import React from 'react';
import { 
  FaCar, FaMoneyBillWave, FaTrophy, FaWrench, FaGlobe, FaStar, FaInfinity, 
  FaMoon, FaGem, FaTachometerAlt, FaFire, FaBox, FaTools, FaCrown, FaGhost, 
  FaClock, FaHandshake, FaStore, FaMedal, FaCarCrash, FaBolt 
} from 'react-icons/fa';
import { GiRaceCar, GiSteeringWheel, GiCarKey, GiCheckeredFlag } from 'react-icons/gi';

interface TrophyShowcaseProps {
  trofeos: any[];
}

export default function TrophyShowcase({ trofeos }: TrophyShowcaseProps) {
  const getRarezaStyles = (rareza: string) => {
    switch (rareza?.toLowerCase()) {
      case "mítico": return "border-cyan-400 bg-cyan-900/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]";
      case "legendario": return "border-purple-500 bg-purple-900/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]";
      case "oro": return "border-amber-400 bg-amber-900/20 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]";
      case "plata": return "border-slate-300 bg-slate-800 text-slate-300";
      case "bronce": return "border-orange-500 bg-orange-900/20 text-orange-500";
      default: return "border-slate-700 bg-slate-800 text-slate-500";
    }
  };

  const getIconForAchievement = (logro: any) => {
    const code = logro.codigo_regla || '';

    // =========================================================
    // 1. ASIGNACIONES EXACTAS (Para logros muy específicos)
    // =========================================================
    // 🧠 SOLUCIÓN: Cambiamos JSX.Element por React.ReactNode
    const iconMap: Record<string, React.ReactNode> = {
      'CREADOR_SUPREMO': <FaInfinity className="w-8 h-8" />,
      'CAZADOR_NOCTURNO': <FaGhost className="w-8 h-8" />, // Un fantasma
      'EARLY_BIRD': <FaClock className="w-8 h-8" />, // Un reloj
      'CENA_POLLO': <FaCrown className="w-8 h-8" />, // Una corona
      'LA_VUELTA_MUNDO': <FaGlobe className="w-8 h-8" />,
      'PRIMER_REGISTRO': <GiCarKey className="w-8 h-8" />, // Llaves de auto
      'DIVERSIDAD_5': <GiCheckeredFlag className="w-8 h-8" />,
      'DIVERSIDAD_10': <GiCheckeredFlag className="w-8 h-8" />,
    };

    if (iconMap[code]) return iconMap[code];

    // =========================================================
    // 2. ASIGNACIONES POR FAMILIA (Para no escribir los 115)
    // =========================================================
    
    // Marcas Específicas
    if (code.includes('HW_')) return <FaFire className="w-8 h-8" />; // Fuego para Hot Wheels
    if (code.includes('MBX_')) return <FaBox className="w-8 h-8" />; // Caja para Matchbox
    if (code.includes('M2_') || code.includes('GL_')) return <FaTools className="w-8 h-8" />; // Herramientas
    if (code.includes('FERRARI_') || code.includes('PORSCHE_') || code.includes('LAMBO_')) return <GiSteeringWheel className="w-8 h-8" />; // Volante
    
    // Estilos de Auto
    if (code.includes('JDM_') || code.includes('MGT_')) return <FaTachometerAlt className="w-8 h-8" />; // Velocímetro
    if (code.includes('MUSCLE_')) return <FaBolt className="w-8 h-8" />; // Rayo de potencia
    if (code.includes('EURO_')) return <GiRaceCar className="w-8 h-8" />; 

    // Comercio y Dinero
    if (code.includes('VALOR_') || code.includes('TOP_')) return <FaMoneyBillWave className="w-8 h-8" />;
    if (code.includes('VENTA_')) return <FaStore className="w-8 h-8" />; // Tienda
    if (code.includes('CAMBIO_')) return <FaHandshake className="w-8 h-8" />; // Apretón de manos
    
    // Rarezas y Estados
    if (code.includes('STH_') || code.includes('CHASE_')) return <FaGem className="w-8 h-8" />; // Diamante
    if (code.includes('TH_')) return <FaStar className="w-8 h-8" />;
    if (code.includes('RLC_') || code.includes('PREMIUM_')) return <FaCrown className="w-8 h-8" />;
    if (code.includes('MINT_') || code.includes('EXHIBICION_')) return <FaStar className="w-8 h-8" />;
    if (code.includes('LOOSE_')) return <FaCarCrash className="w-8 h-8" />; // Auto chocando/jugado
    if (code.includes('JUNK_')) return <FaWrench className="w-8 h-8" />; // Llave inglesa

    // Décadas
    if (code.includes('D70S_') || code.includes('D80S_') || code.includes('D90S_') || code.includes('D00S_')) return <FaClock className="w-8 h-8" />;

    // Cantidad de carros
    if (code.includes('CARROS_')) {
      if (logro.rareza_logro === 'Oro' || logro.rareza_logro === 'Legendario') return <FaTrophy className="w-8 h-8" />; // Trofeo a los más altos
      return <FaCar className="w-8 h-8" />; // Carrito normal a los bajos
    }

    // Comodín si no cae en ninguna categoría
    return <FaMedal className="w-8 h-8" />;
  };

  const ganados = trofeos.filter(t => t.unlocked);
  const bloqueados = trofeos.filter(t => !t.unlocked);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
            Álbum de Logros
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Completa los retos para desbloquear medallas exclusivas.</p>
        </div>
        <div className="bg-cyan-50 border border-cyan-200 text-cyan-700 font-bold px-4 py-2 rounded-xl text-sm shadow-sm">
          {ganados.length} / {trofeos.length} Desbloqueados
        </div>
      </div>

      {ganados.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <p className="text-slate-500 font-bold">Aún no has desbloqueado ningún logro.</p>
          <p className="text-xs text-slate-400 mt-1">Sube tus primeras piezas a la bóveda para empezar.</p>
        </div>
      ) : (
        <div className="mb-10">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Logros Obtenidos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {ganados.map(logro => (
              <div key={logro.id_logro} className="flex flex-col items-center text-center group cursor-help">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${getRarezaStyles(logro.rareza_logro)}`}>
                  {getIconForAchievement(logro)}
                </div>
                <h4 className="text-xs font-black text-slate-800 leading-tight mb-1">{logro.nombre}</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">{logro.descripcion}</p>
                <span className={`text-[8px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full border ${getRarezaStyles(logro.rareza_logro).split(' ')[0]} ${getRarezaStyles(logro.rareza_logro).split(' ')[2]}`}>
                  {logro.rareza_logro}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bloqueados.length > 0 && (
        <div className="pt-8 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Logros Bloqueados</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {bloqueados.map(logro => (
              <div key={logro.id_logro} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 bg-slate-50 flex items-center justify-center mb-3 text-slate-300">
                  {getIconForAchievement(logro)}
                </div>
                <h4 className="text-[11px] font-black text-slate-600 leading-tight mb-1">{logro.nombre}</h4>
                <p className="text-[9px] text-slate-400 font-medium leading-tight">{logro.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}