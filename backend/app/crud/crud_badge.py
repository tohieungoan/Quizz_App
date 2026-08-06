"""
Database CRUD (Create, Read, Update, Delete) operations for the Badge model.
"""
from typing import List, Optional, Union, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.badge import Badge
from app.schemas.badge import BadgeCreate, BadgeUpdate


class CRUDBadge:
    def get_by_id(self, db: Session, badge_id: int) -> Optional[Badge]:
        """Get badge by ID."""
        return db.query(Badge).filter(Badge.id == badge_id).first()

    def get_by_name(self, db: Session, name: str) -> Optional[Badge]:
        """Get badge by exact name."""
        return db.query(Badge).filter(Badge.name == name).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Badge]:
        """Get multiple badges with pagination."""
        return db.query(Badge).offset(skip).limit(limit).all()

    def get_multi_with_total(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        tier: Optional[str] = None
    ) -> Tuple[List[Badge], int]:
        """Get multiple badges and total count for pagination."""
        query = db.query(Badge)
        
        if search:
            query = query.filter(Badge.name.ilike(f"%{search}%") | Badge.description.ilike(f"%{search}%"))
        if tier and tier != "All":
            query = query.filter(Badge.tier == tier)
            
        total = query.count()
        badges = query.order_by(Badge.id.desc()).offset(skip).limit(limit).all()
        
        badge_ids = [b.id for b in badges]
        if badge_ids:
            from app.models.badge import UserBadge
            from sqlalchemy import func
            counts = db.query(UserBadge.badge_id, func.count(UserBadge.id)).filter(
                UserBadge.badge_id.in_(badge_ids),
                UserBadge.is_unlocked == True
            ).group_by(UserBadge.badge_id).all()
            
            count_map = {badge_id: count for badge_id, count in counts}
            for badge in badges:
                badge.unlocked_count = count_map.get(badge.id, 0)
        else:
            for badge in badges:
                badge.unlocked_count = 0
                
        return badges, total

    def create(self, db: Session, obj_in: BadgeCreate) -> Badge:
        """Create a new badge."""
        db_obj = Badge(
            name=obj_in.name,
            description=obj_in.description,
            icon=obj_in.icon,
            category=obj_in.category or "TITLE",
            tier=obj_in.tier or "COMMON",
            points_required=obj_in.points_required or 0,
            type_value=obj_in.type_value,
            target_value=obj_in.target_value or 1,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Badge, obj_in: Union[BadgeUpdate, Dict[str, Any]]) -> Badge:
        """Update badge information."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, badge_id: int) -> Optional[Badge]:
        """Delete badge by ID."""
        obj = db.query(Badge).filter(Badge.id == badge_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def get_badge_users(self, db: Session, badge_id: int) -> List[Any]:
        """Get all users who have unlocked a specific badge."""
        from app.models.badge import UserBadge
        from app.models.user import User
        
        return (
            db.query(UserBadge, User)
            .join(User, UserBadge.user_id == User.id)
            .filter(UserBadge.badge_id == badge_id)
            .filter(UserBadge.is_unlocked == True)
            .order_by(UserBadge.unlocked_at.desc())
            .all()
        )

    def seed_default_badges_if_empty(self, db: Session):
        """Seed initial badges if the table is empty."""
        if db.query(Badge).first() is not None:
            return
        
        default_badges = [
            Badge(name="First Blood", description="Complete your first quiz with any score.", icon="target", category="BADGE", tier="COMMON", points_required=0, type_value="QUIZ_COUNT", target_value=1),
            Badge(name="Sharpshooter", description="Achieve a 100% score on 5 different quizzes.", icon="zap", category="BADGE", tier="RARE", points_required=50, type_value="PERFECT_SCORE", target_value=5),
            Badge(name="Unstoppable", description="Maintain a learning streak of 30 consecutive days.", icon="flame", category="TITLE", tier="EPIC", points_required=100, type_value="STREAK", target_value=30),
            Badge(name="Night Owl", description="Complete 10 quizzes between midnight and 4 AM.", icon="moon", category="BADGE", tier="RARE", points_required=30, type_value="QUIZ_COMPLETED", target_value=10),
            Badge(name="Quiz Master", description="Complete 50 total quizzes across all topics.", icon="crown", category="TITLE", tier="LEGENDARY", points_required=500, type_value="QUIZ_COUNT", target_value=50),
            Badge(name="Knowledge Seeker", description="Complete 5 quizzes to get started.", icon="book", category="TITLE", tier="COMMON", points_required=10, type_value="QUIZ_COUNT", target_value=5),
            Badge(name="Top Performer", description="Rank #1 in 5 live quiz rooms.", icon="trophy", category="TITLE", tier="RARE", points_required=150, type_value="PERFECT_SCORE", target_value=5),
            Badge(name="Legendary Scholar", description="Reach 1,000 total achievement points.", icon="star", category="TITLE", tier="LEGENDARY", points_required=1000, type_value="TOTAL_POINTS", target_value=1000),
        ]
        db.add_all(default_badges)
        db.commit()

    def get_user_badges(self, db: Session, user: Any) -> List[Dict[str, Any]]:
        """Get all badges along with current user's unlock & equipped status."""
        from app.models.badge import UserBadge

        self.seed_default_badges_if_empty(db)

        badges = db.query(Badge).all()
        user_badges_map = {ub.badge_id: ub for ub in db.query(UserBadge).filter(UserBadge.user_id == user.id).all()}

        result = []
        for badge in badges:
            ub = user_badges_map.get(badge.id)
            is_unlocked = ub.is_unlocked if ub else False
            is_equipped = ub.is_equipped if ub else False
            current_progress = ub.current_progress if ub else 0
            unlocked_at = ub.unlocked_at if ub else None

            # Calculate or auto-unlock based on user metrics
            if not is_unlocked:
                if badge.type_value == "STREAK" and (user.study_streak or 0) >= badge.target_value:
                    is_unlocked = True
                    current_progress = badge.target_value
                elif badge.type_value == "TOTAL_POINTS" and (user.achievement_points or 0) >= badge.target_value:
                    is_unlocked = True
                    current_progress = badge.target_value
                elif badge.points_required == 0 or (user.achievement_points or 0) >= badge.points_required:
                    if (user.achievement_points or 0) > 0:
                        current_progress = min(badge.target_value, user.achievement_points or 0)

            result.append({
                "id": badge.id,
                "name": badge.name,
                "description": badge.description,
                "icon": badge.icon,
                "category": badge.category,
                "tier": badge.tier,
                "points_required": badge.points_required,
                "type_value": badge.type_value,
                "target_value": badge.target_value,
                "created_at": badge.created_at,
                "is_unlocked": is_unlocked,
                "is_equipped": is_equipped,
                "current_progress": current_progress,
                "unlocked_at": unlocked_at
            })

        return result

    def equip_badge(self, db: Session, user: Any, badge_id: int) -> Dict[str, Any]:
        """Equip a title/badge for a user (unequips others in same category)."""
        from app.models.badge import UserBadge
        from datetime import datetime

        badge = db.query(Badge).filter(Badge.id == badge_id).first()
        if not badge:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Badge not found")

        # Find or create UserBadge record
        ub = db.query(UserBadge).filter(UserBadge.user_id == user.id, UserBadge.badge_id == badge_id).first()
        if not ub:
            ub = UserBadge(
                user_id=user.id,
                badge_id=badge_id,
                current_progress=badge.target_value,
                is_unlocked=True,
                is_equipped=True,
                unlocked_at=datetime.utcnow()
            )
            db.add(ub)
        else:
            ub.is_unlocked = True
            ub.is_equipped = not ub.is_equipped  # Toggle equipped status

        if ub.is_equipped:
            # Unequip other badges in the same category
            other_user_badges = (
                db.query(UserBadge)
                .join(Badge, UserBadge.badge_id == Badge.id)
                .filter(UserBadge.user_id == user.id, Badge.category == badge.category, UserBadge.badge_id != badge_id)
                .all()
            )
            for other in other_user_badges:
                other.is_equipped = False

        db.commit()
        db.refresh(ub)

        return {
            "id": badge.id,
            "name": badge.name,
            "description": badge.description,
            "icon": badge.icon,
            "category": badge.category,
            "tier": badge.tier,
            "points_required": badge.points_required,
            "type_value": badge.type_value,
            "target_value": badge.target_value,
            "created_at": badge.created_at,
            "is_unlocked": ub.is_unlocked,
            "is_equipped": ub.is_equipped,
            "current_progress": ub.current_progress,
            "unlocked_at": ub.unlocked_at
        }

crud_badge = CRUDBadge()

