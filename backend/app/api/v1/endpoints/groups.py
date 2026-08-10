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
from app.models.exam import Exam, ExamAssignee
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    GroupResponse,
    GroupDetailResponse,
    GroupJoinRequest,
    GroupMemberResponse,
    GroupInviteRequest,
    BulkRequestAction,
    BulkInvitationAction,
    RosterMemberResponse,
    ExamScoreDetail,
)

from app.api.v1.endpoints.exams import assign_active_exams_to_new_member

router = APIRouter()


def generate_unique_group_code(db: Session) -> str:
    """Generate a unique random group join code."""
    while True:
        code = "GRP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        exists = db.query(Group).filter(Group.group_code == code).first()
        if not exists:
            return code


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED, summary="Create a new study group")
@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
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

    # Automatically register group creator as APPROVED HOST in GroupMember
    owner_member = GroupMember(
        group_id=db_group.id,
        user_id=current_user.id,
        role_in_group="HOST",
        status="APPROVED",
        joined_at=datetime.utcnow()
    )
    db.add(owner_member)
    db.commit()

    return db_group


@router.get("", response_model=List[GroupResponse], summary="Retrieve study groups owned or hosted by the current user")
@router.get("/", response_model=List[GroupResponse], include_in_schema=False)
def read_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a list of study groups created/owned or hosted by the logged-in user.
    """
    # 1. Directly owned groups
    owned_ids = [g.id for g in db.query(Group.id).filter(Group.owner_id == current_user.id).all()]

    # 2. Groups where user is registered as HOST/OWNER/TEACHER/ADMIN in group_members
    member_host_ids = [
        gm.group_id for gm in db.query(GroupMember.group_id).filter(
            GroupMember.user_id == current_user.id,
            GroupMember.status == "APPROVED",
            GroupMember.role_in_group.in_(["HOST", "OWNER", "TEACHER", "ADMIN"])
        ).all()
    ]

    all_ids = list(set(owned_ids + member_host_ids))
    if not all_ids:
        return []

    groups = db.query(Group).filter(Group.id.in_(all_ids)).order_by(Group.created_at.desc()).all()
    return groups



@router.get("/my-memberships", summary="Retrieve study groups that the current user has joined or requested to join")
def read_my_memberships(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a list of study groups where the current user is a member (APPROVED or PENDING).
    """
    memberships = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id,
        GroupMember.status.in_(["APPROVED", "PENDING"])
    ).all()

    result = []
    for member in memberships:
        group = db.query(Group).filter(Group.id == member.group_id).first()
        if group:
            owner = db.query(User).filter(User.id == group.owner_id).first()
            
            # Count other members in the group
            members_count = db.query(GroupMember).filter(
                GroupMember.group_id == group.id,
                GroupMember.status == "APPROVED"
            ).count()

            result.append({
                "id": group.id,
                "name": group.name,
                "host": (owner.fullname or owner.email) if owner else "Unknown Host",
                "membersCount": members_count,
                "lastActivity": "Join request pending approval" if member.status == "PENDING" else "Active member",
                "status": "PENDING" if member.status == "PENDING" else "ACTIVE",
                "group_code": group.group_code,
            })
    return result


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


@router.post("/invitations/bulk-accept", summary="Accept multiple group invitations")
def bulk_accept_group_invitations(
    body: BulkInvitationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Accept multiple invitations to join study groups.
    """
    query = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "INVITED"
    )
    if not body.all_invitations:
        if not body.group_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either group_ids must be provided or all_invitations must be set to True.",
            )
        query = query.filter(GroupMember.group_id.in_(body.group_ids))
    
    invitations = query.all()
    if not invitations:
        return {"message": "No pending invitations found to accept.", "count": 0}
    
    count = len(invitations)
    group_ids_accepted = []
    for invite in invitations:
        invite.status = "APPROVED"
        invite.joined_at = datetime.utcnow()
        db.add(invite)
        group_ids_accepted.append(invite.group_id)
        assign_active_exams_to_new_member(db, invite.group_id, current_user.id)
        
    # Mark corresponding notifications as read
    if group_ids_accepted:
        notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.target_group_id.in_(group_ids_accepted),
            Notification.type == "GROUP_INVITE",
            Notification.is_read == False
        ).all()
        for notification in notifications:
            notification.is_read = True
            db.add(notification)
            
    db.commit()
    return {"message": f"Successfully joined {count} group(s).", "count": count}


@router.post("/invitations/bulk-decline", summary="Decline multiple group invitations")
def bulk_decline_group_invitations(
    body: BulkInvitationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Decline multiple invitations to join study groups.
    """
    query = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id,
        GroupMember.status == "INVITED"
    )
    if not body.all_invitations:
        if not body.group_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either group_ids must be provided or all_invitations must be set to True.",
            )
        query = query.filter(GroupMember.group_id.in_(body.group_ids))
        
    invitations = query.all()
    if not invitations:
        return {"message": "No pending invitations found to decline.", "count": 0}
        
    count = len(invitations)
    group_ids_declined = []
    for invite in invitations:
        db.delete(invite)
        group_ids_declined.append(invite.group_id)
        
    # Mark corresponding notifications as read
    if group_ids_declined:
        notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.target_group_id.in_(group_ids_declined),
            Notification.type == "GROUP_INVITE",
            Notification.is_read == False
        ).all()
        for notification in notifications:
            notification.is_read = True
            db.add(notification)
            
    db.commit()
    return {"message": f"Successfully declined {count} group invitation(s).", "count": count}


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
    group_name = group.name
    group_id_val = group.id
    db.delete(group)
    db.commit()

    # Trigger admin notification for critical data deletion
    try:
        from app.services.admin_notification_service import admin_notification_service
        admin_notification_service.notify_critical_data_deletion(
            db, item_type="Study Group", item_title=group_name, item_id=group_id_val, deleted_by=current_user
        )
    except Exception:
        pass

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
            assign_active_exams_to_new_member(db, group.id, current_user.id)

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

    # Create notification for Group Owner (Host)
    notification = Notification(
        user_id=group.owner_id,
        sender_id=current_user.id,
        target_type="PERSONAL",
        target_group_id=group.id,
        title="NEW JOIN REQUEST",
        content=f"{current_user.fullname or current_user.email} submitted a request to join your group '{group.name}'.",
        type="SYSTEM",
        action_url=f"/groups/{group.id}",
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notification)
    db.commit()

    try:
        from app.api.v1.endpoints.exams import _send_sync_ws_notification
        _send_sync_ws_notification(
            user_id=group.owner_id,
            title="NEW JOIN REQUEST",
            content=f"{current_user.fullname or current_user.email} submitted a request to join your group '{group.name}'.",
            action_url=f"/groups/{group.id}"
        )
    except Exception:
        pass

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
    
    result = []
    for req in requests:
        user = db.query(User).filter(User.id == req.user_id).first()
        req_res = GroupMemberResponse(
            id=req.id,
            group_id=req.group_id,
            user_id=req.user_id,
            role_in_group=req.role_in_group,
            status=req.status,
            joined_at=req.joined_at,
            name=(user.fullname or user.email) if user else "Unknown User",
            email=user.email if user else "Unknown Email",
            avatar=user.avatar if user else None
        )
        result.append(req_res)
    return result


@router.post("/{group_id}/requests/bulk-approve", summary="Approve multiple join requests")
def bulk_approve_join_requests(
    group_id: int,
    body: BulkRequestAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Approve multiple pending join requests for a study group.
    Only the owner of the group or Super Admin is authorized.
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
        
    query = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == "PENDING"
    )
    if not body.all_members:
        if not body.member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either member_ids must be provided or all_members must be set to True.",
            )
        query = query.filter(GroupMember.user_id.in_(body.member_ids))
        
    requests = query.all()
    if not requests:
        return {"message": "No pending join requests found to approve.", "count": 0}
        
    count = len(requests)
    for req in requests:
        req.status = "APPROVED"
        req.joined_at = datetime.utcnow()
        db.add(req)
        assign_active_exams_to_new_member(db, group_id, req.user_id)
        
    db.commit()
    return {"message": f"Successfully approved {count} join request(s).", "count": count}


@router.post("/{group_id}/requests/bulk-reject", summary="Reject multiple join requests")
def bulk_reject_join_requests(
    group_id: int,
    body: BulkRequestAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Reject multiple pending join requests for a study group.
    Only the owner of the group or Super Admin is authorized.
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
        
    query = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == "PENDING"
    )
    if not body.all_members:
        if not body.member_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either member_ids must be provided or all_members must be set to True.",
            )
        query = query.filter(GroupMember.user_id.in_(body.member_ids))
        
    requests = query.all()
    if not requests:
        return {"message": "No pending join requests found to reject.", "count": 0}
        
    count = len(requests)
    for req in requests:
        db.delete(req)
        
    db.commit()
    return {"message": f"Successfully rejected {count} join request(s).", "count": count}


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
    assign_active_exams_to_new_member(db, group_id, member_id)

    # Create notification for student that their request was approved
    notification = Notification(
        user_id=member_id,
        sender_id=current_user.id,
        target_type="PERSONAL",
        target_group_id=group.id,
        title="JOIN REQUEST APPROVED",
        content=f"Your request to join study group '{group.name}' has been approved by the teacher.",
        type="SYSTEM",
        action_url=f"/groups/{group.id}",
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notification)
    db.commit()

    try:
        from app.api.v1.endpoints.exams import _send_sync_ws_notification
        _send_sync_ws_notification(
            user_id=member_id,
            title="JOIN REQUEST APPROVED",
            content=f"Your request to join study group '{group.name}' has been approved by the teacher.",
            action_url=f"/groups/{group.id}"
        )
    except Exception:
        pass

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
            assign_active_exams_to_new_member(db, group_id, invited_user.id)
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

    # Push real-time notification to invited user via WebSocket
    try:
        from app.api.v1.endpoints.exams import _send_sync_ws_notification
        _send_sync_ws_notification(
            user_id=invited_user.id,
            title="GROUP INVITATION",
            content=f"You have been invited to join group '{group.name}' by {current_user.fullname or current_user.email}.",
            action_url=f"/groups/{group.id}"
        )
    except Exception:
        pass

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
    assign_active_exams_to_new_member(db, group_id, current_user.id)

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


@router.get("/{group_id}/roster", response_model=List[RosterMemberResponse], summary="Get roster with exam statistics of group members")
def read_group_roster(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get detailed roster list for Host.
    Includes member name, email, exams completed, average score,
    and detailed score breakdown of the 3 most recently assigned exams.
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
            detail="You do not have permission to view this group roster.",
        )

    members = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == "APPROVED"
    ).all()

    exams = db.query(Exam).filter(
        Exam.group_id == group_id
    ).order_by(Exam.created_at.desc()).all()
    
    total_assigned_count = len(exams)

    result = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        if not user:
            continue

        assignees = db.query(ExamAssignee).filter(
            ExamAssignee.user_id == member.user_id,
            ExamAssignee.exam_id.in_([e.id for e in exams])
        ).all() if total_assigned_count > 0 else []

        assignees_dict = {a.exam_id: a for a in assignees}

        exams_completed = sum(1 for a in assignees if a.submitted_at is not None)

        completed_scores = [a.score for a in assignees if a.score is not None and a.submitted_at is not None]
        avg_score_str = "N/A"
        if completed_scores:
            avg_score_val = sum(completed_scores) / len(completed_scores)
            avg_score_str = f"{round(avg_score_val)}%"

        exam_scores = []
        for ex in exams:
            score_item = assignees_dict.get(ex.id)
            if score_item:
                score_str = f"{round(score_item.score)}%" if score_item.score is not None else "--"
                status_str = "Completed" if score_item.submitted_at is not None else ("In Progress" if score_item.started_at is not None else "Not Started")
            else:
                score_str = "--"
                status_str = "Not Started"

            exam_scores.append({
                "examTitle": ex.title,
                "score": score_str,
                "status": status_str
            })

        result.append({
            "id": member.id,
            "name": user.fullname or user.email,
            "email": user.email,
            "role": member.role_in_group,
            "joined_at": member.joined_at,
            "examsCompleted": exams_completed,
            "totalExamsAssigned": total_assigned_count,
            "averageScore": avg_score_str,
            "avatar": user.avatar,
            "examScores": exam_scores
        })

    return result


@router.delete("/{group_id}/members/{member_id}", summary="Remove a member from a study group")
def remove_member_from_group(
    group_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Remove a member from a study group by group member ID.
    Only the owner of the group or Super Admin is allowed to do this.
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
            detail="Only the group owner or Super Admin can remove members.",
        )

    member = db.query(GroupMember).filter(
        GroupMember.id == member_id,
        GroupMember.group_id == group_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group member not found in this group.",
        )

    db.delete(member)
    db.commit()
    return {"message": "Member removed successfully from the group."}


@router.post("/{group_id}/leave", summary="Leave a study group")
def leave_study_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Leave a study group (removes current user's membership or join request from the group).
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study group not found.",
        )

    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this study group.",
        )

    db.delete(member)
    db.commit()
    return {"message": f"Successfully left group '{group.name}'."}
