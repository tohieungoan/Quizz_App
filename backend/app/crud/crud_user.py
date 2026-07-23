"""
Database operations (Create, Read, Update, Delete) for the User object.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Union, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User, RefreshToken
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password, generate_refresh_token_string



class CRUDUser:
    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Retrieve User information by ID."""
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Retrieve User information by Email."""
        return db.query(User).filter(User.email == email).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Retrieve list of Users with pagination."""
        return db.query(User).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: UserCreate) -> User:
        """Create a new User (hashes password if provided)."""
        db_obj = User(
            email=obj_in.email,
            password=get_password_hash(obj_in.password) if obj_in.password else None,
            fullname=obj_in.fullname,
            avatar=obj_in.avatar,
            role=obj_in.role or "USER",
            status=obj_in.status or "ACTIVE",
            auth_provider=obj_in.auth_provider or "LOCAL",
            provider_id=obj_in.provider_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]) -> User:
        """Update User information."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            update_data["password"] = get_password_hash(update_data["password"])

        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, user_id: int) -> Optional[User]:
        """Delete User by ID."""
        obj = db.query(User).filter(User.id == user_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def authenticate(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user by Email and Password."""
        user = self.get_by_email(db, email=email)
        if not user or not user.password:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    def delete_all_user_refresh_tokens(self, db: Session, user_id: int) -> int:
        """Delete all old Refresh Tokens of the user from database."""
        num_deleted = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).delete(synchronize_session=False)
        db.commit()
        return num_deleted

    def create_refresh_token(
        self, db: Session, user_id: int, expires_days: int = 7, delete_previous: bool = True
    ) -> RefreshToken:
        """Create a new Refresh Token. Default is to delete all old Refresh Tokens of the user from DB."""
        if delete_previous:
            self.delete_all_user_refresh_tokens(db, user_id=user_id)

        token_str = generate_refresh_token_string()
        expires_at = datetime.utcnow() + timedelta(days=expires_days)
        db_obj = RefreshToken(
            user_id=user_id,
            token=token_str,
            expires_at=expires_at,
            revoked=False
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_refresh_token(self, db: Session, token: str) -> Optional[RefreshToken]:
        """Get Refresh Token info if not revoked and not expired."""
        token_obj = db.query(RefreshToken).filter(
            RefreshToken.token == token,
            RefreshToken.revoked == False
        ).first()
        if token_obj and token_obj.expires_at > datetime.utcnow():
            return token_obj
        return None

    def revoke_refresh_token(self, db: Session, token: str) -> bool:
        """Delete a Refresh Token from database upon logout."""
        token_obj = db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if token_obj:
            db.delete(token_obj)
            db.commit()
            return True
        return False



crud_user = CRUDUser()



