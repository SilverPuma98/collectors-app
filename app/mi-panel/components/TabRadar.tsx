"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function TabRadar({ miPerfil }: { miPerfil: any }) {
  const [busquedaRadar, setBusquedaRadar] = useState("");
  const [cargandoRadar, setCargandoRadar] = useState(false);
  const [resultadoRadar, setResultadoRadar] = useState<any>(null);
  const [estadoRadarBuscado, setEstadoRadarBuscado] = useState<'IDLE' | 'ENCONTRADO' | 'NO_ENCONTRADO'>('IDLE');
  const [palabrasBoletin, setPalabrasBoletin] = useState("");
  const [comentarioBoletin, setComentarioBoletin] = useState("");
  const [guardandoBoletin, setGuardandoBoletin] = useState(false);

  const buscarEnRadar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busquedaRadar.trim()) return;
    setCargandoRadar(true);
    setEstadoRadarBuscado('IDLE');
    setResultadoRadar(null);

    const { data: usuarioEncontrado } = await supabase
      .from('usuario')
      .select('id_usuario, nombre_usuario, link_img_perf')
      .ilike('nombre_usuario', busquedaRadar.trim())
      .single();

    if (!usuarioEncontrado) {
      setEstadoRadarBuscado('NO_ENCONTRADO');
      setCargandoRadar(false);
      return;
    }

    if (usuarioEncontrado.id_usuario === miPerfil.id_usuario) {
      alert("No puedes buscarte a ti mismo en el radar.");
      setCargandoRadar(false);
      return;
    }

    const { data: boletines } = await supabase
      .from('boletin_comprador')
      .select('*, vendedor:usuario!id_vendedor(nombre_usuario)')
      .eq('id_comprador', usuarioEncontrado.id_usuario)
      .order('created_at', { ascending: false });

    setResultadoRadar({
      usuario: usuarioEncontrado,
      boletines: boletines || []
    });
    setEstadoRadarBuscado('ENCONTRADO');
    setCargandoRadar(false);
  };

  const boletinarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!palabrasBoletin.trim()) return;
    if (!window.confirm(`⚠️ ¿Seguro que quieres boletinar a @${resultadoRadar.usuario.nombre_usuario}? Esto alertará a otros vendedores.`)) return;
    
    setGuardandoBoletin(true);

    const payload = {
      id_vendedor: miPerfil.id_usuario,
      id_comprador: resultadoRadar.usuario.id_usuario,
      palabras_clave: palabrasBoletin.trim(),
      comentario_privado: comentarioBoletin.trim()
    };

    const { error } = await supabase.from('boletin_comprador').insert([payload]);

    if (error) {
      if (error.code === '23505') { 
        alert("Ya has emitido un reporte de este usuario anteriormente.");
      } else {
        alert("Error al boletinar: " + error.message);
      }
    } else {
      alert("🚨 Usuario boletinado exitosamente. Gracias por proteger a la comunidad.");
      setPalabrasBoletin("");
      setComentarioBoletin("");
      // Refrescar búsqueda silenciosamente
      const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
      buscarEnRadar(dummyEvent);
    }
    setGuardandoBoletin(false);
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-3xl mx-auto"> 
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-sm"> 
        <div className="p-4 bg-white rounded-full shadow-sm text-red-500 shrink-0"> 
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg> 
        </div> 
        <div className="text-center md:text-left"> 
          <h2 className="text-xl font-black text-red-800 mb-1">Radar de Clientes (Buró Interno)</h2> 
          <p className="text-sm text-red-700/80">Verifica la reputación de un comprador ingresando su usuario antes de cerrar un trato, o boletina a usuarios problemáticos para alertar a otros vendedores de la plataforma.</p> 
        </div> 
      </div> 
      
      <form onSubmit={buscarEnRadar} className="flex flex-col md:flex-row gap-3 mb-8"> 
        <input type="text" required placeholder="Escribe el @usuario a buscar..." value={busquedaRadar} onChange={e => setBusquedaRadar(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-4 py-3 outline-none focus:border-red-400 shadow-sm" /> 
        <button type="submit" disabled={cargandoRadar} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md disabled:opacity-50"> 
          {cargandoRadar ? "Buscando..." : "Escanear"} 
        </button> 
      </form> 
      
      {estadoRadarBuscado === 'NO_ENCONTRADO' && ( 
        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl"> 
          <p className="text-slate-500 font-bold text-lg">Usuario no encontrado 🕵️‍♂️</p> 
          <p className="text-slate-400 text-sm mt-1">Verifica que el nombre esté escrito exactamente igual.</p> 
        </div> 
      )} 
      
      {estadoRadarBuscado === 'ENCONTRADO' && resultadoRadar && ( 
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md"> 
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6"> 
            <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 overflow-hidden shrink-0"> 
              {resultadoRadar.usuario.link_img_perf ? <img src={resultadoRadar.usuario.link_img_perf} className="w-full h-full object-cover"/> : <svg className="w-full h-full p-3 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>} 
            </div> 
            <div> 
              <h3 className="text-xl font-black text-slate-800">@{resultadoRadar.usuario.nombre_usuario}</h3> 
              {resultadoRadar.boletines.length === 0 ? ( 
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded border border-emerald-200 mt-1">✅ Limpio (0 Reportes)</span> 
              ) : ( 
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded border border-red-200 mt-1 animate-pulse">🚨 {resultadoRadar.boletines.length} Reporte(s) Encontrados</span> 
              )} 
            </div> 
          </div> 
          
          {resultadoRadar.boletines.length > 0 && ( 
            <div className="flex flex-col gap-3 mb-8"> 
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">Historial de Reportes</h4> 
              {resultadoRadar.boletines.map((bol: any) => ( 
                <div key={bol.id_boletin} className="bg-red-50/50 border border-red-100 p-4 rounded-xl"> 
                  <div className="flex justify-between items-start mb-2"> 
                    <p className="text-xs font-bold text-slate-500">Reportado por: <Link href={`/perfil/${bol.vendedor.nombre_usuario}`} target="_blank" className="text-cyan-600 hover:underline">@{bol.vendedor.nombre_usuario}</Link></p> 
                    <span className="text-[10px] text-slate-400">{new Date(bol.created_at).toLocaleDateString()}</span> 
                  </div> 
                  <p className="font-black text-red-600 mb-1">Motivo: {bol.palabras_clave}</p> 
                  <p className="text-sm text-slate-600">{bol.comentario_privado}</p> 
                </div> 
              ))} 
            </div> 
          )} 
          
          {resultadoRadar.boletines.some((b: any) => b.id_vendedor === miPerfil.id_usuario) ? ( 
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center"> 
              <p className="text-slate-500 font-bold text-sm">Ya has emitido un reporte sobre este usuario.</p> 
            </div> 
          ) : ( 
            <form onSubmit={boletinarUsuario} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-inner"> 
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg> ¿Tuviste problemas con este usuario?</h4> 
              <div className="flex flex-col gap-4"> 
                <div> 
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Palabras Clave (El motivo principal)</label> 
                  <input type="text" required placeholder="Ej. No pagó, Grosero, Canceló al último minuto..." value={palabrasBoletin} onChange={e => setPalabrasBoletin(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-red-400 font-medium text-sm" /> 
                </div> 
                <div> 
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Comentarios / Detalles (Opcional)</label> 
                  <textarea placeholder="Describe brevemente lo que sucedió para alertar a otros vendedores..." value={comentarioBoletin} onChange={e => setComentarioBoletin(e.target.value)} rows={3} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 outline-none focus:border-red-400 font-medium text-sm resize-none"></textarea> 
                </div> 
                <button type="submit" disabled={guardandoBoletin || !palabrasBoletin.trim()} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-md transition-all disabled:opacity-50"> 
                  {guardandoBoletin ? "Enviando Reporte..." : "Boletinar a este Comprador"} 
                </button> 
              </div> 
            </form> 
          )} 
        </div> 
      )} 
    </div>
  );
}