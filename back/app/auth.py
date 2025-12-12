from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os

from . import models, schemas, database

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ВРЕМЕННО: убираем хеширование для теста
def verify_password(plain_password, hashed_password):
    # Временная проверка - сравниваем как строки
    return plain_password == hashed_password

def get_password_hash(password):
    # Временное решение - возвращаем пароль как есть
    # ВНИМАНИЕ: ТОЛЬКО ДЛЯ ТЕСТА!
    return password

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    # Временная проверка
    if password != user.hashed_password:  # Теперь храним пароль как есть
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

def create_user(db: Session, user: schemas.UserCreate):
    # Временное решение - сохраняем пароль как есть
    hashed_password = get_password_hash(user.password)  # Фактически возвращает сам пароль
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,  # Теперь здесь plain password
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user_field(db: Session, field: schemas.FieldCreate, user_id: int):
    db_field = models.Field(**field.dict(), owner_id=user_id)
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return db_field