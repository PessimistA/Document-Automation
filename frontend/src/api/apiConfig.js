import axios from 'axios'; // Axios kütüphanesini içe aktar

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'; // Temel URL'yi belirle

const api = axios.create({ // Axios örneği oluştur
  baseURL: BASE_URL, // Temel adresi ayarla
  headers: { // Başlıkları tanımla
    'Content-Type': 'application/json', // JSON veri türünü ayarla
  },
});

api.interceptors.request.use((config) => { // İstek yakalayıcı (interceptor) başlat
  const token = localStorage.getItem('access_token'); // Tokeni hafızadan al
  if (token) { // Token mevcutsa
    config.headers.Authorization = `Bearer ${token}`; // Yetki başlığını ekle
  }
  return config; // Yapılandırmayı döndür
}, (error) => Promise.reject(error)); // İstek hatasını reddet

api.interceptors.response.use( // Yanıt yakalayıcı başlat
  (response) => response, // Başarılı yanıtı döndür
  (error) => { // Hata durumunu yönet
    if (error.response && error.response.status === 401) { // Yetkisiz erişim kontrolü
      console.error("Yetkisiz erişim. Token siliniyor."); // Hata logu yaz
      localStorage.removeItem('access_token'); // Geçersiz tokeni sil
    }
    return Promise.reject(error); // Hatayı ileri fırlat
  }
);

export default api; // API örneğini dışa aktar