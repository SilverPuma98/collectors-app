"use client";

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NavbarAdmin() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // Al salir, lo mandamos al login
  };

  return (
    // Diseño más oscuro y técnico, con borde inferior cian
    <nav className="sticky top-0 z-50 w-full bg-[#050810] border-b border-cyan-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          
          {/* Logo versión Admin */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="bg-cyan-700 text-white text-xs font-bold px-2 py-1 rounded">ADMIN</span>
            <Link href="/admin" className="text-xl font-bold text-slate-100 tracking-wider">
              COLLECTORS
            </Link>
          </div>

          {/* Links Administrativos */}
          <div className="hidden md:flex space-x-6">
            <Link href="/admin" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">Dashboard</Link>
            <Link href="/admin/usuarios" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Usuarios</Link>
            <Link href="/admin/moderacion" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Moderación</Link>
          </div>

          {/* Botón de Salida */}
          <div>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900 px-3 py-1.5 rounded transition-all"
            >
              Cerrar Sesión Segura
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}