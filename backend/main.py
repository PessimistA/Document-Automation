import multiprocessing
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base

# Router (Bağlantı) importları
from bağlantılar import (
    auth, invitations, projects, tasks, files, members,
    dashboard, repositories, ai_operations, messages, system
)

# Uygulama Hazırlığı
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s') # Log düzenini belirler
logger = logging.getLogger(__name__) # Kayıt birimini başlatır

Base.metadata.create_all(bind=engine) # Tabloları fiziksel oluşturur
app = FastAPI(title="Entegre Proje Yönetimi ve AI API", version="3.0.0") # API motorunu kurar

# CORS Ayarları
app.add_middleware( # Erişim kurallarını tanımlar
    CORSMiddleware,
    allow_origins=["*"], # Kaynak kısıtlamasını kaldırır
    allow_credentials=True, # Çerezlere onay verir
    allow_methods=["*"], # İstek türlerini açar
    allow_headers=["*"], # Başlık izni verir
    expose_headers=["Content-Disposition"] # İndirme bilgisini gösterir
)

# Modüllerin Bağlanması
app.include_router(auth.router, tags=["Auth"])
app.include_router(invitations.router, tags=["Invitations"])
app.include_router(projects.router, tags=["Projects"])
app.include_router(tasks.router, tags=["Tasks"])
app.include_router(files.router, tags=["Files"])
app.include_router(members.router, tags=["Members"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(repositories.router, tags=["Repositories"])
app.include_router(ai_operations.router, tags=["AI Operations"])
app.include_router(messages.router, tags=["Messages"])
app.include_router(system.router, tags=["System"])

if __name__ == "__main__":
    multiprocessing.freeze_support()
    uvicorn.run(app, host="127.0.0.1", port=8000)