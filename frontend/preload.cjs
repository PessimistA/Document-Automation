const { contextBridge,ipcRenderer } = require('electron'); // Electron modüllerini aktar

contextBridge.exposeInMainWorld('electron_api',{ // API'yi dışa aktar
    appVersion:process.versions.electron, // Sürüm bilgisini ekle
    get_sytem_status:(url)=>ipcRenderer.invoke('check-system-status',url), // Durum kontrolünü bağla
});