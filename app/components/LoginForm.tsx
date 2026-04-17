"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // --- Email/Password Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // STOPS the page from reloading
    setLoading(true);

    // Force a clean slate by signing out any "ghost" sessions
    await supabase.auth.signOut();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      alert("Login failed: " + error.message);
      return; // CRITICAL: Stop here so the redirect below never happens!
    }

    // Success path
    router.push('/');
    router.refresh();
  };

  // --- Google OAuth Login ---
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert("Google Login failed: " + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="p-8 bg-white shadow-2xl rounded-2xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-800">
          Login to Productivity Board
        </h2>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Email" 
            required
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            required
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button 
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white p-3 rounded-lg font-bold shadow-md
                       cursor-pointer transition-all duration-150
                       hover:bg-blue-700 hover:scale-[1.02] active:scale-95
                       disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-400">Or continue with</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 p-3 rounded-lg font-bold text-gray-700
                     cursor-pointer transition-all duration-150
                     hover:bg-gray-50 hover:scale-[1.02] active:scale-95 shadow-sm"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
          Google
        </button>
      </div>
    </div>
  );
}