"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TabMotorIA() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [rarezas, setRarezas] = useState<any[]>([]);
  const [presentaciones, setPresentaciones] = useState<any[]>([]);
  const [condiciones, setCondiciones] = useState<any[]>([]);
  const [hype, setHype] = useState<any[]>([]);
  
  // Configuraciones Globales
  const [apreciacion, setApreciacion] = useState("0.08");
  const [multAlta, setMultAlta] = useState("1.4");
  const [multMedia, setMultMedia] = useState("1.2");
  const [multBaja, setMultBaja] = useState("0.8");

  // Estados Formularios Nuevos
  const [nuevaRareza, setNuevaRareza] = useState({ id_fab: "", rareza: "", mult: "1.0" });
  const [nuevaPres, setNuevaPres] = useState({ id_fab: "", presentacion: "", precio: "40" });
  const [nuevaCond, setNuevaCond] = useState({ estado: "", mult: "1.0" });
  const [nuevoHype, setNuevoHype] = useState({ palabra: "", nivel: "ALTA" }); // Ya no pide multiplicador

  useEffect(() => {
    cargarParametros();
  }, []);

  const cargarParametros = async () => {
    const [resFab, resRar, resPres, resCond, resHype, resConf] = await Promise.all([
      supabase.from('fabricante').select('id_fabricante, fabricante').order('fabricante', { ascending: true }),
      supabase.from('rareza').select('id_rareza, rareza, multiplicador_rareza, id_fabricante').order('multiplicador_rareza', { ascending: false }),
      supabase.from('presentacion').select('id_presentacion, presentacion, precio_base, id_fabricante').order('precio_base', { ascending: false }),
      supabase.from('estado_carro').select('id_estado_carro, estado_carro, multiplicador_estado').order('multiplicador_estado', { ascending: false }),
      supabase.from('hype_keywords').select('*').order('nivel_demanda', { ascending: true }),
      supabase.from('configuracion').select('*')
    ]);

    if (resFab.data) setFabricantes(resFab.data);
    if (resRar.data) setRarezas(resRar.data);
    if (resPres.data) setPresentaciones(resPres.data);
    if (resCond.data) setCondiciones(resCond.data);
    if (resHype.data) setHype(resHype.data);
    
    if (resConf.data) {
      const conf = resConf.data;
      setApreciacion(conf.find(c => c.clave === 'apreciacion_anual')?.valor || "0.08");
      setMultAlta(conf.find(c => c.clave === 'demanda_alta')?.valor || "1.4");
      setMultMedia(conf.find(c => c.clave === 'demanda_media')?.valor || "1.2");
      setMultBaja(conf.find(c => c.clave === 'demanda_baja')?.valor || "0.8");
    }
    
    setCargando(false);
  };

  const guardarCambiosMasivos = async () => {
    setGuardando(true);
    try {
      // Guardar Globales
      await Promise.all([
        supabase.from('configuracion').update({ valor: parseFloat(apreciacion) || 0.08 }).eq('clave', 'apreciacion_anual'),
        supabase.from('configuracion').update({ valor: parseFloat(multAlta) || 1.4 }).eq('clave', 'demanda_alta'),
        supabase.from('configuracion').update({ valor: parseFloat(multMedia) || 1.2 }).eq('clave', 'demanda_media'),
        supabase.from('configuracion').update({ valor: parseFloat(multBaja) || 0.8 }).eq('clave', 'demanda_baja')
      ]);

      // Guardar Catálogos
      for (const r of rarezas) await supabase.from('rareza').update({ multiplicador_rareza: parseFloat(r.multiplicador_rareza) || 1 }).eq('id_rareza', r.id_rareza);
      for (const p of presentaciones) await supabase.from('presentacion').update({ precio_base: parseFloat(p.precio_base) || 40 }).eq('id_presentacion', p.id_presentacion);
      for (const c of condiciones) await supabase.from('estado_carro').update({ multiplicador_estado: parseFloat(c.multiplicador_estado) || 1 }).eq('id_estado_carro', c.id_estado_carro);
      
      alert("✅ Parámetros guardados y actualizados en toda la plataforma.");
    } catch (error) { alert("❌ Error al guardar."); }
    setGuardando(false);
  };

  // ================== FUNCIONES DE AGREGAR ==================
  const agregarRareza = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('rareza').insert([{ id_fabricante: parseInt(nuevaRareza.id_fab), rareza: nuevaRareza.rareza, multiplicador_rareza: parseFloat(nuevaRareza.mult) }]);
    setNuevaRareza({ id_fab: "", rareza: "", mult: "1.0" }); cargarParametros();
  };

  const agregarPresentacion = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('presentacion').insert([{ id_fabricante: parseInt(nuevaPres.id_fab), presentacion: nuevaPres.presentacion, precio_base: parseFloat(nuevaPres.precio) }]);
    setNuevaPres({ id_fab: "", presentacion: "", precio: "40" }); cargarParametros();
  };

  const agregarCondicion = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('estado_carro').insert([{ estado_carro: nuevaCond.estado, multiplicador_estado: parseFloat(nuevaCond.mult) }]);
    setNuevaCond({ estado: "", mult: "1.0" }); cargarParametros();
  };

  const agregarHype = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('hype_keywords').insert([{ palabra_clave: nuevoHype.palabra.toLowerCase().trim(), nivel_demanda: nuevoHype.nivel }]);
    setNuevoHype({ palabra: "", nivel: "ALTA" }); cargarParametros();
  };

  // ================== FUNCIONES DE ELIMINAR ==================
  const eliminarReg = async (tabla: string, columnaId: string, id: number) => {
    if(!window.confirm("¿Seguro que deseas eliminar este registro?")) return;
    await supabase.from(tabla).delete().eq(columnaId, id);
    cargarParametros();
  };

  if (cargando) return <div className="p-10 text-center animate-pulse font-bold text-amber-500">Cargando Motor IA...</div>;

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* HEADER STICKY */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mb-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden sticky top-4 z-40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h2 className="text-2xl font-black text-amber-400 mb-2 flex items-center gap-2">🧠 Motor de Valuación IA</h2>
          <p className="text-slate-400 text-sm">Ajusta los multiplicadores y la Calculadora PRO se actualizará al instante para todos los usuarios.</p>
        </div>
        <div className="flex shrink-0">
          <button onClick={guardarCambiosMasivos} disabled={guardando} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-8 py-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50">
            {guardando ? "Guardando..." : "💾 Guardar Todos los Ajustes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 0. CONFIGURACIONES GLOBALES (NUEVO) */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">🌍 Parámetros Globales</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Apreciación Anual (r)</span>
              <div className="flex items-center gap-1">
                <input type="number" step="0.01" value={apreciacion} onChange={(e) => setApreciacion(e.target.value)} className="w-20 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-center font-black text-slate-800 outline-none focus:border-amber-500" />
              </div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">🔥 Demanda Alta (x)</span>
              <div className="flex items-center gap-1">
                <input type="number" step="0.1" value={multAlta} onChange={(e) => setMultAlta(e.target.value)} className="w-20 bg-white border border-rose-300 rounded px-2 py-1 text-center font-black text-rose-700 outline-none focus:border-rose-500" />
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">📈 Demanda Media (x)</span>
              <div className="flex items-center gap-1">
                <input type="number" step="0.1" value={multMedia} onChange={(e) => setMultMedia(e.target.value)} className="w-20 bg-white border border-amber-300 rounded px-2 py-1 text-center font-black text-amber-700 outline-none focus:border-amber-500" />
              </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">📉 Demanda Baja (x)</span>
              <div className="flex items-center gap-1">
                <input type="number" step="0.1" value={multBaja} onChange={(e) => setMultBaja(e.target.value)} className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-center font-black text-slate-700 outline-none focus:border-slate-500" />
              </div>
            </div>

          </div>
        </div>
        
        {/* 1. RAREZAS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">💎 Multiplicador de Rareza (x)</h3>
          
          <form onSubmit={agregarRareza} className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <select required value={nuevaRareza.id_fab} onChange={e => setNuevaRareza({...nuevaRareza, id_fab: e.target.value})} className="w-1/3 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none">
              <option value="">Fabricante...</option>{fabricantes.map(f => <option key={f.id_fabricante} value={f.id_fabricante}>{f.fabricante}</option>)}
            </select>
            <input type="text" required placeholder="Rareza" value={nuevaRareza.rareza} onChange={e => setNuevaRareza({...nuevaRareza, rareza: e.target.value})} className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none" />
            <input type="number" step="0.1" required value={nuevaRareza.mult} onChange={e => setNuevaRareza({...nuevaRareza, mult: e.target.value})} className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none text-center text-amber-600 font-bold" />
            <button type="submit" className="bg-cyan-600 text-white px-3 py-1 rounded-lg text-xs font-bold">+</button>
          </form>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
            {rarezas.map((r, idx) => (
              <div key={r.id_rareza} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="flex flex-col truncate pr-2">
                  <span className="text-xs font-bold text-slate-700">{r.rareza}</span>
                  <span className="text-[9px] text-slate-400 uppercase">{fabricantes.find(f => f.id_fabricante === r.id_fabricante)?.fabricante}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 text-xs font-bold">x</span>
                  <input type="number" step="0.1" value={r.multiplicador_rareza} onChange={(e) => { const copia = [...rarezas]; copia[idx].multiplicador_rareza = e.target.value; setRarezas(copia); }} className="w-16 bg-white border border-slate-300 rounded-md px-1 text-center text-xs font-black text-amber-600 outline-none focus:border-amber-500" />
                  <button onClick={() => eliminarReg('rareza', 'id_rareza', r.id_rareza)} className="text-red-400 hover:text-red-600 font-bold text-xs p-1">✖</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. PRESENTACIONES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">📦 Precio Base Empaque ($)</h3>
          
          <form onSubmit={agregarPresentacion} className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <select required value={nuevaPres.id_fab} onChange={e => setNuevaPres({...nuevaPres, id_fab: e.target.value})} className="w-1/3 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none">
              <option value="">Fabricante...</option>{fabricantes.map(f => <option key={f.id_fabricante} value={f.id_fabricante}>{f.fabricante}</option>)}
            </select>
            <input type="text" required placeholder="Empaque" value={nuevaPres.presentacion} onChange={e => setNuevaPres({...nuevaPres, presentacion: e.target.value})} className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none" />
            <input type="number" step="1" required value={nuevaPres.precio} onChange={e => setNuevaPres({...nuevaPres, precio: e.target.value})} className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none text-center text-emerald-600 font-bold" />
            <button type="submit" className="bg-cyan-600 text-white px-3 py-1 rounded-lg text-xs font-bold">+</button>
          </form>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
            {presentaciones.map((p, idx) => (
              <div key={p.id_presentacion} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="flex flex-col truncate pr-2">
                  <span className="text-xs font-bold text-slate-700">{p.presentacion}</span>
                  <span className="text-[9px] text-slate-400 uppercase">{fabricantes.find(f => f.id_fabricante === p.id_fabricante)?.fabricante}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 text-xs font-bold">$</span>
                  <input type="number" step="1" value={p.precio_base} onChange={(e) => { const copia = [...presentaciones]; copia[idx].precio_base = e.target.value; setPresentaciones(copia); }} className="w-16 bg-white border border-slate-300 rounded-md px-1 text-center text-xs font-black text-emerald-600 outline-none focus:border-emerald-500" />
                  <button onClick={() => eliminarReg('presentacion', 'id_presentacion', p.id_presentacion)} className="text-red-400 hover:text-red-600 font-bold text-xs p-1">✖</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CONDICIONES / ESTADOS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">🛠️ Factor Condición Físico (x)</h3>
          
          <form onSubmit={agregarCondicion} className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input type="text" required placeholder="Estado (Ej. Loose)" value={nuevaCond.estado} onChange={e => setNuevaCond({...nuevaCond, estado: e.target.value})} className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none" />
            <input type="number" step="0.1" required value={nuevaCond.mult} onChange={e => setNuevaCond({...nuevaCond, mult: e.target.value})} className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none text-center text-amber-600 font-bold" />
            <button type="submit" className="bg-cyan-600 text-white px-3 py-1 rounded-lg text-xs font-bold">+</button>
          </form>

          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
            {condiciones.map((c, idx) => (
              <div key={c.id_estado_carro} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700 truncate pr-2">{c.estado_carro}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400 text-xs font-bold">x</span>
                  <input type="number" step="0.1" value={c.multiplicador_estado} onChange={(e) => { const copia = [...condiciones]; copia[idx].multiplicador_estado = e.target.value; setCondiciones(copia); }} className="w-16 bg-white border border-slate-300 rounded-md px-1 text-center text-xs font-black text-amber-600 outline-none focus:border-amber-500" />
                  <button onClick={() => eliminarReg('estado_carro', 'id_estado_carro', c.id_estado_carro)} className="text-red-400 hover:text-red-600 font-bold text-xs p-1">✖</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. DEMANDA / ETIQUETAS DE HYPE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">🏷️ Asignación de Demanda</h3>
          <p className="text-xs text-slate-500 mb-4">Clasifica palabras clave en niveles. El algoritmo usará el multiplicador global que definiste arriba según la caja a la que pertenezcan.</p>
          
          <form onSubmit={agregarHype} className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input type="text" required placeholder="Palabra (Ej. skyline, bugatti...)" value={nuevoHype.palabra} onChange={e => setNuevoHype({...nuevoHype, palabra: e.target.value})} className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none" />
            <select value={nuevoHype.nivel} onChange={e => setNuevoHype({...nuevoHype, nivel: e.target.value})} className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none font-bold">
              <option value="ALTA">Alta 🔥</option><option value="MEDIA">Media 📈</option><option value="BAJA">Baja 📉</option>
            </select>
            <button type="submit" className="bg-cyan-600 text-white px-3 py-1 rounded-lg text-xs font-bold">+</button>
          </form>

          <div className="max-h-[300px] overflow-y-auto pr-2 flex flex-wrap gap-2">
            {hype.map(h => (
              <div key={h.id_hype} className={`border rounded-lg px-2 py-1 flex items-center gap-2 text-xs group ${h.nivel_demanda === 'ALTA' ? 'bg-rose-50 border-rose-200' : h.nivel_demanda === 'MEDIA' ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'}`}>
                <span className={`font-bold ${h.nivel_demanda === 'ALTA' ? 'text-rose-700' : h.nivel_demanda === 'MEDIA' ? 'text-amber-700' : 'text-slate-600'}`}>
                  {h.palabra_clave}
                </span>
                <span className="text-[9px] opacity-60 font-black">{h.nivel_demanda}</span>
                <button onClick={() => eliminarReg('hype_keywords', 'id_hype', h.id_hype)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}