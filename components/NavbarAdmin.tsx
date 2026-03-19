"use client";

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NavbarAdmin() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#050810] border-b border-cyan-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          
          {/* Logo versión Admin */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="bg-cyan-700 text-white text-xs font-bold px-2 py-1 rounded">PANEL</span>
            <Link href="/admin" className="text-xl font-bold text-slate-100 tracking-wider">
              COLLECTORS
            </Link>
          </div>

          {/* Links de Navegación Útiles */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/admin" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">
              Catálogos Base
            </Link>
            
            {/* ACCESO DIRECTO AL GARAJE (AQUÍ REGISTRAN SUS AUTOS) */}
            <Link href="/mi-garaje" className="flex items-center gap-1 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-900/20 px-3 py-1.5 rounded-md border border-emerald-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Ir a Mi Garaje
            </Link>
            
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sitio Público
            </Link>
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