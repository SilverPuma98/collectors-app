"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sesion, setSesion] = useState<any>(null);
  const [rol, setRol] = useState("USUARIO");
  const [usuarioInfo, setUsuarioInfo] = useState<any>(null); // Guardamos más info del user

  // 🔔 ESTADOS DE NOTIFICACIONES
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    verificarSesion();
    
    // Escucha si el usuario entra o sale de su cuenta en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      verificarSesion();
    });

    // Cierra el menú de notificaciones si das clic afuera
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setMostrarNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      authListener.subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const verificarSesion = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSesion(session);
    
    if (session) {
      const { data: perfil } = await supabase.from('usuario').select('*').eq('correo', session.user.email).single();
      if (perfil) {
        setRol(perfil.rol);
        setUsuarioInfo(perfil);
        cargarNotificaciones(perfil.id_usuario);
      }
    } else {
      setRol("USUARIO");
      setUsuarioInfo(null);
    }
  };

  // 🔔 CARGAR NOTIFICACIONES
  const cargarNotificaciones = async (idUsuario: number) => {
    const { data } = await supabase
      .from('notificacion')
      .select('*')
      .eq('id_usuario', idUsuario)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotificaciones(data);
  };

  // 🔔 MARCAR COMO LEÍDAS
  const marcarComoLeidas = async () => {
    setMostrarNotifs(!mostrarNotifs);
    const noLeidas = notificaciones.filter(n => !n.leida);
    
    if (!mostrarNotifs && noLeidas.length > 0) {
      // Al abrir el menú, marcamos todas como leídas en la BD
      const ids = noLeidas.map(n => n.id_notificacion);
      await supabase.from('notificacion').update({ leida: true }).in('id_notificacion', ids);
      
      // Actualizamos el estado visual
      setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSesion(null);
    setRol("USUARIO");
    setUsuarioInfo(null);
    cerrarMenu();
    router.push('/login');
  };

  const cerrarMenu = () => setMenuAbierto(false);

  // Ocultar el menú completamente si estamos en las pantallas de Login o Registro
  if (pathname === '/login' || pathname === '/registro' || pathname === '/recuperar' || pathname === '/actualizar-password' || pathname === '/registro-vendedor') return null;

  const esAdmin = rol === 'SUPER_ADMIN' || rol === 'COLABORADOR';
  const noLeidasCount = notificaciones.filter(n => !n.leida).length;

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
            
            {/* 🛒 BOTÓN DEL MARKETPLACE */}
            <Link href="/mercado" className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-80 transition-opacity flex items-center gap-1.5">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Mercado
            </Link>

            {/* Opciones de Coleccionista (Solo si hay sesión) */}
            {sesion && (
              <>
                <Link href="/calculadora" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  Calculadora
                </Link>

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

          <div className="hidden md:flex items-center gap-4">
            {sesion ? (
              <>
                {/* 🔔 CAMPANITA DE NOTIFICACIONES */}
                <div className="relative flex items-center" ref={notifRef}>
                  <button onClick={marcarComoLeidas} className="relative p-1 text-slate-400 hover:text-white transition-colors focus:outline-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    {noLeidasCount > 0 && (
                      <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </button>

                  {/* DROP DOWN DE NOTIFICACIONES */}
                  {mostrarNotifs && (
                    <div className="absolute right-0 top-10 w-80 bg-[#0b1120] rounded-2xl shadow-2xl border border-cyan-900/50 overflow-hidden z-50">
                      <div className="bg-slate-900/50 px-4 py-3 border-b border-cyan-900/30 flex justify-between items-center">
                        <h3 className="font-black text-white text-sm">Notificaciones</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notificaciones.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-sm font-medium">No tienes alertas en tu radar.</div>
                        ) : (
                          notificaciones.map((n) => (
                            <div key={n.id_notificacion} className={`px-4 py-3 border-b border-cyan-900/20 flex gap-3 items-start ${n.leida ? 'bg-transparent opacity-70' : 'bg-cyan-900/20'}`}>
                              <div className="mt-1 bg-cyan-900/50 text-cyan-400 p-1.5 rounded-full shrink-0 border border-cyan-800">
                                {n.tipo === 'SEGUIDOR' ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path></svg> : <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
                              </div>
                              <div>
                                <p className="text-xs text-slate-300 font-medium">{n.mensaje}</p>
                                <p className="text-[9px] text-cyan-500/50 mt-1 font-bold uppercase">{new Date(n.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900 px-3 py-1.5 rounded transition-all ml-2">Cerrar Sesión</button>
              </>
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
          <div className="md:hidden flex items-center gap-4">
            
            {/* 🔔 Campanita también en móvil */}
            {sesion && (
              <button onClick={marcarComoLeidas} className="relative p-1 text-slate-400 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {noLeidasCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            )}

            <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-slate-300 hover:text-white p-1">
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
            
            {/* 🔔 Dropdown de notificaciones en móvil */}
            {mostrarNotifs && notificaciones.length > 0 && (
               <div className="mb-2 max-h-40 overflow-y-auto bg-slate-900/80 rounded-lg p-2 border border-cyan-900/50 shadow-inner">
                 <p className="text-xs text-cyan-500 font-bold mb-2 uppercase px-2">Notificaciones</p>
                 {notificaciones.map((n) => (
                    <div key={n.id_notificacion} className="px-2 py-2 mb-1 bg-[#050810] border border-cyan-900/30 rounded-md">
                      <p className="text-xs text-slate-300">{n.mensaje}</p>
                    </div>
                  ))}
               </div>
            )}

            <Link href="/" onClick={cerrarMenu} className="text-slate-300 hover:text-white font-medium text-base">Inicio</Link>
            
            <Link href="/mercado" onClick={cerrarMenu} className="flex items-center gap-2 text-cyan-400 font-bold bg-cyan-900/20 px-3 py-2 rounded-md border border-cyan-800/50 w-fit">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Explorar Mercado
            </Link>

            <Link href="/calculadora" onClick={cerrarMenu} className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 font-medium text-base">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              Calculadora
            </Link>
            
            {sesion ? (
              <>
                <Link href="/mi-panel" onClick={cerrarMenu} className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-900/20 px-3 py-2 rounded-md border border-emerald-800/50 w-fit mt-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                  Mi Panel
                </Link>
                
                {esAdmin && (
                  <Link href="/admin" onClick={cerrarMenu} className="flex items-center gap-2 text-purple-400 font-bold bg-purple-900/20 px-3 py-2 rounded-md border border-purple-800 w-fit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Panel Admin
                  </Link>
                )}

                <div className="h-px bg-slate-800 w-full my-1"></div>
                <button onClick={handleLogout} className="text-left text-red-400 font-bold text-base">Cerrar Sesión</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={cerrarMenu} className="text-cyan-400 font-bold text-base mt-2">Iniciar Sesión</Link>
                <Link href="/registro" onClick={cerrarMenu} className="text-slate-900 bg-cyan-500 block px-3 py-2 rounded-full text-base font-black text-center mt-2 shadow-[0_0_15px_rgba(34,211,238,0.4)]">Crear Cuenta Gratis</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}