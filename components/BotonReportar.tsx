"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BotonReportar({ idCarro, miIdUsuario }: { idCarro: number, miIdUsuario: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reportado, setReportado] = useState(false);

  const enviarReporte = async () => {
    if (!motivo) return alert("Selecciona un motivo.");
    setEnviando(true);

    const { error } = await supabase.from('reporte_carro').insert([{
      id_carro: idCarro,
      id_usuario: miIdUsuario,
      motivo: motivo
    }]);

    if (error) {
      if (error.code === '23505') {
        alert("Ya habías reportado esta publicación anteriormente.");
      } else {
        alert("Error al enviar reporte: " + error.message);
      }
    } else {
      setReportado(true);
      setIsOpen(false);
    }
    setEnviando(false);
  };

  if (reportado) {
    return <span className="text-xs text-red-400 font-bold bg-red-900/10 px-3 py-1 rounded-full border border-red-900/30">🚩 Reporte Enviado</span>;
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-red-50">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
        Reportar
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Reportar Publicación
            </h3>
            <p className="text-xs text-slate-500 mb-4">Ayúdanos a mantener la comunidad limpia. ¿Cuál es el problema con esta pieza?</p>
            
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-700 outline-none mb-4 focus:border-red-400 cursor-pointer">
              <option value="">-- Selecciona el motivo --</option>
              <option value="No es un auto / Spam">No es un auto / Spam</option>
              <option value="Contenido Ofensivo">Contenido Ofensivo o Inapropiado</option>
              <option value="Fraude / Estafa">Sospecha de Fraude / Estafa</option>
              <option value="Precio Falso / Irreal">Precio Falso / Engañoso</option>
            </select>

            <div className="flex gap-3 mt-2">
              <button onClick={() => setIsOpen(false)} className="flex-1 py-2 rounded-lg text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
              <button onClick={enviarReporte} disabled={enviando || !motivo} className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors shadow-md">
                {enviando ? "Enviando..." : "Enviar Reporte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}