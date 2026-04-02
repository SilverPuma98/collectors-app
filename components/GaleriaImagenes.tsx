"use client";

import { useState } from "react";

export default function GaleriaImagenes({ 
  imagenPrincipal, 
  galeria, 
  modelo, 
  children 
}: { 
  imagenPrincipal: string; 
  galeria: string[]; 
  modelo: string; 
  children?: React.ReactNode; 
}) {
  const [imgActual, setImgActual] = useState(imagenPrincipal);
  
  // Juntamos la foto principal con el resto de la galería (ignorando nulos)
  const todasLasFotos = [imagenPrincipal, ...(galeria || [])].filter(Boolean);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* FOTO GRANDE PRINCIPAL */}
      <div className="relative w-full h-[50vh] md:h-[75vh] bg-[#0b1120] rounded-3xl overflow-hidden shadow-2xl group flex items-center justify-center p-4 border border-slate-800">
        {imgActual ? (
          <img src={imgActual} alt={modelo} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 drop-shadow-2xl" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
            <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <p className="font-bold tracking-widest uppercase">Sin Fotografía</p>
          </div>
        )}
        
        {/* Aquí inyectamos las etiquetas (Lote, Preventa, etc) sobre la foto */}
        {children}
      </div>

      {/* MINIATURAS (Solo aparecen si hay más de 1 foto) */}
      {todasLasFotos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {todasLasFotos.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setImgActual(url)}
              className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${imgActual === url ? 'border-cyan-500 opacity-100 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'border-slate-700 opacity-50 hover:opacity-100 hover:border-slate-500'}`}
            >
              <img src={url} alt={`${modelo} ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}