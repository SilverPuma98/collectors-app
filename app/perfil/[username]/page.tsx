import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import CollectorCard from '@/components/CollectorCard';
import TrophyShowcase from '@/components/TrophyShowcase';
// NUEVO: Importamos el componente social
import SocialButtons from '@/components/SocialButtons';

export const revalidate = 60; 

export default async function PerfilPublico({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const usernameDecoded = decodeURIComponent(resolvedParams.username);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const { data: perfil } = await supabase
    .from('usuario')
    .select('id_usuario, nombre_usuario, correo, link_img_perf, rol')
    .ilike('nombre_usuario', usernameDecoded) 
    .single();

  if (!perfil) {
    return (
      <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-black text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl text-slate-400 font-bold mb-8">Coleccionista no encontrado</h2>
        <Link href="/" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all">Volver a la pista</Link>
      </main>
    );
  }

  const esMiPerfil = session?.user?.email === perfil.correo;

  // PARALELO: Buscamos Carros, Trofeos, Seguidores y Likes
  const [resCarros, resTrofeos, resSeguidores, resLikes] = await Promise.all([
    supabase.from('carro').select('*, imagen_url, marca(marca), serie(serie)').eq('id_usuario', perfil.id_usuario).order('id_carro', { ascending: false }),
    supabase.from('usuario_logro').select('fecha_obtencion, logro(*)').eq('id_usuario', perfil.id_usuario),
    supabase.from('seguidor').select('*', { count: 'exact', head: true }).eq('seguido_id', perfil.id_usuario),
    supabase.from('perfil_like').select('*', { count: 'exact', head: true }).eq('perfil_id', perfil.id_usuario)
  ]);

  const carros = resCarros.data || [];
  const trofeos = resTrofeos.data?.map((item: any) => item.logro) || [];
  
  // Extraemos la cantidad exacta de la base de datos
  const totalSeguidores = resSeguidores.count || 0;
  const totalLikes = resLikes.count || 0;

  return (
    <main className="min-h-screen bg-[#050810] pb-20 selection:bg-cyan-900 selection:text-cyan-50">
      
      <header className="relative w-full pt-32 pb-12 px-4 md:px-10 flex flex-col items-center border-b border-slate-800/50">
        <div className="absolute top-0 w-full h-48 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#050810] shadow-[0_0_30px_rgba(8,145,178,0.3)] overflow-hidden bg-slate-900 relative mb-4 flex items-center justify-center">
            {perfil.link_img_perf ? (
              <Image src={perfil.link_img_perf} alt={`Avatar de ${perfil.nombre_usuario}`} fill className="object-cover" sizes="160px" />
            ) : (
              <svg className="w-16 h-16 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight text-center">
            {perfil.nombre_usuario}
          </h1>
          
          <div className="flex items-center gap-3 mt-3">
            <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
              {carros.length} Piezas
            </span>
            {perfil.rol !== 'USUARIO' && (
              <span className="bg-purple-900/30 text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-800">
                {perfil.rol}
              </span>
            )}
          </div>

          {/* COMPONENTE SOCIAL (Likes y Followers) */}
          <SocialButtons perfilId={perfil.id_usuario} initialFollowers={totalSeguidores} initialLikes={totalLikes} />

          {/* BOTÓN DE EDICIÓN */}
          {esMiPerfil && (
            <Link href="/perfil/editar" className="mt-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-900/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Editar Mi Perfil
            </Link>
          )}

        </div>
      </header>

      {/* VITRINA Y GARAJE (Igual que antes) */}
      <div className="max-w-7xl mx-auto px-4 md:px-10 mt-10 flex flex-col gap-12">
        <section><TrophyShowcase trofeos={trofeos} /></section>
        <section>
          <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4"><h2 className="text-2xl font-bold text-white tracking-wide">Colección <span className="text-cyan-500">Exhibida</span></h2></div>
          {carros.length === 0 ? (
            <div className="text-center py-20 border border-slate-800 border-dashed rounded-3xl bg-slate-900/20 flex flex-col items-center"><p className="text-slate-500 text-lg">Este garaje aún está vacío.</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {carros.map((carro) => (
                <CollectorCard key={carro.id_carro} modelo={carro.modelo} marca={carro.marca?.marca || "Desconocida"} rareza={carro.rareza || "Estándar"} valor={carro.valor} imagenUrl={carro.imagen_url} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}