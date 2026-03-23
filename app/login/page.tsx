"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("Verificando credenciales seguras...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje("❌ Acceso denegado: Credenciales incorrectas.");
      setCargando(false);
    } else {
      setMensaje("✅ ¡Bienvenido! Preparando bóveda...");
      
      // 1. REFRESCAMOS EL SERVIDOR: Esto sincroniza las cookies con el Middleware
      router.refresh(); 

      // 2. Le damos 500ms al servidor para asimilar la cookie antes de redirigir
      setTimeout(() => {
        router.push("/admin"); 
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[70vh]">
      <div className="w-full max-w-md bg-[#0b1120] border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-widest mb-2">
            ZONA VIP<span className="text-cyan-500">.</span>
          </h1>
          <p className="text-slate-400 text-sm">Acceso exclusivo para administradores</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Corregido: Accesibilidad con htmlFor e id */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="admin@collectors.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-2">
              Contraseña de Seguridad
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {mensaje && (
            <div className={`text-sm text-center font-medium mt-2 py-2 rounded ${mensaje.includes('❌') ? 'text-red-400 bg-red-900/20' : 'text-emerald-400 bg-emerald-900/20'}`}>
              {mensaje}
            </div>
          )}

          <div className="mt-4">
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] disabled:opacity-50"
            >
              {cargando ? "Desencriptando..." : "Acceder al Panel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}