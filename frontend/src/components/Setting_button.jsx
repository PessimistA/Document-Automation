import React, { useEffect, useState } from "react"; // Import React hooks
import { Thermometer, Settings, Cpu, Activity, Link as LinkIcon, RefreshCw, Save } from "lucide-react"; // Import UI icons

const lm_url = import.meta.env.VITE_LM_STUDIO_LINK || "http://localhost:1234"; // Set default URL

const Setting_button = () => { // Settings button component
  const [open, set_open] = useState(false); // Popover state
  const [loading, set_loading] = useState(false); // Loading state
  const [info, set_info] = useState({ gpu_usage: '...', gpu_temp: '...', lm_studio_active: false }); // Hardware info state

  const [lm_studio_link, set_lm_studio_link] = useState(lm_url); // API link state

  const backend_status = async () => { // Fetch hardware status
    set_loading(true); // Start loading indicator
    try { // Start try block
      if (!window.electron_api) { // Check electron bridge
        console.warn("DİKKAT: Electron ortamında değilsin!"); // Log missing bridge
        set_info({ gpu_usage: 'N/A', gpu_temp: 'N/A', lm_studio_active: false }); // Set fallback data
        set_loading(false); // Stop loading indicator
        return; // Exit execution
      }

      const res = await window.electron_api.get_sytem_status(lm_studio_link); // Fetch system status
      
      set_info({ // Update state
        gpu_usage: res.gpu_usage, // Set GPU usage
        gpu_temp: res.gpu_temp, // Set GPU temp
        lm_studio_active: res.lm_studio_active // Set studio status
      });

    } catch (e) { // Catch fetch error
      console.error("Backend'e ulaşılamadı:", e); // Log connection error
      set_info({ gpu_usage: 'Hata', gpu_temp: 'Hata', lm_studio_active: false }); // Set error state
    }
    set_loading(false); // Stop loading indicator
  };

  useEffect(() => { // Mount effect hook
    if (open) backend_status(); // Fetch on open
  }, [open]); // Dependency array trigger

  const styles = { // Inline CSS styles
    container: { position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }, // Container styles
    icon_buton: { backgroundColor: '#879f84', color: 'white', padding: '12px', borderRadius: '50%', border: '1px solid #334155', cursor: 'pointer', display: 'flex' }, // Button styles
    pop_over: { backgroundColor: '#879f84', color: 'white', borderRadius: '12px', border: '1px solid #398d30', cursor: 'pointer', display: open ? 'block' : 'none', position: 'absolute', top: '55px', right: '0', width: '280px' }, // Popover styles
    info_item: { backgroundColor: '#879f84', alignItems: 'center', gap: '10px', display: 'flex', marginBottom: '15px', fontSize: '14px' }, // Info item styles
    input_part: { resize: 'none', fontFamily: 'monospace', outline: 'none', marginTop: '5px', fontSize: '14px', color: 'white', borderRadius: '8px', border: '1px solid #398d30', backgroundColor: '#879f84', width: '98%' }, // Input field styles
    status_doc: (active) => ({ backgroundColor: active ? '#22c55e' : '#ef4444', width: '10px', height: '10px', borderRadius: '50%' }) // Status indicator styles
  };

  return ( // Return JSX elements
    <div style={styles.container} onMouseEnter={() => set_open(true)} onMouseLeave={() => set_open(false)}>
      <button style={styles.icon_buton}>
        <Settings size={24} color={open ? '#3b82f6' : 'white'} />
      </button>

      <div style={styles.pop_over} className="p-4">
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}> Ayarlar </h3>
        <div style={styles.info_item}>
          <Cpu size={18} color="#60a5fa" />
          <span>GPU Kullanımı: <strong>%{info.gpu_usage}</strong></span>
        </div>
        <div style={styles.info_item}>
          <Thermometer size={18} color="#f87171" />
          <span>GPU Sıcaklık: <strong>{info.gpu_temp}°C</strong></span>
        </div>
        <div style={styles.info_item}>
          <Activity size={18} color="#a78bfa" />
          <span>LM Studio:</span>
          <div style={styles.status_doc(info.lm_studio_active)} />
          <small>{info.lm_studio_active ? 'Bağlı' : 'Bağlantı Yok'}</small>
        </div>
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#94a3b8' }}>
            <LinkIcon size={14} /> API Endpoint URL
          </div>
          <textarea
            style={styles.input_part}
            rows="2"
            value={lm_studio_link}
            onChange={(e) => set_lm_studio_link(e.target.value)}
            placeholder="http://localhost:1234"
          />
        </div>
        <button
          onClick={backend_status}
          style={{ width: '100%', marginTop: '15px', padding: '8px', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Ayarları Güncelle
        </button>
      </div>
    </div>
  );
};

export default Setting_button; // Export default component