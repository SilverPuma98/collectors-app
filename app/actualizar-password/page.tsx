"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [enlaceInvalido, setEnlaceInvalido] = useState(false);

  // Verificamos si el usuario realmente viene del enlace de correo
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setEnlaceInvalido(true);
      }
    };
    verificarSesion();
  }, []);

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMensaje("❌ Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setMensaje("❌ La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);
    setMensaje("Forjando nueva llave de seguridad...");

    // Supabase permite actualizar la contraseña si el usuario tiene una sesión activa (que se la dio el enlace mágico)
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMensaje("❌ Error al actualizar: " + error.message);
      setCargando(false);
    } else {
      setExito(true);
      // Lo mandamos directo a su panel después de 3 segundos
      setTimeout(() => {
        router.push("/mi-panel");
        router.refresh();
      }, 3000);
    }
  };

  if (enlaceInvalido) {
    return (
      <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="bg-[#0b1120] border border-red-900/50 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center z-10">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Enlace Inválido o Expirado</h2>
          <p className="text-sm text-slate-400 mb-6">El enlace mágico que usaste ya no es válido. Por favor, solicita uno nuevo.</p>
          <Link href="/recuperar" className="w-full inline-block bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all">
            Solicitar nuevo enlace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 selection:bg-cyan-900 selection:text-cyan-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <Link href="/" className="mb-8 text-3xl font-black text-white tracking-wider z-10 hover:scale-105 transition-transform">
        COLLECTORS<span className="text-cyan-500">.</span>
      </Link>

      <div className="bg-[#0b1120] border border-cyan-900/30 p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full z-10">
        
        {exito ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Contraseña Actualizada!</h2>
            <p className="text-sm text-slate-400 mb-6">Tu bóveda está segura nuevamente. Redirigiendo a tu panel...</p>
            <div className="flex justify-center"><svg className="animate-spin h-6 w-6 text-cyan-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Nueva Contraseña</h1>
              <p className="text-sm text-slate-400">Ingresa tu nueva llave de seguridad.</p>
            </div>

            <form onSubmit={handleActualizar} className="flex flex-col gap-5">
              {mensaje && (
                <div className={`text-sm font-bold p-3 rounded-xl text-center animate-in fade-in duration-300 ${mensaje.includes('❌') ? 'text-red-400 bg-red-500/10 border border-red-500/30' : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'}`}>
                  {mensaje}
                </div>
              )}
              
              <div>
                <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Escríbela de nuevo"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={cargando || !password || !confirmPassword}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] disabled:opacity-50"
              >
                {cargando ? "Actualizando..." : "Guardar y Entrar"}
              </button>
            </form>
          </>
        )}

      </div>
    </main>
  );
}