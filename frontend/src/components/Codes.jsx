import React, { useState, useEffect, useContext } from "react"; // Import React hooks
import Editor from "@monaco-editor/react"; // Import Monaco editor
import { 
  GitBranch, Star, Clock, Code2, X, ChevronRight, 
  ChevronDown, Folder, File, Split, Save, RefreshCw, 
  Laptop, Database, FilePlus, Sparkles, FolderPlus, Pencil, UploadCloud
} from "lucide-react"; // Import UI icons

import Setting_button from "./Setting_button"; // Import settings button

import { 
  getWorkspaceTree, 
  saveCodeToApp, 
  getRepositories, 
  createRepository,
  createFolderInRepo,    
  renameRepoItem,        
  uploadFilesToRepo      
} from "../services/apiService"; // Import API services

import { CodeContext } from "./CodeContext"; // Import code context

const getLanguageFromPath = (path) => { // Map file extension
  if (!path) return "plaintext"; // Default to plaintext
  const ext = path.split('.').pop().toLowerCase(); // Extract file extension
  const languageMap = { // Language mapping dictionary
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", c: "c", cpp: "cpp", cs: "csharp", java: "java",
    html: "html", css: "css", json: "json", md: "markdown", sql: "sql"
  };
  return languageMap[ext] || "plaintext"; // Return mapped language
};

function FileTree({ files, onFileSelect, selectedPath, onAddFileInside, onRename }) { // File tree component
  const [expanded, setExpanded] = useState(new Set()); // Track expanded folders

  const toggleFolder = (e, path) => { // Toggle folder state
    e.stopPropagation(); // Prevent event bubbling
    const newExpanded = new Set(expanded); // Clone expanded set
    if (newExpanded.has(path)) { // Check path presence
      newExpanded.delete(path); // Remove from set
    } else {
      newExpanded.add(path); // Add to set
    }
    setExpanded(newExpanded); // Update expanded state
  };

  const renderNode = (node, depth = 0) => { // Render tree node
    const isExpanded = expanded.has(node.path); // Check expanded status
    const isSelected = selectedPath === node.path; // Check selection status

    if (node.type === "folder") { // Handle folder node
      return ( // Render folder container
        <div key={node.path}> 
          <div 
            className="group flex items-center justify-between w-full pr-2 hover:bg-zinc-100 rounded cursor-pointer transition-colors"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={(e) => toggleFolder(e, node.path)}
          >
            <div className="flex items-center gap-2 py-1.5 overflow-hidden flex-1">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />}
              <Folder className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-sm text-zinc-700 truncate select-none">{node.name}</span>
            </div>
            <div className="hidden group-hover:flex items-center gap-1 shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); onAddFileInside(node.path); }}
                className="p-1 hover:bg-blue-100 text-zinc-400 hover:text-blue-600 rounded transition-colors" 
                title="İçine Dosya Ekle"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onRename(node); }}
                className="p-1 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 rounded transition-colors" 
                title="Yeniden Adlandır"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {isExpanded && node.children && ( // Render child nodes
            <div>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return ( // Render file node
      <div
        key={node.path}
        onClick={() => onFileSelect(node)}
        className={`group flex items-center justify-between w-full pr-2 rounded cursor-pointer transition-colors ${
          isSelected ? "bg-blue-100" : "hover:bg-zinc-100"
        }`}
        style={{ paddingLeft: `${depth * 12 + 32}px` }}
      >
        <div className="flex items-center gap-2 py-1.5 overflow-hidden flex-1">
          <File className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-600" : "text-zinc-400"}`} />
          <span className={`text-sm truncate select-none ${isSelected ? "text-blue-900 font-medium" : "text-zinc-700"}`}>
            {node.name}
          </span>
        </div>
        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onRename(node); }}
            className="p-1 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 rounded transition-colors" 
            title="Yeniden Adlandır"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return ( // Render root nodes
    <div className="space-y-0.5 pb-4">
      {files && files.map(node => renderNode(node))}
    </div>
  );
}

export function CodeEditor({ repo }) { // Code editor component
  const { 
    selectedFile, setSelectedFile, 
    code, setCode, 
    result, 
    isSplit, setIsSplit, 
    aiLoading, handleGenerateComment 
  } = useContext(CodeContext); // Get context states

  const [files, setFiles] = useState([]); // Files list state
  const [showSaveModal, setShowSaveModal] = useState(false); // Save modal state
  const [saveFileName, setSaveFileName] = useState(""); // Save filename state
  const [saveTarget, setSaveTarget] = useState("app"); // Save target state
  
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false); // New file state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false); // New folder state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false); // Rename modal state
  const [itemToRename, setItemToRename] = useState(null); // Target item state
  
  const [newItemName, setNewItemName] = useState(""); // New item name
  const [contextPath, setContextPath] = useState(""); // Context path state
  
  const [isDragging, setIsDragging] = useState(false); // Drag status state

  const fetchTree = async () => { // Fetch workspace tree
    try { // Start try block
      const treeData = await getWorkspaceTree(repo.id); 
      setFiles(Array.isArray(treeData) ? treeData : []); // Update files list
    } catch (error) { // Catch error block
      console.error("Dosya ağacı çekilirken hata oluştu:", error); // Log fetch error
    }
  };

  useEffect(() => { // Mount effect hook
    if (repo) fetchTree(); // Load tree on mount
  }, [repo]); // Dependency array trigger

  const handleFileSelect = (file) => { // Handle file selection
    if (file.type === "file") { // Check file type
      setSelectedFile(file); // Update active file
      setCode(file.content || ""); // Update active code
      setIsSplit(false); // Disable split view
      setSaveFileName(file.path); // Update save filename
    }
  };

  const handleSaveCurrentCode = async () => { // Save active code
    if (!selectedFile) return; // Validate selection
    try { // Start try block
      await saveCodeToApp(repo.id, selectedFile.path, code); // Save to API
      alert("Kod başarıyla kaydedildi!"); // Notify success
      fetchTree(); // Refresh file tree
    } catch (e) { // Catch error block
      alert("Kod kaydedilemedi."); // Notify error
    }
  };

  const handleDragOver = (e) => { // Handle drag over
    e.preventDefault(); // Prevent default behavior
    setIsDragging(true); // Enable drag overlay
  };
  
  const handleDragLeave = () => { // Handle drag leave
    setIsDragging(false); // Disable drag overlay
  };
  
  const handleDrop = async (e) => { // Handle file drop
    e.preventDefault(); // Prevent default behavior
    setIsDragging(false); // Disable drag overlay
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.size > 0); // Filter valid files
    
    if(droppedFiles.length === 0) { // Validate dropped files
      alert("Hata: Sadece tekil dosyaları sürükleyebilirsiniz. Klasör sürüklemek tarayıcı tarafından engellenir."); // Notify error
      return; // Exit execution
    }

    try { // Start try block
      await uploadFilesToRepo(repo.id, "", droppedFiles); // Upload to API
      fetchTree(); // Refresh file tree
      alert(`${droppedFiles.length} dosya başarıyla yüklendi!`); // Notify success
    } catch(err) { // Catch error block
      console.error("Yükleme Hatası:", err); // Log upload error
      alert("Dosyalar yüklenirken sunucu hatası oluştu."); // Notify error
    }
  };

  const handleOpenNewFile = (path = "") => { // Open file modal
    setContextPath(path); // Set target path
    setNewItemName(""); // Reset input name
    setIsNewFileModalOpen(true); // Show modal
  };

  const handleOpenNewFolder = () => { // Open folder modal
    setNewItemName(""); // Reset input name
    setIsNewFolderModalOpen(true); // Show modal
  };

  const handleOpenRename = (node) => { // Open rename modal
    setItemToRename(node); // Set target node
    setNewItemName(node.name); // Set current name
    setIsRenameModalOpen(true); // Show modal
  };

  const executeCreateFile = async () => { // Create new file
    if (!newItemName.trim()) return; // Validate input
    const fullPath = contextPath ? `${contextPath}/${newItemName}` : newItemName; // Build full path
    try { // Start try block
      await saveCodeToApp(repo.id, fullPath, "// Yeni dosya\n"); // Create file API
      setIsNewFileModalOpen(false); // Close modal
      fetchTree(); // Refresh file tree
    } catch (e) { // Catch error block
      alert("Dosya oluşturulamadı."); // Notify error
    }
  };

  const executeCreateFolder = async () => { // Create new folder
    if (!newItemName.trim()) return; // Validate input
    try { // Start try block
      await createFolderInRepo(repo.id, newItemName); // Create folder API
      setIsNewFolderModalOpen(false); // Close modal
      fetchTree(); // Refresh file tree
    } catch (e) { // Catch error block
      alert("Klasör oluşturulamadı."); // Notify error
    }
  };

  const executeRename = async () => { // Rename file/folder
    if (!newItemName.trim() || !itemToRename) return; // Validate input
    
    const pathParts = itemToRename.path.split('/'); // Split path
    pathParts.pop(); // Remove old name
    pathParts.push(newItemName); // Add new name
    const newPath = pathParts.join('/'); // Join new path

    try { // Start try block
      await renameRepoItem(repo.id, itemToRename.path, newPath); // Rename API
      setIsRenameModalOpen(false); // Close modal
      fetchTree(); // Refresh file tree
    } catch (e) { // Catch error block
      alert("Yeniden adlandırılamadı."); // Notify error
    }
  };

  const handleSaveAIOutput = async () => { // Save AI output
    if (!saveFileName.trim()) { // Validate input
      alert("Lütfen bir dosya adı girin."); // Notify error
      return; // Exit execution
    }

    if (saveTarget === "local") { // Save to local
      try { // Start try block
        const blob = new Blob([result], { type: "text/plain;charset=utf-8" }); // Create blob
        const url = URL.createObjectURL(blob); // Create object URL
        const link = document.createElement("a"); // Create link element
        link.href = url; // Set link URL
        
        const cleanFileName = saveFileName.split('/').pop(); // Clean filename
        link.download = cleanFileName || "ai_output.txt"; // Set download attribute
        
        document.body.appendChild(link); // Append link
        link.click(); // Trigger download
        
        document.body.removeChild(link); // Remove link
        URL.revokeObjectURL(url); // Revoke object URL
      } catch (error) { // Catch error block
        console.error("Bilgisayara indirme hatası:", error); // Log download error
        alert("Dosya indirilirken bir hata oluştu."); // Notify error
      }
    } else if (saveTarget === "app" || saveTarget === "both") { // Save to app
      try { // Start try block
        await saveCodeToApp(repo.id, saveFileName, result); // Save API
        fetchTree(); // Refresh file tree
      } catch (e) { // Catch error block
        console.error(e); // Log save error
        alert("Uygulamaya kaydedilirken hata oluştu."); // Notify error
      }
    }
    
    setShowSaveModal(false); // Close modal
  };

  const editorLanguage = selectedFile ? getLanguageFromPath(selectedFile.path) : "javascript"; // Determine editor language

  return ( // Return JSX elements
    <div className="flex h-[calc(100vh-12rem)] gap-4 relative">
      
      {isDragging && ( // Render drag overlay
        <div 
          className="absolute inset-0 z-50 bg-blue-500/10 border-4 border-dashed border-blue-500 rounded-xl flex items-center justify-center backdrop-blur-sm"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center pointer-events-none">
            <UploadCloud className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-zinc-800">Dosyaları Buraya Bırakın</h2>
            <p className="text-sm text-zinc-500 mt-2">Repoya anında yüklenecektir.</p>
          </div>
        </div>
      )}

      <div // Render sidebar
        className="w-64 bg-white rounded-lg border border-zinc-200 shadow-sm flex-shrink-0 flex flex-col"
        onDragOver={handleDragOver}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 mb-1">
          <h3 className="font-bold text-zinc-900 text-sm truncate">Explorer</h3>
          <div className="flex items-center gap-1">
            
            <button 
              onClick={() => { fetchTree(); alert("Takım değişiklikleri güncellendi!"); }}
              className="p-1.5 hover:bg-green-100 rounded text-zinc-500 hover:text-green-600 transition-colors"
              title="Değişiklikleri Senkronize Et"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button 
              onClick={() => handleOpenNewFile()}
              className="p-1.5 hover:bg-zinc-100 rounded text-zinc-500 hover:text-blue-600 transition-colors"
              title="Kök Dizine Dosya Ekle"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button 
              onClick={handleOpenNewFolder}
              className="p-1.5 hover:bg-zinc-100 rounded text-zinc-500 hover:text-blue-600 transition-colors"
              title="Kök Dizine Klasör Ekle"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {files.length > 0 ? ( // Check files existence
            <FileTree 
              files={files} 
              onFileSelect={handleFileSelect} 
              selectedPath={selectedFile?.path} 
              onAddFileInside={handleOpenNewFile}
              onRename={handleOpenRename}
            />
          ) : ( // Empty state render
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-4 text-center">
              <Database className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Repo boş. Yeni dosya oluşturun veya sürükleyip bırakın.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 bg-white rounded-lg border border-zinc-200 overflow-hidden flex flex-col shadow-sm min-w-0">
          {selectedFile ? ( // Check file selection
            <>
              <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-zinc-200 bg-zinc-50 flex-shrink-0 gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <File className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-sm font-medium text-zinc-700 truncate" title={selectedFile.name}>{selectedFile.name}</span>
                  <span className="text-[10px] text-zinc-400 bg-zinc-200/50 px-1.5 py-0.5 rounded ml-2 uppercase font-bold">{editorLanguage}</span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveCurrentCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-white rounded-md hover:bg-zinc-900 transition-colors text-xs font-medium shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> Kaydet
                  </button>
                  
                  <button
                    onClick={handleGenerateComment}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm disabled:opacity-50"
                  >
                    {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Split className="w-3.5 h-3.5" />}
                    {aiLoading ? "Üretiliyor..." : "AI Yorumu"}
                  </button>
                  
                  <Setting_button />
                  
                </div>
              </div>
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  language={editorLanguage}
                  theme="light"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
                />
              </div>
            </>
          ) : ( // Render empty state
            <div 
              className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50"
              onDragOver={handleDragOver}
            >
              <Code2 className="w-16 h-16 mb-4 text-zinc-200" />
              <p className="font-medium text-zinc-600">Editör Boş</p>
              <p className="text-sm mt-1">Dosya seçin veya bilgisayarınızdan buraya sürükleyin.</p>
            </div>
          )}
        </div>

        {isSplit && ( // Render split view
          <div className="flex-1 bg-white rounded-lg border-2 border-green-500 overflow-hidden flex flex-col shadow-sm min-w-0">
            <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-zinc-200 bg-green-50 flex-shrink-0 gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Sparkles className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-sm font-medium text-green-800 truncate">AI Çıktısı</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> Çıktıyı Kaydet
                </button>
                <button onClick={() => setIsSplit(false)} className="p-1 hover:bg-green-200/50 rounded text-green-700 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={editorLanguage}
                theme="light"
                value={result}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, wordWrap: "on" }}
              />
            </div>
          </div>
        )}
      </div>

      {isNewFileModalOpen && ( // Render file modal
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900">Yeni Dosya Oluştur</h3>
              <button onClick={() => setIsNewFileModalOpen(false)} className="text-zinc-400 hover:text-zinc-700"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              {contextPath && ( // Display context path
                <p className="text-xs text-blue-600 mb-3 font-semibold bg-blue-50 p-2 rounded">
                  Hedef Klasör: {contextPath}/
                </p>
              )}
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeCreateFile()}
                placeholder="Dosya adı (örn: index.js)"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg mb-2 outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsNewFileModalOpen(false)} className="px-4 py-2 border rounded-lg bg-white font-medium hover:bg-zinc-100">İptal</button>
              <button onClick={executeCreateFile} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {isNewFolderModalOpen && ( // Render folder modal
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900">Yeni Klasör Oluştur</h3>
              <button onClick={() => setIsNewFolderModalOpen(false)} className="text-zinc-400 hover:text-zinc-700"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeCreateFolder()}
                placeholder="Klasör adı (örn: components)"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg mb-2 outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsNewFolderModalOpen(false)} className="px-4 py-2 border rounded-lg bg-white font-medium hover:bg-zinc-100">İptal</button>
              <button onClick={executeCreateFolder} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {isRenameModalOpen && ( // Render rename modal
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900">Yeniden Adlandır</h3>
              <button onClick={() => setIsRenameModalOpen(false)} className="text-zinc-400 hover:text-zinc-700"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <p className="text-xs text-zinc-500 mb-2">Mevcut: {itemToRename?.path}</p>
              <input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeRename()}
                placeholder="Yeni isim..."
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg mb-2 outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t flex justify-end gap-3">
              <button onClick={() => setIsRenameModalOpen(false)} className="px-4 py-2 border rounded-lg bg-white font-medium hover:bg-zinc-100">İptal</button>
              <button onClick={executeRename} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && ( // Render save modal
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900">AI Çıktısını Kaydet</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-zinc-400 hover:text-zinc-700"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <label className="text-sm font-bold text-zinc-700 mb-2 block">Dosya Yolu (Uygulama İçi İçin)</label>
              <input
                value={saveFileName}
                onChange={(e) => setSaveFileName(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
              />
              <div className="flex gap-3">
                <button onClick={() => setSaveTarget("local")} className={`flex-1 py-3 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${saveTarget === "local" ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "text-zinc-500 hover:bg-zinc-50"}`}>
                  <Laptop className="w-6 h-6" /> <span className="font-medium text-sm">PC'ye İndir</span>
                </button>
                <button onClick={() => setSaveTarget("app")} className={`flex-1 py-3 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${saveTarget === "app" ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "text-zinc-500 hover:bg-zinc-50"}`}>
                  <Database className="w-6 h-6" /> <span className="font-medium text-sm">Uygulamaya</span>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 border rounded-lg bg-white font-medium hover:bg-zinc-100">İptal</button>
              <button onClick={handleSaveAIOutput} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">
                {saveTarget === "local" ? "İndir" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Codes({ targetRepo, setTargetRepo }) { // Repository list component
  const { 
    selectedRepo, setSelectedRepo, // Get repo state
    setSelectedFile, setCode, setResult, setIsSplit // Get cleanup setters
  } = useContext(CodeContext); // Get context states

  const [isNewRepoDialogOpen, setIsNewRepoDialogOpen] = useState(false); // Repo dialog state
  const [repositories, setRepositories] = useState([]); // Repositories list state

  const [newRepoForm, setNewRepoForm] = useState({ // Repo form state
    name: "",
    description: "",
    language: ""
  });

  const languages = [ // Available languages list
    "TypeScript", "JavaScript", "Python", "React", "React Native", 
    "Java", "Go", "Ruby", "PHP", "Shell", "C", "C++", "C#"
  ];

  const languageColors = { // Language color mapping
    "TypeScript": "text-blue-600", "JavaScript": "text-amber-600", "Python": "text-yellow-600",
    "React": "text-cyan-600", "React Native": "text-purple-600", "Java": "text-red-600",
    "Go": "text-cyan-500", "Ruby": "text-red-500", "PHP": "text-indigo-600",
    "Shell": "text-green-600", "C++": "text-pink-600", "C#": "text-purple-500", "C": "text-blue-500"
  };

  const loadRepos = async () => { // Fetch repositories
    try { // Start try block
      const data = await getRepositories(); // Call API service
      setRepositories(Array.isArray(data) ? data : []); // Update repo list
    } catch (e) { // Catch error block
      console.error("Depolar çekilemedi:", e); // Handle fetch error
    }
  };

  useEffect(() => { // Mount effect hook
    loadRepos(); // Load repos on mount
  }, []); // Dependency array trigger

  useEffect(() => { // Handle target repo
    if (targetRepo) { // Check target presence
      setSelectedRepo(targetRepo); // Update active repo
      if(setTargetRepo) setTargetRepo(null); // Reset target repo
    }
  }, [targetRepo, setTargetRepo, setSelectedRepo]); // Dependency array trigger

  const handleCreateRepo = async () => { // Create new repository
    if (newRepoForm.name && newRepoForm.description && newRepoForm.language) { // Validate form
      try { // Start try block
        await createRepository({ // Call API service
          repo_name: newRepoForm.name,
          description: newRepoForm.description,
          language: newRepoForm.language
        });
        
        await loadRepos(); // Refresh repo list
        setNewRepoForm({ name: "", description: "", language: "" }); // Reset form state
        setIsNewRepoDialogOpen(false); // Close modal
      } catch (e) { // Catch error block
        alert("Kod deposu oluşturulamadı. Aynı isimde bir depo zaten var olabilir."); // Handle creation error
      }
    } else { // Invalid form branch
      alert("Lütfen tüm alanları doldurun."); // Prompt for input
    }
  };

  if (selectedRepo) { // Check active repo
    return ( // Render selected repo
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { // Handle back navigation
                setSelectedRepo(null); // Clear active repo
                setSelectedFile(null); // Clear active file
                setCode(""); // Clear editor content
                setResult(""); // Clear AI output
                setIsSplit(false); // Reset split view
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors focus:outline-none"
            >
              ← Depolara geri dön
            </button>
            <div className="h-4 w-px bg-zinc-300"></div>
            <h2 className="text-xl font-semibold text-zinc-900">{selectedRepo.repo_name}</h2>
          </div>
        </div>
        <CodeEditor repo={selectedRepo} />
      </div>
    );
  }

  return ( // Render repo list
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Kod Depoları</h2>
          <p className="text-zinc-600 mt-1">Kod depolarınızı inceleyin ve yönetin</p>
        </div>
        
        <button 
          onClick={() => setIsNewRepoDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Code2 className="w-4 h-4" />
          Yeni Depo
        </button>
      </div>

      <div className="space-y-4">
        {repositories.length === 0 ? ( // Check repos existence
          <p className="text-zinc-500 italic py-8 text-center bg-white rounded-lg border border-zinc-200">Henüz oluşturulmuş bir depo yok.</p>
        ) : ( // Render repos array
          repositories.map((repo) => ( // Iterate over repos
            <div 
              key={repo.id} 
              className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition-shadow cursor-pointer group relative"
              onClick={() => { // Handle repo selection
                setSelectedFile(null); // Clear previous file
                setCode(""); // Clear previous code
                setResult(""); // Clear previous output
                setIsSplit(false); // Reset view
                setSelectedRepo(repo); // Set active repo
              }}
            >
              {repo.project_id && ( // Render project badge
                <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg bg-blue-100 text-blue-700">
                  Ortak Proje
                </div>
              )}
              
              <div className="flex items-start justify-between mb-3 mt-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Code2 className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                    <h3 className="font-bold text-zinc-900">{repo.repo_name}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${languageColors[repo.language] || "text-zinc-600"} bg-white border-current uppercase tracking-wider`}>
                      {repo.language}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 ml-8">{repo.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 ml-8 text-sm text-zinc-500 mt-2">
                <div className="flex items-center gap-1"><Star className="w-4 h-4" /><span>0</span></div>
                <div className="flex items-center gap-1"><GitBranch className="w-4 h-4" /><span>main</span></div>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>Yakında güncellendi</span></div>
              </div>
            </div>
          ))
        )}
      </div>

      {isNewRepoDialogOpen && ( // Render new repo dialog
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-lg font-bold text-zinc-900">Yeni Depo Oluştur</h3>
              <button onClick={() => setIsNewRepoDialogOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Depo Adı</label>
                <input
                  placeholder="örn: harika-projem"
                  value={newRepoForm.name}
                  onChange={(e) => setNewRepoForm({ ...newRepoForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Açıklama</label>
                <textarea
                  placeholder="Deponuzun kısa bir açıklaması..."
                  value={newRepoForm.description}
                  onChange={(e) => setNewRepoForm({ ...newRepoForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Ana Dil</label>
                <select 
                  value={newRepoForm.language} 
                  onChange={(e) => setNewRepoForm({ ...newRepoForm, language: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all"
                >
                  <option value="" disabled>Bir dil seçin...</option>
                  {languages.map((lang) => ( // Render language options
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3 mt-auto">
              <button
                onClick={() => setIsNewRepoDialogOpen(false)}
                className="px-5 py-2.5 font-medium border border-zinc-200 rounded-xl bg-white hover:bg-zinc-100 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCreateRepo}
                className="px-5 py-2.5 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Depoyu Oluştur
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}