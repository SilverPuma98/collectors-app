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

  // ESTADOS DE DATOS
  const [marcas, setMarcas] = useState<any[]>([]);
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [rarezas, setRarezas] = useState<any[]>([]);
  const [escalas, setEscalas] = useState<any[]>([]);
  const [estadosCarro, setEstadosCarro] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]); 
  const [coches, setCoches] = useState<any[]>([]);

  // ESTADOS DE UI
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [itemEditando, setItemEditando] = useState<any>(null);

  // ESTADOS DE FORMULARIOS
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [nuevoFabricante, setNuevoFabricante] = useState("");
  const [nuevaSerie, setNuevaSerie] = useState({ serie: "", anio: "", no_carros: "", id_fabricante: "" });
  const [nuevaRareza, setNuevaRareza] = useState({ rareza: "", id_fabricante: "" });
  const [nuevaEscala, setNuevaEscala] = useState("");
  const [nuevoEstadoCarro, setNuevoEstadoCarro] = useState("");

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
    const [resMar, resFab, resSer, resRar, resEsc, resEst, resCoc] = await Promise.all([
      supabase.from('marca').select('*').order('id_marca', { ascending: true }),
      supabase.from('fabricante').select('*').order('id_fabricante', { ascending: true }),
      supabase.from('serie').select('*').order('id_serie', { ascending: true }),
      supabase.from('rareza').select('*').order('id_rareza', { ascending: true }),
      supabase.from('escala').select('*').order('id_escala', { ascending: true }),
      supabase.from('estado_carro').select('*').order('id_estado_carro', { ascending: true }),
      supabase.from('carro').select('*, marca(marca), serie(serie)').order('estado_aprobacion', { ascending: false })
    ]);

    if (resMar.data) setMarcas(resMar.data);
    if (resFab.data) setFabricantes(resFab.data);
    if (resSer.data) setSeries(resSer.data);
    if (resRar.data) setRarezas(resRar.data);
    if (resEsc.data) setEscalas(resEsc.data);
    if (resEst.data) setEstadosCarro(resEst.data);
    if (resCoc.data) setCoches(resCoc.data);

    if (rol === 'SUPER_ADMIN') {
      const resUsu = await supabase.from('usuario').select('*').order('id_usuario', { ascending: true });
      if (resUsu.data) setUsuarios(resUsu.data);
    }
  };

  // FILTROS DE BÚSQUEDA
  const marcasFiltradas = marcas.filter(m => m.marca.toLowerCase().includes(busqueda.toLowerCase()));
  const fabricantesFiltrados = fabricantes.filter(f => f.fabricante.toLowerCase().includes(busqueda.toLowerCase()));
  const seriesFiltradas = series.filter(s => s.serie.toLowerCase().includes(busqueda.toLowerCase()));
  const rarezasFiltradas = rarezas.filter(r => r.rareza.toLowerCase().includes(busqueda.toLowerCase()));
  const escalasFiltradas = escalas.filter(e => e.escala.toLowerCase().includes(busqueda.toLowerCase()));
  const estadosFiltrados = estadosCarro.filter(e => e.estado_carro.toLowerCase().includes(busqueda.toLowerCase()));
  const cochesFiltrados = coches.filter(c => c.modelo.toLowerCase().includes(busqueda.toLowerCase()));
  const usuariosFiltrados = usuarios.filter(u => (u.nombre_usuario?.toLowerCase() || "").includes(busqueda.toLowerCase()) || (u.correo?.toLowerCase() || "").includes(busqueda.toLowerCase()));

  const abrirModalCrear = (tipo: string) => {
    setItemEditando(null); 
    setNuevaMarca(""); setNuevoFabricante(""); setNuevaEscala(""); setNuevoEstadoCarro("");
    setNuevaSerie({ serie: "", anio: "", no_carros: "", id_fabricante: "" }); 
    setNuevaRareza({ rareza: "", id_fabricante: "" });
    setModalAbierto(tipo);
  };

  const abrirModalEditar = (tipo: string, item: any) => {
    setItemEditando(item);
    if (tipo === "marca") setNuevaMarca(item.marca);
    if (tipo === "fabricante") setNuevoFabricante(item.fabricante);
    if (tipo === "serie") setNuevaSerie({ serie: item.serie, anio: item.anio || "", no_carros: item.no_carros || "", id_fabricante: item.id_fabricante });
    if (tipo === "rareza") setNuevaRareza({ rareza: item.rareza, id_fabricante: item.id_fabricante });
    if (tipo === "escala") setNuevaEscala(item.escala);
    if (tipo === "estado") setNuevoEstadoCarro(item.estado_carro);
    setModalAbierto(tipo);
  };

  // ==========================================
  // FUNCIONES DE GUARDADO (CRUD) - A PRUEBA DE FALLOS
  // ==========================================
  const guardarMarca = async (e: React.FormEvent) => { 
    e.preventDefault(); setCargando(true); 
    const { error } = itemEditando ? await supabase.from('marca').update({ marca: nuevaMarca }).eq('id_marca', itemEditando.id_marca) : await supabase.from('marca').insert([{ marca: nuevaMarca }]); 
    if (error) alert("Error al guardar: " + error.message); else { await cargarTodosLosDatos(miRol); setModalAbierto(null); } setCargando(false); 
  };
  
  const guardarFabricante = async (e: React.FormEvent) => { 
    e.preventDefault(); setCargando(true); 
    const { error } = itemEditando ? await supabase.from('fabricante').update({ fabricante: nuevoFabricante }).eq('id_fabricante', itemEditando.id_fabricante) : await supabase.from('fabricante').insert([{ fabricante: nuevoFabricante }]); 
    if (error) alert("Error al guardar: " + error.message); else { await cargarTodosLosDatos(miRol); setModalAbierto(null); } setCargando(false); 
  };
  
  const guardarSerie = async (e: React.FormEvent) => { 
    e.preventDefault(); setCargando(true); 
    const payload = { serie: nuevaSerie.serie, anio: parseInt(nuevaSerie.anio) || null, no_carros: parseInt(nuevaSerie.no_carros) || null, id_fabricante: parseInt(nuevaSerie.id_fabricante) }; 
    const { error } = itemEditando ? await supabase.from('serie').update(payload).eq('id_serie', itemEditando.id_serie) : await supabase.from('serie').insert([payload]); 
    if (error) alert("Error al guardar: " + error.message); else { await cargarTodosLosDatos(miRol); setModalAbierto(null); } setCargando(false); 
  };
  
  const guardarRareza = async (e: React.FormEvent) => { 
    e.preventDefault(); setCargando(true); 
    const payload = { rareza: nuevaRareza.rareza, id_fabricante: parseInt(nuevaRareza.id_fabricante) }; 
    const { error } = itemEditando ? await supabase.from('rareza').update(payload).eq('id_rareza', itemEditando.id_rareza) : await supabase.from('rareza').insert([payload]); 
    if (error) alert("Error al guardar: " + error.message); else { await cargarTodosLosDatos(miRol); setModalAbierto(null); } setCargando(false); 
  };
  
  const guardarEscala = async (e: React.FormEvent) => { 
    e.preventDefault(); setCargando(true); 
    const { error } = itemEditando ? await supabase.from('escala').update({ escala: nuevaEscala }).eq('id_escala', itemEditando.id_escala) : await supabase.from('escala').insert([{ escala: nuevaEscala }]); 
    if (error) alert("Error al guardar: " + error.message); else { await cargarTodosLosDatos(miRol); setModalAbierto(null); } setCargando(false); 
  };
  
  const guardarEstadoCarro = async (e: React.FormEvent) => { 
    e.preventDefault(); setCargando(true); 
    const { error } = itemEditando ? await supabase.from('estado_carro').update({ estado_carro: nuevoEstadoCarro }).eq('id_estado_carro', itemEditando.id_estado_carro) : await supabase.from('estado_carro').insert([{ estado_carro: nuevoEstadoCarro }]); 
    if (error) alert("Error al guardar: " + error.message); else { await cargarTodosLosDatos(miRol); setModalAbierto(null); } setCargando(false); 
  };

  const eliminarRegistro = async (tabla: string, columnaId: string, id: number) => {
    if (miRol !== 'SUPER_ADMIN') { alert("Solo los Súper Administradores pueden eliminar."); return; }
    const confirmar = window.confirm("⚠️ ¿Estás seguro de eliminar este registro?");
    if (!confirmar) return;
    const { error } = await supabase.from(tabla).delete().eq(columnaId, id);
    if (error) alert("Error: " + error.message); else cargarTodosLosDatos(miRol);
  };

  // MODERACIÓN Y ROLES
  const cambiarRolUsuario = async (id_usuario: number, nuevoRol: string) => {
    const { error } = await supabase.from('usuario').update({ rol: nuevoRol }).eq('id_usuario', id_usuario);
    if (error) alert("Error: " + error.message); else cargarTodosLosDatos(miRol);
  };

  const aprobarAuto = async (id_carro: number) => {
    const { error } = await supabase.from('carro').update({ estado_aprobacion: 'APROBADO' }).eq('id_carro', id_carro);
    if (error) alert("Error al aprobar: " + error.message); else cargarTodosLosDatos(miRol);
  };

  const rechazarAuto = async (id_carro: number) => {
    const confirmar = window.confirm("¿Rechazar y eliminar este auto permanentemente del sistema?");
    if (!confirmar) return;
    const { error } = await supabase.from('carro').delete().eq('id_carro', id_carro);
    if (error) alert("Error al rechazar: " + error.message); else cargarTodosLosDatos(miRol);
  };

  if (!autorizado) return <div className="flex h-screen items-center justify-center text-cyan-500 animate-pulse font-bold">VERIFICANDO NIVEL DE ACCESO...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 w-full relative">
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">
            Panel <span className={miRol === 'SUPER_ADMIN' ? "text-purple-500" : "text-cyan-500"}>{miRol === 'SUPER_ADMIN' ? 'SÚPER ADMIN' : 'COLABORADOR'}</span>
          </h1>
          <p className="text-slate-400 mt-1">{miRol === 'SUPER_ADMIN' ? 'Gestión total del sistema.' : 'Gestión de catálogos base.'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <aside className="flex flex-row lg:flex-col gap-2 lg:col-span-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <button onClick={() => setTabActiva("marcas")} className={`whitespace-nowrap text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "marcas" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Marcas</button>
          <button onClick={() => setTabActiva("fabricantes")} className={`whitespace-nowrap text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "fabricantes" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Fabricantes</button>
          <button onClick={() => setTabActiva("series")} className={`whitespace-nowrap text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "series" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Series</button>
          <button onClick={() => setTabActiva("rarezas")} className={`whitespace-nowrap text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "rarezas" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Rarezas</button>
          <button onClick={() => setTabActiva("escalas")} className={`whitespace-nowrap text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "escalas" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Escalas</button>
          <button onClick={() => setTabActiva("estados")} className={`whitespace-nowrap text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "estados" ? "bg-slate-800 border border-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}>Est. Autos</button>
          
          <div className="hidden lg:block h-px bg-slate-800 my-2"></div>
          
          <button onClick={() => setTabActiva("coches")} className={`whitespace-nowrap text-left px-4 py-3 rounded-lg font-medium transition-colors flex justify-between items-center ${tabActiva === "coches" ? "bg-amber-900/40 border border-amber-900 text-amber-400" : "text-slate-400 hover:bg-slate-800/30"}`}>
            <span>Todos los Autos</span>
            {coches.filter(c => c.estado_aprobacion === 'PENDIENTE').length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse ml-2">{coches.filter(c => c.estado_aprobacion === 'PENDIENTE').length}</span>
            )}
          </button>

          {miRol === 'SUPER_ADMIN' && (
            <button onClick={() => setTabActiva("usuarios")} className={`whitespace-nowrap lg:mt-2 text-left px-4 py-3 rounded-lg font-medium transition-colors flex justify-between items-center ${tabActiva === "usuarios" ? "bg-emerald-900/40 border border-emerald-900 text-emerald-400" : "text-slate-400 hover:bg-slate-800/30"}`}>
              <span>Usuarios</span>
              <span className="bg-slate-800 text-xs px-2 py-1 rounded-full ml-2">{usuarios.length}</span>
            </button>
          )}
        </aside>

        <main className="lg:col-span-4 bg-[#0b1120] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl min-h-[500px] overflow-hidden">
          
          <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full md:w-1/2 bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-cyan-500 outline-none" />
            
            {(tabActiva !== "usuarios" && tabActiva !== "coches") && (
              <button onClick={() => abrirModalCrear(tabActiva === 'estados' ? 'estado' : tabActiva.slice(0, -1))} className="w-full md:w-auto bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md font-bold">
                + Nuevo Registro
              </button>
            )}
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="pb-3 pl-2 font-medium">ID</th>
                  {tabActiva === "marcas" && <th className="pb-3 font-medium">Nombre de la Marca</th>}
                  {tabActiva === "fabricantes" && <th className="pb-3 font-medium">Nombre del Fabricante</th>}
                  {tabActiva === "escalas" && <th className="pb-3 font-medium">Escala</th>}
                  {tabActiva === "estados" && <th className="pb-3 font-medium">Estado del Auto</th>}
                  {tabActiva === "series" && <><th className="pb-3 font-medium">Serie</th><th className="pb-3 font-medium">Fabricante</th><th className="pb-3 text-center font-medium">Año</th><th className="pb-3 text-center font-medium">Autos</th></>}
                  {tabActiva === "rarezas" && <><th className="pb-3 font-medium">Nivel de Rareza</th><th className="pb-3 font-medium">Fabricante</th></>}
                  {tabActiva === "usuarios" && <><th className="pb-3 font-medium">Usuario / Correo</th><th className="pb-3 font-medium">Rol</th></>}
                  {tabActiva === "coches" && <><th className="pb-3 font-medium">Auto</th><th className="pb-3 font-medium">Estatus</th><th className="pb-3 font-medium text-center">Valor</th></>}
                  <th className="pb-3 text-right pr-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                
                {tabActiva === "marcas" && marcasFiltradas.map((m) => (
                  <tr key={m.id_marca} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pl-2 text-slate-500">#{m.id_marca}</td><td className="py-3 font-semibold">{m.marca}</td>
                    <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('marca', m)} className="text-cyan-500 font-bold p-2">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('marca', 'id_marca', m.id_marca)} className="text-red-500 font-bold p-2">Eliminar</button>}</td>
                  </tr>
                ))}

                {tabActiva === "fabricantes" && fabricantesFiltrados.map((f) => (
                  <tr key={f.id_fabricante} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pl-2 text-slate-500">#{f.id_fabricante}</td><td className="py-3 font-semibold">{f.fabricante}</td>
                    <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('fabricante', f)} className="text-cyan-500 font-bold p-2">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('fabricante', 'id_fabricante', f.id_fabricante)} className="text-red-500 font-bold p-2">Eliminar</button>}</td>
                  </tr>
                ))}

                {tabActiva === "escalas" && escalasFiltradas.map((e) => (
                  <tr key={e.id_escala} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pl-2 text-slate-500">#{e.id_escala}</td><td className="py-3 font-semibold">{e.escala}</td>
                    <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('escala', e)} className="text-cyan-500 font-bold p-2">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('escala', 'id_escala', e.id_escala)} className="text-red-500 font-bold p-2">Eliminar</button>}</td>
                  </tr>
                ))}

                {tabActiva === "estados" && estadosFiltrados.map((e) => (
                  <tr key={e.id_estado_carro} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pl-2 text-slate-500">#{e.id_estado_carro}</td><td className="py-3 font-semibold">{e.estado_carro}</td>
                    <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('estado', e)} className="text-cyan-500 font-bold p-2">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('estado_carro', 'id_estado_carro', e.id_estado_carro)} className="text-red-500 font-bold p-2">Eliminar</button>}</td>
                  </tr>
                ))}

                {tabActiva === "series" && seriesFiltradas.map((s) => {
                  const nombreFabricante = fabricantes.find(f => f.id_fabricante === s.id_fabricante)?.fabricante || "Desconocido";
                  return (
                    <tr key={s.id_serie} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 pl-2 text-slate-500">#{s.id_serie}</td><td className="py-3 font-semibold text-cyan-400">{s.serie}</td><td className="py-3"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{nombreFabricante}</span></td><td className="py-3 text-center">{s.anio || "-"}</td><td className="py-3 text-center font-bold">{s.no_carros || "-"}</td>
                      <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('serie', s)} className="text-cyan-500 font-bold p-2">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('serie', 'id_serie', s.id_serie)} className="text-red-500 font-bold p-2">Eliminar</button>}</td>
                    </tr>
                  );
                })}

                {tabActiva === "rarezas" && rarezasFiltradas.map((r) => {
                  const nombreFabricante = fabricantes.find(f => f.id_fabricante === r.id_fabricante)?.fabricante || "Desconocido";
                  return (
                    <tr key={r.id_rareza} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 pl-2 text-slate-500">#{r.id_rareza}</td><td className="py-3 font-semibold text-purple-400">{r.rareza}</td><td className="py-3"><span className="bg-slate-800 px-2 py-1 rounded text-xs">{nombreFabricante}</span></td>
                      <td className="py-3 text-right pr-2 space-x-3"><button onClick={() => abrirModalEditar('rareza', r)} className="text-cyan-500 font-bold p-2">Editar</button>{miRol === 'SUPER_ADMIN' && <button onClick={() => eliminarRegistro('rareza', 'id_rareza', r.id_rareza)} className="text-red-500 font-bold p-2">Eliminar</button>}</td>
                    </tr>
                  );
                })}

                {miRol === 'SUPER_ADMIN' && tabActiva === "usuarios" && usuariosFiltrados.map((u) => (
                  <tr key={u.id_usuario} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pl-2 text-slate-500">#{u.id_usuario}</td><td className="py-3"><div className="font-semibold text-slate-200">{u.nombre_usuario || "Sin Nombre"}</div><div className="text-xs text-slate-500">{u.correo}</div></td>
                    <td className="py-3">
                      <select value={u.rol || "USUARIO"} onChange={(e) => cambiarRolUsuario(u.id_usuario, e.target.value)} className="bg-slate-800 text-slate-300 border-slate-700 px-2 py-1 rounded outline-none text-xs font-bold">
                        <option value="USUARIO">Usuario (Base)</option><option value="VENDEDOR">Vendedor</option><option value="COLABORADOR">Colaborador</option><option value="SUPER_ADMIN">Súper Admin</option>
                      </select>
                    </td>
                    <td className="py-3 text-right pr-2"><button onClick={() => eliminarRegistro('usuario', 'id_usuario', u.id_usuario)} className="text-red-500 font-bold p-2">Banear</button></td>
                  </tr>
                ))}

                {tabActiva === "coches" && cochesFiltrados.map((carro) => (
                  <tr key={carro.id_carro} className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${carro.estado_aprobacion === 'PENDIENTE' ? 'bg-amber-900/10' : ''}`}>
                    <td className="py-4 pl-2 text-slate-500">#{carro.id_carro}</td>
                    <td className="py-4"><div className="font-bold text-white">{carro.modelo}</div><div className="text-xs text-slate-400 mt-1">{carro.marca?.marca || "Sin Marca"}</div></td>
                    <td className="py-4">
                      {carro.estado_aprobacion === 'PENDIENTE' ? (
                        <span className="bg-amber-500/20 text-amber-500 border border-amber-500/50 px-2 py-1 rounded text-[10px] font-bold uppercase animate-pulse">Pendiente</span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 px-2 py-1 rounded text-[10px] font-bold uppercase">Aprobado</span>
                      )}
                    </td>
                    <td className="py-4 text-center text-emerald-400 font-mono">${carro.valor}</td>
                    <td className="py-4 text-right pr-2 space-x-2">
                      {carro.estado_aprobacion === 'PENDIENTE' && <button onClick={() => aprobarAuto(carro.id_carro)} className="text-emerald-400 font-bold p-2 hover:bg-emerald-900/30 rounded">Aprobar</button>}
                      <button onClick={() => rechazarAuto(carro.id_carro)} className="text-red-400 font-bold p-2 hover:bg-red-900/30 rounded">{carro.estado_aprobacion === 'PENDIENTE' ? 'Rechazar' : 'Eliminar'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODALES DE EDICIÓN Y CREACIÓN
          ========================================================================= */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4 capitalize">{itemEditando ? `Editar ${modalAbierto}` : `Nuevo ${modalAbierto}`}</h3>
            
            {/* ESTE FORMULARIO AHORA ATRAPA ERRORES Y SABE EXACTAMENTE QUÉ FUNCIÓN LLAMAR */}
            <form onSubmit={(e) => {
              if (modalAbierto === 'marca') guardarMarca(e);
              else if (modalAbierto === 'fabricante') guardarFabricante(e);
              else if (modalAbierto === 'serie') guardarSerie(e);
              else if (modalAbierto === 'rareza') guardarRareza(e);
              else if (modalAbierto === 'escala') guardarEscala(e);
              else if (modalAbierto === 'estado') guardarEstadoCarro(e);
            }} className="flex flex-col gap-4">
              
              {modalAbierto === 'marca' && <input type="text" required placeholder="Nombre de la marca" value={nuevaMarca} onChange={(e) => setNuevaMarca(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none" />}
              
              {modalAbierto === 'fabricante' && <input type="text" required placeholder="Nombre del fabricante" value={nuevoFabricante} onChange={(e) => setNuevoFabricante(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none" />}
              
              {modalAbierto === 'escala' && <input type="text" required placeholder="Ej: 1:64" value={nuevaEscala} onChange={(e) => setNuevaEscala(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none" />}
              
              {modalAbierto === 'estado' && <input type="text" required placeholder="Ej: Nuevo en Blister" value={nuevoEstadoCarro} onChange={(e) => setNuevoEstadoCarro(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none" />}
              
              {modalAbierto === 'serie' && (
                <>
                  <select required value={nuevaSerie.id_fabricante} onChange={(e) => setNuevaSerie({...nuevaSerie, id_fabricante: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none cursor-pointer">
                    <option value="">-- Selecciona Fabricante --</option>
                    {fabricantes.map(f => <option key={f.id_fabricante} value={f.id_fabricante}>{f.fabricante}</option>)}
                  </select>
                  <input type="text" required placeholder="Nombre de la serie" value={nuevaSerie.serie} onChange={(e) => setNuevaSerie({...nuevaSerie, serie: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none" />
                  <div className="flex gap-2">
                    <input type="number" placeholder="Año" value={nuevaSerie.anio} onChange={(e) => setNuevaSerie({...nuevaSerie, anio: e.target.value})} className="w-1/2 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none" />
                    <input type="number" placeholder="Total Autos" value={nuevaSerie.no_carros} onChange={(e) => setNuevaSerie({...nuevaSerie, no_carros: e.target.value})} className="w-1/2 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none" />
                  </div>
                </>
              )}

              {modalAbierto === 'rareza' && (
                <>
                  <select required value={nuevaRareza.id_fabricante} onChange={(e) => setNuevaRareza({...nuevaRareza, id_fabricante: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none cursor-pointer">
                    <option value="">-- Selecciona Fabricante --</option>
                    {fabricantes.map(f => <option key={f.id_fabricante} value={f.id_fabricante}>{f.fabricante}</option>)}
                  </select>
                  <input type="text" required placeholder="Ej. Treasure Hunt" value={nuevaRareza.rareza} onChange={(e) => setNuevaRareza({...nuevaRareza, rareza: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 outline-none" />
                </>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setModalAbierto(null)} className="text-slate-400 p-2 font-bold">Cancelar</button>
                <button type="submit" disabled={cargando} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md font-bold transition-colors">{cargando ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}