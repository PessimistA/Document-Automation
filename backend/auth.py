
from datetime import datetime, timedelta # Zaman işlemleri
from typing import Optional # İsteğe bağlı değişken tipi
from jose import JWTError, jwt # Şifreleme aracı
from fastapi import HTTPException, Depends, status # Web API araçları
from fastapi.security import OAuth2PasswordBearer # Güvenlik aracı

SECRET_KEY = "proje_yonetim_sistemi_gizli_anahtar" # Şifreleme anahtarı
ALGORITHM = "HS256" # Şifreleme yöntemi
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # tokenin geçerlilik süresi

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") # Giriş adresi kuralı

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy() # Kullanıcı verisini kopyala
    if expires_delta:
        expire = datetime.utcnow() + expires_delta # Verilen süreyi ekle
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) # Varsayılan süreyi ekle

    to_encode.update({"exp": expire}) # Bitiş zamanını veriye ekle
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM) # Veriyi şifrele
    return encoded_jwt # Şifreli tokeni geri ver

def verify_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Oturum süresi dolmuş veya geçersiz kimlik.",
        headers={"WWW-Authenticate": "Bearer"},
    ) # Hata mesajını hazırla
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) # tokeni çöz
        user_id: str = payload.get("sub") # Kullanıcı kimliğini al
        if user_id is None:
            raise credentials_exception # Kimlik yoksa hata ver
        return int(user_id) # Kimlik numarasını geri ver
    except JWTError:
        raise credentials_exception # Çözme başarısızsa hata ver