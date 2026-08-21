# Python 3.10 kullanıyoruz
FROM python:3.10-slim

WORKDIR /app

# Gerekli Python kütüphanelerini kuruyoruz
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm backend kodlarını (main.py, app.db vs.) kopyalıyoruz
COPY . .

# FastAPI'yi 8000 portundan dışarı açıyoruz
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]