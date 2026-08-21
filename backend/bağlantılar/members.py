from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import schemas
import models
from database import get_db
from auth import verify_token

router = APIRouter()

@router.get("/members/", response_model=List[schemas.Member]) # Kişileri getirme adresi
def get_members(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    return db.query(models.Member).filter(models.Member.user_id == current_user_id).all() # Current usera ait listeyi bul ve ver


@router.post("/members/", response_model=schemas.Member) # Kişi ekleme adresi
def create_member(member: schemas.MemberCreate, db: Session = Depends(get_db),
                  current_user_id: int = Depends(verify_token)):
    db_member = models.Member(**member.model_dump(), user_id=current_user_id) # Yeni kişiyi current user kimliğiyle oluştur
    db.add(db_member) # Veritabanına yaz
    db.commit()
    db.refresh(db_member)
    return db_member


@router.patch("/members/{member_id}", response_model=schemas.Member) # Kişinin bilgilerini güncelleme adresi
def update_member(member_id: int, update_data: schemas.MemberUpdate, db: Session = Depends(get_db),
                  current_user_id: int = Depends(verify_token)):
    db_member = db.query(models.Member).filter(models.Member.id == member_id, # Güncellenecek kişiyi listede bul
                                               models.Member.user_id == current_user_id).first()
    if not db_member: raise HTTPException(status_code=404, detail="Üye bulunamadı veya yetkiniz yok")

    for key, value in update_data.model_dump(exclude_unset=True).items(): # Gelen yeni verileri tek tek
        setattr(db_member, key, value) # Üzerine yaz
    db.commit()
    db.refresh(db_member)
    return db_member


@router.delete("/members/{member_id}") # Kişiyi silme adresi
def delete_member(member_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    member = db.query(models.Member).filter(models.Member.id == member_id, # Silinecek kişiyi bul
                                            models.Member.user_id == current_user_id).first()
    if member:
        db.delete(member) # Listeden sil
        db.commit()
        return {"message": "Üye silindi"}
    raise HTTPException(status_code=404, detail="Üye bulunamadı")