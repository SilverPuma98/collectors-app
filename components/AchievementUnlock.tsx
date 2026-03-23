"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Props {
  logros: string[];
  onClose: () => void;
}

export default function AchievementUnlock({ logros, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeño delay para la animación de entrada
    setTimeout(() => setVisible(true), 100);

    // Auto-ocultar después de 6 segundos
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500); // Espera a que termine la animación para desmontar
    }, 6000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95 pointer-events-none'}`}>
      <div className="bg-slate-900 border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)] rounded-2xl p-4 flex items-center gap-4 overflow-hidden relative min-w-[320px]">
        
        {/* Efecto de brillo de fondo */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-amber-500/10 to-transparent animate-pulse pointer-events-none"></div>

        {/* Icono del trofeo */}
        <div className="relative w-14 h-14 bg-slate-950 rounded-full border border-amber-500 flex items-center justify-center flex-shrink-0 z-10">
          <span className="text-2xl">🏆</span>
        </div>

        {/* Textos */}
        <div className="flex flex-col z-10">
          <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">¡Logro Desbloqueado!</span>
          {logros.map((nombre, index) => (
            <span key={index} className="text-white font-bold text-lg leading-tight">{nombre}</span>
          ))}
        </div>

        {/* Botón cerrar manual */}
        <button onClick={() => setVisible(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors z-20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
}