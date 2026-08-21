import os
import shutil
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

import schemas
import models
from database import get_db
from auth import verify_token
from bağlantılar.core import log_activity, check_project_access, FILES_DIR, ExportFileRequest, RenameFileRequest

router = APIRouter()
@router.get("/projects/{project_id}/files/",
            response_model=List[schemas.ProjectFile])  # Proje dosyalarını listele
def get_project_files(project_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id):  # Erişim kontrolü
        raise HTTPException(status_code=403, detail="Yetkiniz yok")
    return db.query(models.ProjectFile).filter(models.ProjectFile.project_id == project_id).all()  # Dosyaları dön


@router.post("/projects/{project_id}/upload_file/")  # Projeye dosya yükle
async def upload_file(project_id: int, file: UploadFile = FastAPIFile(...), db: Session = Depends(get_db),
                      current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id):  # Erişim kontrolü
        raise HTTPException(status_code=403, detail="Yetkiniz yok")

    _, ext = os.path.splitext(file.filename)  # Uzantıyı ayır
    if ext.lower() in [".exe", ".bat", ".cmd", ".msi", ".sh"]:  # Zararlı uzantı engeli
        raise HTTPException(status_code=400,
                            detail="Güvenlik nedeniyle çalıştırılabilir dosya (.exe, .bat vb.) yüklenemez.")

    if not os.path.exists(FILES_DIR):  # Klasör kontrolü
        os.makedirs(FILES_DIR, exist_ok=True)  # Klasör oluştur

    safe_filename = file.filename.replace(" ", "_")  # Güvenli isim
    timestamp_str = str(datetime.datetime.now().timestamp()).replace(".", "_")  # Zaman damgası
    file_path = os.path.join(FILES_DIR, f"proj_{project_id}_user_{current_user_id}_{timestamp_str}_{safe_filename}")  # Dosya yolu

    try:
        with open(file_path, "wb") as buffer:  # Dosyayı aç
            shutil.copyfileobj(file.file, buffer)  # Diske yaz
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya kaydedilirken fiziksel bir hata oluştu: {str(e)}")

    file_size_bytes = os.path.getsize(file_path)  # Boyut hesapla
    file_size_kb = f"{file_size_bytes / 1024:.2f} KB"  # KB çevir

    new_file = models.ProjectFile(  # Veritabanı modeli
        name=file.filename,
        file_type="file",
        size=file_size_kb,
        file_path=file_path,
        project_id=project_id,
        user_id=current_user_id
    )
    db.add(new_file)  # Kaydı ekle
    db.commit()  # Onayla
    db.refresh(new_file)  # Yenile

    log_activity(db, user_id=current_user_id, project_id=project_id, action_type="file_uploaded",
                 details=f"Proje dosyası yüklendi: {file.filename}")  # Aktivite kaydı
    return new_file  # Dosyayı dön


@router.post("/projects/{project_id}/link_file/{file_id}")  # Dosyayı projeye bağla
def link_system_file_to_project(project_id: int, file_id: int, db: Session = Depends(get_db),
                                current_user_id: int = Depends(verify_token)):
    if not check_project_access(db, project_id, current_user_id):  # Erişim kontrolü
        raise HTTPException(status_code=403, detail="Bu projeye dosya ekleme yetkiniz yok")

    sys_file = db.query(models.ProjectFile).filter(  # Dosyayı sorgula
        models.ProjectFile.id == file_id,
        models.ProjectFile.user_id == current_user_id,
        models.ProjectFile.project_id == None
    ).first()

    if not sys_file:  # Dosya yoksa
        raise HTTPException(status_code=404, detail="Sistem dosyası bulunamadı veya size ait değil")

    if not os.path.exists(FILES_DIR):  # Klasör kontrolü
        os.makedirs(FILES_DIR, exist_ok=True)  # Klasör oluştur

    safe_name = sys_file.name.replace(" ", "_")  # Güvenli isim
    timestamp_str = str(datetime.datetime.now().timestamp()).replace(".", "_")  # Zaman damgası
    new_file_path = os.path.join(FILES_DIR, f"proj_{project_id}_{timestamp_str}_{safe_name}")  # Yeni yol

    try:
        shutil.copy2(sys_file.file_path, new_file_path)  # Dosyayı kopyala
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya kopyalanırken hata oluştu: {str(e)}")

    new_project_file = models.ProjectFile(  # Veritabanı modeli
        name=sys_file.name,
        file_type=sys_file.file_type,
        size=sys_file.size,
        file_path=new_file_path,
        project_id=project_id,
        user_id=current_user_id
    )
    db.add(new_project_file)  # Kaydı ekle
    db.commit()  # Onayla
    db.refresh(new_project_file)  # Yenile

    log_activity(db, user_id=current_user_id, project_id=project_id, action_type="file_linked",
                 details=f"Sistemden dosya projeye aktarıldı: {sys_file.name}")  # Aktivite kaydı
    return new_project_file  # Dosyayı dön


@router.post("/files/upload/")  # Şahsi dosya yükle
async def upload_system_file(file: UploadFile = FastAPIFile(...), db: Session = Depends(get_db),
                             current_user_id: int = Depends(verify_token)):
    _, ext = os.path.splitext(file.filename)  # Uzantıyı ayır
    if ext.lower() in [".exe", ".bat", ".cmd", ".msi", ".sh"]:  # Zararlı uzantı engeli
        raise HTTPException(status_code=400,
                            detail="Güvenlik nedeniyle çalıştırılabilir dosya (.exe, .bat vb.) yüklenemez.")

    if not os.path.exists(FILES_DIR):  # Klasör kontrolü
        os.makedirs(FILES_DIR, exist_ok=True)  # Klasör oluştur

    safe_filename = file.filename.replace(" ", "_")  # Güvenli isim
    timestamp_str = str(datetime.datetime.now().timestamp()).replace(".", "_")  # Zaman damgası
    file_path = os.path.join(FILES_DIR,
                             f"user_{current_user_id}_{timestamp_str}_{safe_filename}")  # Şahsi yol

    try:
        with open(file_path, "wb") as buffer:  # Dosyayı aç
            shutil.copyfileobj(file.file, buffer)  # Diske yaz
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Şahsi dosya kaydedilirken hata oluştu: {str(e)}")

    file_size_bytes = os.path.getsize(file_path)  # Boyut hesapla
    file_size_kb = f"{file_size_bytes / 1024:.2f} KB"  # KB çevir

    new_file = models.ProjectFile(  # Veritabanı modeli
        name=file.filename,
        file_type="file",
        size=file_size_kb,
        file_path=file_path,
        project_id=None,
        user_id=current_user_id
    )
    db.add(new_file)  # Kaydı ekle
    db.commit()  # Onayla
    db.refresh(new_file)  # Yenile

    log_activity(db, user_id=current_user_id, action_type="file_uploaded",
                 details=f"Şahsi dosya yüklendi: {file.filename}")  # Aktivite kaydı
    return new_file  # Dosyayı dön


@router.delete("/files/{file_id}")  # Dosyayı sil
def delete_file(file_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    db_file = db.query(models.ProjectFile).filter(models.ProjectFile.id == file_id).first()  # Dosyayı bul

    if db_file:
        if db_file.project_id is None:  # Şahsi dosya kontrolü
            if db_file.user_id != current_user_id:  # Sahibi mi
                raise HTTPException(status_code=403, detail="Dosya size ait değil.")
        elif not check_project_access(db, db_file.project_id, current_user_id):  # Proje yetkisi
            raise HTTPException(status_code=403, detail="Bu projede yetkiniz yok.")

        if db_file.file_path and os.path.exists(db_file.file_path):  # Dosya var mı
            try:
                os.remove(db_file.file_path)  # Diskten sil
            except Exception:
                pass  # Çökmeyi yoksay

        db.delete(db_file)  # Veritabanından sil
        db.commit()  # Onayla
        return {"message": "Dosya silindi"}  # Sonucu dön

    raise HTTPException(status_code=404, detail="Dosya bulunamadı.")  # Dosya yoksa


@router.get("/files/{file_id}/content")  # Dosya içeriği
def get_file_content(file_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    db_file = db.query(models.ProjectFile).filter(models.ProjectFile.id == file_id).first()  # Dosyayı bul

    if not db_file:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı.")

    if db_file.project_id is None and db_file.user_id != current_user_id:  # Şahsi yetki
        raise HTTPException(status_code=403, detail="Bu dosyayı görüntüleme yetkiniz yok.")
    elif db_file.project_id is not None and not check_project_access(db, db_file.project_id, current_user_id):  # Proje yetkisi
        raise HTTPException(status_code=403, detail="Bu projede yetkiniz yok.")

    try:
        with open(db_file.file_path, "r", encoding="utf-8") as f:  # Dosyayı oku
            content = f.read()  # İçeriği al
        return {"content": content}  # İçeriği dön
    except UnicodeDecodeError:  # Metin dışı format
        return {"content": "Bu dosya metin formatında değil. Lütfen dosyayı indirin."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{file_id}/download")  # Dosya indirme
def download_file(file_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    db_file = db.query(models.ProjectFile).filter(models.ProjectFile.id == file_id).first()  # Dosyayı bul

    if not db_file:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı.")

    if db_file.project_id is None and db_file.user_id != current_user_id:  # Şahsi yetki
        raise HTTPException(status_code=403, detail="Bu dosyayı indirme yetkiniz yok.")
    elif db_file.project_id is not None and not check_project_access(db, db_file.project_id, current_user_id):  # Proje yetkisi
        raise HTTPException(status_code=403, detail="Bu projede yetkiniz yok.")

    if not os.path.exists(db_file.file_path):  # Fiziksel kontrol
        raise HTTPException(status_code=404, detail="Dosya fiziksel olarak sunucuda bulunamadı.")

    log_activity(db, user_id=current_user_id, project_id=db_file.project_id, action_type="file_downloaded",
                 details=f"Dosya indirildi: {db_file.name}")  # Aktivite kaydı
    return FileResponse(path=db_file.file_path, filename=db_file.name)  # İndirmeyi başlat


@router.patch("/files/{file_id}/rename")  # İsim değiştirme
def rename_project_file(file_id: int, req: RenameFileRequest, db: Session = Depends(get_db),
                        current_user_id: int = Depends(verify_token)):
    db_file = db.query(models.ProjectFile).filter(models.ProjectFile.id == file_id).first()  # Dosyayı bul

    if not db_file:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı.")

    if db_file.project_id is None:  # Şahsi kontrol
        if db_file.user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Bu dosya size ait değil.")
    else:  # Proje kontrolü
        if not check_project_access(db, db_file.project_id, current_user_id):
            raise HTTPException(status_code=403, detail="Bu projede yetkiniz yok.")

    db_file.name = req.new_name  # Yeni ismi ata
    db.commit()  # Onayla
    db.refresh(db_file)  # Yenile

    log_activity(db, user_id=current_user_id, project_id=db_file.project_id, action_type="file_renamed",
                 details=f"Dosya adı değiştirildi: {db_file.name}")  # Aktivite kaydı

    return {"message": "Dosya adı başarıyla değiştirildi", "new_name": db_file.name}  # Sonucu dön


@router.post("/files/{file_id}/export")  # Şahsi alana aktar
def export_to_personal_files(file_id: int, req: ExportFileRequest, db: Session = Depends(get_db),
                             current_user_id: int = Depends(verify_token)):
    db_file = db.query(models.ProjectFile).filter(models.ProjectFile.id == file_id).first()  # Dosyayı bul

    if not db_file or db_file.project_id is None:  # Geçerlilik kontrolü
        raise HTTPException(status_code=404, detail="Aktarılacak geçerli bir proje dosyası bulunamadı.")

    if not check_project_access(db, db_file.project_id, current_user_id):  # Yetki kontrolü
        raise HTTPException(status_code=403, detail="Bu projede yetkiniz yok.")

    if not os.path.exists(FILES_DIR):  # Klasör kontrolü
        os.makedirs(FILES_DIR, exist_ok=True)  # Klasör oluştur

    new_filename = f"[{req.project_name}] {db_file.name}"  # Yeni ismi hazırla
    safe_filename = new_filename.replace(" ", "_")  # Güvenli isim
    timestamp_str = str(datetime.datetime.now().timestamp()).replace(".", "_")  # Zaman damgası

    new_file_path = os.path.join(FILES_DIR, f"user_{current_user_id}_{timestamp_str}_{safe_filename}")  # Yeni yol

    try:
        shutil.copy2(db_file.file_path, new_file_path)  # Dosyayı kopyala
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya dışa aktarılırken hata oluştu: {str(e)}")

    new_personal_file = models.ProjectFile(  # Veritabanı modeli
        name=new_filename,
        file_type=db_file.file_type,
        size=db_file.size,
        file_path=new_file_path,
        project_id=None,
        user_id=current_user_id
    )

    db.add(new_personal_file)  # Kaydı ekle
    db.commit()  # Onayla
    db.refresh(new_personal_file)  # Yenile

    log_activity(db, user_id=current_user_id, action_type="file_exported",
                 details=f"Proje dosyası şahsi alana aktarıldı: {new_filename}")  # Aktivite kaydı
    return new_personal_file  # Dosyayı dön


@router.get("/system/files/", response_model=List[schemas.ProjectFile])  # Şahsi dosyaları listele
def get_all_system_files(db: Session = Depends(get_db), current_user_id: int = Depends(verify_token)):
    return db.query(models.ProjectFile).filter(  # Filtrele
        models.ProjectFile.user_id == current_user_id,
        models.ProjectFile.project_id == None
    ).all()  # Dosyaları dön