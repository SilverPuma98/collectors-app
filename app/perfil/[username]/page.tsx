import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import CollectorCard from '@/components/CollectorCard';
import TrophyShowcase from '@/components/TrophyShowcase';

export const revalidate = 60; // Caché de 60 segundos (Performance)

// En Next.js 15, los 'params' son una Promesa
export default async function PerfilPublico({ params }: { params: Promise<{ username: string }> }) {
  
  // 1. Esperamos a que Next.js 15 resuelva los parámetros y las cookies
  const resolvedParams = await params;
  const usernameDecoded = decodeURIComponent(resolvedParams.username);
  const cookieStore = await cookies();

  // 2. Conectamos a Supabase desde el Servidor (Ya compatible con Next 15)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 3. Buscamos al coleccionista por su nombre de usuario
  const { data: perfil } = await supabase
    .from('usuario')
    .select('id_usuario, nombre_usuario, link_img_perf, rol')
    .ilike('nombre_usuario', usernameDecoded) 
    .single();

  // Si no existe, mostramos pantalla 404
  if (!perfil) {
    return (
      <main className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-black text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl text-slate-400 font-bold mb-8">Coleccionista no encontrado</h2>
        <Link href="/" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
          Volver a la pista
        </Link>
      </main>
    );
  }

  // 4. Buscamos sus Carros y sus Trofeos en PARALELO
  const [resCarros, resTrofeos] = await Promise.all([
    supabase
      .from('carro')
      .select('*, marca(marca), serie(serie)')
      .eq('id_usuario', perfil.id_usuario)
      .order('id_carro', { ascending: false }),
    
    supabase
      .from('usuario_logro')
      .select('fecha_obtencion, logro(*)')
      .eq('id_usuario', perfil.id_usuario)
  ]);

  const carros = resCarros.data || [];
  const trofeos = resTrofeos.data?.map((item: any) => item.logro) || [];

  return (
    <main className="min-h-screen bg-[#050810] pb-20 selection:bg-cyan-900 selection:text-cyan-50">
      
      {/* HEADER DEL PERFIL */}
      <header className="relative w-full pt-32 pb-12 px-4 md:px-10 flex flex-col items-center border-b border-slate-800/50">
        <div className="absolute top-0 w-full h-48 bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#050810] shadow-[0_0_30px_rgba(8,145,178,0.3)] overflow-hidden bg-slate-900 relative mb-4 flex items-center justify-center">
            {perfil.link_img_perf ? (
              <Image 
                src={perfil.link_img_perf} 
                alt={`Avatar de ${perfil.nombre_usuario}`}
                fill
                className="object-cover"
                sizes="160px"
              />
            ) : (
              <svg className="w-16 h-16 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            )}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight text-center">
            {perfil.nombre_usuario}
          </h1>
          
          <div className="flex items-center gap-3 mt-3">
            <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
              {carros.length} Piezas en Bóveda
            </span>
            {perfil.rol !== 'USUARIO' && (
              <span className="bg-purple-900/30 text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-800">
                {perfil.rol}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-10 mt-10 flex flex-col gap-12">
        
        {/* VITRINA DE TROFEOS */}
        <section>
          <TrophyShowcase trofeos={trofeos} />
        </section>

        {/* GARAJE */}
        <section>
          <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Colección <span className="text-cyan-500">Exhibida</span>
            </h2>
          </div>

          {carros.length === 0 ? (
            <div className="text-center py-20 border border-slate-800 border-dashed rounded-3xl bg-slate-900/20 flex flex-col items-center">
              <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <p className="text-slate-500 text-lg">Este garaje aún está vacío.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {carros.map((carro) => (
                <CollectorCard 
                  key={carro.id_carro}
                  modelo={carro.modelo}
                  marca={carro.marca?.marca || "Desconocida"}
                  rareza={carro.rareza || "Estándar"}
                  valor={carro.valor}
                  imagenUrl={carro.link_img}
                />
              ))}
            </div>
          )}
        </section>
        
      </div>
    </main>
  );
}