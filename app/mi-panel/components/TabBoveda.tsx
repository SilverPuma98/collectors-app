"use client";

import { useState } from "react";
import Link from "next/link";
import CollectorCard from "@/components/CollectorCard";

export default function TabBoveda({ 
  misCarros, 
  abrirModalCarro, 
  eliminarCarro 
}: { 
  misCarros: any[];
  abrirModalCarro: (carro?: any) => void;
  eliminarCarro: (id: number) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [tarjetaActiva, setTarjetaActiva] = useState<number | null>(null);

  const carrosFiltrados = misCarros.filter(carro => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    
    const datosCustom = carro.carro_custom?.[0] || {};
    const nombreMarca = carro.es_custom && datosCustom.marca ? datosCustom.marca : carro.marca?.marca;
    const nombreSerie = carro.es_custom && datosCustom.serie ? datosCustom.serie : carro.serie?.serie;
    const nombreFabricante = carro.es_custom && datosCustom.fabricante ? datosCustom.fabricante : carro.fabricante?.fabricante;
    
    // 🛡️ BLINDAJE 1: Extracción segura para el buscador
    const rRaw = carro.es_custom && datosCustom.rareza ? datosCustom.rareza : carro.rareza;
    const nombreRareza = typeof rRaw === 'object' ? rRaw?.rareza : rRaw;

    return carro.modelo?.toLowerCase().includes(termino) || 
           nombreMarca?.toLowerCase().includes(termino) || 
           nombreSerie?.toLowerCase().includes(termino) || 
           nombreRareza?.toLowerCase().includes(termino) || 
           nombreFabricante?.toLowerCase().includes(termino);
  });

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input type="text" placeholder="Buscar modelo, marca, rareza..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-3 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-400 focus:bg-white shadow-inner" />
        </div>
        <button onClick={() => abrirModalCarro()} className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> Nueva Pieza
        </button>
      </div>

      {misCarros.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border border-slate-200 border-dashed rounded-2xl"><p className="text-slate-500 font-medium">Aún no hay joyas en tu bóveda.</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {carrosFiltrados.map((carro) => {
            const datosCustom = carro.carro_custom?.[0] || {};
            const nombreMarca = carro.es_custom && datosCustom.marca ? datosCustom.marca : (carro.marca?.marca || "Sin Marca");
            const nombrePres = carro.es_custom && datosCustom.presentacion ? datosCustom.presentacion : carro.presentacion?.presentacion;
            
            // 🛡️ BLINDAJE 2: Extracción segura para la tarjeta (Obligamos a que sea texto)
            const rRaw = carro.es_custom && datosCustom.rareza ? datosCustom.rareza : carro.rareza;
            const nombreRareza = typeof rRaw === 'object' ? (rRaw?.rareza || "Común") : (rRaw || "Común");
            
            return (
              <div 
                key={carro.id_carro} 
                className="relative group cursor-pointer"
                onClick={() => setTarjetaActiva(tarjetaActiva === carro.id_carro ? null : carro.id_carro)}
              >
                {carro.estado_aprobacion === 'PENDIENTE' && <div className="absolute top-2 right-2 z-20 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">REVISIÓN</div>}
                
                {carro.para_cambio && !carro.es_custom && <div className="absolute top-2 left-2 z-20 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">CAMBIO</div>}
                {carro.para_venta && !carro.es_preventa && !carro.es_subasta && <div className="absolute top-2 right-2 z-20 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">💲 EN VENTA</div>}
                
                {carro.es_preventa && <div className="absolute top-2 right-2 z-20 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-pulse">⏳ PREVENTA</div>}
                {carro.es_lote && !carro.es_custom && <div className="absolute top-2 left-2 z-20 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">📦 LOTE</div>}
                
                {carro.es_subasta && <div className="absolute top-2 right-2 z-20 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-bounce">🔨 SUBASTA</div>}
                
                <div className={`absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 rounded-2xl p-2 ${tarjetaActiva === carro.id_carro ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}>
                  <button onClick={(e) => { e.stopPropagation(); abrirModalCarro(carro); }} className="w-full max-w-[120px] bg-white text-slate-800 py-2 rounded-lg shadow-lg font-bold text-xs hover:bg-slate-200 transition-transform active:scale-95">Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); eliminarCarro(carro.id_carro); }} className="w-full max-w-[120px] bg-red-500 text-white py-2 rounded-lg shadow-lg font-bold text-xs hover:bg-red-400 transition-transform active:scale-95">Eliminar</button>
                  <Link href={`/pieza/${carro.id_carro}`} onClick={(e) => e.stopPropagation()} className="w-full max-w-[120px] bg-cyan-600 text-white py-2 rounded-lg shadow-lg font-bold text-xs text-center hover:bg-cyan-500 mt-2 transition-transform active:scale-95">Detalles</Link>
                </div>
                
                {/* Envolvemos en String() por si acaso para que React JAMÁS vuelva a quejarse */}
                <CollectorCard 
                  modelo={carro.modelo} 
                  marca={nombreMarca} 
                  rareza={String(nombreRareza)} 
                  presentacion={nombrePres}
                  valor={carro.valor} 
                  valorCalculado={carro.valor_calculado} 
                  imagenUrl={carro.imagen_url} 
                  esCustom={carro.es_custom} 
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}