"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function EditarPerfil() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  
  // Campos de Texto
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  
  // Campos de Ubicación
  const [estados, setEstados] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");

  // Foto
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  useEffect(() => {
    cargarDatosBase();
  }, []);

  const cargarDatosBase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // 1. Cargamos todos los Estados de la República
    const resEstados = await supabase.from('estado').select('*').order('estado');
    if (resEstados.data) setEstados(resEstados.data);

    // 2. Cargamos el perfil del usuario
    const { data } = await supabase.from('usuario').select('*').eq('correo', user.email).single();
    
    if (data) {
      setPerfil(data);
      setNombreUsuario(data.nombre_usuario || "");
      setWhatsapp(data.whatsapp ? data.whatsapp.toString() : "");
      setFacebook(data.facebook || "");
      setFotoPreview(data.link_img_perf);
      setMunicipioSeleccionado(data.id_mun ? data.id_mun.toString() : "");

      // 3. Si el usuario ya tiene un municipio guardado, necesitamos saber a qué Estado pertenece para cargar la lista
      if (data.id_mun) {
        const resMun = await supabase.from('municipio').select('id_est').eq('id_mun', data.id_mun).single();
        if (resMun.data) {
          setEstadoSeleccionado(resMun.data.id_est.toString());
          cargarMunicipios(resMun.data.id_est);
        }
      }
    }
  };

  const cargarMunicipios = async (idEst: string | number) => {
    if (!idEst) { setMunicipios([]); return; }
    const { data } = await supabase.from('municipio').select('*').eq('id_est', idEst).order('municipio');
    if (data) setMunicipios(data);
  };

  const manejarCambioEstado = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEst = e.target.value;
    setEstadoSeleccionado(nuevoEst);
    setMunicipioSeleccionado(""); // Resetea el municipio al cambiar de estado
    cargarMunicipios(nuevoEst);
  };

  const manejarCapturaFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFotoArchivo(file); setFotoPreview(URL.createObjectURL(file)); }
  };

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    // ==========================================
    // 🛡️ MEDIDA DE SEGURIDAD: VERIFICAR DUPLICADOS
    // ==========================================
    // Solo verificamos si el usuario realmente cambió su nombre
    if (nombreUsuario.trim() !== perfil.nombre_usuario) {
      const { data: usuarioExistente } = await supabase
        .from('usuario')
        .select('id_usuario')
        .ilike('nombre_usuario', nombreUsuario.trim()) // ilike ignora mayúsculas/minúsculas
        .single();
        
      if (usuarioExistente) {
        alert("⚠️ ¡Ese nombre de usuario ya está en uso por otro coleccionista! Por favor, elige uno diferente.");
        setGuardando(false);
        return; // Abortamos la misión, no guardamos nada.
      }
    }
    // ==========================================

    let imagenUrlFinal = fotoPreview?.includes('blob:') ? null : fotoPreview;

    if (fotoArchivo) {
      const extension = fotoArchivo.name.split('.').pop();
      const nombreArchivo = `${perfil.id_usuario}_${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('avatares').upload(nombreArchivo, fotoArchivo);
      if (uploadError) { alert("Error al subir foto: " + uploadError.message); setGuardando(false); return; }
      const { data } = supabase.storage.from('avatares').getPublicUrl(nombreArchivo);
      imagenUrlFinal = data.publicUrl;
    }

    const payload: any = {
      nombre_usuario: nombreUsuario.trim(), // .trim() quita espacios vacíos al inicio o final
      facebook: facebook,
      whatsapp: whatsapp ? parseInt(whatsapp) : null,
      id_mun: municipioSeleccionado ? parseInt(municipioSeleccionado) : null,
      link_img_perf: imagenUrlFinal
    };

    const { error } = await supabase.from('usuario').update(payload).eq('id_usuario', perfil.id_usuario);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      router.push(`/perfil`);
    }
    setGuardando(false);
  };

  if (!perfil) return <div className="flex h-screen items-center justify-center text-cyan-500 animate-pulse font-bold tracking-widest">CARGANDO PERFIL...</div>;

  return (
    <main className="min-h-screen bg-[#050810] flex items-center justify-center p-4 py-10">
      <div className="bg-[#0b1120] border border-cyan-900/30 p-6 md:p-8 rounded-3xl shadow-2xl max-w-lg w-full">
        <h2 className="text-2xl font-black text-white mb-6 text-center tracking-wide">Configurar Perfil<span className="text-cyan-500">.</span></h2>
        
        <form onSubmit={guardarCambios} className="flex flex-col gap-6">
          
          {/* FOTO DE PERFIL */}
          <div className="flex flex-col items-center mb-2">
            <input type="file" accept="image/*" id="avatar-upload" className="hidden" onChange={manejarCapturaFoto} />
            <label htmlFor="avatar-upload" className="relative w-32 h-32 rounded-full border-2 border-dashed border-cyan-700 flex items-center justify-center cursor-pointer group overflow-hidden bg-slate-900 shadow-inner">
              {fotoPreview ? (
                <><img src={fotoPreview} alt="Avatar" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs font-bold">Cambiar</span></div></>
              ) : (
                <span className="text-slate-500 text-xs font-bold text-center px-4">Toca para subir foto</span>
              )}
            </label>
          </div>

          {/* DATOS DE IDENTIDAD */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
            <div>
              <label className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-1 block flex justify-between">
                <span>Nombre de Usuario</span>
                <span className="text-slate-500 text-[10px]">⚠️ Cambiará tu enlace público</span>
              </label>
              <input type="text" required value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-cyan-700 font-bold uppercase tracking-wider mb-1 block">Correo (No editable)</label>
              <input type="text" disabled value={perfil.correo} className="w-full bg-transparent border border-transparent text-slate-500 rounded-lg px-2 py-1 outline-none cursor-not-allowed" />
            </div>
          </div>

          {/* REDES DE CONTACTO CON AVISO DE PRIVACIDAD */}
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-800 pb-2">
              <h3 className="text-xs text-cyan-500 font-bold uppercase tracking-wider">Contacto & Redes</h3>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 bg-emerald-900/20 border border-emerald-800 rounded flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                100% Privado
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              Tus redes sociales y número telefónico están protegidos. <strong className="text-slate-200">Solo serán visibles para usuarios que tú sigas y que te sigan de vuelta (Amigos Mutuos).</strong> Úsalos para coordinar intercambios de forma segura.
            </p>
            
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg px-4 py-1 focus-within:border-cyan-500 transition-colors">
              <span className="text-emerald-500 font-bold text-xl">W</span>
              <input type="number" placeholder="WhatsApp (Ej. 5512345678)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-transparent text-white py-2 outline-none placeholder:text-slate-600" />
            </div>

            <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg px-4 py-1 focus-within:border-cyan-500 transition-colors">
              <span className="text-blue-500 font-bold text-xl">f</span>
              <input type="text" placeholder="Enlace de tu perfil de Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full bg-transparent text-white py-2 outline-none placeholder:text-slate-600" />
            </div>
          </div>

          {/* UBICACIÓN */}
          <div className="space-y-4">
            <h3 className="text-xs text-cyan-500 font-bold uppercase tracking-wider border-b border-slate-800 pb-2">Ubicación (Para intercambios)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select value={estadoSeleccionado} onChange={manejarCambioEstado} className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500 cursor-pointer">
                  <option value="">-- Selecciona Estado --</option>
                  {estados.map(e => <option key={e.id_est} value={e.id_est}>{e.estado}</option>)}
                </select>
              </div>

              <div>
                <select disabled={!estadoSeleccionado} value={municipioSeleccionado} onChange={(e) => setMunicipioSeleccionado(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 outline-none focus:border-cyan-500 disabled:opacity-50 cursor-pointer">
                  <option value="">-- Selecciona Municipio --</option>
                  {municipios.map(m => <option key={m.id_mun} value={m.id_mun}>{m.municipio}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button type="submit" disabled={guardando} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg">
              {guardando ? "Guardando Bóveda..." : "Guardar Cambios"}
            </button>
            <button type="button" onClick={() => router.push('/perfil')} className="text-slate-500 hover:text-white text-sm font-bold py-2 transition-colors">
              Cancelar y volver
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}