import unittest
from fastapi.testclient import TestClient
from datetime import datetime

from app.main import app
from app.api.deps import get_db
from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.notification import Notification

class TestGroupsBulk(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        db_gen = get_db()
        self.db = next(db_gen)

    def tearDown(self):
        self.db.close()

    def test_bulk_actions(self):
        # 1. Setup mock data
        owner = User(
            email="test_owner@example.com",
            hashed_password=get_password_hash("testpassword"),
            fullname="Test Owner",
            role="USER",
            status="ACTIVE"
        )
        user_a = User(
            email="test_usera@example.com",
            hashed_password=get_password_hash("testpassword"),
            fullname="Test User A",
            role="USER",
            status="ACTIVE"
        )
        user_b = User(
            email="test_userb@example.com",
            hashed_password=get_password_hash("testpassword"),
            fullname="Test User B",
            role="USER",
            status="ACTIVE"
        )
        self.db.add_all([owner, user_a, user_b])
        self.db.commit()
        self.db.refresh(owner)
        self.db.refresh(user_a)
        self.db.refresh(user_b)

        # Helper to create headers with token
        def get_auth_headers(user_id: int) -> dict:
            access_token = create_access_token(subject=user_id)
            return {"Authorization": f"Bearer {access_token}"}

        try:
            # Create Group
            group = Group(
                owner_id=owner.id,
                name="Test Group Bulk",
                description="Testing bulk approvals",
                status="OPEN",
                group_code="TESTGRP"
            )
            self.db.add(group)
            self.db.commit()
            self.db.refresh(group)

            # Create Group 2 (for invitation test)
            group2 = Group(
                owner_id=owner.id,
                name="Test Group Bulk 2",
                description="Testing bulk invitations",
                status="OPEN",
                group_code="TESTGRP2"
            )
            self.db.add(group2)
            self.db.commit()
            self.db.refresh(group2)

            # A. Test Bulk Join Requests (Owner approves/rejects requests from User A & B)
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
            self.db.add_all([req_a, req_b])
            self.db.commit()

            # Call bulk-approve API as Owner
            headers = get_auth_headers(owner.id)
            payload = {
                "member_ids": [user_a.id, user_b.id],
                "all_members": False
            }
            response = self.client.post(
                f"{settings.API_V1_STR}/groups/{group.id}/requests/bulk-approve",
                json=payload,
                headers=headers
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 2)

            # Check status in DB
            self.db.refresh(req_a)
            self.db.refresh(req_b)
            self.assertEqual(req_a.status, "APPROVED")
            self.assertEqual(req_b.status, "APPROVED")

            # Reset to PENDING to test bulk-reject
            req_a.status = "PENDING"
            req_b.status = "PENDING"
            self.db.add_all([req_a, req_b])
            self.db.commit()

            # Call bulk-reject API as Owner
            response = self.client.post(
                f"{settings.API_V1_STR}/groups/{group.id}/requests/bulk-reject",
                json=payload,
                headers=headers
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 2)

            # In DB, these records should be deleted (so query returns None)
            member_a = self.db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == user_a.id).first()
            member_b = self.db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == user_b.id).first()
            self.assertIsNone(member_a)
            self.assertIsNone(member_b)

            # B. Test Bulk Invitations (User A accepts/declines invitations from Group 1 & 2)
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
            self.db.add_all([inv_1, inv_2, notif_1, notif_2])
            self.db.commit()

            # Call bulk-accept API as User A
            headers_a = get_auth_headers(user_a.id)
            payload_inv = {
                "group_ids": [group.id, group2.id],
                "all_invitations": False
            }
            response = self.client.post(
                f"{settings.API_V1_STR}/groups/invitations/bulk-accept",
                json=payload_inv,
                headers=headers_a
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 2)

            # Check in DB
            self.db.refresh(inv_1)
            self.db.refresh(inv_2)
            self.db.refresh(notif_1)
            self.db.refresh(notif_2)
            self.assertEqual(inv_1.status, "APPROVED")
            self.assertEqual(inv_2.status, "APPROVED")
            self.assertTrue(notif_1.is_read)
            self.assertTrue(notif_2.is_read)

            # Reset to INVITED and unread notification to test bulk-decline
            inv_1.status = "INVITED"
            inv_2.status = "INVITED"
            notif_1.is_read = False
            notif_2.is_read = False
            self.db.add_all([inv_1, inv_2, notif_1, notif_2])
            self.db.commit()

            # Call bulk-decline API as User A
            response = self.client.post(
                f"{settings.API_V1_STR}/groups/invitations/bulk-decline",
                json=payload_inv,
                headers=headers_a
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 2)

            member_inv1 = self.db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == user_a.id).first()
            member_inv2 = self.db.query(GroupMember).filter(GroupMember.group_id == group2.id, GroupMember.user_id == user_a.id).first()
            self.assertIsNone(member_inv1)
            self.assertIsNone(member_inv2)

            self.db.refresh(notif_1)
            self.db.refresh(notif_2)
            self.assertTrue(notif_1.is_read)
            self.assertTrue(notif_2.is_read)

        finally:
            # Cleanup
            self.db.query(Notification).filter(Notification.user_id.in_([owner.id, user_a.id, user_b.id])).delete(synchronize_session=False)
            self.db.query(GroupMember).filter(GroupMember.user_id.in_([owner.id, user_a.id, user_b.id])).delete(synchronize_session=False)
            self.db.query(Group).filter(Group.owner_id == owner.id).delete(synchronize_session=False)
            self.db.query(User).filter(User.id.in_([owner.id, user_a.id, user_b.id])).delete(synchronize_session=False)
            self.db.commit()

if __name__ == "__main__":
    unittest.main()
