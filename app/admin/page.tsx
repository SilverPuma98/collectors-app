"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [miRol, setMiRol] = useState("");
  
  const [tabActiva, setTabActiva] = useState("marcas"); 
  const [busqueda, setBusqueda] = useState("");

  const [marcas, setMarcas] = useState<any[]>([]);
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [rarezas, setRarezas] = useState<any[]>([]); // <-- NUEVO ESTADO PARA RAREZAS
  const [usuarios, setUsuarios] = useState<any[]>([]); 
  const [cochesPendientes, setCochesPendientes] = useState<any[]>([]); 

  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [itemEditando, setItemEditando] = useState<any>(null);

  const [nuevaMarca, setNuevaMarca] = useState("");
  const [nuevoFabricante, setNuevoFabricante] = useState("");
  const [nuevaSerie, setNuevaSerie] = useState({ serie: "", anio: "", no_carros: "", id_fabricante: "" });
  const [nuevaRareza, setNuevaRareza] = useState({ rareza: "", id_fabricante: "" }); // <-- NUEVO FORMULARIO RAREZA

  useEffect(() => {
    validarAcceso();
  }, []);

  const validarAcceso = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data: perfil } = await supabase.from('usuario').select('rol').eq('correo', session.user.email).single();
    const rolDelUsuario = perfil?.rol || 'USUARIO';
    setMiRol(rolDelUsuario);

    if (rolDelUsuario === 'SUPER_ADMIN' || rolDelUsuario === 'COLABORADOR') {
      setAutorizado(true);
      cargarTodosLosDatos(rolDelUsuario);
    } else {
      alert("Acceso denegado."); router.push("/");
    }
  };

  const cargarTodosLosDatos = async (rol: string) => {
    const resMarcas = await supabase.from('marca').select('*').order('id_marca', { ascending: true });
    if (resMarcas.data) setMarcas(resMarcas.data);
    
    const resFab = await supabase.from('fabricante').select('*').order('id_fabricante', { ascending: true });
    if (resFab.data) setFabricantes(resFab.data);
    
    const resSer = await supabase.from('serie').select('*').order('id_serie', { ascending: true });
    if (resSer.data) setSeries(resSer.data);

    // NUEVO: CARGAR RAREZAS
    const resRar = await supabase.from('rareza').select('*').order('id_rareza', { ascending: true });
    if (resRar.data) setRarezas(resRar.data);

    const resPendientes = await supabase.from('carro').select('*, marca(marca), serie(serie)').eq('estado_aprobacion', 'PENDIENTE');
    if (resPendientes.data) setCochesPendientes(resPendientes.data);

    if (rol === 'SUPER_ADMIN') {
      const resUsu = await supabase.from('usuario').select('*').order('id_usuario', { ascending: true });
      if (resUsu.data) setUsuarios(resUsu.data);
    }
  };

  const marcasFiltradas = marcas.filter(m => m.marca.toLowerCase().includes(busqueda.toLowerCase()));
  const fabricantesFiltrados = fabricantes.filter(f => f.fabricante.toLowerCase().includes(busqueda.toLowerCase()));
  const seriesFiltradas = series.filter(s => s.serie.toLowerCase().includes(busqueda.toLowerCase()));
  const rarezasFiltradas = rarezas.filter(r => r.rareza.toLowerCase().includes(busqueda.toLowerCase())); // <-- NUEVO FILTRO
  const usuariosFiltrados = usuarios.filter(u => (u.nombre_usuario?.toLowerCase() || "").includes(busqueda.toLowerCase()) || (u.correo?.toLowerCase() || "").includes(busqueda.toLowerCase()));

  const abrirModalCrear = (tipo: string) => {
    setItemEditando(null); 
    setNuevaMarca(""); setNuevoFabricante(""); 
    setNuevaSerie({ serie: "", anio: "", no_carros: "", id_fabricante: "" }); 
    setNuevaRareza({ rareza: "", id_fabricante: "" });
    setModalAbierto(tipo);
  };

  const abrirModalEditar = (tipo: string, item: any) => {
    setItemEditando(item);
    if (tipo === "marca") setNuevaMarca(item.marca);
    if (tipo === "fabricante") setNuevoFabricante(item.fabricante);
    if (tipo === "serie") setNuevaSerie({ serie: item.serie, anio: item.anio, no_carros: item.no_carros, id_fabricante: item.id_fabricante });
    if (tipo === "rareza") setNuevaRareza({ rareza: item.rareza, id_fabricante: item.id_fabricante });
    setModalAbierto(tipo);
  };

  // ... (Funciones guardarMarca, guardarFabricante, guardarSerie se mantienen igual)
  const guardarMarca = async (e: React.FormEvent) => { e.preventDefault(); setCargando(true); if (itemEditando) await supabase.from('marca').update({ marca: nuevaMarca }).eq('id_marca', itemEditando.id_marca); else await supabase.from('marca').insert([{ marca: nuevaMarca }]); await cargarTodosLosDatos(miRol); setModalAbierto(null); setCargando(false); };
  const guardarFabricante = async (e: React.FormEvent) => { e.preventDefault(); setCargando(true); if (itemEditando) await supabase.from('fabricante').update({ fabricante: nuevoFabricante }).eq('id_fabricante', itemEditando.id_fabricante); else await supabase.from('fabricante').insert([{ fabricante: nuevoFabricante }]); await cargarTodosLosDatos(miRol); setModalAbierto(null); setCargando(false); };
  const guardarSerie = async (e: React.FormEvent) => { e.preventDefault(); setCargando(true); const payload = { serie: nuevaSerie.serie, anio: parseInt(nuevaSerie.anio), no_carros: parseInt(nuevaSerie.no_carros), id_fabricante: parseInt(nuevaSerie.id_fabricante) }; if (itemEditando) await supabase.from('serie').update(payload).eq('id_serie', itemEditando.id_serie); else await supabase.from('serie').insert([payload]); await cargarTodosLosDatos(miRol); setModalAbierto(null); setCargando(false); };

  // NUEVO: GUARDAR RAREZA
  const guardarRareza = async (e: React.FormEvent) => {
    e.preventDefault(); setCargando(true);
    const payload = { rareza: nuevaRareza.rareza, id_fabricante: parseInt(nuevaRareza.id_fabricante) };
    if (itemEditando) await supabase.from('rareza').update(payload).eq('id_rareza', itemEditando.id_rareza); 
    else await supabase.from('rareza').insert([payload]);
    await cargarTodosLosDatos(miRol); setModalAbierto(null); setCargando(false);
  };

  const eliminarRegistro = async (tabla: string, columnaId: string, id: number) => {
    if (miRol !== 'SUPER_ADMIN') { alert("Solo los Súper Administradores pueden eliminar."); return; }
    const confirmar = window.confirm("⚠️ ¿Estás seguro de eliminar este registro?");
    if (!confirmar) return;
    const { error } = await supabase.from(tabla).delete().eq(columnaId, id);
    if (error) alert("Error: " + error.message); else cargarTodosLosDatos(miRol);
  };

  const cambiarRolUsuario = async (id_usuario: number, nuevoRol: string) => {
    const { error } = await supabase.from('usuario').update({ rol: nuevoRol }).eq('id_usuario', id_usuario);
    if (error) alert("Error: " + error.message); else cargarTodosLosDatos(miRol);
  };

  const aprobarAuto = async (id_carro: number) => {
    const { error } = await supabase.from('carro').update({ estado_aprobacion: 'APROBADO' }).eq('id_carro', id_carro);
    if (error) alert("Error al aprobar: " + error.message); else cargarTodosLosDatos(miRol);
  };

  const rechazarAuto = async (id_carro: number) => {
    const confirmar = window.confirm("¿Rechazar y eliminar este auto permanentemente?");
    if (!confirmar) return;
    const { error } = await supabase.from('carro').delete().eq('id_carro', id_carro);
    if (error) alert("Error al rechazar: " + error.message); else cargarTodosLosDatos(miRol);
  };

  if (!autorizado) return <div className="flex h-screen items-center justify-center text-cyan-500 animate-pulse">VERIFICANDO NIVEL DE ACCESO...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 w-full relative">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">
            Panel <span className={miRol === 'SUPER_ADMIN' ? "text-purple-500" : "text-blue-500"}>{miRol === 'SUPER_ADMIN' ? 'SÚPER ADMIN' : 'COLABORADOR'}</span>
          </h1>
          <p className="text-slate-400 mt-1">{miRol === 'SUPER_ADMIN' ? 'Gestión total del sistema.' : 'Gestión de catálogos base.'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="flex flex-col gap-2 lg:col-span-1">
          <button onClick={() => setTabActiva("marcas")} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "marcas" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Marcas</button>
          <button onClick={() => setTabActiva("fabricantes")} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "fabricantes" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Fabricantes</button>
          <button onClick={() => setTabActiva("series")} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "series" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Series</button>
          
          {/* NUEVA PESTAÑA: RAREZAS */}
          <button onClick={() => setTabActiva("rarezas")} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "rarezas" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Rarezas</button>
          
          <div className="h-px bg-slate-800 my-2"></div>
          
          <button onClick={() => setTabActiva("moderacion")} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors flex justify-between items-center ${tabActiva === "moderacion" ? "bg-amber-900/40 border border-amber-900 text-amber-400" : "text-slate-400 hover:bg-slate-800/30"}`}>
            <span>Moderación de Autos</span>
            {cochesPendientes.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">{cochesPendientes.length}</span>
            )}
          </button>

          {miRol === 'SUPER_ADMIN' && (
            <button onClick={() => setTabActiva("usuarios")} className={`mt-2 text-left px-4 py-3 rounded-lg font-medium transition-colors flex justify-between items-center ${tabActiva === "usuarios" ? "bg-emerald-900/40 border border-emerald-900 text-emerald-400" : "text-slate-400 hover:bg-slate-800/30"}`}>
              <span>Gestión de Usuarios</span>
              <span className="bg-slate-800 text-xs px-2 py-1 rounded-full">{usuarios.length}</span>
            </button>
          )}
        </aside>

        <main className="lg:col-span-3 bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
          
          <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full md:w-1/2 bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-cyan-500 outline-none" />
            
            {/* BOTÓN DINÁMICO PARA NUEVO REGISTRO */}
            {(tabActiva !== "usuarios" && tabActiva !== "moderacion") && (
              <button onClick={() => abrirModalCrear(tabActiva === 'marcas' ? 'marca' : tabActiva === 'fabricantes' ? 'fabricante' : tabActiva === 'series' ? 'serie' : 'rareza')} className="w-full md:w-auto bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md font-bold">
                + Nuevo Registro
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="pb-3 pl-2 font-medium">ID</th>
                  {tabActiva === "marcas" && <th className="pb-3 font-medium">Nombre de la Marca</th>}
                  {tabActiva === "fabricantes" && <th className="pb-3 font-medium">Nombre del Fabricante</th>}
                  {tabActiva === "series" && <><th className="pb-3 font-medium">Serie</th><th className="pb-3 font-medium">Fabricante</th><th className="pb-3 text-center font-medium">Año</th><th className="pb-3 text-center font-medium">No. Autos</th></>}
                  {tabActiva === "rarezas" && <><th className="pb-3 font-medium">Nivel de Rareza</th><th className="pb-3 font-medium">Fabricante</th></>}
                  {tabActiva === "usuarios" && <><th className="pb-3 font-medium">Usuario / Correo</th><th className="pb-3 font-medium">Nivel de Acceso (Rol)</th></>}
                  {tabActiva === "moderacion" && <><th className="pb-3 font-medium">Modelo / Datos</th><th className="pb-3 font-medium">Rareza</th><th className="pb-3 font-medium text-center">Valor ($)</th></>}
                  <th className="pb-3 text-right pr-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                
                {/* ... (Tablas Marcas, Fabricantes y Series iguales) ... */}
                {tabActiva === "marcas" && marcasFiltradas.map((m) => (
                  <tr key={m.id_marca} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pl-2 text-slate-500">#{m.id_marca}</td><td className="py-3 font-semibold">{m.marca}</td>
                    <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('marca', m)} className="text-cyan-500 hover:text-cyan-300 text-sm">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('marca', 'id_marca', m.id_marca)} className="text-red-500 hover:text-red-400 text-sm">Eliminar</button>}</td>
                  </tr>
                ))}

                {tabActiva === "fabricantes" && fabricantesFiltrados.map((f) => (
                  <tr key={f.id_fabricante} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pl-2 text-slate-500">#{f.id_fabricante}</td><td className="py-3 font-semibold">{f.fabricante}</td>
                    <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('fabricante', f)} className="text-cyan-500 hover:text-cyan-300 text-sm">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('fabricante', 'id_fabricante', f.id_fabricante)} className="text-red-500 hover:text-red-400 text-sm">Eliminar</button>}</td>
                  </tr>
                ))}

                {tabActiva === "series" && seriesFiltradas.map((s) => {
                  const nombreFabricante = fabricantes.find(f => f.id_fabricante === s.id_fabricante)?.fabricante || "Desconocido";
                  return (
                    <tr key={s.id_serie} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 pl-2 text-slate-500">#{s.id_serie}</td><td className="py-3 font-semibold text-cyan-400">{s.serie}</td><td className="py-3"><span className="bg-slate-800/80 px-2 py-1 rounded text-xs border border-slate-700 text-slate-300">{nombreFabricante}</span></td><td className="py-3 text-center text-slate-400">{s.anio}</td><td className="py-3 text-center text-slate-200 font-bold">{s.no_carros}</td>
                      <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('serie', s)} className="text-cyan-500 hover:text-cyan-300 text-sm">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('serie', 'id_serie', s.id_serie)} className="text-red-500 hover:text-red-400 text-sm">Eliminar</button>}</td>
                    </tr>
                  );
                })}

                {/* NUEVA TABLA: RAREZAS */}
                {tabActiva === "rarezas" && rarezasFiltradas.map((r) => {
                  const nombreFabricante = fabricantes.find(f => f.id_fabricante === r.id_fabricante)?.fabricante || "Desconocido";
                  return (
                    <tr key={r.id_rareza} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 pl-2 text-slate-500">#{r.id_rareza}</td>
                      <td className="py-3 font-semibold text-purple-400">{r.rareza}</td>
                      <td className="py-3"><span className="bg-slate-800/80 px-2 py-1 rounded text-xs border border-slate-700 text-slate-300">{nombreFabricante}</span></td>
                      <td className="py-3 text-right pr-2 space-x-3">
                        <button onClick={() => abrirModalEditar('rareza', r)} className="text-cyan-500 hover:text-cyan-300 text-sm">Editar</button>
                        {miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('rareza', 'id_rareza', r.id_rareza)} className="text-red-500 hover:text-red-400 text-sm">Eliminar</button>}
                      </td>
                    </tr>
                  );
                })}

                {/* ... (Tablas Usuarios y Moderación iguales) ... */}
                {miRol === 'SUPER_ADMIN' && tabActiva === "usuarios" && usuariosFiltrados.map((u) => (
                  <tr key={u.id_usuario} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pl-2 text-slate-500">#{u.id_usuario}</td><td className="py-3"><div className="font-semibold text-slate-200">{u.nombre_usuario || "Sin Nombre"}</div><div className="text-xs text-slate-500">{u.correo}</div></td>
                    <td className="py-3">
                      <select value={u.rol || "USUARIO"} onChange={(e) => cambiarRolUsuario(u.id_usuario, e.target.value)} className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${u.rol === 'SUPER_ADMIN' ? 'bg-purple-900/30 text-purple-400 border-purple-800' : u.rol === 'COLABORADOR' ? 'bg-blue-900/30 text-blue-400 border-blue-800' : u.rol === 'VENDEDOR' ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        <option value="USUARIO">Usuario (Base)</option><option value="VENDEDOR">Vendedor</option><option value="COLABORADOR">Colaborador</option><option value="SUPER_ADMIN">Súper Admin</option>
                      </select>
                    </td>
                    <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => eliminarRegistro('usuario', 'id_usuario', u.id_usuario)} className="text-red-500 hover:text-red-400 text-sm">Banear</button></td>
                  </tr>
                ))}

                {tabActiva === "moderacion" && (
                  cochesPendientes.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-500"><span className="block text-2xl mb-2">🎉</span>No hay autos pendientes.</td></tr>
                  ) : (
                    cochesPendientes.map((carro) => (
                      <tr key={carro.id_carro} className="border-b border-slate-800/50 hover:bg-slate-800/30 bg-amber-900/10">
                        <td className="py-4 pl-2 text-slate-500">#{carro.id_carro}</td>
                        <td className="py-4"><div className="font-bold text-amber-400 text-lg">{carro.modelo}</div><div className="text-xs text-slate-400 flex gap-2 mt-1"><span className="bg-slate-800 px-2 py-0.5 rounded">{carro.marca?.marca || "Sin Marca"}</span>{carro.serie && <span className="bg-slate-800 px-2 py-0.5 rounded">{carro.serie?.serie}</span>}</div></td>
                        <td className="py-4"><span className="text-sm font-semibold text-slate-300">{carro.rareza}</span></td>
                        <td className="py-4 text-center text-emerald-400 font-mono">${carro.valor}</td>
                        <td className="py-4 text-right pr-2 space-x-2">
                          <button onClick={() => aprobarAuto(carro.id_carro)} className="bg-emerald-600/20 text-emerald-400 border border-emerald-800 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-all">✓ Aprobar</button>
                          <button onClick={() => rechazarAuto(carro.id_carro)} className="bg-red-600/20 text-red-400 border border-red-800 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-all">✗ Rechazar</button>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* ... (Modales de Marca, Fabricante y Serie se mantienen igual) ... */}
      
      {/* NUEVO MODAL: RAREZA */}
      {modalAbierto === "rareza" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">{itemEditando ? 'Editar Rareza' : 'Nueva Rareza'}</h3>
            <form onSubmit={guardarRareza} className="flex flex-col gap-4">
              <select required value={nuevaRareza.id_fabricante} onChange={(e) => setNuevaRareza({...nuevaRareza, id_fabricante: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-cyan-500 outline-none">
                <option value="">-- Selecciona Fabricante --</option>
                {fabricantes.map(f => <option key={f.id_fabricante} value={f.id_fabricante}>{f.fabricante}</option>)}
              </select>
              <input type="text" required placeholder="Ej. Treasure Hunt" value={nuevaRareza.rareza} onChange={(e) => setNuevaRareza({...nuevaRareza, rareza: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-cyan-500 outline-none" />
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setModalAbierto(null)} className="text-slate-400">Cancelar</button>
                <button type="submit" disabled={cargando} className="bg-cyan-700 text-white px-4 py-2 rounded-md">{cargando ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}