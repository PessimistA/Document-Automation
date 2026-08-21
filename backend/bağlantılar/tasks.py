from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import schemas
import models
from database import get_db
from auth import verify_token
from bağlantılar.core import log_activity, check_project_access

router = APIRouter()

@router.get("/projects/{project_id}/tasks/", response_model=List[schemas.Task]) # Projenin görevlerini getirme adresi
def get_project_tasks(project_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id): # Projeye erişim yetkisi var mı bak
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    return db.query(models.Task).filter(models.Task.project_id == project_id).all() # O projenin görevlerini ver


@router.post("/projects/{project_id}/tasks/", response_model=schemas.Task) # Projeye yeni görev ekleme adresi
def create_task(project_id: int, task_data: schemas.TaskCreate, db: Session = Depends(get_db),
                current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id): # İzin kontrolü
        raise HTTPException(status_code=403, detail="Yetkiniz yok")

    new_task = models.Task(project_id=project_id, title=task_data.title, is_completed=False) # Görevi tamamlanmamış olarak hazırla
    db.add(new_task) # Veritabanına ekle
    db.commit()
    db.refresh(new_task)
    log_activity(db, user_id=current_user_id, project_id=project_id, action_type="task_created",
                 details=f"Yeni görev eklendi: {task_data.title}") # Görevin eklendiğini kaydet
    return new_task


@router.patch("/tasks/{task_id}") # Görevin durumunu güncelleme adresi
def update_task_status(task_id: int, data: dict, db: Session = Depends(get_db),
                       current_user_id: int = Depends(verify_token)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first() # Görevi bul
    if task and check_project_access(db, task.project_id, current_user_id): # Görev varsa ve yetkim varsa
        task.is_completed = data.get("is_completed", task.is_completed) # Görevin tamamlanma durumunu değiştir
        db.commit() # Değişikliği veritabanına yaz
        return {"message": "Görev güncellendi"}
    raise HTTPException(status_code=403, detail="Yetkiniz yok")


@router.delete("/tasks/{task_id}") # Görevi silme adresi
def delete_task(task_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first() # Silinecek görevi bul
    if task and check_project_access(db, task.project_id, current_user_id): # Yetki kontrolü yap
        db.delete(task) # Görevi listeden sil
        db.commit()
        return {"message": "Görev Silindi"}
    raise HTTPException(status_code=403, detail="Yetkiniz yok")