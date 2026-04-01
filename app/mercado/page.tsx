"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CollectorCard from "@/components/CollectorCard";
import Link from "next/link";

export default function MarketplacePage() {
  const [piezas, setPiezas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [tabActiva, setTabActiva] = useState<"venta" | "cambio">("venta");
  const [busqueda, setBusqueda] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  useEffect(() => {
    cargarMercado();
  }, []);

  const cargarMercado = async () => {
    // Traemos todos los autos aprobados que estén a la venta o para cambio
    const { data } = await supabase
      .from('carro')
      .select('*, marca(marca), presentacion(presentacion), usuario(nombre_usuario, link_img_perf, rol)')
      .eq('estado_aprobacion', 'APROBADO')
      .or('para_venta.eq.true,para_cambio.eq.true')
      .order('id_carro', { ascending: false });

    if (data) setPiezas(data);
    setCargando(false);
  };

  // Lógica de Filtrado Inteligente
  const piezasFiltradas = piezas.filter((p) => {
    // 1. Filtro por Modalidad (Venta o Cambio)
    const coincideTab = tabActiva === "venta" ? p.para_venta : p.para_cambio;
    
    // 2. Filtro por Búsqueda (Modelo o Marca)
    const coincideBusqueda = 
      (p.modelo || "").toLowerCase().includes(busqueda.toLowerCase()) || 
      (p.marca?.marca || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.rareza || "").toLowerCase().includes(busqueda.toLowerCase());

    // 3. Filtro por Precio (Solo aplica si estamos en Venta)
    const min = precioMin ? parseFloat(precioMin) : 0;
    const max = precioMax ? parseFloat(precioMax) : Infinity;
    const coincidePrecio = tabActiva === "venta" ? (p.valor >= min && p.valor <= max) : true;

    return coincideTab && coincideBusqueda && coincidePrecio;
  });

  if (cargando) return <div className="flex min-h-screen items-center justify-center text-cyan-500 animate-pulse font-bold tracking-widest bg-[#050810]">CARGANDO MERCADO...</div>;

  return (
    <main className="min-h-screen bg-[#050810] font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 relative overflow-hidden">
      
      {/* Luces de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12 relative z-10">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 uppercase">
            El Gran <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">Tianguis</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto font-medium">Explora el catálogo global. Encuentra esa pieza que te falta o negocia el intercambio perfecto con otros coleccionistas.</p>
        </div>

        {/* CONTROLES Y FILTROS */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-4 md:p-6 mb-10 shadow-2xl flex flex-col gap-6">
          
          {/* Tabs Principales */}
          <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
            <button onClick={() => setTabActiva("venta")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-black text-sm transition-all ${tabActiva === "venta" ? "bg-amber-500 text-slate-900 shadow-md" : "text-slate-400 hover:text-amber-400"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              En Venta
            </button>
            <button onClick={() => setTabActiva("cambio")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-black text-sm transition-all ${tabActiva === "cambio" ? "bg-emerald-500 text-slate-900 shadow-md" : "text-slate-400 hover:text-emerald-400"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              Para Cambio
            </button>
          </div>

          {/* Barra de Búsqueda y Precios */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
              <input type="text" placeholder="Buscar modelo, marca, variante..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-11 pr-4 py-3.5 focus:border-cyan-500 outline-none transition-colors placeholder:text-slate-600" />
            </div>
            
            {tabActiva === "venta" && (
              <div className="flex gap-2 w-full lg:w-1/3 shrink-0">
                <input type="number" placeholder="Min $" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-800 text-emerald-400 font-bold rounded-xl px-4 py-3.5 focus:border-emerald-500 outline-none placeholder:text-slate-600 placeholder:font-normal text-center" />
                <div className="flex items-center text-slate-600">-</div>
                <input type="number" placeholder="Max $" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} className="w-1/2 bg-slate-950 border border-slate-800 text-emerald-400 font-bold rounded-xl px-4 py-3.5 focus:border-emerald-500 outline-none placeholder:text-slate-600 placeholder:font-normal text-center" />
              </div>
            )}
          </div>
        </div>

        {/* RESULTADOS */}
        {piezasFiltradas.length === 0 ? (
          <div className="text-center py-20 bg-[#0b1120] border border-slate-800 border-dashed rounded-3xl">
            <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-slate-400 font-bold text-lg">No encontramos piezas que coincidan con tu búsqueda.</p>
            <p className="text-slate-600 text-sm mt-1">Intenta con otros términos o ajusta los precios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {piezasFiltradas.map((p) => (
              <div key={p.id_carro} className="flex flex-col h-full group hover:-translate-y-2 transition-transform duration-300">
                <Link href={`/pieza/${p.id_carro}`} className="relative flex-1 block">
                  
                  {/* Etiqueta Visual de Venta/Cambio */}
                  {p.para_venta && <div className="absolute top-2 right-2 z-20 bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded shadow-md uppercase">En Venta</div>}
                  {!p.para_venta && p.para_cambio && <div className="absolute top-2 left-2 z-20 bg-emerald-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded shadow-md uppercase">Cambio</div>}
                  
                  <CollectorCard 
                    modelo={p.modelo} 
                    marca={p.marca?.marca || "Desconocida"} 
                    rareza={p.rareza || "Estándar"} 
                    presentacion={p.presentacion?.presentacion}
                    valor={p.valor} 
                    valorCalculado={p.valor_calculado} 
                    imagenUrl={p.imagen_url} 
                  />
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-cyan-500/50 transition-all pointer-events-none z-10"></div>
                </Link>

                {/* Info del Vendedor (Debajo de la tarjeta) */}
                <Link href={`/perfil/${p.usuario?.nombre_usuario}`} className="mt-3 flex items-center gap-2 px-1 hover:opacity-80 transition-opacity">
                  <div className={`w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700 ${p.usuario?.rol === 'VENDEDOR' ? 'ring-1 ring-amber-500' : ''}`}>
                    {p.usuario?.link_img_perf ? <img src={p.usuario.link_img_perf} className="w-full h-full object-cover"/> : <svg className="w-full h-full p-1 text-slate-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] text-slate-500 font-bold leading-none">Ofrecido por</p>
                    <p className="text-xs text-slate-300 font-black truncate group-hover:text-cyan-400 transition-colors">
                      @{p.usuario?.nombre_usuario || 'Anónimo'} {p.usuario?.rol === 'VENDEDOR' && <span className="text-amber-500 ml-0.5">✓</span>}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}