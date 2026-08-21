import { File, Folder, Download, Upload, MoreVertical, Pencil, Trash2, X, FileText, Eye, Loader2 } from "lucide-react"; // Import UI icons
import { useState, useRef, useEffect } from "react"; // Import React hooks

import { getProjectFiles, uploadProjectFile, deleteProjectFile, updateFileMetadata } from "../services/apiService"; // Import API services
import api from '../api/apiConfig'; // Import API config

import { Documantasyon_page } from "./Documantasyon_page.jsx"; // Import documentation page

export function Files({ projectId }) { // Define Files component
  const [files, setFiles] = useState([]); // Files list state
  const [selectedFiles, setSelectedFiles] = useState([]); // Selected files state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false); // Rename dialog state
  const [renamingFile, setRenamingFile] = useState(null); // Renaming target state
  const [newFileName, setNewFileName] = useState(""); // New filename state
  const [activeDropdownId, setActiveDropdownId] = useState(null); // Active dropdown state
  const fileInputRef = useRef(null); // File input reference
  
  const [showDocBuilder, setShowDocBuilder] = useState(false); // Doc builder state

  const [previewFile, setPreviewFile] = useState(null); // Preview target state
  const [previewContent, setPreviewContent] = useState(""); // Preview content state
  const [isPreviewLoading, setIsPreviewLoading] = useState(false); // Preview loading state

  const isPersonal = !projectId || typeof projectId === 'object'; // Check personal scope

  useEffect(() => { // Initial data fetch
    fetchFiles(); // Call fetch function
  }, [projectId]); // Dependency array trigger

  const fetchFiles = async () => { // Fetch files function
    try { // Start try block
      const data = await getProjectFiles(projectId); // Fetch from API
      setFiles(Array.isArray(data) ? data : []); // Set files safely
    } catch (err) { // Catch fetch error
      console.error("Dosyalar yüklenirken hata oluştu:", err); // Log fetch error
      setFiles([]); // Reset files state
    }
  };

  const handleFileUpload = async (event) => { // Handle file upload
    const uploadedFiles = event.target.files; // Get selected files
    if (!uploadedFiles || uploadedFiles.length === 0) return; // Validate selected files

    try { // Start try block
      for (let file of uploadedFiles) { // Iterate over files
        await uploadProjectFile(projectId, file); // Upload each file
      }
      
      await fetchFiles(); // Refresh file list
    } catch (err) { // Catch upload error
      console.error("Yükleme hatası:", err); // Log upload error
      alert(`Dosya yüklenemedi: ${err.message}`); // Notify user error
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input field
  };

  const handlePreview = async (file) => { // Handle file preview
    setPreviewFile(file); // Set preview target
    setIsPreviewLoading(true); // Start loading indicator
    setActiveDropdownId(null); // Close active dropdown
    setPreviewContent(""); // Reset preview content
    
    try { // Start try block
      const response = await api.get(`/files/${file.id}/content`); // Fetch file content
      let rawContent = response.data.content; // Extract raw content

      rawContent = rawContent.replace(/\[START OF DOCUMENT SECTION\][\s\S]*?OUTPUT FORMAT:/gi, ''); // Remove AI artifacts

      if (file.name.endsWith('.doc') || file.name.endsWith('.html')) { // Check document type
          
          rawContent = rawContent.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, ''); // Strip HTML head
          rawContent = rawContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ''); // Strip HTML style

          rawContent = rawContent.replace(/<\/p>/gi, '\n\n'); // Format paragraph tags
          rawContent = rawContent.replace(/<br\s*[\/]?>/gi, '\n'); // Format break tags
          rawContent = rawContent.replace(/<li>/gi, '• '); // Format list items
          rawContent = rawContent.replace(/<\/li>/gi, '\n'); // Format list endings
          
          rawContent = rawContent.replace(/<[^>]+>/g, ''); // Strip remaining HTML
          
          const txtDoc = new DOMParser().parseFromString(rawContent, 'text/html'); // Parse HTML entities
          rawContent = txtDoc.documentElement.textContent || ""; // Extract clean text
      }

      rawContent = rawContent.replace(/\n\s*\n\s*\n/g, '\n\n'); // Normalize line breaks

      rawContent = rawContent.trim(); // Trim extra whitespace

      setPreviewContent(rawContent); // Update preview content
    } catch (err) { // Handle preview error
      setPreviewContent("⚠️ İçerik yüklenemedi.\n\nBu dosya metin tabanlı (TXT, HTML, MD, JS vb.) olmayabilir veya arka planda dosya yolu bulunamadı."); // Set fallback message
    }
    setIsPreviewLoading(false); // Stop loading indicator
  };

  const handleDownload = async (file) => { // Handle file download
    setActiveDropdownId(null); // Close active dropdown
    try { // Start try block
      const response = await api.get(`/files/${file.id}/download`, { // Fetch download data
        responseType: 'blob' // Fetch binary data
      });

      const url = window.URL.createObjectURL(new Blob([response.data])); // Create blob URL
      const link = document.createElement('a'); // Create anchor element
      link.href = url; // Set download link
      link.setAttribute('download', file.name); // Set download attribute
      document.body.appendChild(link); // Append to DOM
      link.click(); // Trigger file download
      
      link.parentNode.removeChild(link); // Remove from DOM
      window.URL.revokeObjectURL(url); // Revoke blob URL
    } catch (err) { // Catch download error
      console.error("İndirme hatası:", err); // Log download error
      alert("Dosya indirilemedi. Sunucu bağlantısını kontrol edin."); // Notify user error
    }
  };

  const handleDelete = async (id) => { // Handle file deletion
    try { // Start try block
      await deleteProjectFile(id); // Call delete API
      setFiles(files.filter(f => f.id !== id)); // Update state
      setSelectedFiles(prev => prev.filter(fileId => fileId !== id)); // Update selection
      setActiveDropdownId(null); // Close active dropdown
    } catch (err) { // Catch delete error
      console.error("Silme hatası:", err); // Log delete error
    }
  };

  const openRenameDialog = (file) => { // Open rename dialog
    setRenamingFile(file); // Set target file
    setNewFileName(file.name); // Set initial name
    setIsRenameDialogOpen(true); // Open modal
    setActiveDropdownId(null); // Close active dropdown
  };

  const handleRename = async () => { // Handle file rename
    if (!renamingFile || !newFileName || newFileName === renamingFile.name) { // Validate rename input
      setIsRenameDialogOpen(false); // Close modal
      return; // Exit execution
    }

    try { // Start try block
      await api.patch(`/files/${renamingFile.id}/rename`, { new_name: newFileName }); // Execute rename API
      
      setFiles(files.map(f => f.id === renamingFile.id ? { ...f, name: newFileName } : f)); // Update local state
      setIsRenameDialogOpen(false); // Close modal
      setRenamingFile(null); // Reset target file
      setNewFileName(""); // Reset filename input
    } catch (err) { // Catch rename error
      console.error("Ad değiştirme hatası:", err); // Log rename error
      alert("Dosya adı değiştirilemedi! Sunucu bağlantınızı kontrol edin."); // Notify user error
    }
  };

  const toggleFileSelection = (id) => { // Toggle file selection
    setSelectedFiles(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]); // Update selection array
  };

  const toggleSelectAll = (e) => { // Toggle all selection
    if (e.target.checked) setSelectedFiles(files.map(f => f.id)); // Select all IDs
    else setSelectedFiles([]); // Clear selection
  };

  if (showDocBuilder) { // Conditional builder render
    return ( // Render builder component
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDocBuilder(false)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors focus:outline-none"
            >
              ← Dosyalara geri dön
            </button>
            <div className="h-4 w-px bg-zinc-300"></div>
            <h2 className="text-xl font-semibold text-zinc-900">AI Döküman Stüdyosu</h2>
          </div>
        </div>
        
        <Documantasyon_page  // Render documentation page
          projectId={projectId} 
          onClose={() => setShowDocBuilder(false)} 
          onSaved={fetchFiles} 
        />
      </div>
    );
  }

  return ( // Render main component
    <div className="space-y-6 text-left relative animate-in fade-in duration-200">
      
      <div className="flex items-center justify-between"> {/* Render header section */}
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            {isPersonal ? "Şahsi Dosyalar" : "Proje Dosyaları"} {/* Render dynamic title */}
          </h2>
          <p className="text-zinc-600 mt-1">
            {isPersonal ? "Kişisel dosyalarınızı ve dökümanlarınızı yönetin" : "Proje dosyalarınızı ve dökümanlarınızı yönetin"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          
          <button 
            onClick={() => setShowDocBuilder(true)} // Toggle builder button
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <FileText className="w-4 h-4" /> Döküman Oluştur
          </button>

          <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" /> {/* Render upload trigger */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Upload className="w-4 h-4" /> Dosya Yükle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-visible"> {/* Render files table */}
        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50/80 border-b border-zinc-200"> {/* Render table header */}
              <tr>
                <th className="px-6 py-4 w-12 text-zinc-700 text-center">
                  <input
                    type="checkbox"
                    checked={files.length > 0 && selectedFiles.length === files.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Dosya Adı</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tür</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Boyut</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Düzenlenme Tarihi</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {files.map((file) => ( // Render table rows
                <tr key={file.id} className="hover:bg-zinc-50 transition-colors group/row">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => toggleFileSelection(file.id)}
                      className="w-4 h-4 rounded border-zinc-300 text-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="flex items-center gap-3 group cursor-pointer" 
                      onClick={() => handlePreview(file)}
                    >
                      {file.file_type === "folder" ? ( // Render file icon
                        <div className="p-2 bg-blue-50 rounded-lg"><Folder className="w-5 h-5 text-blue-500" /></div>
                      ) : ( 
                        <div className="p-2 bg-zinc-100 rounded-lg"><File className="w-5 h-5 text-zinc-500" /></div>
                      )}
                      <span className="font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 capitalize">
                    {file.file_type === "file" ? "Dosya" : "Klasör"}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-medium">
                    {file.file_type === "folder" ? `${file.items_count || 0} öğe` : (file.size || "Bilinmiyor")}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {file.modified_at ? new Date(file.modified_at).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                  </td>
                  <td className="px-6 py-4 relative text-right">
                    <button 
                      onClick={() => setActiveDropdownId(activeDropdownId === file.id ? null : file.id)} // Render dropdown trigger
                      className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg focus:outline-none transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {activeDropdownId === file.id && ( // Conditional dropdown render
                      <div className="absolute right-8 top-12 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-10 animate-in fade-in zoom-in-95 duration-100 overflow-hidden text-left">
                        {file.file_type === "file" && ( 
                          <>
                            <button onClick={() => handlePreview(file)} className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                              <Eye className="w-4 h-4 mr-2.5 text-blue-500" /> Görüntüle
                            </button>
                            <button onClick={() => handleDownload(file)} className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                              <Download className="w-4 h-4 mr-2.5 text-zinc-400" /> İndir
                            </button>
                          </>
                        )}
                        <button onClick={() => openRenameDialog(file)} className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                          <Pencil className="w-4 h-4 mr-2.5 text-zinc-400" /> Yeniden Adlandır
                        </button>
                        <div className="h-px bg-zinc-100 my-1"></div>
                        <button onClick={() => handleDelete(file.id)} className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4 mr-2.5" /> Sil
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {files.length === 0 && ( // Empty state render
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-zinc-500">
                    <div className="w-16 h-16 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Folder className="w-8 h-8 text-zinc-300" />
                    </div>
                    <p className="font-medium text-zinc-900 mb-1">Henüz dosya bulunmuyor</p>
                    <p className="text-sm text-zinc-500">İlk dökümanınızı oluşturun veya bir dosya yükleyin.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isRenameDialogOpen && ( // Conditional rename modal
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left text-zinc-900">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-lg font-bold">Yeniden Adlandır</h3>
              <button onClick={() => setIsRenameDialogOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="text-sm font-bold text-zinc-700 mb-2 block">Yeni Dosya Adı</label>
              <input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-zinc-50 focus:bg-white transition-all"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
              <button onClick={() => setIsRenameDialogOpen(false)} className="px-5 py-2.5 font-medium border border-zinc-200 rounded-xl bg-white hover:bg-zinc-100">İptal</button>
              <button onClick={handleRename} className="px-5 py-2.5 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {previewFile && ( // Conditional preview modal
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-900/70 backdrop-blur-md p-4 md:p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg">{previewFile.name}</h3>
                  <p className="text-xs text-zinc-500">Ön İzleme Modu</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewFile(null)} 
                className="p-2 bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-zinc-50/50 p-6 md:p-8">
              {isPreviewLoading ? ( // Render loading state
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="font-medium">Dosya içeriği yükleniyor...</p>
                </div>
              ) : ( // Render preview content
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm min-h-full max-w-3xl mx-auto">
                  <div className="font-sans text-base text-zinc-800 whitespace-pre-wrap break-words leading-relaxed tracking-wide">
                    {previewContent}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}