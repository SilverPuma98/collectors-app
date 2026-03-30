"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sesion, setSesion] = useState<any>(null);
  const [rol, setRol] = useState("USUARIO");

  useEffect(() => {
    verificarSesion();
    
    // Escucha si el usuario entra o sale de su cuenta en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      verificarSesion();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const verificarSesion = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSesion(session);
    
    if (session) {
      const { data: perfil } = await supabase.from('usuario').select('rol').eq('correo', session.user.email).single();
      if (perfil) setRol(perfil.rol);
    } else {
      setRol("USUARIO");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSesion(null);
    setRol("USUARIO");
    cerrarMenu();
    router.push('/login');
  };

  const cerrarMenu = () => setMenuAbierto(false);

  // Ocultar el menú completamente si estamos en las pantallas de Login o Registro
  if (pathname === '/login' || pathname === '/registro') return null;

  const esAdmin = rol === 'SUPER_ADMIN' || rol === 'COLABORADOR';

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#050810] border-b border-cyan-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          
          {/* LOGO */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="text-xl font-black text-white tracking-wider">
              COLLECTORS<span className="text-cyan-500">.</span>
            </Link>
            {esAdmin && <span className="bg-purple-900/50 text-purple-400 border border-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">ADMIN</span>}
          </div>

          {/* ==============================================
              VISTA ESCRITORIO
              ============================================== */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Inicio
            </Link>

            {/* 🧠 NUEVO: Botón de Calculadora (Visible para todos) */}
            <Link href="/calculadora" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              Calculadora
            </Link>

            {/* Opciones de Coleccionista (Solo si hay sesión) */}
            {sesion && (
              <>
                <Link href="/mi-panel" className="flex items-center gap-1 text-sm font-bold text-cyan-600 hover:text-cyan-500 transition-colors bg-cyan-50 px-3 py-1.5 rounded-md border border-cyan-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                  Mi Panel
                </Link>
              </>
            )}

            {/* Opciones de Admin (Solo si tiene el rol) */}
            {esAdmin && (
              <Link href="/admin" className="flex items-center gap-1 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-900/20 px-3 py-1.5 rounded-md border border-cyan-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Panel
              </Link>
            )}
          </div>

          <div className="hidden md:block">
            {sesion ? (
              <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-900 px-3 py-1.5 rounded transition-all">Cerrar Sesión</button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 transition-all">Ingresar</Link>
                <Link href="/registro" className="text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 px-4 py-1.5 rounded-full transition-all shadow-[0_0_10px_rgba(8,145,178,0.5)]">Crear Cuenta</Link>
              </div>
            )}
          </div>

          {/* ==============================================
              BOTÓN HAMBURGUESA CELULAR
              ============================================== */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-slate-300 hover:text-white p-2">
              {menuAbierto ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>}
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
            
            <Link href="/" onClick={cerrarMenu} className="text-slate-300 hover:text-white font-medium text-base">Inicio</Link>
            
            {/* 🧠 NUEVO: Botón de Calculadora Móvil */}
            <Link href="/calculadora" onClick={cerrarMenu} className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 font-medium text-base">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              Calculadora
            </Link>
            
            {sesion ? (
              <>
                {/* 🛠️ CORRECCIÓN DE CORTESÍA: Cambié '/mi-garaje' por '/mi-panel' */}
                <Link href="/mi-panel" onClick={cerrarMenu} className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-900/20 px-3 py-2 rounded-md border border-emerald-800 w-fit">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                  Mi Panel
                </Link>
                
                {esAdmin && (
                  <Link href="/admin" onClick={cerrarMenu} className="flex items-center gap-2 text-cyan-400 font-bold bg-cyan-900/20 px-3 py-2 rounded-md border border-cyan-800 w-fit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Panel Admin
                  </Link>
                )}

                <div className="h-px bg-slate-800 w-full my-1"></div>
                <button onClick={handleLogout} className="text-left text-red-400 font-bold text-base">Cerrar Sesión</button>
              </>
            ) : (
              <Link href="/login" onClick={cerrarMenu} className="text-cyan-400 font-bold text-base">Iniciar Sesión</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}