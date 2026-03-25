import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import CollectorCard from '@/components/CollectorCard';
import Link from 'next/link';

export const revalidate = 60;

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

  // 2. Buscamos sus autos públicos
  const { data: carros } = await supabase
    .from('carro')
    .select('*, marca(marca)')
    .eq('id_usuario', perfil.id_usuario)
    .eq('estado_aprobacion', 'APROBADO')
    .order('id_carro', { ascending: false });

  // 3. Revisamos si el visitante tiene sesión y si ya sigue a este usuario
  const { data: { session } } = await supabase.auth.getSession();
  let miIdUsuario = null;
  let yaLoSigo = false;
  let sonMutuos = false;

  if (session?.user?.email) {
    const { data: miPerfil } = await supabase.from('usuario').select('id_usuario').eq('correo', session.user.email).single();
    if (miPerfil) {
      miIdUsuario = miPerfil.id_usuario;
      
      const { data: follow } = await supabase.from('seguidor').select('*').eq('seguidor_id', miIdUsuario).eq('seguido_id', perfil.id_usuario).single();
      if (follow) yaLoSigo = true;

      // Verificamos amigos mutuos para usuarios normales
      const { data: meSigue } = await supabase.from('seguidor').select('*').eq('seguidor_id', perfil.id_usuario).eq('seguido_id', miIdUsuario).single();
      if (follow && meSigue) sonMutuos = true;
    }
  }

  // Estadísticas
  const totalAutos = carros ? carros.length : 0;
  const valorTotal = carros ? carros.reduce((acc, curr) => acc + (curr.valor || 0), 0) : 0;

  const esMio = miIdUsuario === perfil.id_usuario;
  const esVendedor = perfil.rol === 'VENDEDOR' || perfil.rol === 'SUPER_ADMIN';

  // Lógica de visualización de contacto
  // Los vendedores muestran contacto siempre (si lo tienen configurado). Los usuarios normales solo a mutuos.
  const mostrarContacto = esVendedor || sonMutuos || esMio;

  const enlaceWhatsApp = perfil.whatsapp ? `https://wa.me/${perfil.whatsapp}` : null;
  const enlaceFacebook = perfil.facebook ? (perfil.facebook.startsWith('http') ? perfil.facebook : `https://${perfil.facebook}`) : null;
  const enlaceMaps = perfil.link_maps ? (perfil.link_maps.startsWith('http') ? perfil.link_maps : `https://${perfil.link_maps}`) : null;

  // Extraer ubicación
  const nombreMunicipio = perfil.municipio?.municipio || "";
  const nombreEstado = perfil.municipio?.estado?.estado || "";
  const ubicacion = nombreMunicipio && nombreEstado ? `${nombreMunicipio}, ${nombreEstado}` : (nombreEstado || "Ubicación no registrada");

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-cyan-200 selection:text-cyan-900 pb-20 font-sans">
      
      {/* HEADER DEL PERFIL */}
      <div className="bg-white border-b border-slate-200 pt-10 pb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          
          {/* Avatar */}
          <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 shadow-xl flex-shrink-0 bg-slate-200 overflow-hidden ${esVendedor ? 'border-amber-400' : 'border-white'}`}>
            {perfil.link_img_perf ? (
              <img src={perfil.link_img_perf} alt={perfil.nombre_usuario} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
            )}
            {esVendedor && (
              <div className="absolute bottom-0 w-full bg-amber-500 text-white text-[10px] font-black text-center py-1">TIENDA PRO</div>
            )}
          </div>

          {/* Info Principal */}
          <div className="flex-1 text-center md:text-left flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1 flex items-center justify-center md:justify-start gap-2">
              {perfil.nombre_usuario}
              {esVendedor && <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
            </h1>
            
            <p className="text-sm font-bold text-slate-500 mb-4 flex items-center justify-center md:justify-start gap-1">
              📍 {ubicacion}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center shadow-sm">
                <p className="text-2xl font-black text-slate-800">{totalAutos}</p>
                <p className="text-[10px] uppercase font-bold text-slate-500">Piezas</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center shadow-sm">
                <p className="text-2xl font-black text-emerald-600">${valorTotal.toLocaleString()}</p>
                <p className="text-[10px] uppercase font-bold text-slate-500">Valor Colección</p>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN (Seguir / Contacto) */}
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

              {/* Botón Maps Exclusivo */}
              {mostrarContacto && enlaceMaps && (
                <a href={enlaceMaps} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all shadow-sm flex items-center gap-2">
                  📍 Abrir Maps
                </a>
              )}
            </div>

            {/* Panel de Contacto (Visible para Vendedores o Mutuos) */}
            {mostrarContacto && (enlaceWhatsApp || enlaceFacebook) && (
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                {enlaceWhatsApp && <a href={enlaceWhatsApp} target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-[#25D366]/10 text-[#1DA851] border border-[#25D366]/30 px-4 py-2 rounded-lg hover:bg-[#25D366]/20 transition-colors flex items-center gap-1">📱 WhatsApp</a>}
                {enlaceFacebook && <a href={enlaceFacebook} target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1">📘 Facebook</a>}
              </div>
            )}
            
            {/* Aviso para Usuarios Normales si no son Mutuos */}
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
            {carros.map((carro) => (
              <Link key={carro.id_carro} href={`/pieza/${carro.id_carro}`} className="block transition-transform hover:scale-[1.02] active:scale-95 duration-200 relative group">
                {carro.para_venta && <div className="absolute top-2 right-2 z-20 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-md">💲 VENTA</div>}
                {!carro.para_venta && carro.para_cambio && <div className="absolute top-2 left-2 z-20 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-md">CAMBIO</div>}
                
                <CollectorCard modelo={carro.modelo} marca={carro.marca?.marca || "Desconocida"} rareza={carro.rareza || "Estándar"} valor={carro.valor} imagenUrl={carro.imagen_url} />
              </Link>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}