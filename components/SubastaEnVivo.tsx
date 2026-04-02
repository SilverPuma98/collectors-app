"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/ssr';

export default function SubastaEnVivo({ 
  subastaInicial, 
  miIdUsuario, 
  esMiPieza,
  telefonoVendedor,
  modeloCarro
}: { 
  subastaInicial: any; 
  miIdUsuario: number | string | null; 
  esMiPieza: boolean; 
  telefonoVendedor: string | null;
  modeloCarro: string;
}) {
  const [subasta, setSubasta] = useState(subastaInicial);
  const [montoPuja, setMontoPuja] = useState("");
  const [tiempoRestante, setTiempoRestante] = useState("Calculando...");
  const [activa, setActiva] = useState(subastaInicial?.estado === 'ACTIVA');
  const [cargando, setCargando] = useState(false);

  // 🏆 ESTADOS PARA EL GANADOR
  const [ganadorId, setGanadorId] = useState<any>(null);
  const [cargandoGanador, setCargandoGanador] = useState(false);
  const [buscoGanador, setBuscoGanador] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 🔍 FUNCIÓN: Busca en la base de datos la puja más alta
  const buscarGanador = async () => {
    setCargandoGanador(true);
    const { data, error } = await supabase
      .from('puja')
      .select('id_comprador')
      .eq('id_subasta', subasta.id_subasta)
      .order('monto', { ascending: false })
      .limit(1)
      .single();
      
    if (data) {
      setGanadorId(data.id_comprador);
    }
    setBuscoGanador(true);
    setCargandoGanador(false);
  };

  useEffect(() => {
    if (!subasta) return;

    // 1. EL RELOJ DE LA SUBASTA ⏱️
    const intervalo = setInterval(() => {
      const ahora = new Date().getTime();
      const cierre = new Date(subasta.fecha_cierre).getTime();
      const dif = cierre - ahora;

      if (dif <= 0) {
        setTiempoRestante("SUBASTA FINALIZADA");
        if (activa) {
          setActiva(false);
          // Actualizamos la base de datos para cerrarla oficialmente
          supabase.from('subasta').update({ estado: 'FINALIZADA' }).eq('id_subasta', subasta.id_subasta).then();
        }
        clearInterval(intervalo);
      } else {
        const d = Math.floor(dif / (1000 * 60 * 60 * 24));
        const h = Math.floor((dif % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((dif % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((dif % (1000 * 60)) / 1000);
        setTiempoRestante(`${d}d ${h}h ${m}m ${s}s`);
      }
    }, 1000);

    // 2. WEBSOCKETS: ESCUCHAR PUJAS EN TIEMPO REAL 📡
    const channel = supabase.channel(`subasta-${subasta.id_subasta}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'subasta', 
        filter: `id_subasta=eq.${subasta.id_subasta}` 
      }, (payload) => {
        setSubasta(payload.new);
        if (payload.new.estado !== 'ACTIVA') setActiva(false);
      })
      .subscribe();

    return () => { 
      clearInterval(intervalo); 
      supabase.removeChannel(channel); 
    };
  }, [subasta?.id_subasta, subasta?.fecha_cierre, supabase, activa]);

  // 3. EFECTO: Si la subasta se apaga, buscamos al ganador automáticamente
  useEffect(() => {
    if (!activa && !buscoGanador) {
       buscarGanador();
    }
  }, [activa, buscoGanador]);

  const enviarPuja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miIdUsuario) return alert("Debes iniciar sesión o crear una cuenta para participar en subastas.");
    if (esMiPieza) return alert("No puedes pujar por tu propia pieza.");

    const oferta = parseFloat(montoPuja);
    const minimoRequerido = parseFloat(subasta.precio_actual) + parseFloat(subasta.incremento_minimo);

    if (isNaN(oferta) || oferta < minimoRequerido) {
      return alert(`La puja mínima aceptada es de $${minimoRequerido}`);
    }

    setCargando(true);
    
    const { error: errorPuja } = await supabase.from('puja').insert({
      id_subasta: subasta.id_subasta,
      id_comprador: miIdUsuario,
      monto: oferta
    });

    if (!errorPuja) {
      await supabase.from('subasta').update({ precio_actual: oferta }).eq('id_subasta', subasta.id_subasta);
      setMontoPuja("");
    } else {
      alert("Error al procesar la puja: " + errorPuja.message);
    }
    setCargando(false);
  };

  if (!subasta) return null;

  const proximaPujaSugerida = parseFloat(subasta.precio_actual) + parseFloat(subasta.incremento_minimo);
  
  // 📱 Mensaje VIP para el ganador
  const mensajeWhatsApp = `¡Hola! He ganado la subasta de tu *${modeloCarro}* en Collectors por $${subasta.precio_actual.toLocaleString()}. ¡Paso a reclamar mi pieza! 🏆`;
  const enlaceWhatsApp = telefonoVendedor ? `https://wa.me/${telefonoVendedor}?text=${encodeURIComponent(mensajeWhatsApp)}` : null;

  return (
    <div className={`border-2 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden transition-colors ${activa ? 'bg-rose-50 border-rose-300 shadow-rose-200/50' : 'bg-slate-100 border-slate-300 shadow-none'}`}>
      
      {activa && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-[pulse_2s_ease-in-out_infinite]"></div>}
      
      <div className="flex justify-between items-start mb-4">
        <p className={`font-black uppercase tracking-widest text-xs px-3 py-1 rounded-full ${activa ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-white'}`}>
          {activa ? '🔨 SUBASTA EN VIVO' : '🛑 FINALIZADA'}
        </p>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Tiempo Restante</p>
          <p className={`font-black font-mono ${activa ? 'text-rose-700 text-lg' : 'text-slate-500'}`}>{tiempoRestante}</p>
        </div>
      </div>

      <div className="py-6 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 mb-6 shadow-inner">
        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Oferta Ganadora Actual</p>
        <p className={`text-5xl font-black ${activa ? 'text-slate-900' : 'text-slate-500'}`}>
          ${parseFloat(subasta.precio_actual).toLocaleString()}
        </p>
      </div>

      {activa ? (
        esMiPieza ? (
          <p className="text-sm font-bold text-rose-600 bg-rose-100 py-3 rounded-xl border border-rose-200">
            Tú eres el vendedor. Esperando ofertas... 👀
          </p>
        ) : (
          <form onSubmit={enviarPuja} className="flex flex-col gap-3 relative z-10">
            <div className="flex bg-white rounded-xl border-2 border-rose-200 overflow-hidden focus-within:border-rose-500 transition-colors shadow-sm">
              <div className="bg-rose-50 px-4 flex items-center justify-center text-rose-700 font-black border-r border-rose-200">$</div>
              <input 
                type="number" 
                required 
                min={proximaPujaSugerida}
                placeholder={`Mínimo ${proximaPujaSugerida}`} 
                value={montoPuja} 
                onChange={(e) => setMontoPuja(e.target.value)} 
                className="w-full py-3 px-4 outline-none font-black text-slate-800 text-lg" 
              />
            </div>
            <button 
              type="submit" 
              disabled={cargando || !montoPuja} 
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-rose-500/40 disabled:opacity-50"
            >
              {cargando ? "Procesando..." : "HACER PUJA"}
            </button>
            <p className="text-[10px] text-slate-500 font-medium">Incrementos mínimos de ${subasta.incremento_minimo}</p>
          </form>
        )
      ) : (
        // 🏆 EL PODIO DE PREMIACIÓN (CUANDO LA SUBASTA TERMINA)
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col items-center gap-2">
          {cargandoGanador ? (
            <p className="text-slate-500 font-bold animate-pulse">Calculando ganador...</p>
          ) : !ganadorId ? (
            <>
              <p className="text-3xl">🏜️</p>
              <p className="text-slate-700 font-black">Subasta Desierta</p>
              <p className="text-xs text-slate-500 font-medium">Nadie realizó una oferta antes de que cayera el martillo.</p>
            </>
          ) : esMiPieza ? (
            <>
              <p className="text-3xl">🏆</p>
              <p className="text-emerald-600 font-black">¡Subasta Concluida!</p>
              <p className="text-xs text-slate-500 font-medium">El ganador se pondrá en contacto contigo pronto para el pago.</p>
            </>
          ) : ganadorId === miIdUsuario ? (
            <>
              <p className="text-4xl animate-bounce">🎉</p>
              <p className="text-emerald-600 font-black text-lg">¡ERES EL GANADOR!</p>
              <p className="text-xs text-slate-500 font-medium mb-3">Tu oferta superó a todas. Reclama tu pieza ahora.</p>
              {enlaceWhatsApp ? (
                <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.48-1.459-1.653-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Reclamar por WhatsApp
                </a>
              ) : (
                <p className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-2 rounded-lg w-full">El vendedor no tiene WhatsApp registrado.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-3xl">😔</p>
              <p className="text-slate-700 font-black">Otra vez será</p>
              <p className="text-xs text-slate-500 font-medium">La subasta terminó y otro coleccionista se llevó la pieza.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}