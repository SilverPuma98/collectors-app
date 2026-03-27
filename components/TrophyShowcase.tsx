"use client";

import Image from "next/image";

interface Trofeo {
  id_logro: number;
  nombre: string;
  descripcion: string;
  rareza_logro: "Bronce" | "Plata" | "Oro" | "Legendario";
  link_img_medalla: string;
  unlocked?: boolean; // NUEVO: Para saber si lo tiene o no
}

export default function TrophyShowcase({ trofeos }: { trofeos: Trofeo[] }) {
  const getRarezaColor = (rareza: string) => {
    switch (rareza) {
      case "Legendario": return "border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.4)] bg-purple-50";
      case "Oro": return "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)] bg-amber-50";
      case "Plata": return "border-slate-300 bg-slate-50";
      case "Bronce": return "border-orange-300 bg-orange-50";
      default: return "border-slate-200 bg-slate-50";
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
          Álbum de Logros
        </h2>
        <span className="bg-cyan-50 text-cyan-700 text-xs font-bold px-3 py-1 rounded-full border border-cyan-100">
          {trofeos.filter(t => t.unlocked).length} / {trofeos.length} Desbloqueados
        </span>
      </div>

      {trofeos.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-500 font-medium">Aún no hay trofeos en la base de datos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {trofeos.map((trofeo) => (
            <div key={trofeo.id_logro} className="relative group cursor-pointer flex flex-col items-center">
              
              {/* Medalla (Aplica escala de grises si no está desbloqueado) */}
              <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:scale-105 ${trofeo.unlocked ? getRarezaColor(trofeo.rareza_logro) : 'border-slate-200 bg-slate-100 grayscale opacity-60'}`}>
                 <Image 
                   src={trofeo.link_img_medalla || "/placeholder-medal.png"} 
                   alt={trofeo.nombre}
                   fill
                   className="object-contain p-4" 
                 />
              </div>

              {/* Textos */}
              <p className={`text-xs font-black text-center mt-3 truncate w-full ${trofeo.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{trofeo.nombre}</p>
              
              {/* Tooltip UX */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 w-48 text-center bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-3 shadow-2xl">
                <span className="block font-black text-cyan-400 mb-1">{trofeo.nombre}</span>
                <span className="text-slate-300 text-[10px] leading-tight block">{trofeo.descripcion}</span>
                {!trofeo.unlocked && <span className="block mt-2 text-[9px] text-amber-400 font-bold uppercase tracking-wider">🔒 Bloqueado</span>}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}