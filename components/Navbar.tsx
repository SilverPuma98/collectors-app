"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// NUEVO: Importamos usePathname
import { useRouter, usePathname } from 'next/navigation'; 

export default function Navbar() {
  const [usuario, setUsuario] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname(); // NUEVO: Obtenemos la URL actual

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // NUEVO: Si la URL empieza con "/admin", este componente se auto-destruye (no se dibuja)
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      {/* ... (EL RESTO DE TU CÓDIGO HTML DEL NAVBAR PÚBLICO SE QUEDA EXACTAMENTE IGUAL) ... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-extrabold text-slate-100 tracking-wider">
              COLLECTORS<span className="text-cyan-500">.</span>
            </Link>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Inicio</Link>
            <Link href="/colecciones" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Explorar Garajes</Link>
          </div>
          <div className="flex gap-4 items-center">
            {usuario ? (
              <>
                <Link href="/admin" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Panel Admin</Link>
                <button onClick={handleLogout} className="text-sm font-bold bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-white px-4 py-2 rounded-md transition-all border border-slate-700 hover:border-red-800">Salir</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors py-2">Entrar</Link>
                <Link href="/registro" className="text-sm font-bold bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md transition-all">Crear Cuenta</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}