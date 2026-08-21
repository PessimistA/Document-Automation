import json # Veriyi metne çevirme aracı
import sys # Sistem araçları
import traceback # Hata izleme aracı
import os # İşletim sistemi araçları

def get_gpu_data():
    try:
        import pynvml # Ekran kartı kütüphanesini
        pynvml.nvmlInit() # Kütüphaneyi başlat

        handle = pynvml.nvmlDeviceGetHandleByIndex(0) # Sistemdeki ilk ekran kartını seç
        util = pynvml.nvmlDeviceGetUtilizationRates(handle) # Anlık Kullanım oranını al
        temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU) # Anlık Sıcaklığı al

        return {"usage": util.gpu, "temp": temp} # Verileri geri dön

    except Exception as e:
        hata_silsilesi = traceback.format_exc() # Hatanın detayını al

        log_dosyasi = os.path.join(os.getcwd(), "gpu_hata_log.txt") # Hata dosyası yolu
        try:
            with open(log_dosyasi, "w", encoding="utf-8") as f: # Dosyayı yazma modunda aç
                f.write("=== GPU VERISI ALINIRKEN HATA OLUSTU ===\n") # Başlık yaz
                f.write(hata_silsilesi) # Hata detayını yaz
        except Exception as log_err:
            pass # Yazamazsa çökmeyi engelle

        return {"usage": "error", "temp": "error", "hata_detayi": str(e)} # Sisteme hata bilgisini gönder

if __name__ == "__main__":
    print(json.dumps(get_gpu_data())) # Dosya çalışırsa veriyi ekrana yaz