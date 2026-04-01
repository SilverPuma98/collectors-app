"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BannerCookies() {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Revisamos si el usuario ya aceptó las cookies antes
    const cookiesAceptadas = localStorage.getItem("collectors_cookies_aceptadas");
    if (!cookiesAceptadas) {
      // Le damos un pequeño retraso de 1 segundo para que la página cargue primero
      setTimeout(() => setMostrar(true), 1000);
    }
  }, []);

  const aceptarCookies = () => {
    localStorage.setItem("collectors_cookies_aceptadas", "true");
    setMostrar(false);
  };

  if (!mostrar) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] p-4 md:p-6 animate-in slide-in-from-bottom-10 duration-500 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-[#0b1120]/95 backdrop-blur-xl border border-cyan-900/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">
        
        <div className="flex items-start md:items-center gap-4">
          <div className="text-3xl hidden sm:block">🍪</div>
          <div>
            <h4 className="text-white font-bold text-sm mb-1">Usamos cookies para mejorar tu bóveda</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Collectors utiliza cookies técnicas esenciales para mantener tu sesión iniciada de forma segura y garantizar el funcionamiento de la plataforma. 
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <Link href="/privacidad" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap">
            Leer Políticas
          </Link>
          <button 
            onClick={aceptarCookies} 
            className="flex-1 md:flex-none bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black px-6 py-2.5 rounded-xl transition-all shadow-md uppercase tracking-wider"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}