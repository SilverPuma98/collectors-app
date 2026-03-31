import React from 'react';

interface CollectorCardProps {
  modelo: string;
  marca: string;
  rareza: string;
  presentacion?: string; // 📦 NUEVO: Recibe la presentación
  valor: number;
  valorCalculado?: number; // 🧠 Recibe el valor de la IA
  imagenUrl?: string;
}

export default function CollectorCard({ modelo, marca, rareza, presentacion, valor, valorCalculado, imagenUrl }: CollectorCardProps) {
  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-cyan-800 transition-colors w-full flex flex-col h-full">
      
      {/* FOTO DE LA PIEZA */}
      <div className="relative w-full aspect-[4/3] bg-white flex items-center justify-center p-2">
        {imagenUrl ? (
          <img src={imagenUrl} alt={modelo} className="w-full h-full object-contain drop-shadow-md" />
        ) : (
          <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        )}
      </div>
      
      {/* TEXTOS Y DATOS */}
      <div className="p-3 md:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <p className="text-[9px] md:text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1 truncate">{marca}</p>
          <h3 className="text-xs md:text-sm font-black text-white leading-tight line-clamp-2">{modelo}</h3>
        </div>
        
        {/* PIE DE TARJETA: RAREZA, PRESENTACIÓN Y PRECIOS */}
        <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-800/50 gap-2">
          
          <div className="flex flex-col gap-1 w-[55%]">
            {/* 📦 ETIQUETA DE PRESENTACIÓN (Se oculta si es el individual normal) */}
            {presentacion && presentacion !== "Individual Básico" && presentacion !== "" && (
               <span className="text-[8px] md:text-[9px] font-bold bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 px-1.5 py-0.5 rounded w-max max-w-full truncate shadow-sm">
                 📦 {presentacion}
               </span>
            )}
            <span className="text-[9px] md:text-[10px] font-medium bg-slate-800 text-slate-300 px-2 py-1 rounded-md w-max max-w-full truncate">
              {rareza}
            </span>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {/* Valor del Dueño (Blanco) */}
            <span className="text-white font-bold text-xs md:text-sm leading-none">
              ${valor ? valor.toLocaleString() : '0'}
            </span>
            
            {/* Valor IA (Dorado) - Solo si existe y es mayor a 0 */}
            {(valorCalculado !== undefined && valorCalculado > 0) && (
              <span className="text-amber-400 font-black text-[9px] md:text-[10px] leading-none flex items-center gap-1 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                IA: ${valorCalculado.toLocaleString()}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}