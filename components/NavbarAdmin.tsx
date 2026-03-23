"use client";

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NavbarAdmin() {
  const router = useRouter();
  // NUEVO: Estado para saber si el menú de celular está abierto
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Función para cerrar el menú cuando tocamos un enlace en el celular
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#050810] border-b border-cyan-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          
          {/* LOGO (Siempre visible) */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="bg-cyan-700 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded">PANEL</span>
            <Link href="/admin" className="text-lg sm:text-xl font-bold text-slate-100 tracking-wider">
              COLLECTORS
            </Link>
          </div>

          {/* ==============================================
              VISTA ESCRITORIO (Se oculta en celulares)
              ============================================== */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/admin" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">
              Catálogos Base
            </Link>
            
            <Link href="/mi-garaje" className="flex items-center gap-1 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-900/20 px-3 py-1.5 rounded-md border border-emerald-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Ir a Mi Garaje
            </Link>

            <Link href="/perfil" className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Mi Perfil
            </Link>
            
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sitio Público
            </Link>
          </div>

          <div className="hidden md:block">
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900 px-3 py-1.5 rounded transition-all">
              Cerrar Sesión
            </button>
          </div>

          {/* ==============================================
              BOTÓN HAMBURGUESA (Solo visible en celulares)
              ============================================== */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)} 
              className="text-slate-300 hover:text-white focus:outline-none p-2"
            >
              {menuAbierto ? (
                // Icono de la "X" para cerrar
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              ) : (
                // Icono de las 3 rayitas (Hamburguesa)
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ==============================================
          MENÚ DESPLEGABLE CELULAR
          ============================================== */}
      {menuAbierto && (
        <div className="md:hidden absolute w-full bg-[#0a0f1c] border-b border-cyan-900/50 shadow-2xl animate-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-6 flex flex-col space-y-4">
            
            <Link href="/admin" onClick={cerrarMenu} className="text-slate-300 hover:text-cyan-400 font-medium text-base">
              Catálogos Base
            </Link>
            
            <Link href="/mi-garaje" onClick={cerrarMenu} className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-900/20 px-3 py-2 rounded-md border border-emerald-800 w-fit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
              Ir a Mi Garaje
            </Link>

            <Link href="/perfil" onClick={cerrarMenu} className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 font-medium text-base">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Mi Perfil
            </Link>

            <Link href="/" onClick={cerrarMenu} className="text-slate-400 hover:text-white font-medium text-base">
              Sitio Público
            </Link>

            <div className="h-px bg-slate-800 w-full my-1"></div>

            <button onClick={handleLogout} className="text-left text-red-400 font-bold text-base">
              Cerrar Sesión
            </button>
            
          </div>
        </div>
      )}
    </nav>
  );
}