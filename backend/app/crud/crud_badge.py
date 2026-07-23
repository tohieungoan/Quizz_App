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
        limit: int = 100
    ) -> Tuple[List[Badge], int]:
        """Get multiple badges and total count for pagination."""
        total = db.query(Badge).count()
        badges = db.query(Badge).order_by(Badge.id.desc()).offset(skip).limit(limit).all()
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




crud_badge = CRUDBadge()
