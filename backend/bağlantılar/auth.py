from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import schemas
import models
from database import get_db
from auth import create_access_token, verify_token
from bağlantılar.core import log_activity, ProfileUpdateRequest

router = APIRouter()

@router.post("/register/", response_model=schemas.User) # Yeni kullanıcı kayıt
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first() # Email daha önce alınmış mı bak
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı.")

    new_user = models.User(name=user.name, surname=user.surname, email=user.email, hashed_password=user.password) # Yeni kullanıcıyı oluştur
    db.add(new_user) # Veritabanına ekle
    db.commit() # Değişiklikleri kaydet
    db.refresh(new_user)
    log_activity(db, user_id=new_user.id, action_type="user_registered", details=f"{user.name} sisteme katıldı.") # Kayıt işlemini geçmişe yaz
    return new_user

@router.post("/login/") # Kullanıcı giriş
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first() # Kullanıcıyı bul
    if not user or user.hashed_password != user_data.password: # Şifre yanlışsa hata ver
        raise HTTPException(status_code=400, detail="Hatalı email veya şifre.")

    access_token = create_access_token(data={"sub": str(user.id)}) # Giriş tokeni oluştur
    log_activity(db, user_id=user.id, action_type="user_login", details=f"{user.name} sisteme giriş yaptı.")
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id} # tokeni kullanıcıya ver

@router.get("/users/me") # Kendi user bilgilerini getirme
def get_current_user_profile(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first() # Giriş yapan kişiyi bul
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    return { # Kullanıcı bilgilerini geri gönder
        "id": user.id,
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "role": getattr(user, 'role', 'Üye'),
        "department": getattr(user, 'department', 'Belirtilmedi'),
        "location": getattr(user, 'location', 'Belirtilmedi'),
        "created_at": getattr(user, 'created_at', None)
    }

@router.patch("/users/me") # Kendi bilgilerimi güncelleme
def update_current_user_profile(profile_data: ProfileUpdateRequest, db: Session = Depends(get_db),
                                current_user_id: int = Depends(verify_token)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first() # Kişiyi bul
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    update_dict = profile_data.model_dump(exclude_unset=True) # Sadece değişen bilgileri al
    for key, value in update_dict.items():
        setattr(user, key, value) # Yeni bilgileri kişiye uygula

    try:
        db.commit() # Veritabanına kaydet
        db.refresh(user)
    except Exception as e:
        db.rollback() # Hata olursa işlemi geri al
        print(f"VERİTABANI UYARISI (Muhtemelen sütun eksik): {str(e)}")

    return { # Güncel bilgileri geri gönder
        "id": user.id,
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "role": getattr(user, 'role', 'Üye'),
        "department": getattr(user, 'department', 'Belirtilmedi'),
        "location": getattr(user, 'location', 'Belirtilmedi'),
        "created_at": getattr(user, 'created_at', None)
    }

@router.get("/system/users/", response_model=List[schemas.User]) # Sistemdeki herkesi listeleme adresi
def get_all_system_users(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    return db.query(models.User).filter(models.User.id != current_user_id).all() # Kendim hariç herkesi getir