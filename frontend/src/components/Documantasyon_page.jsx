import React, { useState, useEffect, useRef, useContext } from "react"; // Import React hooks
import axios from "axios"; // Import HTTP client
import { Plus, Trash2, FileText, ChevronRight, ListPlus, Save, Type, Sparkles, Edit, Globe, X, Loader2, Thermometer, Settings, Cpu, Activity, Link, RefreshCw,LinkIcon } from 'lucide-react'; // Import UI icons
import Markdown from 'react-markdown'; // Import markdown parser

import { editInlineDocument } from "../services/apiService"; // Import API service
import { DocumentContext } from "./DocumentContext"; // Import document context

const Setting_button = () => { // Settings button component
  const [open, set_open] = useState(false); // Popover visibility state
  const [loading, set_loading] = useState(false); // Loading status state
  const [info, set_info] = useState({ gpu_usage: '...', gpu_temp: '...', lm_studio_active: false }); // Hardware info state
  const [lm_studio_link, set_lm_studio_link] = useState(import.meta.env.VITE_LM_STUDIO_LINK || "http://localhost:1234"); // API endpoint state

  const close_timeout_ref = useRef(null); // Close timeout reference

  const handle_mouse_enter = () => { // Handle mouse enter
    if (close_timeout_ref.current) clearTimeout(close_timeout_ref.current); // Clear close timeout
    set_open(true); // Open settings popover
  };

  const handle_mouse_leave = () => { // Handle mouse leave
    close_timeout_ref.current = setTimeout(() => { // Set close timeout
      set_open(false); // Close settings popover
    }, 300);
  };

  const backend_status = async () => { // Fetch backend status
    set_loading(true); // Start loading indicator
    try { // Start try block
      if (!window.electron_api) { // Check Electron environment
        console.warn("DİKKAT: Electron ortamında değilsin!"); // Log environment warning
        set_info({ gpu_usage: 'N/A', gpu_temp: 'N/A', lm_studio_active: false }); // Set fallback info
        set_loading(false); // Stop loading indicator
        return; // Exit execution
      }
      const res = await window.electron_api.get_sytem_status(lm_studio_link); // Call system API
      set_info({ // Update hardware info
        gpu_usage: res.gpu_usage, // Set GPU usage
        gpu_temp: res.gpu_temp, // Set GPU temperature
        lm_studio_active: res.lm_studio_active // Set API status
      });
    } catch (e) { // Catch error block
      console.error("Backend'e ulaşılamadı:", e); // Log connection error
      set_info({ gpu_usage: 'Hata', gpu_temp: 'Hata', lm_studio_active: false }); // Set error info
    }
    set_loading(false); // Stop loading indicator
  };

  useEffect(() => { // Mount effect hook
    if (open) backend_status(); // Fetch status on open
    return () => { // Cleanup function
      if (close_timeout_ref.current) clearTimeout(close_timeout_ref.current); // Clear pending timeout
    };
  }, [open]); // Dependency array trigger

  const styles = { // Component inline styles
    container: { position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }, // Container styles
    icon_buton: { backgroundColor: '#879f84', color: 'white', padding: '12px', borderRadius: '50%', border: '1px solid #334155', cursor: 'pointer', display: 'flex' }, // Button styles
    pop_over: { backgroundColor: '#879f84', color: 'white', borderRadius: '12px', border: '1px solid #398d30', cursor: 'default', display: open ? 'block' : 'none', position: 'absolute', top: '50px', right: '0', width: '280px', padding: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }, // Popover styles
    info_item: { backgroundColor: 'transparent', alignItems: 'center', gap: '10px', display: 'flex', marginBottom: '15px', fontSize: '14px' }, // Info item styles
    input_part: { resize: 'none', fontFamily: 'monospace', outline: 'none', marginTop: '5px', fontSize: '14px', color: 'white', borderRadius: '8px', border: '1px solid #398d30', backgroundColor: '#6a7d68', width: '100%', padding: '5px' }, // Input field styles
    status_doc: (active) => ({ backgroundColor: active ? '#22c55e' : '#ef4444', width: '10px', height: '10px', borderRadius: '50%' }) // Status indicator styles
  };

  return ( // Return JSX elements
    <div style={styles.container} onMouseEnter={handle_mouse_enter} onMouseLeave={handle_mouse_leave}>
      <button style={styles.icon_buton}>
        <Settings size={24} color={open ? '#3b82f6' : 'white'} />
      </button>
      <div style={styles.pop_over}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}> Ayarlar </h3>
        <div style={styles.info_item}><Cpu size={18} color="#60a5fa" /><span>GPU Kullanımı: <strong>%{info.gpu_usage}</strong></span></div>
        <div style={styles.info_item}><Thermometer size={18} color="#f87171" /><span>GPU Sıcaklık: <strong>{info.gpu_temp}°C</strong></span></div>
        <div style={styles.info_item}>
          <Activity size={18} color="#a78bfa" /><span>LM Studio:</span>
          <div style={styles.status_doc(info.lm_studio_active)} />
          <small>{info.lm_studio_active ? 'Bağlı' : 'Bağlantı Yok'}</small>
        </div>
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#d1d5db' }}><LinkIcon size={14} /> API Endpoint URL</div>
          <textarea style={styles.input_part} rows="2" value={lm_studio_link} onChange={(e) => set_lm_studio_link(e.target.value)} placeholder="http://localhost:1234" />
        </div>
        <button
          onClick={backend_status}
          style={{ width: '100%', marginTop: '15px', padding: '8px', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Ayarları Güncelle
        </button>
      </div>
    </div>
  );
};

export const Documantasyon_page = ({ projectId, onClose, onSaved }) => { // Documentation page component
  const { // Get context states
    parts, set_parts, // Document parts state
    loading_page,  // Loading status state
    output, set_output, // Document output state
    detailLevel, setDetailLevel, // Detail level state
    language, setLanguage, // Language target state
    backend_conntection // API trigger function
  } = useContext(DocumentContext); // Access context data

  const [show_modal, set_show_model] = useState(false); // Save modal state
  const [file_name, set_file_name] = useState('AI_Dokuman'); // Filename input state
  const [save_target, set_save_target] = useState('both'); // Save target state
  const [fontStyle, setFontStyle] = useState('Georgia, serif'); // Font style state
  const [aiEditModal, setAiEditModal] = useState({ isOpen: false, targetText: '', prompt: '' }); // AI edit state
  const [aiEditLoading, setAiEditLoading] = useState(false); // AI loading state

  const adding_parts = () => set_parts([...parts, { id: Date.now(), main_title: '', sub_all: [{ id: Date.now() + 1, sub_title: '', text: '' }] }]); // Add main part
  const deleting_parts = (id) => set_parts(parts.filter(part => part.id !== id)); // Delete main part
  const adding_sub_all_parts = (id) => set_parts(parts.map(part => part.id === id ? { ...part, sub_all: [...part.sub_all, { id: Date.now(), sub_title: '', text: '' }] } : part)); // Add sub part
  const removing_sub_all_parts = (id, sub_id) => set_parts(parts.map(part => part.id === id ? { ...part, sub_all: part.sub_all.filter(sub => sub.id !== sub_id) } : part)); // Remove sub part
  const title_updates = (id, value) => set_parts(parts.map(part => part.id === id ? { ...part, main_title: value } : part)); // Update main title
  const sub_all_title_updates = (part_id, sub_id, field, value) => set_parts(parts.map(part => { // Update sub content
    if (part.id === part_id) { // Check matching part
      return { ...part, sub_all: part.sub_all.map(sub => sub.id === sub_id ? { ...sub, [field]: value } : sub) }; // Update matching field
    }
    return part; // Return unchanged part
  }));

  const handleInlineAiEdit = async () => { // Handle AI editing
    if (!aiEditModal.prompt.trim()) return; // Validate prompt input
    setAiEditLoading(true); // Start loading indicator
    const targetLanguage = language.trim() || 'Türkçe'; // Determine target language

    try { // Start try block
      const res = await editInlineDocument({ // Call AI API
        full_document: output, // Pass full document
        target_text: aiEditModal.targetText, // Pass target text
        instruction: aiEditModal.prompt, // Pass user prompt
        language: targetLanguage  // Pass target language
      });
      
      set_output(res.data.updated_document); // Update global output
      setAiEditModal({ isOpen: false, targetText: '', prompt: '' }); // Reset modal state
    } catch (e) {  // Catch error block
      const errorMsg = e.response?.data?.detail || "Düzenleme sırasında sunucuya ulaşılamadı."; // Extract error message
      alert("Hata: " + errorMsg);  // Notify user error
    }
    setAiEditLoading(false); // Stop loading indicator
  };

  const handleManualEdit = (oldText, newText) => { // Manual edit handler
    if (!oldText || !newText || oldText === newText) return; // Validate input values

    const words = oldText.trim().split(/\s+/); // Split text into words
    const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape regex characters
    const pattern = new RegExp(escapedWords.join('[\\s\\*\\_\\#\\`\\[\\]\\(\\)\\.\\,\\"\\\']*?'), 'i'); // Create flexible pattern

    const match = output.match(pattern); // Search within output

    if (match) { // Check match presence
      set_output(prev => prev.replace(match[0], newText)); // Replace matched content
    } else { // Handle no match
      alert("Sistem Uyarısı: Bu kısım karmaşık markdown içerdiğinden doğrudan değiştirilemedi. Lütfen daha belirgin bir bölüm seçin."); // Alert user failure
    }
  };

  const save_document = async () => { // Handle document saving
    if (!output) return; // Validate output existence

    set_show_model(false); // Close save modal

    const finalWordName = file_name.endsWith('.doc') ? file_name : `${file_name}.doc`; // Format filename extension

    const element = document.getElementById('paper-content'); // Get DOM element
    const paperContent = element ? element.innerHTML : ''; // Extract HTML content

    const wordTemplate = ` 
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${file_name}</title>
        <style>
          body { font-family: ${fontStyle}, sans-serif; padding: 20px; color: #27272a; }
          h1 { color: #09090b; border-bottom: 1px solid #e4e4e7; padding-bottom: 10px; margin-bottom: 20px; font-size: 24pt; }
          h2 { color: #18181b; border-left: 4px solid #2563eb; padding-left: 15px; margin-top: 25px; margin-bottom: 15px; font-size: 18pt; }
          h3 { color: #3f3f46; margin-top: 20px; font-size: 14pt; }
          p { margin-bottom: 15px; line-height: 1.6; }
          ul, ol { margin-left: 30px; margin-bottom: 15px; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        ${paperContent}
      </body>
      </html>
    `; // Generate Word template

    try { // Start try block
      if (save_target === "local" || save_target === "both") { // Check local target
        const blob = new Blob(['\ufeff', wordTemplate], { type: "application/msword;charset=utf-8" }); // Create document blob
        const url = URL.createObjectURL(blob); // Create object URL
        const link = document.createElement("a"); // Create link element
        link.href = url; // Set link URL
        link.download = finalWordName; // Set download filename
        document.body.appendChild(link); // Append link element
        link.click(); // Trigger file download
        document.body.removeChild(link); // Remove link element
        URL.revokeObjectURL(url); // Revoke object URL
      }

      if (save_target === "app" || save_target === "both") { // Check app target
        const fileToUpload = new File(['\ufeff' + wordTemplate], finalWordName, { type: "application/msword" }); // Create file object
        const formData = new FormData(); // Initialize form data
        formData.append("file", fileToUpload); // Append file data

        const token = localStorage.getItem("token") || localStorage.getItem("access_token"); // Get auth token
        
        if (!token) { // Validate auth token
          alert("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın."); // Notify missing token
          return; // Exit execution
        }

        const config = { // Setup request config
          headers: {  // Setup request headers
            "Authorization": `Bearer ${token}`, // Attach auth header
            "Content-Type": "multipart/form-data"  // Set content type
          }
        };

        const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"; // Determine base URL

        if (projectId) { // Check project context
          await axios.post(`${baseURL}/projects/${projectId}/upload_file/`, formData, config); // Upload to project
        } else { // Handle global context
          await axios.post(`${baseURL}/files/upload/`, formData, config); // Upload globally
        }
        
        if (onSaved) onSaved();  // Trigger save callback
        alert("Dosya başarıyla kaydedildi!");  // Notify success
      }
    } catch (e) { // Catch error block
      console.error("Kaydetme işlemi sırasında hata:", e); // Log save error
      if (e.response) { // Check server response
        alert(`Uygulamaya kaydedilirken hata oluştu: Sunucu ${e.response.status} hatası verdi.`); // Notify server error
      } else { // Handle network error
        alert("Uygulamaya kaydedilirken hata oluştu: Sunucuya ulaşılamadı."); // Notify network error
      }
    }
  };

  const extractRawText = (children) => { // Extract raw text
    let text = ""; // Initialize text accumulator
    React.Children.forEach(children, child => { // Iterate over children
      if (typeof child === 'string') text += child; // Append string node
      else if (child?.props?.children) text += extractRawText(child.props.children); // Recurse child nodes
    });
    return text; // Return extracted text
  };

  const HoverableElement = ({ children, Tag, className }) => { // Hover wrapper component
    const [isHovered, setIsHovered] = useState(false); // Hover status state
    const [isEditing, setIsEditing] = useState(false); // Edit mode state
    const [editText, setEditText] = useState(""); // Edit content state

    const rawText = extractRawText(children); // Get element text

    const startManualEditing = () => { // Enable manual editing
      setEditText(rawText); // Set initial text
      setIsEditing(true); // Toggle edit mode
      setIsHovered(false); // Clear hover state
    };

    const saveManualEditing = () => { // Save manual edits
      handleManualEdit(rawText, editText); // Call edit handler
      setIsEditing(false); // Disable edit mode
    };

    if (isEditing) { // Check edit mode
      return ( // Render edit textarea
        <div className="mb-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-400 shadow-sm animate-in fade-in">
          <textarea 
            value={editText} 
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[100px] p-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y font-sans text-sm text-zinc-800 bg-white"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50">İptal</button>
            <button onClick={saveManualEditing} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">Kaydet</button>
          </div>
        </div>
      );
    }

    return ( // Render standard element
      <div 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        className={`relative rounded-lg transition-all duration-200 ${isHovered ? 'bg-blue-50/50 outline-dashed outline-2 outline-blue-300 p-2 -m-2' : ''}`}
      >
        <Tag className={className}>{children}</Tag>
        {isHovered && ( // Render action buttons
          <div className="absolute -top-4 right-2 flex gap-2 z-10 animate-in fade-in slide-in-from-bottom-1">
            <button 
              onClick={startManualEditing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 text-xs font-medium rounded-md shadow-md border border-blue-100 hover:bg-blue-50 transition-colors"
            >
              <Edit size={14} /> Kendin Düzenle
            </button>
            <button 
              onClick={() => setAiEditModal({ isOpen: true, targetText: rawText, prompt: '' })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-md shadow-md hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              <Sparkles size={14} /> AI ile Değiştir
            </button>
          </div>
        )}
      </div>
    );
  };

  return ( // Return JSX components
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl border border-zinc-200 p-6 md:p-8 font-sans text-left relative shadow-sm">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
            <FileText size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Döküman Mimari</h1>
            <p className="text-sm text-zinc-500 mt-1">Akademik AI Yazım Stüdyosu</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-zinc-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
            <Globe size={16} className="text-zinc-400" />
            <input 
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Dil (Örn: Türkçe)"
              disabled={loading_page}
              className="bg-transparent border-none outline-none text-sm text-zinc-900 placeholder-zinc-400 w-28"
            />
          </div>

          <select 
            value={detailLevel} 
            onChange={(e) => setDetailLevel(e.target.value)} 
            disabled={loading_page}
            className="bg-white border border-zinc-300 text-zinc-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="kisa">Kısa Özet</option>
            <option value="normal">Normal Doküman</option>
            <option value="detayli">Detaylı (Uzun)</option>
          </select>
          
          <button 
            onClick={backend_conntection} 
            disabled={loading_page} 
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading_page ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading_page ? 'Oluşturuluyor...' : 'Dosya Oluştur'}
          </button>
          
          <Setting_button />
        </div>
      </header>

      <div className="space-y-6">
        {parts.map((part, index) => ( // Iterate document parts
          <div key={part.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Bölüm #{index + 1}</span>
                <input 
                  className="w-full mt-2 text-xl font-bold bg-transparent border-none outline-none text-zinc-900 placeholder-zinc-300" 
                  placeholder="Ana Başlık (Örn: Giriş, Metodoloji...)" 
                  value={part.main_title} 
                  onChange={(e) => title_updates(part.id, e.target.value)} 
                />
              </div>
              <button 
                onClick={() => deleting_parts(part.id)} 
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Bölümü Sil"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="ml-2 pl-6 border-l-2 border-zinc-200 space-y-4">
              {part.sub_all.map((item) => ( // Iterate sub parts
                <div key={item.id} className="bg-white border border-zinc-200 rounded-lg p-5 relative shadow-sm group/sub">
                  <button 
                    onClick={() => removing_sub_all_parts(part.id, item.id)} 
                    className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover/sub:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronRight size={18} className="text-blue-500" />
                    <input 
                      className="flex-1 font-semibold text-zinc-800 bg-transparent border-none outline-none placeholder-zinc-300" 
                      placeholder="Alt başlık" 
                      value={item.sub_title} 
                      onChange={(e) => sub_all_title_updates(part.id, item.id, 'sub_title', e.target.value)} 
                    />
                  </div>
                  <textarea 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 p-3 h-24 outline-none focus:ring-2 focus:ring-blue-500 resize-y" 
                    placeholder="Bu bölümde bahsedilmesi gereken detaylar, notlar veya maddeler..." 
                    value={item.text} 
                    onChange={(e) => sub_all_title_updates(part.id, item.id, 'text', e.target.value)} 
                  />
                </div>
              ))}
              <button 
                onClick={() => adding_sub_all_parts(part.id)} 
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2 px-2 py-1"
              >
                <ListPlus size={16} /> Alt Başlık Ekle
              </button>
            </div>
          </div>
        ))}
        
        <button 
          onClick={adding_parts} 
          className="w-full py-6 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2"
        >
          <div className="p-2 bg-white rounded-full shadow-sm border border-zinc-100">
            <Plus size={20} />
          </div>
          <span className="font-medium">Yeni Ana Bölüm Ekle</span>
        </button>
      </div>
      
      {output && ( // Conditional output render
        <div className="mt-12 pt-12 border-t border-zinc-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">Oluşturulan Döküman</h2>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-zinc-300 px-3 py-2 rounded-lg">
                <Type size={16} className="text-zinc-500" />
                <select 
                  value={fontStyle} 
                  onChange={(e) => setFontStyle(e.target.value)} 
                  className="bg-transparent border-none outline-none text-sm text-zinc-700 cursor-pointer"
                >
                  <optgroup label="Akademik & Resmi">
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                    <option value="'Garamond', serif">Garamond</option>
                  </optgroup>
                  <optgroup label="Modern & Net">
                    <option value="Arial, Helvetica, sans-serif">Arial</option>
                    <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                    <option value="'Verdana', sans-serif">Verdana</option>
                    <option value="'Tahoma', sans-serif">Tahoma</option>
                  </optgroup>
                  <optgroup label="Teknik & Daktilo">
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                  </optgroup>
                </select>
              </div>

              <button 
                onClick={() => set_show_model(true)} 
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
              >
                <Save size={18} /> Word (.doc) Kaydet
              </button>
            </div>
          </div>
          
          <div 
            className="bg-white border border-zinc-200 rounded-xl p-8 md:p-12 shadow-sm" 
            id="paper-content" 
            style={{ fontFamily: fontStyle }}
          >
            <Markdown components={{ // Configure markdown parser
              h1: ({node, children, ...props}) => <HoverableElement Tag="h1" className="text-3xl font-bold text-zinc-900 border-b-2 border-zinc-200 pb-3 mb-6">{children}</HoverableElement>, // Render H1
              h2: ({node, children, ...props}) => <HoverableElement Tag="h2" className="text-2xl font-bold text-zinc-800 border-l-4 border-blue-500 pl-4 mt-10 mb-4">{children}</HoverableElement>, // Render H2
              h3: ({node, children, ...props}) => <HoverableElement Tag="h3" className="text-xl font-bold text-zinc-700 mt-6 mb-3">{children}</HoverableElement>, // Render H3
              p: ({node, children, ...props}) => <HoverableElement Tag="p" className="text-base text-zinc-700 leading-relaxed mb-4">{children}</HoverableElement>, // Render P
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 text-zinc-700 space-y-1" {...props} />, // Render UL
              li: ({node, ...props}) => <li className="mb-1 leading-relaxed" {...props} />, // Render LI
              strong: ({node, ...props}) => <strong className="font-bold text-zinc-900" {...props} />, // Render Strong
            }}>
              {output == "null" || output == null 
                ? "###  Bağlantı Hatası\n**Yapay zeka sunucusuna ulaşılamadı.** Lütfen LM Studio'nun açık olduğundan ve bağlantı ayarlarınızın doğru olduğundan emin olun." 
                : output}
            </Markdown>
          </div>
        </div>
      )}

      {show_modal && ( // Conditional modal render
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Dosyayı Kaydet</h3>
                <p className="text-sm text-zinc-500 mt-1">Belgeyi proje dosyalarına ve cihazınıza kaydedin.</p>
              </div>
              <button onClick={() => set_show_model(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Dosya Adı</label>
                <input 
                  type="text" 
                  value={file_name} 
                  onChange={(e) => set_file_name(e.target.value)} 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Kayıt Hedefi</label>
                <select 
                  value={save_target} 
                  onChange={(e) => set_save_target(e.target.value)} 
                  className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="both">Hem Uygulamaya (SQL) Hem Cihaza Kaydet</option>
                  <option value="app">Sadece Uygulamaya (SQL) Kaydet</option>
                  <option value="local">Sadece Cihazıma İndir</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button onClick={() => set_show_model(false)} className="px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-700 bg-white rounded-lg hover:bg-zinc-100">İptal</button>
              <button onClick={save_document} className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">Onayla ve Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {aiEditModal.isOpen && ( // Conditional edit modal render
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-purple-100">
            <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={20} /> AI ile Paragrafı Yeniden Yaz
                </h3>
              </div>
              <button onClick={() => setAiEditModal({ isOpen: false, targetText: '', prompt: '' })} className="text-zinc-500 hover:text-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-sm text-zinc-600 italic line-clamp-3">
                "{aiEditModal.targetText}"
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Nasıl değiştirilmesini istiyorsun?</label>
                <textarea 
                  placeholder="Örn: Daha akademik bir dille, kısa ve net bir şekilde yeniden yaz..."
                  value={aiEditModal.prompt} 
                  onChange={(e) => setAiEditModal({...aiEditModal, prompt: e.target.value})} 
                  className="w-full px-3 py-3 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button onClick={() => setAiEditModal({ isOpen: false, targetText: '', prompt: '' })} disabled={aiEditLoading} className="px-4 py-2 text-sm font-medium border border-zinc-300 text-zinc-700 bg-white rounded-lg hover:bg-zinc-100">İptal</button>
              <button onClick={handleInlineAiEdit} disabled={aiEditLoading || !aiEditModal.prompt.trim()} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-60">
                {aiEditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiEditLoading ? 'Yazılıyor...' : 'Yeniden Yaz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};