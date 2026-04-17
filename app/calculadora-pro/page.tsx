"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { calcularValorPremium } from "@/lib/premiumValuationEngine";

export default function CalculadoraProPage() {
  const [cargando, setCargando] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [resultado, setResultado] = useState<number | null>(null);

  // Catálogos
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [rarezas, setRarezas] = useState<any[]>([]);
  const [presentaciones, setPresentaciones] = useState<any[]>([]);
  const [estadosCarro, setEstadosCarro] = useState<any[]>([]);

  // Formulario
  const [modelo, setModelo] = useState("");
  const [idFabricante, setIdFabricante] = useState("");
  const [idRareza, setIdRareza] = useState("");
  const [idPresentacion, setIdPresentacion] = useState("");
  const [idEstado, setIdEstado] = useState("");
  const [anio, setAnio] = useState<string>("");

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    const [resFab, resRar, resPres, resEst] = await Promise.all([
      supabase.from('fabricante').select('*').order('fabricante', { ascending: true }),
      supabase.from('rareza').select('*').order('rareza', { ascending: true }),
      supabase.from('presentacion').select('*').order('presentacion', { ascending: true }),
      supabase.from('estado_carro').select('*').order('estado_carro', { ascending: true })
    ]);
    
    if (resFab.data) setFabricantes(resFab.data);
    if (resRar.data) setRarezas(resRar.data);
    if (resPres.data) setPresentaciones(resPres.data);
    if (resEst.data) setEstadosCarro(resEst.data);

    setCargando(false);
  };

  // ✨ MAGIA EN CASCADA: Filtramos las opciones basándonos en el fabricante seleccionado
  const rarezasFiltradas = idFabricante 
    ? rarezas.filter(r => String(r.id_fabricante) === String(idFabricante)) 
    : rarezas;

  const presentacionesFiltradas = idFabricante 
    ? presentaciones.filter(p => String(p.id_fabricante) === String(idFabricante)) 
    : presentaciones;

  const ejecutarCalculadora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelo.trim()) {
      alert("Por favor, ingresa el nombre del modelo.");
      return;
    }

    setCalculando(true);
    setResultado(null);

    try {
      // Llamamos a nuestro Motor Matemático del Servidor
      const valor = await calcularValorPremium(
        modelo,
        idFabricante ? parseInt(idFabricante) : null,
        idRareza ? parseInt(idRareza) : null,
        idPresentacion ? parseInt(idPresentacion) : null,
        anio ? parseInt(anio) : null,
        idEstado ? parseInt(idEstado) : null
      );
      
      // Simulamos un pequeño retraso para darle "emoción" a la IA
      setTimeout(() => {
        setResultado(valor);
        setCalculando(false);
      }, 800);
      
    } catch (error) {
      console.error(error);
      alert("Hubo un error al valuar la pieza.");
      setCalculando(false);
    }
  };

  if (cargando) return <div className="flex min-h-screen items-center justify-center text-amber-500 animate-pulse font-bold tracking-widest bg-[#050810]">INICIALIZANDO MOTOR PRO...</div>;

  return (
    <main className="min-h-screen bg-[#050810] font-sans selection:bg-amber-500/30 selection:text-amber-200 pb-20 relative overflow-hidden">
      
      {/* Fondos con blur para efecto premium */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 pt-12 md:pt-20 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            🌟 Acceso Exclusivo
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
            Calculadora <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">PRO</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto font-medium">Valuaciones dinámicas en tiempo real impulsadas por el mercado actual. Ingresa los datos de tu pieza para obtener su valor estimado con precisión milimétrica.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* FORMULARIO DE VALUACIÓN */}
          <div className="md:col-span-7 bg-[#0b1120] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
            <form onSubmit={ejecutarCalculadora} className="flex flex-col gap-5">
              
              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Modelo / Nombre de la Pieza *</label>
                <input 
                  type="text" required placeholder="Ej. Nissan Skyline GT-R R34" 
                  value={modelo} onChange={(e) => setModelo(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 text-white font-medium rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Fabricante</label>
                  <select 
                    value={idFabricante} 
                    onChange={(e) => {
                      setIdFabricante(e.target.value);
                      // ✨ Reseteamos los dependientes al cambiar de fabricante
                      setIdRareza("");
                      setIdPresentacion("");
                    }} 
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">-- Seleccionar --</option>
                    {fabricantes.map(f => <option key={f.id_fabricante} value={f.id_fabricante}>{f.fabricante}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Año de Edición</label>
                  <input type="number" placeholder="Ej. 2024" value={anio} onChange={(e) => setAnio(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Nivel de Rareza</label>
                  <select 
                    value={idRareza} 
                    onChange={(e) => setIdRareza(e.target.value)} 
                    disabled={!idFabricante} // ✨ Bloqueamos si no hay fabricante
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Seleccionar --</option>
                    {rarezasFiltradas.map(r => <option key={r.id_rareza} value={r.id_rareza}>{r.rareza}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Empaque</label>
                  <select 
                    value={idPresentacion} 
                    onChange={(e) => setIdPresentacion(e.target.value)} 
                    disabled={!idFabricante} // ✨ Bloqueamos si no hay fabricante
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Seleccionar --</option>
                    {presentacionesFiltradas.map(p => <option key={p.id_presentacion} value={p.id_presentacion}>{p.presentacion}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Estado Físico / Condición</label>
                <select value={idEstado} onChange={(e) => setIdEstado(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 cursor-pointer">
                  <option value="">-- Seleccionar --</option>
                  {estadosCarro.map(e => <option key={e.id_estado_carro} value={e.id_estado_carro}>{e.estado_carro}</option>)}
                </select>
              </div>

              <button type="submit" disabled={calculando} className="w-full mt-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all disabled:opacity-50 text-lg flex justify-center items-center gap-2">
                {calculando ? (
                  <><svg className="animate-spin h-5 w-5 text-slate-900" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analizando Mercado...</>
                ) : "Valuar Pieza 🤖✨"}
              </button>
            </form>
          </div>

          {/* PANEL DE RESULTADO */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl h-full flex flex-col justify-center items-center text-center relative overflow-hidden">
              
              {resultado === null && !calculando && (
                <div className="opacity-40">
                  <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-4">
                    <span className="text-4xl">📊</span>
                  </div>
                  <p className="text-slate-400 font-medium">Ingresa los datos para conocer el valor estimado de mercado.</p>
                </div>
              )}

              {calculando && (
                <div className="text-amber-500 flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                  <p className="font-bold tracking-widest text-sm animate-pulse">CONSULTANDO DATOS...</p>
                </div>
              )}

              {resultado !== null && !calculando && (
                <div className="w-full animate-in zoom-in-95 duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <p className="text-amber-500 font-black uppercase tracking-widest text-xs mb-2">Valor Estimado de Mercado</p>
                  <p className="text-6xl md:text-7xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    ${resultado.toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-sm font-medium border-t border-slate-800 pt-4 mt-4">
                    Calculado usando factores en tiempo real de rareza, demanda ({modelo}) y condición física.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}