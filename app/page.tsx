"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CollectorCard from "@/components/CollectorCard";
import Link from "next/link";

export default function HomeFeed() {
  const [cargando, setCargando] = useState(true);
  const [miIdUsuario, setMiIdUsuario] = useState<number | null>(null);
  
  const [feedUnificado, setFeedUnificado] = useState<any[]>([]);
  const [tiendasLocales, setTiendasLocales] = useState<any[]>([]); 

  const [query, setQuery] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<any[]>([]);
  const [autosEncontrados, setAutosEncontrados] = useState<any[]>([]);

  useEffect(() => {
    cargarFeed();
  }, []);

  const cargarFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let listaSeguidos: number[] = [];
    let miId = null;
    let idsTiendasLocales: number[] = [];

    if (user) {
      const { data: perfil } = await supabase.from('usuario').select('*').eq('correo', user.email).single();
      if (perfil) {
        miId = perfil.id_usuario;
        setMiIdUsuario(miId);
        
        const { data: follows } = await supabase.from('seguidor').select('seguido_id').eq('seguidor_id', miId);
        if (follows) {
          listaSeguidos = follows.map(f => f.seguido_id);
        }

        if (perfil.id_mun) {
          const { data: tiendas } = await supabase
            .from('usuario')
            .select('id_usuario, nombre_usuario, link_img_perf, rol')
            .eq('rol', 'VENDEDOR')
            .eq('id_mun', perfil.id_mun)
            .neq('id_usuario', miId)
            .limit(10);
          
          if (tiendas) {
            setTiendasLocales(tiendas);
            idsTiendasLocales = tiendas.map(t => t.id_usuario);
          }
        }
      }
    }

    const { data: coches } = await supabase
      .from('carro')
      .select(`*, marca(marca), serie(serie), presentacion(presentacion), usuario:id_usuario (nombre_usuario, link_img_perf, rol)`)
      .eq('estado_aprobacion', 'APROBADO')
      .order('id_carro', { ascending: false })
      .limit(100);

    if (coches) {
      const amigos: any[] = [];
      const ventasLocales: any[] = [];
      const comunidad: any[] = [];

      // 🧠 CLASIFICAMOS LOS AUTOS
      coches.forEach(carro => {
        if (carro.id_usuario === miId) return; // No mostrar mis propios autos en el feed
        
        if (listaSeguidos.includes(carro.id_usuario)) {
          amigos.push(carro);
        } else if (idsTiendasLocales.includes(carro.id_usuario) && carro.para_venta) {
          ventasLocales.push(carro);
        } else {
          comunidad.push(carro);
        }
      });

      // 🧠 ALGORITMO DE MEZCLA (Intercalamos Amigos con Ventas Locales)
      let feedConstruido: any[] = [];
      let i = 0, j = 0;
      
      while(i < amigos.length || j < ventasLocales.length) {
        if (i < amigos.length) feedConstruido.push(amigos[i++]);
        if (i < amigos.length) feedConstruido.push(amigos[i++]); // Ponemos 2 de amigos
        
        if (j < ventasLocales.length) {
          let venta = ventasLocales[j++];
          venta.isGolden = true; // 🌟 MARCADOR PARA BORDES DORADOS
          feedConstruido.push(venta);
        }
      }
      
      // Rellenamos el final con piezas del resto de la comunidad
      feedConstruido = [...feedConstruido, ...comunidad];
      setFeedUnificado(feedConstruido);
    }
    setCargando(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 1) {
        realizarBusqueda(query.trim());
      } else {
        setUsuariosEncontrados([]);
        setAutosEncontrados([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const realizarBusqueda = async (texto: string) => {
    setBuscando(true);
    const resUsu = await supabase.from('usuario').select('id_usuario, nombre_usuario, link_img_perf, rol').ilike('nombre_usuario', `%${texto}%`).limit(10);
    if (resUsu.data) setUsuariosEncontrados(resUsu.data);

    const resCar = await supabase.from('carro').select(`*, marca(marca), serie(serie), presentacion(presentacion), usuario:id_usuario (nombre_usuario, link_img_perf)`).eq('estado_aprobacion', 'APROBADO').or(`modelo.ilike.%${texto}%,rareza.ilike.%${texto}%`).limit(20);
    if (resCar.data) setAutosEncontrados(resCar.data);
    setBuscando(false);
  };

  if (cargando) return <div className="flex min-h-screen items-center justify-center text-cyan-500 animate-pulse font-bold tracking-widest bg-[#050810]">CARGANDO EL RADAR...</div>;

  return (
    <main className="min-h-screen bg-[#050810] pb-20 font-sans selection:bg-cyan-900 selection:text-cyan-50 relative overflow-hidden">
      
      {/* 🚀 BARRA DE BÚSQUEDA GLOBAL (Fija y sin traslapes) */}
      <div className="relative z-30 bg-[#050810] px-4 md:px-8 py-6 mb-2">
        <div className="max-w-4xl mx-auto relative flex items-center">
          <div className="absolute left-4 flex items-center justify-center pointer-events-none text-cyan-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar coleccionistas, tiendas, autos o rarezas..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            className="w-full bg-slate-900 border border-cyan-900/60 text-white rounded-full pl-12 pr-12 py-4 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-500 shadow-md" 
          />
          {buscando && (
            <div className="absolute right-4 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-cyan-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 flex flex-col gap-6 mt-6">
        
        {/* 🚀 MEGA BOTONES / HERO BANNER */}
        {!miIdUsuario && query.trim().length < 2 ? (
          <section className="bg-gradient-to-br from-cyan-900/40 to-[#0b1120] border border-cyan-800/50 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center">
              <span className="bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 border border-cyan-500/30">El Archivo Definitivo</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">Tu Bóveda Digital <br/> <span className="text-cyan-400">Te Espera.</span></h2>
              <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mb-8">Registra tu colección, valúa tus piezas con nuestra IA y conecta con la mayor comunidad de coleccionistas de México.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                <Link href="/registro" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)] transition-all flex items-center justify-center gap-2 text-lg">
                  Crear mi Cuenta Gratis
                </Link>
                <Link href="/login" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center text-lg">
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
          </section>
        ) : query.trim().length < 2 && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/mercado" className="bg-[#0b1120] hover:bg-slate-900 border border-cyan-900/50 hover:border-cyan-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all group shadow-xl">
              <div className="w-16 h-16 bg-cyan-900/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><span className="text-3xl">🛒</span></div>
              <h3 className="text-xl font-black text-white mb-2">Explorar el Mercado</h3>
              <p className="text-sm text-slate-400">Compra y realiza intercambios de piezas verificadas.</p>
            </Link>
            <Link href="/calculadora" className="bg-[#0b1120] hover:bg-slate-900 border border-emerald-900/50 hover:border-emerald-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all group shadow-xl">
              <div className="w-16 h-16 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><span className="text-3xl">🤖</span></div>
              <h3 className="text-xl font-black text-white mb-2">Calculadora IA</h3>
              <p className="text-sm text-slate-400">Valúa tus autos en tiempo real con nuestra base de datos.</p>
            </Link>
          </section>
        )}

        {/* 🚀 CARRUSEL DE TIENDAS LOCALES */}
        {miIdUsuario && tiendasLocales.length > 0 && query.trim().length < 2 && (
          <section className="mt-4 mb-2">
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-lg font-black text-amber-500 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Tiendas en tu Zona
              </h2>
              <span className="text-[10px] text-amber-600/80 font-bold uppercase tracking-widest hidden sm:block">Apoya el comercio local</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {tiendasLocales.map(tienda => (
                <Link key={tienda.id_usuario} href={`/perfil/${tienda.nombre_usuario}`} className="flex flex-col items-center gap-2 min-w-[72px] group snap-start">
                  <div className="w-16 h-16 rounded-full border-2 border-amber-500 group-hover:border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)] overflow-hidden bg-slate-800 transition-all relative shrink-0">
                    {tienda.link_img_perf ? <img src={tienda.link_img_perf} alt="Tienda" className="w-full h-full object-cover" /> : <svg className="w-full h-full text-slate-500 p-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold truncate w-full text-center group-hover:text-amber-300 transition-colors">{tienda.nombre_usuario}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 🚀 VISTA DE RESULTADOS DE BÚSQUEDA */}
        {query.trim().length > 1 ? (
          <div className="flex flex-col gap-10 animate-in fade-in duration-300">
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Coleccionistas y Tiendas</h2>
              {usuariosEncontrados.length === 0 && !buscando ? <p className="text-slate-600 text-sm">No se encontraron perfiles.</p> : (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {usuariosEncontrados.map(user => (
                    <Link key={user.id_usuario} href={`/perfil/${user.nombre_usuario}`} className="flex flex-col items-center gap-2 min-w-[90px] group">
                      <div className={`w-16 h-16 rounded-full border-2 overflow-hidden bg-slate-800 transition-colors relative ${user.rol === 'VENDEDOR' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-slate-700 group-hover:border-cyan-500'}`}>
                        {user.link_img_perf ? <img src={user.link_img_perf} alt="Avatar" className="w-full h-full object-cover" /> : <svg className="w-full h-full text-slate-500 p-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
                        {user.rol !== 'USUARIO' && <div className="absolute bottom-0 w-full bg-amber-500 text-white text-[8px] font-black text-center py-0.5 leading-none">{user.rol === 'VENDEDOR' ? 'PRO' : 'ADMIN'}</div>}
                      </div>
                      <span className={`text-xs font-bold truncate w-full text-center transition-colors ${user.rol === 'VENDEDOR' ? 'text-amber-400' : 'text-white group-hover:text-cyan-400'}`}>{user.nombre_usuario}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Piezas en Bóvedas</h2>
              {autosEncontrados.length === 0 && !buscando ? <p className="text-slate-600 text-sm">No se encontraron piezas con ese nombre o rareza.</p> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {autosEncontrados.map(carro => (
                    <article key={carro.id_carro} className="bg-[#0b1120] border border-slate-800 rounded-2xl p-3 shadow-lg hover:border-slate-700 transition-colors relative group">
                      
                      {carro.para_venta && <div className="absolute top-4 right-4 z-20 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md">💲 VENTA</div>}
                      {!carro.para_venta && carro.para_cambio && <div className="absolute top-4 left-4 z-20 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md">CAMBIO</div>}

                      <div className="flex items-center gap-2 mb-3">
                        <Link href={`/perfil/${carro.usuario?.nombre_usuario}`} className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-600">
                          {carro.usuario?.link_img_perf ? <img src={carro.usuario.link_img_perf} alt="Avatar" className="w-full h-full object-cover" /> : <svg className="w-full h-full text-slate-500 p-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
                        </Link>
                        <Link href={`/perfil/${carro.usuario?.nombre_usuario}`} className="text-[10px] font-bold text-slate-300 hover:text-white transition-colors truncate">De {carro.usuario?.nombre_usuario || "Anónimo"}</Link>
                      </div>
                      <Link href={`/pieza/${carro.id_carro}`} className="block transition-transform hover:scale-[1.02] active:scale-95 duration-200">
                        <CollectorCard modelo={carro.modelo} marca={carro.marca?.marca || "Sin Marca"} rareza={carro.rareza || "Común"} presentacion={carro.presentacion?.presentacion} valor={carro.valor} valorCalculado={carro.valor_calculado} imagenUrl={carro.imagen_url} />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* 🚀 VISTA DEL FEED GENERAL MEZCLADO (Amigos + Ventas Locales + Comunidad) */
          <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {miIdUsuario && feedUnificado.length === 0 && (
              <div className="bg-cyan-900/10 border border-cyan-900/30 rounded-2xl p-6 text-center mt-4">
                <h3 className="text-cyan-400 font-bold mb-2">Tu radar está tranquilo</h3>
                <p className="text-sm text-slate-400 mb-4">Usa el buscador para encontrar coleccionistas o explora el Mercado.</p>
              </div>
            )}

            {feedUnificado.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6 px-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                  {feedUnificado.map((carro, idx) => (
                    <article 
                      key={`${carro.id_carro}-${idx}`} 
                      className={`bg-[#0b1120] border rounded-2xl p-3 transition-colors group relative shadow-lg ${carro.isGolden ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-slate-800 hover:border-slate-700'}`}
                    >
                      
                      {/* 🌟 ETIQUETA DORADA PARA VENTAS LOCALES */}
                      {carro.isGolden && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-900 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md z-30 whitespace-nowrap">
                          🔥 Venta Local
                        </div>
                      )}

                      {!carro.isGolden && carro.para_venta && <div className="absolute top-4 right-4 z-20 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md">💲 VENTA</div>}
                      {!carro.para_venta && carro.para_cambio && <div className="absolute top-4 right-4 z-20 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md">CAMBIO</div>}

                      <div className="flex items-center gap-2 mb-3 mt-1">
                        <Link href={`/perfil/${carro.usuario?.nombre_usuario}`} className={`w-6 h-6 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 border ${carro.usuario?.rol === 'VENDEDOR' ? 'border-amber-500' : 'border-slate-600'}`}>
                          {carro.usuario?.link_img_perf ? <img src={carro.usuario.link_img_perf} alt="Avatar" className="w-full h-full object-cover" /> : <svg className="w-full h-full text-slate-500 p-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
                        </Link>
                        <div className="overflow-hidden">
                          <Link href={`/perfil/${carro.usuario?.nombre_usuario}`} className="text-[10px] font-bold text-slate-300 hover:text-white transition-colors truncate flex items-center gap-1">
                            {carro.usuario?.nombre_usuario || "Anónimo"}
                            {carro.usuario?.rol === 'VENDEDOR' && <svg className="w-2.5 h-2.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
                          </Link>
                        </div>
                      </div>

                      <Link href={`/pieza/${carro.id_carro}`} className="block transition-transform hover:scale-[1.02] active:scale-95 duration-200 relative">
                        <CollectorCard modelo={carro.modelo} marca={carro.marca?.marca || "Sin Marca"} rareza={carro.rareza || "Común"} presentacion={carro.presentacion?.presentacion} valor={carro.valor} valorCalculado={carro.valor_calculado} imagenUrl={carro.imagen_url} />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </main>
  );
}