import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import CollectorCard from '@/components/CollectorCard';
import Link from 'next/link';

// 🧠 INYECTAMOS EL MOTOR DE NIVELES
import { calcularNivel } from '@/lib/levelEngine';

// 🧠 IMPORTAMOS EL COMPONENTE DE RESEÑAS
import SeccionResenas from '@/components/SeccionResenas'; 

// 🧠 Importamos la misma librería de íconos que usamos en el Panel
import { 
  FaCar, FaMoneyBillWave, FaTrophy, FaWrench, FaGlobe, FaStar, FaInfinity, 
  FaMoon, FaGem, FaTachometerAlt, FaFire, FaBox, FaTools, FaCrown, FaGhost, 
  FaClock, FaHandshake, FaStore, FaMedal, FaCarCrash, FaBolt 
} from 'react-icons/fa';
import { GiRaceCar, GiSteeringWheel, GiCarKey, GiCheckeredFlag } from 'react-icons/gi';

export const revalidate = 60;

// ====================================================================
// 🧠 FUNCIÓN DE ÍCONOS REUTILIZADA (Para que luzca idéntico al panel)
// ====================================================================
const getIconForAchievement = (logro: any) => {
  const code = logro.codigo_regla || '';

  const iconMap: Record<string, React.ReactNode> = {
    'CREADOR_SUPREMO': <FaInfinity className="w-5 h-5" />,
    'CAZADOR_NOCTURNO': <FaGhost className="w-5 h-5" />,
    'EARLY_BIRD': <FaClock className="w-5 h-5" />,
    'CENA_POLLO': <FaCrown className="w-5 h-5" />,
    'LA_VUELTA_MUNDO': <FaGlobe className="w-5 h-5" />,
    'PRIMER_REGISTRO': <GiCarKey className="w-5 h-5" />,
    'DIVERSIDAD_5': <GiCheckeredFlag className="w-5 h-5" />,
    'DIVERSIDAD_10': <GiCheckeredFlag className="w-5 h-5" />,
  };

  if (iconMap[code]) return iconMap[code];

  if (code.includes('HW_')) return <FaFire className="w-5 h-5" />;
  if (code.includes('MBX_')) return <FaBox className="w-5 h-5" />;
  if (code.includes('M2_') || code.includes('GL_')) return <FaTools className="w-5 h-5" />;
  if (code.includes('FERRARI_') || code.includes('PORSCHE_') || code.includes('LAMBO_')) return <GiSteeringWheel className="w-5 h-5" />;
  if (code.includes('JDM_') || code.includes('MGT_')) return <FaTachometerAlt className="w-5 h-5" />;
  if (code.includes('MUSCLE_')) return <FaBolt className="w-5 h-5" />;
  if (code.includes('EURO_')) return <GiRaceCar className="w-5 h-5" />; 
  if (code.includes('VALOR_') || code.includes('TOP_')) return <FaMoneyBillWave className="w-5 h-5" />;
  if (code.includes('VENTA_')) return <FaStore className="w-5 h-5" />;
  if (code.includes('CAMBIO_')) return <FaHandshake className="w-5 h-5" />;
  if (code.includes('STH_') || code.includes('CHASE_')) return <FaGem className="w-5 h-5" />;
  if (code.includes('TH_')) return <FaStar className="w-5 h-5" />;
  if (code.includes('RLC_') || code.includes('PREMIUM_')) return <FaCrown className="w-5 h-5" />;
  if (code.includes('MINT_') || code.includes('EXHIBICION_')) return <FaStar className="w-5 h-5" />;
  if (code.includes('LOOSE_')) return <FaCarCrash className="w-5 h-5" />;
  if (code.includes('JUNK_')) return <FaWrench className="w-5 h-5" />;
  if (code.includes('D70S_') || code.includes('D80S_') || code.includes('D90S_') || code.includes('D00S_')) return <FaClock className="w-5 h-5" />;
  if (code.includes('CARROS_')) {
    if (logro.rareza_logro === 'Oro' || logro.rareza_logro === 'Legendario') return <FaTrophy className="w-5 h-5" />;
    return <FaCar className="w-5 h-5" />;
  }
  return <FaMedal className="w-5 h-5" />;
};

export default async function PerfilUsuario({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const usernameDecoded = decodeURIComponent(resolvedParams.username);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  // 1. Buscamos el perfil del usuario/tienda y traemos su Estado y Municipio
  const { data: perfil } = await supabase
    .from('usuario')
    .select(`
      *,
      municipio (municipio, estado (estado))
    `)
    .ilike('nombre_usuario', usernameDecoded)
    .single();

  if (!perfil) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-black text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl text-slate-500 font-bold mb-8">Coleccionista no encontrado en el radar</h2>
        <Link href="/" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all">Volver al Inicio</Link>
      </main>
    );
  }

  // 2. ✨ ACTUALIZACIÓN MAESTRA: Añadimos rareza(rareza) y carro_custom(*)
  const { data: carros } = await supabase
    .from('carro')
    .select('*, marca(marca), presentacion(presentacion), rareza(rareza), carro_custom(*)')
    .eq('id_usuario', perfil.id_usuario)
    .eq('estado_aprobacion', 'APROBADO')
    .order('id_carro', { ascending: false });

  // 3. Buscamos sus trofeos desbloqueados 
  const { data: logrosData } = await supabase
    .from('usuario_logro')
    .select('logro(*)')
    .eq('id_usuario', perfil.id_usuario);
  
  const trofeos = logrosData?.map(l => l.logro) || [];

  // 🧠 CALCULAMOS EL NIVEL DEL USUARIO BASADO EN SUS LOGROS
  const infoNivel = calcularNivel(trofeos.length);

  // 🧠 TRAEMOS LAS RESEÑAS PARA CALCULAR EL PROMEDIO EN LA CABECERA
  const { data: reseñas } = await supabase.from('review_vendedor').select('calificacion').eq('id_vendedor', perfil.id_usuario);
  const promedioEstrellas = reseñas && reseñas.length > 0 ? (reseñas.reduce((acc, curr) => acc + curr.calificacion, 0) / reseñas.length).toFixed(1) : "0.0";
  const totalReseñas = reseñas ? reseñas.length : 0;

  // 4. Revisamos si el visitante tiene sesión y si ya sigue a este usuario
  const { data: { session } } = await supabase.auth.getSession();
  let miIdUsuario = null;
  let yaLoSigo = false;
  let sonMutuos = false;
  let miNombreUsuario = "";

  if (session?.user?.email) {
    const { data: miPerfil } = await supabase.from('usuario').select('id_usuario, nombre_usuario').eq('correo', session.user.email).single();
    if (miPerfil) {
      miIdUsuario = miPerfil.id_usuario;
      miNombreUsuario = miPerfil.nombre_usuario; // 🧠 GUARDAMOS MI NOMBRE PARA EL BOTÓN DE WHATSAPP
      
      const { data: follow } = await supabase.from('seguidor').select('*').eq('seguidor_id', miIdUsuario).eq('seguido_id', perfil.id_usuario).single();
      if (follow) yaLoSigo = true;

      // Verificamos amigos mutuos para usuarios normales
      const { data: meSigue } = await supabase.from('seguidor').select('*').eq('seguidor_id', perfil.id_usuario).eq('seguido_id', miIdUsuario).single();
      if (follow && meSigue) sonMutuos = true;
    }
  }

  // 5. 👥 NUEVO: Contar los Seguidores y a quién Sigue
  const [resSeguidores, resSiguiendo] = await Promise.all([
    supabase.from('seguidor').select('*', { count: 'exact', head: true }).eq('seguido_id', perfil.id_usuario),
    supabase.from('seguidor').select('*', { count: 'exact', head: true }).eq('seguidor_id', perfil.id_usuario)
  ]);
  
  const totalSeguidores = resSeguidores.count || 0;
  const totalSiguiendo = resSiguiendo.count || 0;

  const totalAutos = carros ? carros.length : 0;
  const valorTotalUsuario = carros ? carros.reduce((acc, curr) => acc + (curr.valor || 0), 0) : 0;
  const valorTotalIA = carros ? carros.reduce((acc, curr) => acc + (curr.valor_calculado || 0), 0) : 0;

  const esMio = miIdUsuario === perfil.id_usuario;
  const esVendedor = perfil.rol === 'VENDEDOR' || perfil.rol === 'SUPER_ADMIN';

  const mostrarContacto = esVendedor || sonMutuos || esMio;

  const mensajeWhatsApp = miNombreUsuario ? `Hola, vengo de Collectors. Soy el usuario @${miNombreUsuario} y me interesa hacer un trato contigo.` : `Hola, vengo de Collectors y me interesa hacer un trato contigo.`;
  const enlaceWhatsApp = perfil.whatsapp ? `https://wa.me/${perfil.whatsapp}?text=${encodeURIComponent(mensajeWhatsApp)}` : null;
  const enlaceFacebook = perfil.facebook ? (perfil.facebook.startsWith('http') ? perfil.facebook : `https://${perfil.facebook}`) : null;
  const enlaceMaps = perfil.link_maps ? (perfil.link_maps.startsWith('http') ? perfil.link_maps : `https://${perfil.link_maps}`) : null;

  const nombreMunicipio = perfil.municipio?.municipio || "";
  const nombreEstado = perfil.municipio?.estado?.estado || "";
  const ubicacion = nombreMunicipio && nombreEstado ? `${nombreMunicipio}, ${nombreEstado}` : (nombreEstado || "Ubicación no registrada");

  const getMiniRarezaColor = (rareza: string) => {
    switch (rareza?.toLowerCase()) {
      case "mítico": return "border-cyan-400 bg-cyan-50 text-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]";
      case "legendario": return "border-purple-400 bg-purple-50 text-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.3)]";
      case "oro": return "border-amber-400 bg-amber-50 text-amber-500";
      case "plata": return "border-slate-300 bg-slate-50 text-slate-500";
      case "bronce": return "border-orange-300 bg-orange-50 text-orange-500";
      default: return "border-slate-200 bg-slate-50 text-slate-400";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-cyan-200 selection:text-cyan-900 pb-20 font-sans">
      
      {/* HEADER DEL PERFIL */}
      <div className="bg-white border-b border-slate-200 pt-10 pb-8 shadow-sm relative overflow-hidden">
        
        {/* 👑 AURA DORADA PARA FUNDADORES (Fondo) */}
        {perfil.es_fundador && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        )}

        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 relative z-10">
          
          {/* Avatar y Nivel */}
          <div className="flex flex-col items-center gap-4">
            {/* 👑 BORDE DORADO ESPECIAL SI ES FUNDADOR */}
            <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 shadow-xl flex-shrink-0 bg-slate-200 overflow-hidden ${perfil.es_fundador ? 'border-amber-400 shadow-amber-500/30' : (esVendedor ? 'border-cyan-600' : 'border-white')}`}>
              {perfil.link_img_perf ? (
                <img src={perfil.link_img_perf} alt={perfil.nombre_usuario} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
              )}
              {esVendedor && !perfil.es_fundador && (
                <div className="absolute bottom-0 w-full bg-cyan-600 text-white text-[10px] font-black text-center py-1 tracking-widest">TIENDA PRO</div>
              )}
              {/* 👑 ETIQUETA INFERIOR FUNDADOR */}
              {perfil.es_fundador && (
                <div className="absolute bottom-0 w-full bg-gradient-to-r from-amber-600 to-yellow-500 text-white text-[10px] font-black text-center py-1 tracking-widest">FUNDADOR</div>
              )}
            </div>

            <div className={`inline-flex items-center justify-center gap-1.5 ${infoNivel.bg} ${infoNivel.text} px-4 py-1.5 rounded-full border ${infoNivel.border} ${infoNivel.shadow} shadow-lg w-fit -mt-2 z-10`}>
              <span className="text-sm">{infoNivel.icon}</span>
              <span className="text-[10px] font-black tracking-widest uppercase">Nvl {infoNivel.nivel}: {infoNivel.titulo}</span>
            </div>

            {esVendedor && (
              <div className="flex items-center gap-1 text-amber-500 text-sm font-black -mt-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shadow-sm">
                <FaStar /> {promedioEstrellas} <span className="text-amber-700/60 text-[10px] ml-1">({totalReseñas})</span>
              </div>
            )}
          </div>

          {/* Info Principal */}
          <div className="flex-1 text-center md:text-left flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1 flex flex-wrap items-center justify-center md:justify-start gap-2">
              {perfil.nombre_usuario}
              {esVendedor && !perfil.es_fundador && <svg className="w-6 h-6 text-cyan-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
              
              {/* 👑 INSIGNIA OFICIAL DE FUNDADOR AL LADO DEL NOMBRE */}
              {perfil.es_fundador && (
                <span className="bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md border border-amber-300 transform -translate-y-1">
                  <FaCrown className="w-3 h-3" /> MIEMBRO FUNDADOR
                </span>
              )}
            </h1>
            
            <p className="text-sm font-bold text-slate-500 mb-3 flex items-center justify-center md:justify-start gap-1">
              📍 {ubicacion}
            </p>

            <div className="flex justify-center md:justify-start gap-6 mb-4">
              <div className="text-center">
                <span className="text-lg font-black text-slate-800 block leading-none">{totalSeguidores}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Seguidores</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-black text-slate-800 block leading-none">{totalSiguiendo}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Siguiendo</span>
              </div>
            </div>

            {trofeos.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {trofeos.map((t: any) => (
                  <div key={t.id_logro} className={`w-9 h-9 rounded-full border-2 flex items-center justify-center p-1.5 relative group cursor-help transition-transform hover:scale-110 shadow-sm ${getMiniRarezaColor(t.rareza_logro)}`}>
                    {getIconForAchievement(t)}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                      {t.nombre}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center shadow-sm">
                <p className="text-2xl font-black text-slate-800">{totalAutos}</p>
                <p className="text-[10px] uppercase font-bold text-slate-500">Piezas</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center shadow-sm">
                <p className="text-2xl font-black text-slate-800">${valorTotalUsuario.toLocaleString()}</p>
                <p className="text-[10px] uppercase font-bold text-slate-500">Valor Declarado</p>
              </div>
              <div className="bg-cyan-50 border border-cyan-200 px-4 py-2 rounded-xl text-center shadow-sm relative group cursor-help">
                <p className="text-2xl font-black text-cyan-700">${valorTotalIA.toLocaleString()}</p>
                <p className="text-[10px] uppercase font-bold text-cyan-600 flex items-center justify-center gap-1">Valuación IA <span className="bg-cyan-600 text-white text-[8px] px-1 rounded">BETA</span></p>
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 w-48 text-center bg-slate-900 text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-xl left-1/2 -translate-x-1/2">
                  Suma del valor estimado de mercado calculado por nuestro algoritmo.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 w-full">
              {!esMio && miIdUsuario && (
                <form action="/api/follow" method="POST" className="flex-1 md:flex-none">
                  <input type="hidden" name="seguidor_id" value={miIdUsuario} />
                  <input type="hidden" name="seguido_id" value={perfil.id_usuario} />
                  <input type="hidden" name="accion" value={yaLoSigo ? "unfollow" : "follow"} />
                  <button type="submit" className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold transition-all shadow-md ${yaLoSigo ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}>
                    {yaLoSigo ? "Siguiendo" : "Seguir Radar"}
                  </button>
                </form>
              )}
              {esMio && (
                <Link href="/mi-panel" className="px-8 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all shadow-md">
                  Editar mi Perfil
                </Link>
              )}
              {mostrarContacto && enlaceMaps && (
                <a href={enlaceMaps} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all shadow-sm flex items-center gap-2">
                  📍 Abrir Maps
                </a>
              )}
            </div>

            {mostrarContacto && (enlaceWhatsApp || enlaceFacebook) && (
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                {enlaceWhatsApp && <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-[#25D366]/10 text-[#1DA851] border border-[#25D366]/30 px-4 py-2 rounded-lg hover:bg-[#25D366]/20 transition-colors flex items-center gap-1">📱 WhatsApp</a>}
                {enlaceFacebook && <a href={enlaceFacebook} target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1">📘 Facebook</a>}
              </div>
            )}
            
            {!esVendedor && !esMio && !sonMutuos && (
               <p className="text-xs text-amber-600 mt-4 bg-amber-50 py-2 px-4 rounded-lg border border-amber-200 w-fit mx-auto md:mx-0">
                 🔒 Síguelo para desbloquear sus datos de contacto mutuo.
               </p>
            )}
          </div>
        </div>
      </div>

      {/* VITRINA DE AUTOS */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          {esVendedor ? 'Catálogo de Tienda' : 'Bóveda de Exhibición'}
        </h2>
        
        {(!carros || carros.length === 0) ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <p className="text-slate-500 font-medium">Aún no hay piezas en esta vitrina.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {carros.map((carro) => {
              
              // ✨ EXTRACCIÓN INTELIGENTE BLINDADA
              const datosCustom = carro.carro_custom?.[0] || {};
              const nombreMarca = (carro.es_custom && datosCustom.marca) ? datosCustom.marca : (carro.marca?.marca || "Desconocida");
              const nombrePres = (carro.es_custom && datosCustom.presentacion) ? datosCustom.presentacion : carro.presentacion?.presentacion;
              
              const rRaw = carro.es_custom && datosCustom.rareza ? datosCustom.rareza : carro.rareza;
              const nombreRareza = typeof rRaw === 'object' ? (rRaw?.rareza || "Común") : (rRaw || "Común");

              return (
                <Link key={carro.id_carro} href={`/pieza/${carro.id_carro}`} className="block transition-transform hover:scale-[1.02] active:scale-95 duration-200 relative group">
                  {carro.es_lote && !carro.es_custom && <div className="absolute top-2 left-2 z-20 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">📦 LOTE</div>}
                  {carro.para_venta && !carro.es_preventa && !carro.es_subasta && <div className="absolute top-2 right-2 z-20 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">💲 VENTA</div>}
                  {carro.es_preventa && <div className="absolute top-2 right-2 z-20 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-pulse">⏳ PREVENTA</div>}
                  {carro.es_subasta && <div className="absolute top-2 right-2 z-20 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-bounce">🔨 SUBASTA</div>}
                  {!carro.para_venta && carro.para_cambio && !carro.es_custom && <div className="absolute top-2 left-2 z-20 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">CAMBIO</div>}
                  
                  <CollectorCard 
                    modelo={carro.modelo} 
                    marca={nombreMarca} 
                    rareza={String(nombreRareza)} 
                    presentacion={nombrePres} 
                    valor={carro.valor} 
                    valorCalculado={carro.valor_calculado} 
                    imagenUrl={carro.imagen_url} 
                    esCustom={carro.es_custom} 
                  />
                </Link>
              );
            })}
          </div>
        )}
        
        {esVendedor && (
          <SeccionResenas 
            idVendedor={perfil.id_usuario} 
            miIdUsuario={miIdUsuario} 
            esVendedor={esMio} 
          />
        )}
      </div>
    </main>
  );
}