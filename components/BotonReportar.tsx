"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BotonReportar({ idCarro, miIdUsuario }: { idCarro: number, miIdUsuario: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [comentario, setComentario] = useState(""); // 🧠 NUEVO ESTADO PARA DETALLES
  const [enviando, setEnviando] = useState(false);
  const [reportado, setReportado] = useState(false);

  const enviarReporte = async () => {
    if (!motivo) return alert("Selecciona un motivo principal.");
    setEnviando(true);

    const { error } = await supabase.from('reporte_carro').insert([{
      id_carro: idCarro,
      id_usuario: miIdUsuario,
      motivo: motivo,
      comentario: comentario.trim() || null // 🧠 ENVIAMOS EL COMENTARIO
    }]);

    if (error) {
      if (error.code === '23505') { // Asumiendo que hay restricción de 1 reporte por usuario a un mismo carro
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
    return <span className="text-xs text-orange-400 font-bold bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/30 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg> Revisión Solicitada</span>;
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-orange-400 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:border-orange-200 hover:bg-orange-50">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        Reportar Problema
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050810]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b1120] rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full border border-orange-900/50 relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2 relative z-10">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Reportar Publicación
            </h3>
            <p className="text-sm text-slate-400 mb-6 relative z-10">Ayúdanos a mantener la bóveda global segura. Los reportes falsos o malintencionados pueden resultar en baneo de tu cuenta.</p>
            
            <div className="flex flex-col gap-5 relative z-10">
              <div>
                <label className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-2 block">Motivo Principal *</label>
                <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors cursor-pointer text-sm">
                  <option value="">-- Selecciona una infracción --</option>
                  <option value="FOTO_ROBADA">Foto falsa o robada de internet</option>
                  <option value="ESTAFA">Posible estafa / Perfil falso</option>
                  <option value="SPAM">No es un auto / Publicidad (Spam)</option>
                  <option value="OFENSIVO">Contenido u odio ofensivo</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-2 block flex justify-between">
                  <span>Detalles (Opcional)</span>
                  <span className="text-slate-500 font-medium">Ayuda a los moderadores</span>
                </label>
                <textarea 
                  placeholder="Ej: Esta foto es de un grupo de Facebook, no es de él..." 
                  value={comentario} 
                  onChange={(e) => setComentario(e.target.value)} 
                  rows={3} 
                  className="w-full bg-slate-900/80 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors placeholder:text-slate-600 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setIsOpen(false)} className="w-1/3 py-3.5 rounded-xl text-sm font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancelar</button>
                <button onClick={enviarReporte} disabled={enviando || !motivo} className="w-2/3 py-3.5 rounded-xl text-sm font-black text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                  {enviando ? "Enviando..." : "Enviar a Moderación"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}