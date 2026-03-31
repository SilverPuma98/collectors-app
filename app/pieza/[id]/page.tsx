import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import BotonReportar from '@/components/BotonReportar';

export const revalidate = 60; 

export default async function DetallePieza({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const idCarro = resolvedParams.id;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: carro } = await supabase
    .from('carro')
    .select(`
      *,
      marca(marca),
      fabricante(fabricante),
      serie(*),
      presentacion(presentacion),
      escala_rel:escala(escala),
      estado_carro_rel:estado_carro(estado_carro),
      usuario:id_usuario(id_usuario, nombre_usuario, link_img_perf, whatsapp, facebook, correo, rol)
    `)
    .eq('id_carro', idCarro)
    .single();

  if (!carro) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-black text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl text-slate-500 font-bold mb-8">Pieza no encontrada en la bóveda</h2>
        <Link href="/" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg">Volver al Inicio</Link>
      </main>
    );
  }

  const { data: { session } } = await supabase.auth.getSession();
  const esMiPieza = session?.user?.email === carro.usuario?.correo;
  
  let miIdUsuario = null;
  if (session?.user?.email) {
    const { data: miPerfil } = await supabase.from('usuario').select('id_usuario').eq('correo', session.user.email).single();
    miIdUsuario = miPerfil?.id_usuario;
  }

  // ALGORITMO DE AMIGOS MUTUOS 🤝 (Para intercambios)
  let sonMutuos = false;
  if (miIdUsuario && carro.usuario?.id_usuario && !esMiPieza) {
    const [yoSigo, meSigue] = await Promise.all([
       supabase.from('seguidor').select('seguido_id').eq('seguidor_id', miIdUsuario).eq('seguido_id', carro.usuario.id_usuario).single(),
       supabase.from('seguidor').select('seguido_id').eq('seguidor_id', carro.usuario.id_usuario).eq('seguido_id', miIdUsuario).single()
    ]);
    if (yoSigo.data && meSigue.data) sonMutuos = true;
  }

  // LÓGICA DE NEGOCIACIÓN (Venta vs Cambio)
  const esVenta = carro.para_venta;
  const esCambio = carro.para_cambio;

  let mensajeWhatsApp = "";
  if (esVenta) {
    mensajeWhatsApp = `¡Hola ${carro.usuario?.nombre_usuario}! 👋🏼 Vi tu *${carro.modelo}* en tu tienda en Collectors. Me interesa comprarlo por $${carro.valor}. ¿Sigue disponible?`;
  } else {
    mensajeWhatsApp = `¡Hola ${carro.usuario?.nombre_usuario}! 👋🏼 Vi tu *${carro.modelo}* en Collectors y me interesa hacer un intercambio.`;
  }
  
  const enlaceWhatsApp = carro.usuario?.whatsapp ? `https://wa.me/${carro.usuario.whatsapp}?text=${encodeURIComponent(mensajeWhatsApp)}` : null;
  const enlaceFacebook = carro.usuario?.facebook ? carro.usuario.facebook : null;

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-cyan-200 selection:text-cyan-900 pb-20 font-sans">
      
      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10">
        <Link href={`/perfil/${carro.usuario?.nombre_usuario}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver al Perfil
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* LADO IZQUIERDO: LA FOTO */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full h-[50vh] md:h-[75vh] bg-[#0b1120] rounded-3xl overflow-hidden shadow-2xl group flex items-center justify-center p-4 border border-slate-800">
            {carro.imagen_url ? (
              <img src={carro.imagen_url} alt={carro.modelo} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 drop-shadow-2xl" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p className="font-bold tracking-widest uppercase">Sin Fotografía</p>
              </div>
            )}
            
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
              {/* Etiqueta de Rareza */}
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
                {carro.rareza || 'ESTÁNDAR'}
              </div>
              {/* 📦 ETIQUETA NUEVA DE PRESENTACIÓN SOBRE LA FOTO */}
              {carro.presentacion?.presentacion && carro.presentacion.presentacion !== 'Individual Básico' && (
                <div className="bg-indigo-900/80 backdrop-blur-md border border-indigo-500/50 text-indigo-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                  📦 {carro.presentacion.presentacion}
                </div>
              )}
            </div>
            
            {/* Etiquetas Dinámicas (Venta / Cambio) */}
            {esVenta ? (
              <div className="absolute top-4 right-4 z-20 bg-amber-500/90 backdrop-blur-md border border-amber-400 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
                💲 EN VENTA
              </div>
            ) : esCambio ? (
              <div className="absolute top-4 right-4 z-20 bg-emerald-500/90 backdrop-blur-md border border-emerald-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                DISPONIBLE
              </div>
            ) : null}
          </div>
        </div>

        {/* LADO DERECHO: DETALLES */}
        <div className="lg:col-span-5 flex flex-col">
          
          <Link href={`/perfil/${carro.usuario?.nombre_usuario}`} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 hover:border-cyan-400 transition-colors w-fit mb-6 group shadow-sm">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border-2 border-transparent group-hover:border-cyan-500 transition-colors">
              {carro.usuario?.link_img_perf ? <img src={carro.usuario.link_img_perf} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200"></div>}
            </div>
            <div className="pr-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-1">
                {carro.usuario?.rol === 'VENDEDOR' ? 'TIENDA OFICIAL' : 'EN LA BÓVEDA DE'}
              </p>
              <p className="text-sm font-black text-slate-800 group-hover:text-cyan-600 transition-colors leading-none flex items-center gap-1">
                {carro.usuario?.nombre_usuario || 'Anónimo'}
                {carro.usuario?.rol === 'VENDEDOR' && <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
              </p>
            </div>
          </Link>

          {/* BOTÓN DE REPORTAR */}
          <div className="flex justify-end mb-2">
            {miIdUsuario && !esMiPieza && (
              <BotonReportar idCarro={carro.id_carro} miIdUsuario={miIdUsuario} />
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-2 tracking-tight">
            {carro.modelo}
          </h1>
          <p className="text-xl text-cyan-600 font-bold mb-8">{carro.marca?.marca || 'Marca Desconocida'} • {carro.fabricante?.fabricante || 'Sin Fabricante'}</p>

          {/* 📦 CUADRÍCULA DE CARACTERÍSTICAS ACTUALIZADA */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Serie / Año</p>
              <p className="text-sm text-slate-800 font-bold">{carro.serie?.serie || 'Sin Serie'} {carro.serie?.anio ? `(${carro.serie.anio})` : ''}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Número</p>
              <p className="text-sm text-slate-800 font-bold">{carro.no_carro ? `${carro.no_carro} ` : '- '} {carro.serie?.no_carros ? `/ ${carro.serie.no_carros}` : ''}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Escala</p>
              <p className="text-sm text-slate-800 font-bold">{carro.escala_rel?.escala || 'No definida'}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Condición</p>
              <p className="text-sm text-emerald-600 font-bold">{carro.estado_carro_rel?.estado_carro || 'No especificada'}</p>
            </div>
            
            {/* 📦 NUEVO CUADRITO DE PRESENTACIÓN (Ocupa las 2 columnas si es necesario) */}
            <div className="col-span-2 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider mb-1">Empaque Original</p>
                <p className="text-sm text-indigo-900 font-black">{carro.presentacion?.presentacion || 'Individual Básico'}</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>

          {/* =======================================================
              COMPARATIVA DE PRECIOS NEUTRA 
              ======================================================= */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center text-left">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Precio del Dueño</p>
              <p className="text-3xl font-black text-slate-900">${carro.valor ? carro.valor.toLocaleString() : '0'}</p>
            </div>
            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 shadow-sm flex flex-col justify-center text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-[10px] text-cyan-700 uppercase font-black tracking-widest mb-1 relative z-10 flex items-center gap-1.5">
                Valuación IA 
                <span className="text-[8px] bg-cyan-600 text-white px-1.5 py-0.5 rounded shadow-sm">BETA</span>
              </p>
              <p className="text-3xl font-black text-cyan-800 relative z-10">${carro.valor_calculado ? carro.valor_calculado.toLocaleString() : '0'}</p>
            </div>
          </div>

          {/* ÁREA DE NEGOCIACIÓN INTELIGENTE */}
          {esMiPieza ? (
            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-cyan-700 font-black">💎 Esta pieza está en tu Garaje</p>
              {esVenta ? <p className="text-xs text-slate-600 mt-1 font-medium">Actualmente la tienes en venta en la Tienda.</p> : esCambio ? <p className="text-xs text-slate-600 mt-1 font-medium">Actualmente la tienes marcada para Intercambio.</p> : <p className="text-xs text-slate-600 mt-1 font-medium">Actualmente la tienes marcada como Solo Exhibición.</p>}
            </div>
          ) : esVenta ? (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-amber-700 font-black uppercase tracking-wider text-xs mb-4">Adquirir esta pieza</p>
              
              {enlaceWhatsApp ? (
                <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer" className="w-full bg-amber-500 hover:bg-amber-400 text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-amber-500/40 relative z-10">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.48-1.459-1.653-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Comprar Directo
                </a>
              ) : (
                <p className="text-xs text-amber-700 font-bold">Esta tienda no tiene número registrado.</p>
              )}
            </div>
          ) : !esCambio ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-slate-800 font-black mb-1">Pieza de Exhibición</p>
              <p className="text-xs text-slate-500 font-medium">Esta pieza es parte de la colección privada de {carro.usuario?.nombre_usuario} y no está disponible para negociar.</p>
            </div>
          ) : !sonMutuos ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-slate-700 font-black mb-1">Disponible para Intercambio</p>
              <p className="text-xs text-slate-500 font-medium">Sigue a {carro.usuario?.nombre_usuario} y espera a que te siga de vuelta para desbloquear sus datos y enviarle mensaje.</p>
              <Link href={`/perfil/${carro.usuario?.nombre_usuario}`} className="mt-4 inline-block bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-500 transition-colors shadow-md">Ir a su Perfil</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-emerald-600 font-black uppercase tracking-wider text-center mb-4 bg-emerald-50 py-2 rounded-lg border border-emerald-100">✨ Son Amigos Mutuos. ¡Contacto Desbloqueado!</p>

              {enlaceWhatsApp && (
                <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-[#25D366]/40">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.48-1.459-1.653-1.756-.173-.298-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Ofrecer Intercambio
                </a>
              )}
              
              {enlaceFacebook && (
                <a href={enlaceFacebook.startsWith('http') ? enlaceFacebook : `https://${enlaceFacebook}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#1877F2] hover:bg-[#155ebb] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Ver Perfil en Facebook
                </a>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}