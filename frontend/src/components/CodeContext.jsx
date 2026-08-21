import React, { createContext, useState } from "react"; // Import React hooks
import { processCodeWithAI } from "../services/apiService"; // Import API service

export const CodeContext = createContext(); // Create context instance

export const CodeProvider = ({ children }) => { // Define context provider
  const [selectedRepo, setSelectedRepo] = useState(null); // Active repo state
  const [selectedFile, setSelectedFile] = useState(null); // Active file state
  const [code, setCode] = useState(""); // Raw code state
  const [result, setResult] = useState(""); // Processed result state
  const [isSplit, setIsSplit] = useState(false); // UI split state
  const [aiLoading, setAiLoading] = useState(false); // Loading status state

  const handleGenerateComment = async () => { // Async AI processor
    if (!code) return; // Validate input code
    
    setAiLoading(true); // Start loading indicator
    setIsSplit(true); // Enable split view
    setResult("// Yapay zeka arka planda kodunuzu inceliyor...\n// Bu işlem süresince diğer sayfalarda rahatça gezinebilirsiniz.\n// İşlem bittiğinde sonuç buraya yansıyacaktır."); // Set pending message
    
    try { // Start try block
      const data = await processCodeWithAI(code); // Call API service
      setResult(data.commented_code || "// AI yorum üretemedi."); // Update with result
    } catch (e) { // Catch error block
      setResult("// API Hatası: Yapay zeka sunucusuna bağlanılamadı."); // Set error message
    } finally { // Execute finally block
      setAiLoading(false); // Stop loading indicator
    }
  };

  return ( // Return context provider
    <CodeContext.Provider value={{ // Pass state values
      selectedRepo, setSelectedRepo, // Pass repo state
      selectedFile, setSelectedFile, // Pass file state
      code, setCode, // Pass code state
      result, setResult, // Pass result state
      isSplit, setIsSplit, // Pass split state
      aiLoading, setAiLoading, // Pass loading state
      handleGenerateComment // Pass processor function
    }}>
      {children} {/* Render child components */}
    </CodeContext.Provider>
  );
};