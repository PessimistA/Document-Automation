from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List

import schemas
import models
from database import get_db
from auth import verify_token

router = APIRouter()

@router.get("/dashboard/activities/", response_model=List[schemas.Activity]) # Son hareketleri getirme adresi
def get_recent_activities(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    my_projects = db.query(models.Project.id).filter(models.Project.user_id == current_user_id) # Sahibi olunan projeleri bul
    member_projects = db.query(models.ProjectMember.project_id).filter(models.ProjectMember.user_id == current_user_id) # Üye olunan projeleri bul

    return db.query(models.Activity).filter( # Hareketleri filtrele
        or_( # Şu şartlardan herhangi biri uyuyorsa:
            models.Activity.user_id == current_user_id, # Hareketi current user yaptıysa
            models.Activity.project_id.in_(my_projects), # Olay current userda olduysa
            models.Activity.project_id.in_(member_projects) # Olay current user olunan projede olduysa
        )
    ).order_by(models.Activity.created_at.desc()).limit(50).all() # En yeni 50 olayı sırala ve getir