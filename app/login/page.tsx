"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    // 1. Intentamos iniciar sesión con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    if (error) {
      setError("Correo o contraseña incorrectos. Intenta de nuevo.");
      setCargando(false);
      return;
    }

    // 2. Si el login es exitoso, los mandamos al Panel unificado
    // (El panel ya tiene la inteligencia para saber si es Admin o Usuario normal)
    router.push("/mi-panel");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 selection:bg-cyan-900 selection:text-cyan-50 relative overflow-hidden">
      
      {/* Luces de fondo sutiles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <Link href="/" className="mb-8 text-3xl font-black text-white tracking-wider z-10 hover:scale-105 transition-transform">
        COLLECTORS<span className="text-cyan-500">.</span>
      </Link>

      <div className="bg-[#0b1120] border border-cyan-900/30 p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Bienvenido de vuelta</h1>
          <p className="text-sm text-slate-400">Inicia sesión para acceder a tu bóveda</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold p-3 rounded-xl text-center animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Correo Electrónico</label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="coleccionista@correo.com"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Contraseña</label>
            <input
              type="password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Accediendo...
              </>
            ) : (
              "Entrar a mi Bóveda"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">
            ¿Aún no tienes una bóveda?{" "}
            <Link href="/registro" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors ml-1">
              Crear cuenta gratis
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}