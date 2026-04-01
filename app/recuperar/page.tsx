"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    // Enviamos el correo de recuperación
    // Redirigirá a una página que crearemos llamada /actualizar-password
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });

    if (error) {
      setMensaje("❌ Error: " + error.message);
    } else {
      setEnviado(true);
    }
    setCargando(false);
  };

  return (
    <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 selection:bg-cyan-900 selection:text-cyan-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <Link href="/" className="mb-8 text-3xl font-black text-white tracking-wider z-10 hover:scale-105 transition-transform">
        COLLECTORS<span className="text-cyan-500">.</span>
      </Link>

      <div className="bg-[#0b1120] border border-cyan-900/30 p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full z-10">
        
        {enviado ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Revisa tu correo</h2>
            <p className="text-sm text-slate-400 mb-6">Hemos enviado un enlace mágico a <strong>{email}</strong> para que restablezcas tu contraseña de forma segura.</p>
            <Link href="/login" className="w-full inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md">
              Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Recuperar Acceso</h1>
              <p className="text-sm text-slate-400">Ingresa tu correo para recibir las llaves de tu bóveda.</p>
            </div>

            <form onSubmit={handleRecuperar} className="flex flex-col gap-5">
              {mensaje && (
                <div className="text-sm font-bold p-3 rounded-xl text-center text-red-400 bg-red-500/10 border border-red-500/30 animate-in fade-in duration-300">
                  {mensaje}
                </div>
              )}
              
              <div>
                <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coleccionista@correo.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={cargando || !email}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] disabled:opacity-50"
              >
                {cargando ? "Buscando bóveda..." : "Enviar Enlace Mágico"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-sm text-slate-400">
                <Link href="/login" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                  Cancelar y volver atrás
                </Link>
              </p>
            </div>
          </>
        )}

      </div>
    </main>
  );
}