"use client";

import Image from "next/image";

// Esta interfaz mapea nuestra tabla public.logro
interface Trofeo {
  id_logro: number;
  nombre: string;
  descripcion: string;
  rareza_logro: "Bronce" | "Plata" | "Oro" | "Legendario";
  link_img_medalla: string;
}

export default function TrophyShowcase({ trofeos }: { trofeos: Trofeo[] }) {
  // Colores dinámicos basados en la rareza (Gamificación visual)
  const getRarezaColor = (rareza: string) => {
    switch (rareza) {
      case "Legendario": return "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]";
      case "Oro": return "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]";
      case "Plata": return "border-slate-300";
      case "Bronce": return "border-orange-800";
      default: return "border-slate-700";
    }
  };

  return (
    <div className="w-full bg-[#0b1120] border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-wide">
          Vitrina de Trofeos <span className="text-cyan-500">({trofeos.length})</span>
        </h2>
      </div>

      {trofeos.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">
          <p className="text-slate-500">Aún no hay trofeos desbloqueados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {trofeos.map((trofeo) => (
            <div key={trofeo.id_logro} className="relative group cursor-pointer flex flex-col items-center">
              
              {/* Medalla */}
              <div className={`w-20 h-20 rounded-full border-2 bg-slate-900 flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-110 ${getRarezaColor(trofeo.rareza_logro)}`}>
                 <Image 
                   src={trofeo.link_img_medalla || "/placeholder-medal.png"} 
                   alt={trofeo.nombre}
                   fill
                   className="object-cover p-2" 
                 />
              </div>

              {/* Tooltip UX (Aparece al hacer hover) */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 w-48 text-center bg-slate-950 border border-slate-700 text-white text-xs rounded-lg p-3 shadow-xl">
                <span className="block font-bold text-cyan-400 mb-1">{trofeo.nombre}</span>
                <span className="text-slate-300 text-[10px] leading-tight block">{trofeo.descripcion}</span>
                {/* Triangulito del tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}