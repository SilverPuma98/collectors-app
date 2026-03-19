"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  
  // SISTEMA DE PESTAÑAS (TABS)
  const [tabActiva, setTabActiva] = useState("marcas"); // 'marcas' | 'fabricantes' | 'series'

  // ESTADOS PARA LOS DATOS (Las listas que vienen de la BD)
  const [marcas, setMarcas] = useState<any[]>([]);
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);

  // ESTADOS PARA LOS MODALES (Ventanas emergentes)
  const [modalAbierto, setModalAbierto] = useState<string | null>(null); // 'marca', 'fabricante', 'serie' o null
  const [cargando, setCargando] = useState(false);

  // ESTADOS PARA LOS FORMULARIOS
  const [nuevaMarca, setNuevaMarca] = useState("");
  const [nuevoFabricante, setNuevoFabricante] = useState("");
  const [nuevaSerie, setNuevaSerie] = useState({
    serie: "",
    anio: "",
    no_carros: "",
    id_fabricante: ""
  });

  // 1. EL CADENERO
  useEffect(() => {
    validarAcceso();
  }, []);

  const validarAcceso = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
    } else {
      setAutorizado(true);
      cargarTodosLosDatos();
    }
  };

  // 2. CARGAR TODOS LOS CATÁLOGOS
  const cargarTodosLosDatos = async () => {
    // Cargamos Marcas
    const resMarcas = await supabase.from('marca').select('*').order('marca', { ascending: true });
    if (resMarcas.data) setMarcas(resMarcas.data);

    // Cargamos Fabricantes
    const resFabricantes = await supabase.from('fabricante').select('*').order('id_fabricante', { ascending: true });
    if (resFabricantes.data) setFabricantes(resFabricantes.data);

    // Cargamos Series
    const resSeries = await supabase.from('serie').select('*').order('id_serie', { ascending: true });
    if (resSeries.data) setSeries(resSeries.data);
  };

  // 3. FUNCIONES PARA GUARDAR
  const guardarMarca = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const { data, error } = await supabase.from('marca').insert([{ marca: nuevaMarca }]).select();
    if (!error && data) {
      setMarcas([...marcas, data[0]]);
      setModalAbierto(null);
      setNuevaMarca("");
    }
    setCargando(false);
  };

  const guardarFabricante = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const { data, error } = await supabase.from('fabricante').insert([{ fabricante: nuevoFabricante }]).select();
    if (!error && data) {
      setFabricantes([...fabricantes, data[0]]);
      setModalAbierto(null);
      setNuevoFabricante("");
    }
    setCargando(false);
  };

  const guardarSerie = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const { data, error } = await supabase.from('serie').insert([{
      serie: nuevaSerie.serie,
      anio: parseInt(nuevaSerie.anio),
      no_carros: parseInt(nuevaSerie.no_carros),
      id_fabricante: parseInt(nuevaSerie.id_fabricante)
    }]).select();

    if (error) {
      alert("Error al guardar serie: " + error.message);
    } else if (data) {
      setSeries([...series, data[0]]);
      setModalAbierto(null);
      setNuevaSerie({ serie: "", anio: "", no_carros: "", id_fabricante: "" });
    }
    setCargando(false);
  };

  if (!autorizado) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-cyan-500 font-bold tracking-widest animate-pulse border border-cyan-900 bg-cyan-950/30 px-6 py-3 rounded-md">
          ESCANEANDO CREDENCIALES...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 w-full relative">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">
            Panel de Control <span className="text-cyan-500 text-sm align-top">PRO</span>
          </h1>
          <p className="text-slate-400 mt-1">Gestión de catálogos base del sistema.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* =========================================
            EL MENÚ LATERAL (TABS)
            ========================================= */}
        <aside className="flex flex-col gap-2 lg:col-span-1">
          <button 
            onClick={() => setTabActiva("marcas")}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "marcas" ? "bg-slate-800/80 border border-cyan-900/50 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}
          >
            1. Marcas (Autos)
          </button>
          <button 
            onClick={() => setTabActiva("fabricantes")}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "fabricantes" ? "bg-slate-800/80 border border-cyan-900/50 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}
          >
            2. Fabricantes (Juguetes)
          </button>
          <button 
            onClick={() => setTabActiva("series")}
            className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${tabActiva === "series" ? "bg-slate-800/80 border border-cyan-900/50 text-cyan-400" : "text-slate-400 hover:bg-slate-800/30"}`}
          >
            3. Series de Colección
          </button>
        </aside>

        {/* =========================================
            ZONA DE TABLAS DINÁMICA
            ========================================= */}
        <main className="lg:col-span-3 bg-[#0b1120] border border-slate-800/80 rounded-2xl p-6 shadow-xl min-h-[400px]">
          
          {/* TAB: MARCAS */}
          {tabActiva === "marcas" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-100">Catálogo: Marcas de Autos</h2>
                <button onClick={() => setModalAbierto("marca")} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                  + Nueva Marca
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-sm uppercase"><th className="pb-3 pl-2">ID</th><th className="pb-3">Marca</th></tr>
                </thead>
                <tbody className="text-slate-300">
                  {marcas.map((m) => (<tr key={m.id_marca} className="border-b border-slate-800/50"><td className="py-3 pl-2">#{m.id_marca}</td><td className="py-3 font-semibold">{m.marca}</td></tr>))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: FABRICANTES */}
          {tabActiva === "fabricantes" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-100">Catálogo: Fabricantes</h2>
                <button onClick={() => setModalAbierto("fabricante")} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                  + Nuevo Fabricante
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-sm uppercase"><th className="pb-3 pl-2">ID</th><th className="pb-3">Fabricante</th></tr>
                </thead>
                <tbody className="text-slate-300">
                  {fabricantes.map((f) => (<tr key={f.id_fabricante} className="border-b border-slate-800/50"><td className="py-3 pl-2">#{f.id_fabricante}</td><td className="py-3 font-semibold">{f.fabricante}</td></tr>))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: SERIES */}
          {tabActiva === "series" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-100">Catálogo: Series</h2>
                <button onClick={() => setModalAbierto("serie")} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                  + Nueva Serie
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-sm uppercase">
                    <th className="pb-3 pl-2">ID</th>
                    <th className="pb-3">Serie</th>
                    <th className="pb-3">Año</th>
                    <th className="pb-3">No. Carros</th>
                    <th className="pb-3">ID Fabricante</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {series.map((s) => (
                    <tr key={s.id_serie} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="py-3 pl-2 text-slate-500">#{s.id_serie}</td>
                      <td className="py-3 font-semibold text-cyan-400">{s.serie}</td>
                      <td className="py-3">{s.anio}</td>
                      <td className="py-3">{s.no_carros}</td>
                      <td className="py-3 text-slate-500">#{s.id_fabricante}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>

      {/* =========================================
          ZONA DE VENTANAS EMERGENTES (MODALES)
          ========================================= */}
      
      {/* Modal Fabricante */}
      {modalAbierto === "fabricante" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Registrar Fabricante</h3>
            <form onSubmit={guardarFabricante} className="flex flex-col gap-4">
              <input type="text" required autoFocus placeholder="Ej. Hot Wheels, Matchbox..." value={nuevoFabricante} onChange={(e) => setNuevoFabricante(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500" />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setModalAbierto(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={cargando} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-bold">{cargando ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Serie */}
      {modalAbierto === "serie" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Registrar Nueva Serie</h3>
            <form onSubmit={guardarSerie} className="flex flex-col gap-4">
              
              <div>
                <label className="text-xs text-cyan-500 font-bold uppercase">Fabricante *</label>
                <select required value={nuevaSerie.id_fabricante} onChange={(e) => setNuevaSerie({...nuevaSerie, id_fabricante: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-cyan-500">
                  <option value="">-- Selecciona un Fabricante --</option>
                  {fabricantes.map(f => (
                    <option key={f.id_fabricante} value={f.id_fabricante}>{f.fabricante}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-cyan-500 font-bold uppercase">Nombre de la Serie *</label>
                <input type="text" required placeholder="Ej. HW Turbo" value={nuevaSerie.serie} onChange={(e) => setNuevaSerie({...nuevaSerie, serie: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-cyan-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyan-500 font-bold uppercase">Año *</label>
                  <input type="number" required placeholder="2024" value={nuevaSerie.anio} onChange={(e) => setNuevaSerie({...nuevaSerie, anio: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-xs text-cyan-500 font-bold uppercase">No. de Autos *</label>
                  <input type="number" required placeholder="5" value={nuevaSerie.no_carros} onChange={(e) => setNuevaSerie({...nuevaSerie, no_carros: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 mt-1 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setModalAbierto(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={cargando} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-bold">{cargando ? "Guardando..." : "Guardar Serie"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Marca (Conservado de antes) */}
      {modalAbierto === "marca" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Registrar Marca de Auto</h3>
            <form onSubmit={guardarMarca} className="flex flex-col gap-4">
              <input type="text" required autoFocus placeholder="Ej. Nissan, Ford..." value={nuevaMarca} onChange={(e) => setNuevaMarca(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500" />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setModalAbierto(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={cargando} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-bold">{cargando ? "Guardando..." : "Guardar Marca"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}