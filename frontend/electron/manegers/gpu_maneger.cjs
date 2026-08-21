const axios = require('axios');

const gpu_data = async () => {
    try {
        // Backend API Adresini Çevre Değişkeninden Al
        const API_BASE_URL = process.env.VITE_API_URL || process.env.API_URL || 'http://127.0.0.1:8000';

        const response = await axios.get(`${API_BASE_URL}/api/gpu-status`, { 
            timeout: 2000 // 2 saniyede cevap gelmezse patlamasın diye
        });
        
        // FastAPI'den dönen temiz JSON'u al ve ilet
        return response.data;
        
    } catch (error) {
        console.log("FastAPI GPU servisine ulaşılamadı (Backend kapalı olabilir):", error.message);
        // Backend kapalıysa arayüz çökmesin diye hata değerleri dön
        return { usage: 'error', temp: 'error' };
    }
};

module.exports = { gpu_data };