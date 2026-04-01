"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import imageCompression from 'browser-image-compression';

export default function RegistroVendedorPage() {
  const router = useRouter();
  
  // Estados del Formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  
  // Ubicación Local
  const [estadosMexico, setEstadosMexico] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");

  // Foto de Perfil
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  
  // Estados de Control
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  useEffect(() => {
    cargarEstados();
  }, []);

  const cargarEstados = async () => {
    const { data } = await supabase.from('estado').select('*').order('estado', { ascending: true });
    if (data) setEstadosMexico(data);
  };

  const manejarCambioEstado = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idEst = e.target.value;
    setEstadoSeleccionado(idEst);
    setMunicipioSeleccionado("");
    
    if (!idEst) {
      setMunicipios([]);
      return;
    }
    const { data } = await supabase.from('municipio').select('*').eq('id_est', idEst).order('municipio', { ascending: true });
    if (data) setMunicipios(data);
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoArchivo) { setMensaje("❌ Es obligatorio subir un logo o foto de perfil."); return; }
    if (!municipioSeleccionado) { setMensaje("❌ Es obligatorio seleccionar tu Municipio."); return; }

    setCargando(true);
    setMensaje("Verificando disponibilidad de la tienda...");

    // 1. Verificamos si el nombre de usuario ya existe
    const { data: usuarioExistente } = await supabase.from('usuario').select('id_usuario').ilike('nombre_usuario', nombre.trim()).single();
    if (usuarioExistente) {
      setMensaje("❌ Ese nombre de tienda ya está en uso.");
      setCargando(false);
      return;
    }

    setMensaje("Optimizando logotipo...");
    
    // 2. Subimos la foto de la tienda
    let imagenUrlFinal = null;
    try {
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(fotoArchivo, options);
      const extension = compressedFile.name.split('.').pop() || 'jpg';
      const nombreArchivo = `pro_${Date.now()}.${extension}`;
      
      const { error: uploadError } = await supabase.storage.from('avatares').upload(nombreArchivo, compressedFile);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('avatares').getPublicUrl(nombreArchivo);
      imagenUrlFinal = data.publicUrl;
    } catch (error) {
      setMensaje("❌ Error al subir la imagen. Intenta con otra foto.");
      setCargando(false);
      return;
    }

    // 3. CREAMOS LA CUENTA EN LA BÓVEDA DE SUPABASE (AUTH)
    setMensaje("Creando credenciales seguras...");
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setMensaje("❌ Error de seguridad: " + authError.message);
      setCargando(false);
      return;
    }

    // 4. CREAMOS EL PERFIL DE VENDEDOR
    setMensaje("Configurando perfil PRO...");
    const { error: dbError } = await supabase.from('usuario').insert([{
      correo: email,
      nombre_usuario: nombre.trim(),
      whatsapp: parseInt(whatsapp),
      link_maps: linkMaps.trim(),
      id_mun: parseInt(municipioSeleccionado),
      link_img_perf: imagenUrlFinal,
      rol: 'VENDEDOR' // 🌟 ASIGNACIÓN AUTOMÁTICA DE ROL PRO
    }]);

    if (dbError) {
      setMensaje("❌ Error al crear perfil de tienda: " + dbError.message);
      setCargando(false);
    } else {
      setRegistroExitoso(true);
    }
  };

  // 📬 PANTALLA DE ÉXITO
  if (registroExitoso) {
    return (
      <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="bg-[#0b1120] border border-amber-900/50 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.1)] max-w-lg w-full z-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
            <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-4">¡Tienda Registrada!</h1>
          <p className="text-slate-400 mb-6 leading-relaxed">Hemos enviado un enlace de confirmación a <span className="font-bold text-amber-400">{email}</span>. Confirma tu correo para abrir las puertas de tu tienda oficial.</p>
          <Link href="/login" className="inline-block w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black py-4 rounded-xl transition-all shadow-md">Ir a Iniciar Sesión</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden font-sans">
      
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <Link href="/" className="mb-6 text-3xl font-black text-white tracking-wider z-10 hover:scale-105 transition-transform">
        COLLECTORS<span className="text-amber-500">.</span> <span className="text-sm border border-amber-500/50 text-amber-500 px-2 py-1 rounded-md ml-2 bg-amber-900/20">PRO STORE</span>
      </Link>

      <div className="bg-[#0b1120] border border-amber-900/30 p-6 md:p-8 rounded-3xl shadow-2xl max-w-2xl w-full z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Registro de Vendedores</h1>
          <p className="text-sm text-amber-500/80 font-medium">Únete a la red oficial y obtén herramientas de venta exclusivas.</p>
        </div>

        <form onSubmit={handleRegistro} className="flex flex-col gap-6">
          
          {mensaje && (
            <div className={`text-sm font-bold p-3 rounded-xl text-center ${mensaje.includes('❌') ? 'text-red-400 bg-red-500/10 border border-red-500/30' : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'}`}>
              {mensaje}
            </div>
          )}
          
          {/* FOTO DE PERFIL / LOGO OBLIGATORIA */}
          <div className="flex flex-col items-center justify-center mb-2">
            <input type="file" accept="image/*" id="foto-tienda" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setFotoArchivo(f); setFotoPreview(URL.createObjectURL(f)); } }} />
            <label htmlFor="foto-tienda" className="relative w-28 h-28 rounded-full border-2 border-dashed border-amber-500/50 hover:border-amber-400 bg-slate-900/50 flex items-center justify-center cursor-pointer overflow-hidden group shadow-inner">
              {fotoPreview ? (
                <><img src={fotoPreview} alt="Logo" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-[10px] font-bold">Cambiar</span></div></>
              ) : (
                <div className="text-center flex flex-col items-center">
                  <svg className="w-8 h-8 text-amber-500/50 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm3 3h2v2H9V9zm4 0h2v2h-2V9zm-4 4h6v2H9v-2z"/></svg>
                  <span className="text-[9px] text-amber-500/70 font-bold uppercase">Subir Logo *</span>
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* COLUMNA 1: Datos Base */}
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1.5 block">Nombre de Tienda *</label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. HotWheels Qro" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1.5 block">Correo Electrónico *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@tienda.com" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1.5 block">Contraseña *</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
              </div>
            </div>

            {/* COLUMNA 2: Datos de Contacto Obligatorios */}
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1.5 block flex items-center gap-1">📱 WhatsApp de Ventas *</label>
                <input type="number" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="10 dígitos" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1.5 block flex items-center gap-1">📍 Google Maps Link *</label>
                <input type="url" required value={linkMaps} onChange={(e) => setLinkMaps(e.target.value)} placeholder="Enlace de ubicación física" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
              </div>
              
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1.5 block">Estado *</label>
                  <select required value={estadoSeleccionado} onChange={manejarCambioEstado} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 text-sm">
                    <option value="">Selecciona...</option>
                    {estadosMexico.map(e => <option key={e.id_est} value={e.id_est}>{e.estado}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1.5 block">Municipio *</label>
                  <select required disabled={!estadoSeleccionado} value={municipioSeleccionado} onChange={(e) => setMunicipioSeleccionado(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 text-sm disabled:opacity-50">
                    <option value="">Selecciona...</option>
                    {municipios.map(m => <option key={m.id_mun} value={m.id_mun}>{m.municipio}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={cargando} className="mt-4 w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 text-lg tracking-wide uppercase">
            {cargando ? "Procesando Registro..." : "Aplicar como Vendedor PRO"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">
            ¿Eres un coleccionista casual?{" "}
            <Link href="/registro" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors ml-1">
              Registro Normal
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}