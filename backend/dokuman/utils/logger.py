import logging  # Sistem kayıt aracı

def setup_logger():  # Kayıt ayarlarını başlat
    logger = logging.getLogger("AIDocGen")  # Özel kayıtçı oluştur
    logger.setLevel(logging.INFO)  # Bilgi seviyesini ayarla
    if not logger.handlers:  # Çift kaydı önle
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')  # Çıktı formatını belirle
        ch = logging.StreamHandler()  # Ekran kanalını aç
        ch.setFormatter(formatter)  # Formatı kanala uygula
        logger.addHandler(ch)  # Kanalı sisteme bağla
    return logger  # Hazır kayıtçıyı dön

logger = setup_logger()  # Sistemi kullanıma aç