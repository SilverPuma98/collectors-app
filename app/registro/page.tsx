"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  
  // Variables del formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState(""); // Opcional según tu base de datos
  
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("Creando credenciales seguras...");

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

    // 2. SI LA BÓVEDA LO ACEPTA, CREAMOS SU PERFIL EN TU TABLA PÚBLICA 'usuario'
    setMensaje("Configurando perfil de coleccionista...");
    
    const { error: dbError } = await supabase.from('usuario').insert([{
      correo: email,
      nombre_usuario: nombre,
      whatsapp: whatsapp ? parseInt(whatsapp) : null,
      rol: 'USUARIO' // Por defecto entra como usuario base
    }]);

    if (dbError) {
      setMensaje("❌ Error al crear perfil: " + dbError.message);
    } else {
      setMensaje("✅ ¡Cuenta creada con éxito! Entrando al garaje...");
      // Lo mandamos directo a su nuevo garaje
      setTimeout(() => {
        router.push("/mi-garaje");
      }, 2000);
    }
    
    setCargando(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[80vh]">
      <div className="w-full max-w-md bg-[#0b1120] border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-widest mb-2">
            UNIRSE<span className="text-cyan-500">.</span>
          </h1>
          <p className="text-slate-400 text-sm">Crea tu cuenta y empieza a registrar tu colección</p>
        </div>

        <form onSubmit={handleRegistro} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-2">
              Nombre de Coleccionista *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="Ej. HotWheelsHunter99"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-2">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-2">
              Contraseña Segura *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              WhatsApp (Opcional)
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 text-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-slate-500 transition-all"
              placeholder="Para alertas de ventas o moderación"
            />
          </div>

          {mensaje && (
            <div className={`text-sm text-center font-medium mt-2 py-3 rounded ${mensaje.includes('❌') ? 'text-red-400 bg-red-900/20 border border-red-900/50' : 'text-emerald-400 bg-emerald-900/20 border border-emerald-900/50'}`}>
              {mensaje}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4">
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] disabled:opacity-50"
            >
              {cargando ? "Registrando..." : "Crear mi cuenta"}
            </button>

            <div className="text-center">
              <span className="text-slate-500 text-sm">¿Ya tienes una cuenta? </span>
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors">
                Inicia Sesión aquí
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}