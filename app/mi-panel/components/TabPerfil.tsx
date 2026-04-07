"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from 'browser-image-compression';

export default function TabPerfil({ 
  miPerfil, 
  estadosMexico, 
  cargarDatosCentrales 
}: { 
  miPerfil: any, 
  estadosMexico: any[], 
  cargarDatosCentrales: () => void 
}) {
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");
  const [fotoArchivoPerfil, setFotoArchivoPerfil] = useState<File | null>(null);
  const [fotoPreviewPerfil, setFotoPreviewPerfil] = useState<string | null>(null);

  // Cargar los datos del perfil en el formulario cuando se abre la pestaña
  useEffect(() => {
    if (miPerfil) {
      setNombreUsuario(miPerfil.nombre_usuario || "");
      setWhatsapp(miPerfil.whatsapp ? miPerfil.whatsapp.toString() : "");
      setFacebook(miPerfil.facebook || "");
      setLinkMaps(miPerfil.link_maps || "");
      setFotoPreviewPerfil(miPerfil.link_img_perf);
      setMunicipioSeleccionado(miPerfil.id_mun ? miPerfil.id_mun.toString() : "");

      if (miPerfil.id_mun) {
        supabase.from('municipio').select('id_est').eq('id_mun', miPerfil.id_mun).single().then(resMun => {
          if (resMun.data) {
            setEstadoSeleccionado(resMun.data.id_est.toString());
            cargarMunicipios(resMun.data.id_est);
          }
        });
      }
    }
  }, [miPerfil]);

  const cargarMunicipios = async (idEst: string | number) => {
    if (!idEst) { setMunicipios([]); return; }
    const { data } = await supabase.from('municipio').select('*').eq('id_est', idEst).order('municipio', { ascending: true });
    if (data) setMunicipios(data);
  };

  const manejarCambioEstadoMex = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEst = e.target.value; 
    setEstadoSeleccionado(nuevoEst); 
    setMunicipioSeleccionado(""); 
    cargarMunicipios(nuevoEst);
  };

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault(); setGuardandoPerfil(true);
    if (nombreUsuario.trim() !== miPerfil.nombre_usuario) {
      const { data: usuarioExistente } = await supabase.from('usuario').select('id_usuario').ilike('nombre_usuario', nombreUsuario.trim()).single();
      if (usuarioExistente) { alert("⚠️ Ese nombre de usuario ya está en uso."); setGuardandoPerfil(false); return; }
    }
    
    let imagenUrlFinal = fotoPreviewPerfil?.includes('blob:') ? null : fotoPreviewPerfil;
    if (fotoArchivoPerfil) {
      try {
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(fotoArchivoPerfil, options);
        const extension = compressedFile.name.split('.').pop() || 'jpg';
        const nombreArchivo = `${miPerfil.id_usuario}_${Date.now()}.${extension}`;
        await supabase.storage.from('avatares').upload(nombreArchivo, compressedFile);
        const { data } = supabase.storage.from('avatares').getPublicUrl(nombreArchivo);
        imagenUrlFinal = data.publicUrl;
      } catch (error) { alert("Error al optimizar imagen."); setGuardandoPerfil(false); return; }
    }
    
    const payload: any = { nombre_usuario: nombreUsuario.trim(), facebook, whatsapp: whatsapp ? parseInt(whatsapp) : null, id_mun: municipioSeleccionado ? parseInt(municipioSeleccionado) : null, link_img_perf: imagenUrlFinal, link_maps: linkMaps };
    const { error } = await supabase.from('usuario').update(payload).eq('id_usuario', miPerfil.id_usuario);
    
    if (error) {
        alert("Error al guardar: " + error.message); 
    } else { 
        alert("Perfil actualizado correctamente.");
        cargarDatosCentrales(); // Refrescar los datos globales
    }
    setGuardandoPerfil(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300"> 
      <h2 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-100 pb-4">Información de Coleccionista</h2> 
      <form onSubmit={guardarPerfil} className="flex flex-col gap-8"> 
        <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200"> 
          <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer group overflow-hidden bg-slate-200 shrink-0"> 
            <input type="file" accept="image/*" className="hidden" id="foto-perfil" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setFotoArchivoPerfil(f); setFotoPreviewPerfil(URL.createObjectURL(f)); } }} /> 
            <label htmlFor="foto-perfil" className="absolute inset-0 z-10 cursor-pointer"></label> 
            {fotoPreviewPerfil ? <img src={fotoPreviewPerfil} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-slate-400 text-xs font-bold text-center px-2">Subir Foto</span>} 
            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs font-bold">Cambiar</span></div> 
          </div> 
          <div className="w-full"> 
            <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Nombre de Usuario</label> 
            <input type="text" required value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors shadow-sm" /> 
            <p className="text-[10px] text-slate-400 mt-1 font-medium">⚠️ Si lo cambias, tu enlace público de vitrina también cambiará.</p> 
          </div> 
        </div> 
        <div> 
          <h3 className="text-sm text-slate-800 font-bold uppercase tracking-wider border-b border-slate-200 pb-2 mb-4 flex justify-between">Contacto & Privacidad <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">100% PRIVADO</span></h3> 
          <p className="text-xs text-slate-500 mb-4">Estas redes solo serán visibles para coleccionistas que tú sigas y que te sigan de vuelta.</p> 
          <div className="space-y-4"> 
            <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-2 focus-within:border-cyan-500 transition-colors shadow-sm"><span className="text-emerald-500 font-bold text-xl">W</span><input type="number" placeholder="WhatsApp (Ej. 5512345678)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-transparent text-slate-900 py-1.5 outline-none placeholder:text-slate-400 font-medium" /></div> 
            <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-2 focus-within:border-cyan-500 transition-colors shadow-sm"><span className="text-blue-600 font-bold text-xl">f</span><input type="text" placeholder="Enlace de Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full bg-transparent text-slate-900 py-1.5 outline-none placeholder:text-slate-400 font-medium" /></div> 
          </div> 
        </div> 
        <div> 
          <h3 className="text-sm text-slate-800 font-bold uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Ubicación Local</h3> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
            <select value={estadoSeleccionado} onChange={manejarCambioEstadoMex} className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 shadow-sm font-medium"><option value="">-- Estado --</option>{estadosMexico.map(e => <option key={e.id_est} value={e.id_est}>{e.estado}</option>)}</select> 
            <select disabled={!estadoSeleccionado} value={municipioSeleccionado} onChange={(e) => setMunicipioSeleccionado(e.target.value)} className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 shadow-sm font-medium disabled:bg-slate-100 disabled:text-slate-400"><option value="">-- Municipio --</option>{municipios.map(m => <option key={m.id_mun} value={m.id_mun}>{m.municipio}</option>)}</select> 
          </div> 
        </div> 
        {miPerfil?.rol === 'VENDEDOR' && ( 
          <div className="mt-4 border p-4 rounded-xl transition-colors border-slate-200 bg-slate-50 shadow-sm" > 
            <p className="text-sm font-bold flex items-center gap-2 text-slate-700 mb-2">📍 Ubicación Tienda (Google Maps)</p> 
            <input type="text" placeholder="Pega aquí el enlace a Google Maps de tu tienda" value={linkMaps} onChange={(e) => setLinkMaps(e.target.value)} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 font-medium text-sm" /> 
            <p className="text-xs text-slate-500 mt-2">Aparecerá un botón rojo en tu perfil para que los clientes te visiten.</p> 
          </div> 
        )} 
        <div className="pt-4 border-t border-slate-100"> 
          <button type="submit" disabled={guardandoPerfil} className="w-full md:w-auto md:px-12 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50">{guardandoPerfil ? "Guardando..." : "Guardar Perfil"}</button> 
        </div> 
      </form> 
    </div>
  );
}