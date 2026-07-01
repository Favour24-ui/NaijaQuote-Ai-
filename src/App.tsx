import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import { User } from "./types";
import { Landmark } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    const savedToken = localStorage.getItem("session_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/session", {
        headers: {
          Authorization: `Bearer ${savedToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          setToken(savedToken);
        } else {
          localStorage.removeItem("session_token");
        }
      } else {
        localStorage.removeItem("session_token");
      }
    } catch (err) {
      console.error("Session verification failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleAuthSuccess = (authenticatedUser: User, sessionToken: string) => {
    setUser(authenticatedUser);
    setToken(sessionToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <div className="text-center space-y-4">
          <div className="mx-auto h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Landmark className="h-6 w-6 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">AI Quotation Generator</h2>
          <p className="text-xs text-slate-400 font-medium">Bootstrapping secure environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen selection:bg-blue-500 selection:text-white">
      {user && token ? (
        <Dashboard user={user} token={token} onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
