import React, { useState } from "react"; // Import React hooks
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"; // Import UI icons

import { registerUser } from '../services/authService'; // Import auth service

export function SignUp({ onNavigate }) { // Main signup component
  const [showPassword, setShowPassword] = useState(false); // Password visibility state
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Confirm visibility state
  const [isLoading, setIsLoading] = useState(false); // Loading status state
  
  const [formData, setFormData] = useState({ // Form data state
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "" // Confirm password state
  });

  const [error, setError] = useState(""); // Error message state

  const handleSubmit = async (e) => { // Handle form submit
    e.preventDefault(); // Prevent default behavior
    setError(""); // Clear previous errors

    if (formData.password !== formData.confirmPassword) { // Check password match
      setError("Şifreler birbiriyle eşleşmiyor!"); // Set mismatch error
      return; // Exit execution
    }

    const nameParts = formData.fullName.trim().split(" "); // Split full name
    const name = nameParts[0] || ""; // Extract first name
    const surname = nameParts.slice(1).join(" ") || " "; // Extract last name

    setIsLoading(true); // Start loading state
    try { // Start try block
      const data = await registerUser(name, surname, formData.email, formData.password); // Call register API
      
      console.log("Kayıt başarılı:", data); // Log success data
      
      onNavigate("login"); // Navigate to login
      
    } catch (err) { // Catch error block
      if (err.response && err.response.data) { // Check server response
        setError(err.response.data.detail || err.response.data.message); // Set server error
      } else { // Handle connection failure
        setError("Sunucuya bağlanılamadı. Backend çalışıyor mu?"); // Set connection error
      }
    } finally { // Execute finally block
      setIsLoading(false); // Stop loading state
    }
  };

  const handleInputChange = (field, value) => { // Handle input change
    setFormData(prev => ({ ...prev, [field]: value })); // Update form state
  };

  const inputStyles = "block w-full pl-10 pr-10 py-2 border border-zinc-300 rounded-lg bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"; // Input CSS classes
  const labelStyles = "block text-sm font-medium text-zinc-700 mb-1"; // Label CSS classes

  return ( // Return JSX elements
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8">
          <div className="text-center mb-8"> {/* Header section */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <span className="text-2xl font-bold text-white tracking-tighter">AP</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Hesap Oluştur</h1>
            <p className="text-zinc-600 mt-2">Otomasyon panelinizi kullanmaya başlayın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left"> {/* Signup form */}
            
            <div> {/* Full name field */}
              <label className={labelStyles}>Ad Soyad</label> 
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-400" /> 
                </div>
                <input
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  className={inputStyles}
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div> {/* Email field */}
              <label className={labelStyles}>E-posta Adresi</label> 
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email" 
                  placeholder="siz@sirket.com"
                  className={inputStyles}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div> {/* Password field */}
              <label className={labelStyles}>Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"} 
                  placeholder="Şifrenizi girin"
                  className={inputStyles}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  minLength={6} // Optional min length
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />} 
                </button>
              </div>
            </div>

            <div> {/* Confirm password field */}
              <label className={labelStyles}>Şifre Tekrar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Şifrenizi tekrar girin"
                  className={inputStyles}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />} 
                </button>
              </div>
            </div>
            
            {error && ( // Conditional error message
              <div className="text-red-500 text-sm font-medium mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            <button // Form submit button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed" 
            >
              {isLoading ? ( // Conditional button content
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : ( // Default button text
                "Hesap Oluştur"
              )}
            </button>
          </form>

          <div className="mt-6 text-center"> {/* Login link section */}
            <p className="text-sm text-zinc-500">
              Zaten bir hesabınız var mı?{" "} 
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Giriş yapın
              </button>
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-zinc-400"> {/* Footer section */}
          <p></p>
        </div>
      </div>
    </div>
  );
}