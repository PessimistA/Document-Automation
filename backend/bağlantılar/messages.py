from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List

import schemas
import models
from database import get_db
from auth import verify_token

router = APIRouter()

@router.post("/messages/", response_model=schemas.MessageOut) # Mesaj gönderme adresi
def send_message(msg: schemas.MessageCreate, db: Session = Depends(get_db),
                 current_user_id: int = Depends(verify_token)):
    new_msg = models.Message( # Yeni mesajı paketle
        sender_id=current_user_id,
        receiver_id=msg.receiver_id,
        content=msg.content
    )
    db.add(new_msg) # Veritabanına kaydet
    db.commit()
    db.refresh(new_msg)
    return new_msg


@router.get("/messages/{other_user_id}", response_model=List[schemas.MessageOut]) # Konuşma geçmişini görme adresi
def get_chat_history(other_user_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    messages = db.query(models.Message).filter( # Mesajları filtrele
        or_( # İki şarttan biri uysun:
            (models.Message.sender_id == current_user_id) & (models.Message.receiver_id == other_user_id), # Ben ona atmışım
            (models.Message.sender_id == other_user_id) & (models.Message.receiver_id == current_user_id) # O bana atmış
        )
    ).order_by(models.Message.created_at.asc()).all() # Tarihine göre en eskiden yeniye doğru sırala ve getir
    return messages