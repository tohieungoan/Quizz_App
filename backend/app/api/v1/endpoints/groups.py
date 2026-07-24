from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random
import string
from datetime import datetime

from app.api.deps import get_db, get_current_active_user
from app.models.group import Group, GroupMember
from app.models.user import User
from app.models.notification import Notification
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupResponse,
    GroupDetailResponse,
    GroupJoinRequest,
    GroupMemberResponse,
    GroupInviteRequest,
)

router = APIRouter()


def generate_unique_group_code(db: Session) -> str:
    """Generate a unique random group join code."""
    while True:
        code = "GRP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        exists = db.query(Group).filter(Group.group_code == code).first()
        if not exists:
            return code


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED, summary="Create a new study group")
def create_group(
    group_in: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new study group owned by the current active user.
    The group join code is automatically generated as a unique random code.
    """
    generated_code = generate_unique_group_code(db)

    db_group = Group(
        owner_id=current_user.id,
        name=group_in.name.strip(),
        description=group_in.description.strip() if group_in.description else None,
        icon=group_in.icon,
        status=group_in.status,
        group_code=generated_code
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group


@router.get("/", response_model=List[GroupResponse], summary="Retrieve study groups owned by the current user")
def read_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a list of study groups created/owned by the logged-in user.
    """
    groups = db.query(Group).filter(Group.owner_id == current_user.id).all()
    return groups


@router.get("/invitations", summary="List all pending group invitations for the current user")
def list_my_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all active study group invitations sent to the logged-in user.
    """
    invitations = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "INVITED"
    ).all()

    result = []
    for invite in invitations:
        group = db.query(Group).filter(Group.id == invite.group_id).first()
        if group:
            result.append({
                "group_id": group.id,
                "group_name": group.name,
                "group_description": group.description,
                "group_icon": group.icon,
                "invited_by": invite.invited_by,
                "requested_at": invite.requested_at,
            })
    return result


@router.get("/{group_id}", response_model=GroupDetailResponse, summary="Get study group details")
def read_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve detailed study group information by ID.
    Must be the owner of the group to view details.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )
    if group.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this group.",
        )
    return group


@router.put("/{group_id}", response_model=GroupResponse, summary="Update study group details")
def update_group(
    group_id: int,
    group_in: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update group details by ID.
    Only the group owner is allowed to make updates.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )
    if group.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this group.",
        )

    update_data = group_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if hasattr(group, field):
            setattr(group, field, value)

    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", response_model=GroupResponse, summary="Delete a study group")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a study group by ID.
    Only the group owner can delete the group.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )
    if group.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this group.",
        )
    db.delete(group)
    db.commit()
    return group


@router.post("/join-request", summary="Submit a request to join a study group by code")
def request_to_join_group(
    body: GroupJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Submit a request to join another user's study group using the unique group join code.
    Creates a PENDING group member record.
    """
    code = body.group_code.strip().upper()
    group = db.query(Group).filter(Group.group_code == code).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found with the provided join code.",
        )

    # Check if the group is locked
    if group.status == "CLOSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This study group is locked and does not accept new members.",
        )

    # Check if already a member/pending/blocked
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id
    ).first()

    if member:
        if member.status == "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already a member of this study group.",
            )
        elif member.status == "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your request to join this group is already pending approval.",
            )
        elif member.status == "BLOCKED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You have been blocked from joining this study group.",
            )
        elif member.status == "INVITED":
            # If the user was invited by the owner and now requests to join, automatically approve it!
            member.status = "APPROVED"
            member.joined_at = datetime.utcnow()
            db.add(member)

            # Mark invitations for this group sent to the current user as read (is_read=True)
            notifications = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.target_group_id == group.id,
                Notification.type == "GROUP_INVITE",
                Notification.is_read == False
            ).all()
            for notification in notifications:
                notification.is_read = True
                db.add(notification)

            db.commit()
            return {"message": "You had been invited by the owner. Your membership is now automatically approved."}

    # Create pending group member entry
    new_member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role_in_group="MEMBER",
        status="PENDING",
        requested_at=datetime.utcnow()
    )
    db.add(new_member)
    db.commit()

    return {"message": "Join request submitted successfully. Waiting for group owner approval."}


@router.get("/{group_id}/requests", response_model=List[GroupMemberResponse], summary="List pending join requests for a group")
def list_group_join_requests(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all pending join requests for a specific study group.
    Only the owner of the group is authorized to view this.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )
    if group.owner_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner or Super Admin can view pending requests.",
        )

    requests = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == "PENDING"
    ).all()
    return requests


@router.post("/{group_id}/requests/{member_id}/approve", summary="Approve a pending join request")
def approve_join_request(
    group_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Approve a pending request to join the study group.
    Only the owner of the group is authorized.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )
    if group.owner_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner or Super Admin can approve join requests.",
        )

    member = db.query(GroupMember).filter(
        GroupMember.user_id == member_id,
        GroupMember.group_id == group_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending request not found.",
        )

    if member.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This request is already in status: {member.status}",
        )

    member.status = "APPROVED"
    member.joined_at = datetime.utcnow()
    db.add(member)
    db.commit()

    return {"message": "User request approved and added to the study group."}


@router.post("/{group_id}/requests/{member_id}/reject", summary="Reject a pending join request")
def reject_join_request(
    group_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Reject/Delete a pending request to join the study group.
    Only the owner of the group is authorized.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )
    if group.owner_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner or Super Admin can reject join requests.",
        )

    member = db.query(GroupMember).filter(
        GroupMember.user_id == member_id,
        GroupMember.group_id == group_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending request not found.",
        )

    if member.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This request is already in status: {member.status}",
        )

    db.delete(member)
    db.commit()

    return {"message": "User request rejected and removed."}


@router.post("/{group_id}/invite", summary="Invite a member to the study group")
def invite_member_to_group(
    group_id: int,
    body: GroupInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Invite a user to join the study group using their email.
    Only the owner of the group is authorized to invite members.
    If the user has a pending join request, the request is automatically approved.
    """
    # 1. Check if group exists
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )

    # 2. Check if current_user is the owner of the group (or SUPER_ADMIN)
    if group.owner_id != current_user.id and current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner or Super Admin can invite members.",
        )

    # 3. Check if the invited user exists
    invited_email = body.email.strip().lower()
    invited_user = db.query(User).filter(User.email == invited_email).first()
    if not invited_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with the provided email not found.",
        )

    # 4. Check if owner invites themselves
    if invited_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot invite yourself to the group.",
        )

    # 5. Check if the user is already a member or has a pending request
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == invited_user.id
    ).first()

    if member:
        if member.status == "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user is already a member of the study group.",
            )
        elif member.status == "PENDING":
            # If the user has requested to join, and now the owner invites them, we approve it automatically.
            member.status = "APPROVED"
            member.joined_at = datetime.utcnow()
            member.invited_by = current_user.id
            db.add(member)
            db.commit()
            return {"message": "User had a pending request, automatically approved their membership."}
        elif member.status == "INVITED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An invitation has already been sent to this user.",
            )
        elif member.status == "BLOCKED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user is blocked from joining this group.",
            )

    # 6. Create new invitation
    new_member = GroupMember(
        group_id=group.id,
        user_id=invited_user.id,
        role_in_group="MEMBER",
        status="INVITED",
        invited_by=current_user.id,
        requested_at=datetime.utcnow()
    )
    db.add(new_member)

    # 7. Create notification for the invited user
    notification = Notification(
        user_id=invited_user.id,
        sender_id=current_user.id,
        target_type="PERSONAL",
        target_group_id=group.id,
        title="GROUP INVITATION",
        content=f"You have been invited to join group '{group.name}' by {current_user.fullname or current_user.email}.",
        type="GROUP_INVITE",
        action_url=f"/groups/{group.id}",
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notification)
    db.commit()

    return {"message": "Invitation sent successfully to the user."}


@router.post("/{group_id}/accept-invite", summary="Accept a group invitation")
def accept_group_invitation(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Accept an invitation to join a study group.
    """
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "INVITED"
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or you are already a member.",
        )

    # Update membership
    member.status = "APPROVED"
    member.joined_at = datetime.utcnow()
    db.add(member)

    # Mark corresponding notifications as read
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.target_group_id == group_id,
        Notification.type == "GROUP_INVITE",
        Notification.is_read == False
    ).all()
    for notification in notifications:
        notification.is_read = True
        db.add(notification)

    db.commit()

    return {"message": "You have successfully joined the group."}


@router.post("/{group_id}/decline-invite", summary="Decline a group invitation")
def decline_group_invitation(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Decline an invitation to join a study group.
    """
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "INVITED"
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )

    # Delete membership record
    db.delete(member)

    # Mark corresponding notifications as read
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.target_group_id == group_id,
        Notification.type == "GROUP_INVITE",
        Notification.is_read == False
    ).all()
    for notification in notifications:
        notification.is_read = True
        db.add(notification)

    db.commit()

    return {"message": "Invitation declined."}

