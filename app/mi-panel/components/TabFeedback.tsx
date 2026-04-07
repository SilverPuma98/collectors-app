"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TabFeedback({ miPerfil }: { miPerfil: any }) {
  const [tipoFeedback, setTipoFeedback] = useState("IDEA");
  const [mensajeFeedback, setMensajeFeedback] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  const enviarFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeFeedback.trim()) return;
    setEnviandoFeedback(true);
    
    const payload = {
      id_usuario: miPerfil.id_usuario,
      tipo: tipoFeedback,
      mensaje: mensajeFeedback
    };

    const { error } = await supabase.from('feedback').insert([payload]);
    
    if (error) {
      alert("Error al enviar el reporte: " + error.message);
    } else {
      alert("✅ ¡Mensaje enviado al centro de mando! Gracias por tu aporte.");
      setMensajeFeedback("");
    }
    setEnviandoFeedback(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
      <h2 className="text-2xl font-black text-slate-800 mb-2">Buzón de Sugerencias y Reportes</h2>
      <p className="text-slate-500 text-sm mb-8">¿Encontraste un error? ¿Tienes una idea increíble para la plataforma? Escríbele directo a los desarrolladores.</p>
      
      <form onSubmit={enviarFeedback} className="flex flex-col gap-6 bg-indigo-50/50 p-6 md:p-8 rounded-3xl border border-indigo-100 shadow-inner">
        <div>
          <label className="text-xs text-indigo-800 font-bold uppercase tracking-wider mb-2 block">Tipo de Mensaje</label>
          <div className="grid grid-cols-3 gap-3">
            <button type="button" onClick={() => setTipoFeedback('IDEA')} className={`py-3 rounded-xl text-sm font-bold border transition-colors ${tipoFeedback === 'IDEA' ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>💡 Idea</button>
            <button type="button" onClick={() => setTipoFeedback('BUG')} className={`py-3 rounded-xl text-sm font-bold border transition-colors ${tipoFeedback === 'BUG' ? 'bg-red-100 border-red-300 text-red-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>🐛 Error/Bug</button>
            <button type="button" onClick={() => setTipoFeedback('OTRO')} className={`py-3 rounded-xl text-sm font-bold border transition-colors ${tipoFeedback === 'OTRO' ? 'bg-cyan-100 border-cyan-300 text-cyan-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>💬 Otro</button>
          </div>
        </div>
        <div>
          <label className="text-xs text-indigo-800 font-bold uppercase tracking-wider mb-2 block">Tu Mensaje</label>
          <textarea required placeholder="Describe tu idea o el problema que encontraste..." value={mensajeFeedback} onChange={(e) => setMensajeFeedback(e.target.value)} rows={5} className="w-full bg-white border border-indigo-200 text-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors shadow-sm resize-none"></textarea>
        </div>
        <button type="submit" disabled={enviandoFeedback || !mensajeFeedback.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg transition-all text-lg mt-2 disabled:opacity-50">
          {enviandoFeedback ? "Enviando señal..." : "Enviar al Centro de Mando"}
        </button>
      </form>
    </div>
  );
}