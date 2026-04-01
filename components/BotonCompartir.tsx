// components/BotonCompartir.tsx
"use client";

import { useState } from "react";

export default function BotonCompartir({ titulo, texto, url }: { titulo: string, texto: string, url: string }) {
  const [copiado, setCopiado] = useState(false);

  const manejarCompartir = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: titulo,
          text: texto,
          url: url,
        });
      } catch (error) {
        console.log("Error compartiendo:", error);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <button 
      onClick={manejarCompartir} 
      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
    >
      {copiado ? (
        <>
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ¡Enlace Copiado!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
          Compartir Pieza
        </>
      )}
    </button>
  );
}