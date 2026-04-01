"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { calcularNivel } from "@/lib/levelEngine";

export default function RankingPage() {
  const [cargando, setCargando] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    cargarRanking();
  }, []);

  const cargarRanking = async () => {
    // 1. Traemos a todos los usuarios
    const { data: usuarios } = await supabase.from('usuario').select('id_usuario, nombre_usuario, link_img_perf, rol');
    
    // 2. Traemos todos los carros aprobados
    const { data: carros } = await supabase.from('carro').select('id_usuario, valor_calculado, valor').eq('estado_aprobacion', 'APROBADO');
    
    // 3. Traemos todos los logros desbloqueados
    const { data: logros } = await supabase.from('usuario_logro').select('id_usuario');

    if (usuarios && carros && logros) {
      // 4. Armamos la estadística de cada usuario
      const estadisticas = usuarios.map(user => {
        // Filtramos sus autos
        const misCarros = carros.filter(c => c.id_usuario === user.id_usuario);
        const totalAutos = misCarros.length;
        
        // Sumamos el valor de su bóveda (Usamos el de la IA si existe, si no el que le puso el usuario)
        const valorBoveda = misCarros.reduce((acc, curr) => acc + (curr.valor_calculado || curr.valor || 0), 0);
        
        // Contamos sus logros
        const misLogrosCount = logros.filter(l => l.id_usuario === user.id_usuario).length;
        
        // Calculamos su nivel
        const infoNivel = calcularNivel(misLogrosCount);

        return {
          ...user,
          totalAutos,
          valorBoveda,
          misLogrosCount,
          infoNivel
        };
      });

      // 5. Ordenamos del más rico al más pobre y quitamos a los que tienen $0
      const rankingOrdenado = estadisticas
        .filter(user => user.valorBoveda > 0)
        .sort((a, b) => b.valorBoveda - a.valorBoveda);

      setRanking(rankingOrdenado);
    }
    setCargando(false);
  };

  if (cargando) return <div className="flex min-h-screen items-center justify-center text-amber-500 animate-pulse font-bold tracking-widest bg-[#050810]">CALCULANDO POSICIONES...</div>;

  return (
    <main className="min-h-screen bg-[#050810] font-sans selection:bg-amber-500/30 selection:text-amber-200 pb-20 relative overflow-hidden">
      
      {/* Luces de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 pt-12 md:pt-20 relative z-10">
        
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-bold text-sm mb-6 bg-amber-950/30 px-4 py-2 rounded-full border border-amber-900/50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver al inicio
          </Link>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 uppercase">
            Salón de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">Fama</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto font-medium">Los coleccionistas más prestigiosos de la plataforma, clasificados por el valor total de su bóveda y su nivel de experiencia.</p>
        </div>

        <div className="bg-[#0b1120] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 text-xs uppercase tracking-widest bg-slate-900/50">
                  <th className="py-4 px-6 font-black w-16 text-center">Rango</th>
                  <th className="py-4 px-6 font-black">Coleccionista</th>
                  <th className="py-4 px-6 font-black text-center">Nivel</th>
                  <th className="py-4 px-6 font-black text-center">Piezas</th>
                  <th className="py-4 px-6 font-black text-right">Valor Bóveda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {ranking.map((user, index) => {
                  const isTop3 = index < 3;
                  return (
                    <tr key={user.id_usuario} className={`hover:bg-slate-800/30 transition-colors group ${index === 0 ? 'bg-amber-900/10' : ''}`}>
                      
                      {/* POSICIÓN */}
                      <td className="py-4 px-6 text-center">
                        {index === 0 ? <span className="text-3xl drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">🥇</span> : 
                         index === 1 ? <span className="text-2xl drop-shadow-[0_0_10px_rgba(148,163,184,0.8)]">🥈</span> : 
                         index === 2 ? <span className="text-2xl drop-shadow-[0_0_10px_rgba(180,83,9,0.8)]">🥉</span> : 
                         <span className="text-lg font-black text-slate-600">#{index + 1}</span>}
                      </td>

                      {/* USUARIO */}
                      <td className="py-4 px-6">
                        <Link href={`/perfil/${user.nombre_usuario}`} className="flex items-center gap-3 w-fit group-hover:scale-105 transition-transform">
                          <div className={`w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 ${isTop3 ? 'border-amber-500' : 'border-slate-700'}`}>
                            {user.link_img_perf ? <img src={user.link_img_perf} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800"></div>}
                          </div>
                          <div>
                            <div className="font-black text-white text-lg group-hover:text-amber-400 transition-colors flex items-center gap-2">
                              {user.nombre_usuario || 'Anónimo'}
                              {user.rol === 'VENDEDOR' && <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-amber-200">PRO STORE</span>}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{user.misLogrosCount} Logros desbloqueados</div>
                          </div>
                        </Link>
                      </td>

                      {/* NIVEL (BADGE) */}
                      <td className="py-4 px-6 text-center">
                        <div className={`inline-flex items-center gap-1.5 ${user.infoNivel.bg} ${user.infoNivel.text} px-3 py-1 rounded-full border ${user.infoNivel.border} ${user.infoNivel.shadow} shadow-lg`}>
                          <span>{user.infoNivel.icon}</span>
                          <span className="text-xs font-black tracking-widest uppercase">Nvl {user.infoNivel.nivel}: {user.infoNivel.titulo}</span>
                        </div>
                      </td>

                      {/* TOTAL AUTOS */}
                      <td className="py-4 px-6 text-center">
                        <span className="text-slate-300 font-bold bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">{user.totalAutos}</span>
                      </td>

                      {/* VALOR BÓVEDA */}
                      <td className="py-4 px-6 text-right">
                        <span className={`text-xl font-black font-mono tracking-tighter ${isTop3 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'text-emerald-400'}`}>
                          ${user.valorBoveda.toLocaleString('es-MX')}
                        </span>
                      </td>

                    </tr>
                  );
                })}
                {ranking.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">Aún no hay coleccionistas en el ranking. ¡Sé el primero!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}