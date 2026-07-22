"""
Các thao tác truy vấn CSDL (Create, Read, Update, Delete) cho đối tượng User.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Union, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User, RefreshToken
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password, generate_refresh_token_string



class CRUDUser:
    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Lấy thông tin User theo ID."""
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Lấy thông tin User theo Email."""
        return db.query(User).filter(User.email == email).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Lấy danh sách Users có phân trang."""
        return db.query(User).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: UserCreate) -> User:
        """Tạo mới User (mã hóa mật khẩu nếu có)."""
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
        """Cập nhật thông tin User."""
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
        """Xóa User theo ID."""
        obj = db.query(User).filter(User.id == user_id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def authenticate(self, db: Session, email: str, password: str) -> Optional[User]:
        """Xác thực tài khoản bằng Email và Password."""
        user = self.get_by_email(db, email=email)
        if not user or not user.password:
            return None
        if not verify_password(password, user.password):
            return None
        return user

    def delete_all_user_refresh_tokens(self, db: Session, user_id: int) -> int:
        """Xóa sạch toàn bộ Refresh Token cũ của người dùng khỏi CSDL."""
        num_deleted = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).delete(synchronize_session=False)
        db.commit()
        return num_deleted

    def create_refresh_token(
        self, db: Session, user_id: int, expires_days: int = 7, delete_previous: bool = True
    ) -> RefreshToken:
        """Tạo Refresh Token mới. Mặc định xóa toàn bộ Refresh Token cũ của user khỏi DB."""
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
        """Lấy thông tin Refresh Token chưa bị revoke và chưa hết hạn."""
        token_obj = db.query(RefreshToken).filter(
            RefreshToken.token == token,
            RefreshToken.revoked == False
        ).first()
        if token_obj and token_obj.expires_at > datetime.utcnow():
            return token_obj
        return None

    def revoke_refresh_token(self, db: Session, token: str) -> bool:
        """Xóa một Refresh Token khỏi CSDL khi đăng xuất."""
        token_obj = db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if token_obj:
            db.delete(token_obj)
            db.commit()
            return True
        return False



crud_user = CRUDUser()



