from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

import schemas
import models
from database import get_db
from auth import verify_token
from bağlantılar.core import log_activity, check_project_access

router = APIRouter()

@router.get("/projects/") # Tüm projelerimi listeleme endpoint
def get_projects(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    projects = db.query(models.Project).outerjoin(models.ProjectMember).filter( # Projeleri veritabanından çek
        or_( # Şu iki şarttan biri uysun:
            models.Project.user_id == current_user_id, # Proje current usera aitse
            models.ProjectMember.user_id == current_user_id # Veya current user projeye üye ise
        )
    ).all()

    result = []
    for p in projects: # Her proje için detayları topla
        owner = db.query(models.User).filter(models.User.id == p.user_id).first() # Kurucuyu bul
        members = db.query(models.User).join(models.ProjectMember).filter(models.ProjectMember.project_id == p.id).all() # Üyeleri bul

        member_names = [f"{m.name} {getattr(m, 'surname', '')}".strip() for m in members] # Üye isimlerini listele
        if owner:
            member_names.append(f"{owner.name} {getattr(owner, 'surname', '')} (Kurucu)".strip()) # Kurucuyu listeye ekle

        team_members = list(set(member_names)) # Aynı isimleri temizle

        result.append({ # Proje verilerini paketle
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "due_date": p.due_date,
            "progress": p.progress,
            "created_at": p.created_at,
            "tasks": p.tasks,
            "teamMembers": team_members
        })
    return result


@router.get("/projects/{project_id}") # Tek projenin detayını görme endpoint
def get_project_detail(project_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id): # İzin kontrolü yap
        raise HTTPException(status_code=403, detail="Bu projeyi görüntüleme yetkiniz yok")

    p = db.query(models.Project).filter(models.Project.id == project_id).first() # Projeyi bul

    owner = db.query(models.User).filter(models.User.id == p.user_id).first() # Kurucuyu al
    members = db.query(models.User).join(models.ProjectMember).filter(models.ProjectMember.project_id == p.id).all() # Üyeleri al

    member_names = [f"{m.name} {getattr(m, 'surname', '')}".strip() for m in members]
    if owner:
        member_names.append(f"{owner.name} {getattr(owner, 'surname', '')} (Kurucu)".strip()) # Kurucu etiketini ekle

    return { # Detayları geri gönder
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "status": p.status,
        "due_date": p.due_date,
        "progress": p.progress,
        "created_at": p.created_at,
        "tasks": p.tasks,
        "teamMembers": list(set(member_names))
    }


@router.post("/projects/", response_model=schemas.Project) # Yeni proje oluşturma endpoint
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db),
                   current_user_id: int = Depends(verify_token)):
    new_project = models.Project(**project.model_dump(), user_id=current_user_id) # current user ID ile projeyi kur
    db.add(new_project) # Veritabanına ekle
    db.commit()
    db.refresh(new_project)
    log_activity(db, user_id=current_user_id, project_id=new_project.id, action_type="project_created",
                 details=f"Proje oluşturuldu: {project.name}") # İşlemi kaydet
    return new_project


@router.patch("/projects/{project_id}", response_model=schemas.Project) # Proje düzenleme adresi
def update_project(project_id: int, update_data: schemas.ProjectUpdate, db: Session = Depends(get_db),
                   current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id): # İzin var mı bak
        raise HTTPException(status_code=403, detail="Projeyi düzenleme yetkiniz yok")

    db_project = db.query(models.Project).filter(models.Project.id == project_id).first() # Projeyi bul

    for key, value in update_data.model_dump(exclude_unset=True).items(): # Sadece değişmesi istenen kısımları al
        setattr(db_project, key, value) # Yeni değerleri yaz
    db.commit() # Veritabanını güncelle
    db.refresh(db_project)
    return db_project