import React, { useState } from "react"; // Import React hooks
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"; // Import UI icons

import { loginUser } from '../services/authService'; // Import API service

export function Login({ onNavigate }) { // Login main component
  const [showPassword, setShowPassword] = useState(false); // Password visibility state
  const [isLoading, setIsLoading] = useState(false); // Loading status state
  const [formData, setFormData] = useState({ // Form data state
    email: "",
    password: ""
  });
  
  const [error, setError] = useState(""); // Error message state

  const handleSubmit = async (e) => { // Handle form submit
    e.preventDefault(); // Prevent default behavior
    
    setError(""); // Clear previous errors
    setIsLoading(true); // Enable loading state

    try { // Start try block
      const data = await loginUser(formData.email, formData.password); // Call login API
      
      console.log("Giriş başarılı, Token alındı:", data); // Log login success
      
      onNavigate("dashboard"); // Navigate to dashboard

    } catch (err) { // Catch error block
      if (err.response && err.response.data) { // Check server response
        setError(err.response.data.detail); // Set response error
      } else { // Handle connection error
        setError("Sunucuya bağlanılamadı. PyCharm'da backend çalışıyor mu?"); // Set fallback error
      }
    } finally { // Execute finally block
      setIsLoading(false); // Disable loading state
    }
  };

  const handleInputChange = (field, value) => { // Update input field
    setFormData(prev => ({ // Update form state
      ...prev,
      [field]: value
    }));
  };

  const inputStyles = "block w-full pl-10 pr-10 py-2.5 border border-zinc-300 rounded-lg bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"; // Input CSS classes
  const labelStyles = "block text-sm font-medium text-zinc-700 mb-1"; // Label CSS classes

  return ( // Return JSX elements
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8">
          
          <div className="text-center mb-8"> {/* Render header section */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <span className="text-2xl font-bold text-white tracking-tighter">AP</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Tekrar Hoş Geldiniz</h1>
            <p className="text-zinc-600 mt-2">Otomasyon panelinize giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left"> {/* Render login form */}
            
            <div> {/* Render email field */}
              <label htmlFor="email" className={labelStyles}>E-posta Adresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="siz@sirket.com"
                  className={inputStyles}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div> {/* Render password field */}
              <label htmlFor="password" className={labelStyles}>Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin"
                  className={inputStyles}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />} 
                </button>
              </div>
            </div>

            {error && ( // Render error message
              <div className="text-red-500 text-sm font-medium mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button // Render submit button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? ( // Render loading spinner
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : ( // Render normal text
                "Giriş Yap"
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-zinc-100 pt-6"> {/* Render signup link */}
            <p className="text-sm text-zinc-500">
              Hesabınız yok mu?{" "}
              <button
                type="button"
                onClick={() => onNavigate("signup")}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Kayıt olun
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-400"> {/* Render footer section */}
          <p>© 2026 Otomasyon Projesi. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}