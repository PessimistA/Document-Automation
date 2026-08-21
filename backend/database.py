import os # İşletim sistemi araçları
import sys # Sistem araçları
from sqlalchemy import create_engine # Veritabanı motoru
from sqlalchemy.orm import declarative_base, sessionmaker # Veritabanı yönetim araçları

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable) # Exe ise ana klasörü bul
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # Kod ise ana klasörü bul

DATABASE_PATH = os.path.join(BASE_DIR, "app.db") # Veritabanı dosya yolunu ayarla
DOCS_DIR = os.path.join(BASE_DIR, "dokumanlar") # Belge klasörü yolunu ayarla

os.makedirs(DOCS_DIR, exist_ok=True) # Klasör yoksa oluştur

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}" # Bağlantı adresini hazırla

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
) # Veritabanı motorunu başlat
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) # Oturum yöneticisini kur

Base = declarative_base() # Veritabanı modelleri için temel sınıf

def get_db():
    db = SessionLocal() # Yeni oturum aç
    try:
        yield db # Oturumu kullanmaya başla
    finally:
        db.close() # İşlem bitince oturumu kapat