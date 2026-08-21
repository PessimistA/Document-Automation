import React, { createContext, useState } from "react"; // Import React hooks
import { generateDocument } from "../services/apiService"; // Import API service

export const DocumentContext = createContext(); // Create context instance

export const DocumentProvider = ({ children }) => { // Define context provider
    const [parts, set_parts] = useState([{ id: Date.now(), main_title: '', sub_all: [{ id: Date.now() + 1, sub_title: '', text: '' }] }]); // Init parts state
    const [loading_page, set_loading] = useState(false); // Init loading state
    const [output, set_output] = useState(''); // Init output state
    const [detailLevel, setDetailLevel] = useState('normal'); // Init detail level
    const [language, setLanguage] = useState(''); // Init language state
    const [estimatedPages, setEstimatedPages] = useState(0); // Init pages count

    const backend_conntection = async () => { // Async generate function
        set_loading(true); // Start loading indicator
        set_output('Yapay zeka arka planda çalışıyor, diğer sayfalarda gezinebilirsiniz...\n\n'); // Set pending message
        setEstimatedPages(0); // Reset page count
        
        let fullDocumentation = ""; // Init doc accumulator
        let totalPages = 0; // Init page counter
        const targetLanguage = language.trim() || 'Türkçe'; // Determine target language

        try { // Start try block
            for (const part of parts) { // Iterate main parts
                if (!part.main_title.trim()) continue; // Validate main title
                fullDocumentation += `\n# ${part.main_title}\n\n`; // Append main title
                for (const sub of part.sub_all) { // Iterate sub parts
                    if (!sub.sub_title.trim() || !sub.text.trim()) continue; // Validate sub content
                    
                    const res = await generateDocument({ // Call generation API
                        main_topic: part.main_title, // Pass main topic
                        section_name: sub.sub_title, // Pass sub topic
                        text: sub.text, // Pass content
                        detail_level: detailLevel, // Pass detail level
                        language: targetLanguage  // Pass target language
                    });
                    
                    const resultData = res.data; // Extract response data
                    fullDocumentation += `## ${resultData.section}\n${resultData.content}\n\n`; // Append section content
                    
                    set_output(fullDocumentation); // Update UI incrementally
                    totalPages += parseFloat(resultData.estimated_pages || 0); // Accumulate page count
                }
            }
            if (fullDocumentation === "") { // Check empty result
                set_output("Lütfen oluşturmak için başlıkları ve metin alanlarını doldurun."); // Set error message
            } else { // Handle success
                setEstimatedPages(totalPages.toFixed(1)); // Update page count
            }
        } catch (e) { // Catch error block
            console.error(e); // Log generation error
            set_output(fullDocumentation + "\n\n API bağlantı hatası oluştu. İşlem yarıda kesildi."); // Set failure message
        } finally { // Execute finally block
            set_loading(false); // Stop loading indicator
        }
    };

    return ( // Return provider component
        <DocumentContext.Provider value={{ // Pass state values
            parts, set_parts, // Pass parts
            loading_page, set_loading, // Pass loading
            output, set_output, // Pass output
            detailLevel, setDetailLevel, // Pass detail level
            language, setLanguage, // Pass language
            estimatedPages, setEstimatedPages, // Pass estimated pages
            backend_conntection // Pass generate trigger
        }}>
            {children} {/* Render child components */}
        </DocumentContext.Provider>
    );
};