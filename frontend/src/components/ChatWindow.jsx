import { useState, useEffect, useRef } from "react"; // Import React hooks
import { X, Send, Loader2 } from "lucide-react"; // Import UI icons
import { getMessages, sendMessage } from "../services/apiService"; // Import API services

export function ChatWindow({ currentUser, chatMember, onClose }) { // Chat window component
  const [messages, setMessages] = useState([]); // Message list state
  const [newMessage, setNewMessage] = useState(""); // Input field state
  const [isLoading, setIsLoading] = useState(true); // Loading status state
  const messagesEndRef = useRef(null); // Auto scroll reference

  const fetchMessages = async () => { // Fetch chat history
    if (!chatMember.connected_user_id) return; // Validate user ID
    try { // Start try block
      const data = await getMessages(chatMember.connected_user_id); // Fetch from API
      setMessages(Array.isArray(data) ? data : []); // Update messages array
    } catch (err) { // Catch error block
      console.error("Mesajlar çekilemedi", err); // Log fetch error
    } finally { // Execute finally block
      setIsLoading(false); // Stop loading indicator
    }
  };

  useEffect(() => { // Mount effect hook
    fetchMessages(); // Initial message fetch
    const intervalId = setInterval(fetchMessages, 3000); // Setup polling interval
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [chatMember]); // Dependency array trigger

  useEffect(() => { // Auto scroll effect
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll to bottom
  }, [messages]); // Trigger on update

  const handleSend = async (e) => { // Handle message submission
    e.preventDefault(); // Prevent form submit
    if (!newMessage.trim() || !chatMember.connected_user_id) return; // Validate message text
    try { // Start try block
      await sendMessage(chatMember.connected_user_id, newMessage); // Send message API
      setNewMessage(""); // Reset input field
      await fetchMessages(); // Refresh message list
    } catch (error) { // Catch error block
      console.error("Mesaj gönderilemedi", error); // Log send error
    }
  };

  return ( // Return JSX elements
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-50 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-200">
        
        {/* Header section */}
        <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold text-white">{chatMember.avatar || "U"}</span>
            </div>
            <div>
              <h3 className="font-bold text-zinc-900">{chatMember.name}</h3>
              <p className="text-xs text-green-500 font-medium">Takım Üyesi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#efeae2]">
          {isLoading ? ( // Check loading state
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-sm">Mesajlar yükleniyor...</p>
            </div>
          ) : messages.length === 0 ? ( // Check empty state
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-white/60 px-4 py-2 rounded-xl text-sm text-zinc-500 shadow-sm">
                Sohbet geçmişi yok. İlk mesajı siz gönderin.
              </div>
            </div>
          ) : ( // Render messages list
            messages.map((msg, index) => { // Iterate over messages
              const isMine = msg.sender_id === currentUser?.id; // Check message owner
              return ( // Render message bubble
                <div key={index} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative ${
                    isMine 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-none"
                  }`}>
                    <p className="break-words leading-relaxed">{msg.content}</p>
                    <span className={`text-[10px] mt-1 block text-right opacity-70 ${isMine ? "text-blue-100" : "text-zinc-400"}`}>
                      {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} /> {/* Auto scroll anchor */}
        </div>

        {/* Input section */}
        <div className="p-4 bg-white border-t border-zinc-200 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-3"> {/* Form submit handler */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Bir mesaj yazın..."
              className="flex-1 px-4 py-3 bg-zinc-100 border-transparent rounded-xl outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}