"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false); // 📬 NUEVO ESTADO PARA PANTALLA DE ÉXITO

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("Creando credenciales seguras...");

    // Verificamos si el nombre de usuario ya existe
    const { data: usuarioExistente } = await supabase.from('usuario').select('id_usuario').ilike('nombre_usuario', nombre.trim()).single();
    if (usuarioExistente) {
      setMensaje("❌ Ese nombre de usuario ya está en uso.");
      setCargando(false);
      return;
    }

    // 1. CREAMOS LA CUENTA EN LA BÓVEDA DE SUPABASE (AUTH)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMensaje("❌ Error de seguridad: " + authError.message);
      setCargando(false);
      return;
    }

    // 2. CREAMOS SU PERFIL PÚBLICO
    setMensaje("Configurando perfil de coleccionista...");
    
    const { error: dbError } = await supabase.from('usuario').insert([{
      correo: email,
      nombre_usuario: nombre.trim(),
      whatsapp: whatsapp ? parseInt(whatsapp) : null,
      rol: 'USUARIO'
    }]);

    if (dbError) {
      setMensaje("❌ Error al crear perfil: " + dbError.message);
      setCargando(false);
    } else {
      // 📬 MOSTRAR PANTALLA DE CONFIRMACIÓN DE CORREO
      setRegistroExitoso(true);
    }
  };

  // 📬 SI EL REGISTRO FUE EXITOSO, MOSTRAMOS LA PANTALLA DE VERIFICACIÓN
  if (registroExitoso) {
    return (
      <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 selection:bg-cyan-900 selection:text-cyan-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="bg-[#0b1120] border border-cyan-900/50 p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full z-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          
          <h1 className="text-3xl font-black text-white mb-4">¡Revisa tu Correo!</h1>
          
          <p className="text-slate-400 mb-6 leading-relaxed">
            Hemos enviado un enlace mágico a <span className="font-bold text-cyan-400">{email}</span>. 
            Debes hacer clic en él para verificar tu cuenta y poder acceder a tu bóveda.
          </p>

          <div className="bg-amber-900/20 border border-amber-900/50 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Nota Importante
            </p>
            <p className="text-xs text-amber-600/80">Si no ves el correo en tu bandeja principal, revisa tu carpeta de <strong>Spam o Correo no deseado</strong>.</p>
          </div>

          <Link href="/login" className="inline-block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-md">
            Ir a Iniciar Sesión
          </Link>
        </div>
      </main>
    );
  }

  // PANTALLA NORMAL DE REGISTRO
  return (
    <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 selection:bg-cyan-900 selection:text-cyan-50 relative overflow-hidden">
      
      {/* Luces de fondo sutiles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-900/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <Link href="/" className="mb-8 text-3xl font-black text-white tracking-wider z-10 hover:scale-105 transition-transform">
        COLLECTORS<span className="text-cyan-500">.</span>
      </Link>

      <div className="bg-[#0b1120] border border-cyan-900/30 p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Crear Bóveda</h1>
          <p className="text-sm text-slate-400">Únete a la comunidad de coleccionistas</p>
        </div>

        <form onSubmit={handleRegistro} className="flex flex-col gap-5">
          
          {mensaje && (
            <div className={`text-sm font-bold p-3 rounded-xl text-center animate-in fade-in zoom-in duration-300 ${mensaje.includes('❌') ? 'text-red-400 bg-red-500/10 border border-red-500/30' : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'}`}>
              {mensaje}
            </div>
          )}
          
          <div>
            <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Usuario Único *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. PumaDorado99"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Correo Electrónico *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coleccionista@correo.com"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Contraseña Segura *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
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
                Forjando Bóveda...
              </>
            ) : (
              "Crear Mi Cuenta"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">
            ¿Ya eres miembro?{" "}
            <Link href="/login" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors ml-1">
              Inicia Sesión aquí
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}