import json
import urllib.request
import urllib.error
from datetime import datetime
from app.db.session import SessionLocal
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.notification import Notification
from app.core.security import get_password_hash, create_access_token

def run_test():
    db = SessionLocal()
    print("Testing connection to DB...")

    # 1. Setup mock data
    owner = User(
        email="test_owner_http@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Owner HTTP",
        role="USER",
        status="ACTIVE"
    )
    user_a = User(
        email="test_usera_http@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test User A HTTP",
        role="USER",
        status="ACTIVE"
    )
    user_b = User(
        email="test_userb_http@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test User B HTTP",
        role="USER",
        status="ACTIVE"
    )
    db.add_all([owner, user_a, user_b])
    db.commit()
    db.refresh(owner)
    db.refresh(user_a)
    db.refresh(user_b)

    print(f"Created test users: Owner({owner.id}), User A({user_a.id}), User B({user_b.id})")

    try:
        # Create Group
        group = Group(
            owner_id=owner.id,
            name="Test Group HTTP",
            description="Testing bulk approvals via HTTP",
            status="OPEN",
            group_code="TGRP_HTTP"
        )
        db.add(group)
        db.commit()
        db.refresh(group)
        print(f"Created test group {group.id}")

        # Create Group 2
        group2 = Group(
            owner_id=owner.id,
            name="Test Group HTTP 2",
            description="Testing bulk invitations via HTTP",
            status="OPEN",
            group_code="TGRP_HTTP2"
        )
        db.add(group2)
        db.commit()
        db.refresh(group2)
        print(f"Created test group2 {group2.id}")

        # Create PENDING join requests
        req_a = GroupMember(
            group_id=group.id,
            user_id=user_a.id,
            role_in_group="MEMBER",
            status="PENDING",
            requested_at=datetime.utcnow()
        )
        req_b = GroupMember(
            group_id=group.id,
            user_id=user_b.id,
            role_in_group="MEMBER",
            status="PENDING",
            requested_at=datetime.utcnow()
        )
        db.add_all([req_a, req_b])
        db.commit()
        print("Created PENDING requests for A and B")

        # Generate tokens
        owner_token = create_access_token(subject=owner.id)
        usera_token = create_access_token(subject=user_a.id)

        # Base URL of local server
        base_url = "http://127.0.0.1:8000/api/v1"

        # TEST 1: Bulk Approve Join Requests
        print("TEST 1: Bulk Approve Join Requests...")
        url = f"{base_url}/groups/{group.id}/requests/bulk-approve"
        payload = {
            "member_ids": [user_a.id, user_b.id],
            "all_members": False
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {owner_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", res_body)
            assert res_body["count"] == 2

        # Verify in DB
        db.refresh(req_a)
        db.refresh(req_b)
        assert req_a.status == "APPROVED"
        assert req_b.status == "APPROVED"
        print("TEST 1 PASSED: Statuses are APPROVED in DB")

        # Reset to PENDING for TEST 2
        req_a.status = "PENDING"
        req_b.status = "PENDING"
        db.add_all([req_a, req_b])
        db.commit()

        # TEST 2: Bulk Reject Join Requests
        print("TEST 2: Bulk Reject Join Requests...")
        url = f"{base_url}/groups/{group.id}/requests/bulk-reject"
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {owner_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", res_body)
            assert res_body["count"] == 2

        # Verify in DB (should be deleted)
        member_a = db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == user_a.id).first()
        member_b = db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == user_b.id).first()
        assert member_a is None
        assert member_b is None
        print("TEST 2 PASSED: Records deleted from DB")

        # TEST 3: Bulk Accept Invitations
        print("TEST 3: Bulk Accept Invitations...")
        # Create INVITED status
        inv_1 = GroupMember(
            group_id=group.id,
            user_id=user_a.id,
            role_in_group="MEMBER",
            status="INVITED",
            invited_by=owner.id,
            requested_at=datetime.utcnow()
        )
        inv_2 = GroupMember(
            group_id=group2.id,
            user_id=user_a.id,
            role_in_group="MEMBER",
            status="INVITED",
            invited_by=owner.id,
            requested_at=datetime.utcnow()
        )
        # Create notifications
        notif_1 = Notification(
            user_id=user_a.id,
            sender_id=owner.id,
            target_type="PERSONAL",
            target_group_id=group.id,
            title="GROUP INVITATION",
            content="Invite 1",
            type="GROUP_INVITE",
            is_read=False
        )
        notif_2 = Notification(
            user_id=user_a.id,
            sender_id=owner.id,
            target_type="PERSONAL",
            target_group_id=group2.id,
            title="GROUP INVITATION",
            content="Invite 2",
            type="GROUP_INVITE",
            is_read=False
        )
        db.add_all([inv_1, inv_2, notif_1, notif_2])
        db.commit()
        db.refresh(inv_1)
        db.refresh(inv_2)
        db.refresh(notif_1)
        db.refresh(notif_2)

        url = f"{base_url}/groups/invitations/bulk-accept"
        payload_inv = {
            "group_ids": [group.id, group2.id],
            "all_invitations": False
        }
        data_inv = json.dumps(payload_inv).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_inv,
            headers={
                "Authorization": f"Bearer {usera_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", res_body)
            assert res_body["count"] == 2

        # Verify in DB
        db.refresh(inv_1)
        db.refresh(inv_2)
        db.refresh(notif_1)
        db.refresh(notif_2)
        assert inv_1.status == "APPROVED"
        assert inv_2.status == "APPROVED"
        assert notif_1.is_read is True
        assert notif_2.is_read is True
        print("TEST 3 PASSED: Invitations accepted and notifications read")

        # Reset for TEST 4
        inv_1.status = "INVITED"
        inv_2.status = "INVITED"
        notif_1.is_read = False
        notif_2.is_read = False
        db.add_all([inv_1, inv_2, notif_1, notif_2])
        db.commit()

        # TEST 4: Bulk Decline Invitations
        print("TEST 4: Bulk Decline Invitations...")
        url = f"{base_url}/groups/invitations/bulk-decline"
        req = urllib.request.Request(
            url,
            data=data_inv,
            headers={
                "Authorization": f"Bearer {usera_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", res_body)
            assert res_body["count"] == 2

        # Verify in DB
        member_inv1 = db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == user_a.id).first()
        member_inv2 = db.query(GroupMember).filter(GroupMember.group_id == group2.id, GroupMember.user_id == user_a.id).first()
        assert member_inv1 is None
        assert member_inv2 is None

        db.refresh(notif_1)
        db.refresh(notif_2)
        assert notif_1.is_read is True
        assert notif_2.is_read is True
        print("TEST 4 PASSED: Invitations declined and notifications read")

        print("\nALL TESTS PASSED SUCCESSFULLY!")

    finally:
        # Cleanup
        print("Cleaning up database...")
        db.query(Notification).filter(Notification.user_id.in_([owner.id, user_a.id, user_b.id])).delete(synchronize_session=False)
        db.query(GroupMember).filter(GroupMember.user_id.in_([owner.id, user_a.id, user_b.id])).delete(synchronize_session=False)
        db.query(Group).filter(Group.owner_id == owner.id).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([owner.id, user_a.id, user_b.id])).delete(synchronize_session=False)
        db.commit()
        db.close()
        print("Cleanup done.")

if __name__ == "__main__":
    run_test()
