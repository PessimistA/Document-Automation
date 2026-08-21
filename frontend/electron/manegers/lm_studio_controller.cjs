const { ipcMain } = require('electron'); // Electron IPC modülü
const axios = require('axios'); // Axios HTTP istemcisi

function lm_studio() { // LM Studio yöneticisi
    ipcMain.handle('check-system-status', async (event, url) => { // IPC kanalını dinle
        let status_result = { // Durum nesnesini başlat
            lm_studio_active: false, // LM Studio durumu
            gpu_usage: "N/A", // GPU kullanım oranı
            gpu_temp: "N/A" // GPU sıcaklık değeri
        };

        const safeUrl = url || "http://localhost:1234"; // Güvenli URL ata
        
        const API_BASE_URL = process.env.VITE_API_URL || process.env.API_URL || 'http://127.0.0.1:8000'; // API adresini belirle

        try { // LM hata yakalama
            const cleanUrl = safeUrl.replace(/\/$/, ''); // URL sonunu temizle
            const lm_res = await axios.get(`${cleanUrl}/v1/models`, { timeout: 1500 }); // LM API isteği
            if (lm_res.status === 200) { // Başarıyı kontrol et
                status_result.lm_studio_active = true; // Aktif durumunu güncelle
            }
        } catch (e) { // Hata bloğunu yakala
            console.log("LM Studio bağlantısı başarısız."); // Hata logu yaz
        }

        try { // GPU hata yakalama
            const gpu_res = await axios.get(`${API_BASE_URL}/api/gpu-status`, { timeout: 2000 }); // GPU API isteği
            if (gpu_res.data && gpu_res.data.usage !== 'error') { // Veri geçerliliğini onayla
                status_result.gpu_usage = gpu_res.data.usage; // Kullanım verisini güncelle
                status_result.gpu_temp = gpu_res.data.temp; // Sıcaklık verisini güncelle
            }
        } catch (error) { // Hata bloğunu yakala
            console.log("FastAPI GPU rotasına ulaşılamadı."); // Hata logu yaz
        }

        return status_result; // Sonuçları geri dön
    });
}

module.exports = { lm_studio }; // Modülü dışa aktar