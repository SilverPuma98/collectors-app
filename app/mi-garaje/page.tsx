"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CollectorCard from "@/components/CollectorCard";
import { evaluarLogros } from "@/lib/logrosEngine";
import AchievementUnlock from "@/components/AchievementUnlock";

export default function MiGaraje() {
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [miPerfil, setMiPerfil] = useState<any>(null);
  const [misCarros, setMisCarros] = useState<any[]>([]);
  
  // CATÁLOGOS BASE
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [rarezas, setRarezas] = useState<any[]>([]);
  const [escalas, setEscalas] = useState<any[]>([]);
  const [estadosCarro, setEstadosCarro] = useState<any[]>([]);

  // ESTADOS DEL MODAL Y EDICIÓN
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cocheEditando, setCocheEditando] = useState<number | null>(null);
  
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [nuevosLogros, setNuevosLogros] = useState<string[]>([]);

  // ESTADO DEL FORMULARIO (Ahora incluye el Año)
  const [nuevoCarro, setNuevoCarro] = useState({
    modelo: "", id_fabricante: "", otro_fabricante: "", id_marca: "", otra_marca: "",
    id_serie: "", otra_serie: "", rareza: "", valor: "", id_escala: "", id_estado_carro: "", 
    no_carro: "", total_carros: "", anio_serie: ""
  });

  // Generador de Años (Desde el actual hasta 1890)
  const anioActual = new Date().getFullYear();
  const aniosDisponibles = Array.from({ length: anioActual - 1890 + 1 }, (_, i) => anioActual - i);

  useEffect(() => {
    inicializarGaraje();
  }, []);

  const inicializarGaraje = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: perfil } = await supabase.from('usuario').select('*').eq('correo', user.email).single();
      if (perfil) {
        setMiPerfil(perfil);
        await Promise.all([cargarCatalogos(), cargarMisCarros(perfil.id_usuario)]);
      }
    }
    setCargandoDatos(false);
  };

  const cargarCatalogos = async () => {
    const [resFab, resMar, resSer, resRar, resEsc, resEst] = await Promise.all([
      supabase.from('fabricante').select('*').order('fabricante'),
      supabase.from('marca').select('*').order('marca'),
      supabase.from('serie').select('*'),
      supabase.from('rareza').select('*'),
      supabase.from('escala').select('*'),
      supabase.from('estado_carro').select('*')
    ]);
    if (resFab.data) setFabricantes(resFab.data);
    if (resMar.data) setMarcas(resMar.data);
    if (resSer.data) setSeries(resSer.data);
    if (resRar.data) setRarezas(resRar.data);
    if (resEsc.data) setEscalas(resEsc.data);
    if (resEst.data) setEstadosCarro(resEst.data);
  };

  const cargarMisCarros = async (idUsuario: number) => {
    const { data } = await supabase.from('carro').select(`*, marca(marca), serie(*)`).eq('id_usuario', idUsuario).order('id_carro', { ascending: false });
    if (data) setMisCarros(data);
  };

  const manejarCapturaFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFotoArchivo(file); setFotoPreview(URL.createObjectURL(file)); }
  };

  // MAGIC CREATE: Si el usuario escribe algo nuevo, lo guarda en el catálogo para todos
  const crearSiEsNuevo = async (tabla: string, columna: string, idSeleccionado: string, valorNuevo: string, extraData: any = {}) => {
    if (idSeleccionado !== "nuevo") return parseInt(idSeleccionado) || null;
    if (!valorNuevo) return null;
    
    const existente = await supabase.from(tabla).select(`id_${tabla}`).ilike(columna, valorNuevo).single();
    if (existente.data) return (existente.data as Record<string, any>)[`id_${tabla}`];
    
    const { data } = await supabase.from(tabla).insert([{ [columna]: valorNuevo, ...extraData }]).select().single();
    return data ? (data as Record<string, any>)[`id_${tabla}`] : null;
  };

  // ==========================================
  // AUTO-COMPLETAR DATOS DE LA SERIE
  // ==========================================
  // Si el usuario selecciona una serie existente, llenamos automáticamente el Total de Carros y el Año
  useEffect(() => {
    if (nuevoCarro.id_serie && nuevoCarro.id_serie !== "nuevo") {
      const serieSeleccionada = series.find(s => s.id_serie === parseInt(nuevoCarro.id_serie));
      if (serieSeleccionada) {
        setNuevoCarro(prev => ({
          ...prev,
          total_carros: serieSeleccionada.no_carros ? serieSeleccionada.no_carros.toString() : "",
          anio_serie: serieSeleccionada.anio ? serieSeleccionada.anio.toString() : prev.anio_serie // Solo sobreescribe si hay año registrado
        }));
      }
    } else if (nuevoCarro.id_serie === "nuevo") {
      setNuevoCarro(prev => ({ ...prev, total_carros: "", anio_serie: "" })); // Limpiamos si va a crear una nueva
    }
  }, [nuevoCarro.id_serie, series]);

  // ==========================================
  // LÓGICA DE GUARDAR / ACTUALIZAR
  // ==========================================
  const guardarNuevoCarro = async (e: React.FormEvent) => {
    e.preventDefault(); setGuardando(true);

    let imagenUrlFinal = fotoPreview?.includes('blob:') ? null : fotoPreview;
    
    if (fotoArchivo) {
      const extension = fotoArchivo.name.split('.').pop();
      const nombreArchivo = `${miPerfil.id_usuario}_${Date.now()}.${extension}`;
      await supabase.storage.from('autos').upload(nombreArchivo, fotoArchivo);
      const { data } = supabase.storage.from('autos').getPublicUrl(nombreArchivo);
      imagenUrlFinal = data.publicUrl;
    }

    const finalIdFab = await crearSiEsNuevo('fabricante', 'fabricante', nuevoCarro.id_fabricante, nuevoCarro.otro_fabricante);
    const finalIdMar = await crearSiEsNuevo('marca', 'marca', nuevoCarro.id_marca, nuevoCarro.otra_marca);
    
    // Al crear una serie nueva, le pasamos también el año y el total de carros para que alimente el catálogo
    const finalIdSer = await crearSiEsNuevo('serie', 'serie', nuevoCarro.id_serie, nuevoCarro.otra_serie, { 
      id_fabricante: finalIdFab,
      anio: parseInt(nuevoCarro.anio_serie) || null,
      no_carros: parseInt(nuevoCarro.total_carros) || null
    });

    const payload: any = {
      modelo: nuevoCarro.modelo,
      id_fabricante: finalIdFab, marca: finalIdMar, serie: finalIdSer,  
      rareza: nuevoCarro.rareza, 
      valor: parseFloat(nuevoCarro.valor) || 0,
      escala: parseInt(nuevoCarro.id_escala) || null,
      estado_carro: parseInt(nuevoCarro.id_estado_carro) || null,
      no_carro: parseInt(nuevoCarro.no_carro) || null,
    };

    if (imagenUrlFinal) payload.imagen_url = imagenUrlFinal;

    if (cocheEditando) {
      const { error } = await supabase.from('carro').update(payload).eq('id_carro', cocheEditando);
      if (error) alert("Error al editar: " + error.message);
      else { cargarMisCarros(miPerfil.id_usuario); cerrarModal(); alert("¡Pieza actualizada!"); }
    } else {
      payload.id_usuario = miPerfil.id_usuario;
      payload.estado_aprobacion = (miPerfil.rol === 'SUPER_ADMIN' || miPerfil.rol === 'COLABORADOR') ? 'APROBADO' : 'PENDIENTE';
      const { error } = await supabase.from('carro').insert([payload]);
      
      if (error) alert("Error al registrar: " + error.message);
      else {
        cargarMisCarros(miPerfil.id_usuario); cerrarModal();
        const medallasGanadas = await evaluarLogros(miPerfil.id_usuario);
        if (medallasGanadas && medallasGanadas.length > 0) setNuevosLogros(medallasGanadas);
      }
    }
    setGuardando(false);
  };

  // ==========================================
  // LÓGICA DE EDITAR (Precarga TOTAL)
  // ==========================================
  const abrirParaEditar = (carro: any) => {
    setCocheEditando(carro.id_carro);
    
    // Mapeamos los textos a IDs para que los Selects se llenen correctamente
    const idMarcaReal = marcas.find(m => m.marca === carro.marca?.marca)?.id_marca || "";
    const idSerieReal = carro.serie?.id_serie || "";

    setNuevoCarro({
      modelo: carro.modelo || "",
      id_fabricante: carro.id_fabricante ? carro.id_fabricante.toString() : "", otro_fabricante: "",
      id_marca: idMarcaReal.toString(), otra_marca: "",
      id_serie: idSerieReal.toString(), otra_serie: "",
      rareza: carro.rareza || "",
      valor: carro.valor ? carro.valor.toString() : "",
      id_escala: carro.escala ? carro.escala.toString() : "",
      id_estado_carro: carro.estado_carro ? carro.estado_carro.toString() : "",
      no_carro: carro.no_carro ? carro.no_carro.toString() : "",
      // Si la serie tiene año y total de carros guardados, los usamos, si no, lo dejamos vacío
      total_carros: carro.serie?.no_carros ? carro.serie.no_carros.toString() : "",
      anio_serie: carro.serie?.anio ? carro.serie.anio.toString() : ""
    });
    setFotoPreview(carro.imagen_url || null);
    setFotoArchivo(null);
    setIsModalOpen(true);
  };

  const eliminarCarro = async (idCarro: number) => {
    const confirmar = window.confirm("⚠️ ¿Eliminar esta pieza de tu colección? Esta acción no se puede deshacer.");
    if (!confirmar) return;
    const { error } = await supabase.from('carro').delete().eq('id_carro', idCarro);
    if (error) alert("Error al eliminar: " + error.message); else cargarMisCarros(miPerfil.id_usuario);
  };

  const cerrarModal = () => {
    setIsModalOpen(false); setCocheEditando(null); setFotoArchivo(null); setFotoPreview(null);
    setNuevoCarro({ modelo: "", id_fabricante: "", otro_fabricante: "", id_marca: "", otra_marca: "", id_serie: "", otra_serie: "", rareza: "", valor: "", id_escala: "", id_estado_carro: "", no_carro: "", total_carros: "", anio_serie: "" });
  };

  const idFabAct = parseInt(nuevoCarro.id_fabricante) || null;
  const seriesFiltradas = idFabAct ? series.filter(s => s.id_fabricante === idFabAct) : series;
  const rarezasFiltradas = idFabAct ? rarezas.filter(r => r.id_fabricante === idFabAct) : rarezas;

  if (cargandoDatos) return <div className="flex min-h-screen items-center justify-center text-cyan-500 animate-pulse font-bold tracking-widest">ABRIENDO GARAJE...</div>;

  return (
    <main className="min-h-screen bg-[#050810] p-4 md:p-10 font-sans selection:bg-cyan-900 selection:text-cyan-50 relative overflow-x-hidden">
      
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-8">
        <div><h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Mi Garaje<span className="text-cyan-500">.</span></h1><p className="text-slate-400 mt-2 text-lg">Colección de <span className="text-cyan-400 font-semibold">{miPerfil?.nombre_usuario || miPerfil?.correo}</span></p></div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)] flex justify-center items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Registrar Auto
        </button>
      </header>

      <section className="max-w-7xl mx-auto">
        {misCarros.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed px-4"><p className="text-slate-500">Aún no hay joyas en tu garaje.</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {misCarros.map((carro) => (
              <div key={carro.id_carro} className="relative group">
                {carro.estado_aprobacion === 'PENDIENTE' && <div className="absolute top-2 right-2 z-20 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg">EN REVISIÓN</div>}
                
                <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirParaEditar(carro)} title="Editar Pieza" className="bg-cyan-900/90 hover:bg-cyan-600 text-cyan-100 border border-cyan-700 p-2 rounded-lg shadow-lg backdrop-blur-sm transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                  <button onClick={() => eliminarCarro(carro.id_carro)} title="Eliminar Pieza" className="bg-red-900/90 hover:bg-red-600 text-red-100 border border-red-700 p-2 rounded-lg shadow-lg backdrop-blur-sm transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>

                <CollectorCard modelo={carro.modelo} marca={carro.marca?.marca || "Sin Marca"} rareza={carro.rareza || "Común"} valor={carro.valor} imagenUrl={carro.imagen_url} />
              </div>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full sm:max-w-xl max-h-[95vh] overflow-y-auto sm:rounded-2xl rounded-t-3xl border-t sm:border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white tracking-wider">
                {cocheEditando ? "Editar Pieza" : "Nueva Pieza"}<span className="text-cyan-500">.</span>
              </h3>
              <button onClick={cerrarModal} className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <form onSubmit={guardarNuevoCarro} className="p-6 flex flex-col gap-6">
              
              <div className="w-full">
                <input type="file" accept="image/*" capture="environment" id="foto-upload" className="hidden" onChange={manejarCapturaFoto} />
                <label htmlFor="foto-upload" className={`w-full aspect-video sm:aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group shadow-inner ${fotoPreview ? 'border-cyan-500' : 'border-slate-700 hover:border-cyan-500 bg-slate-950/50'}`}>
                  {fotoPreview ? (
                    <><img src={fotoPreview} alt="Vista previa" className="w-full h-full object-cover animate-in fade-in" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2"><span className="text-white font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full">Cambiar Toma</span></div></>
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center gap-4 text-slate-500"><div className="p-4 bg-slate-800 rounded-full"><svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg></div><p className="font-bold text-base text-cyan-500">Tocar para Cámara</p></div>
                  )}
                </label>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Modelo del Auto *</label>
                  <input type="text" required placeholder="Ej. Skyline GT-R R34" value={nuevoCarro.modelo} onChange={(e) => setNuevoCarro({...nuevoCarro, modelo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 outline-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Fabricante *</label>
                    <select required value={nuevoCarro.id_fabricante} onChange={(e) => setNuevoCarro({...nuevoCarro, id_fabricante: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 outline-none cursor-pointer">
                      <option value="">-- Seleccionar --</option>
                      {fabricantes.map(f => <option key={f.id_fabricante} value={f.id_fabricante}>{f.fabricante}</option>)}
                      <option value="nuevo" className="text-cyan-400 font-bold">+ Agregar Otro...</option>
                    </select>
                    {nuevoCarro.id_fabricante === 'nuevo' && <input type="text" placeholder="¿Cuál?" value={nuevoCarro.otro_fabricante} onChange={e => setNuevoCarro({...nuevoCarro, otro_fabricante: e.target.value})} className="mt-2 w-full bg-slate-900 border border-cyan-700 text-white rounded-md px-3 py-2 text-sm outline-none" />}
                  </div>

                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Marca de Auto *</label>
                    <select required value={nuevoCarro.id_marca} onChange={(e) => setNuevoCarro({...nuevoCarro, id_marca: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 outline-none cursor-pointer">
                      <option value="">-- Seleccionar --</option>
                      {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.marca}</option>)}
                      <option value="nuevo" className="text-cyan-400 font-bold">+ Agregar Otra...</option>
                    </select>
                    {nuevoCarro.id_marca === 'nuevo' && <input type="text" placeholder="¿Cuál?" value={nuevoCarro.otra_marca} onChange={e => setNuevoCarro({...nuevoCarro, otra_marca: e.target.value})} className="mt-2 w-full bg-slate-900 border border-cyan-700 text-white rounded-md px-3 py-2 text-sm outline-none" />}
                  </div>
                </div>

                {/* FILA DE SERIE, NÚMERO Y AÑO (Completamente conectada) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  <div className="sm:col-span-5">
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Serie (Filtrada)</label>
                    <select disabled={!idFabAct && nuevoCarro.id_fabricante !== 'nuevo'} value={nuevoCarro.id_serie} onChange={(e) => setNuevoCarro({...nuevoCarro, id_serie: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 outline-none disabled:opacity-50 cursor-pointer">
                      <option value="">-- Seleccionar --</option>
                      {seriesFiltradas.map(s => <option key={s.id_serie} value={s.id_serie}>{s.serie}</option>)}
                      <option value="nuevo" className="text-cyan-400 font-bold">+ Agregar Otra...</option>
                    </select>
                    {nuevoCarro.id_serie === 'nuevo' && <input type="text" placeholder="¿Cuál?" value={nuevoCarro.otra_serie} onChange={e => setNuevoCarro({...nuevoCarro, otra_serie: e.target.value})} className="mt-2 w-full bg-slate-900 border border-cyan-700 text-white rounded-md px-3 py-2 text-sm outline-none" />}
                  </div>

                  <div className="sm:col-span-3 flex gap-2">
                    <div className="w-1/2">
                      <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">No.</label>
                      <input type="number" placeholder="Ej. 3" value={nuevoCarro.no_carro} onChange={(e) => setNuevoCarro({...nuevoCarro, no_carro: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-2 py-3.5 outline-none text-center" />
                    </div>
                    <div className="flex items-center pt-6 text-slate-500 font-bold">/</div>
                    <div className="w-1/2">
                      <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Total</label>
                      <input type="number" placeholder="Ej. 10" disabled={nuevoCarro.id_serie !== 'nuevo' && nuevoCarro.total_carros !== ""} value={nuevoCarro.total_carros} onChange={(e) => setNuevoCarro({...nuevoCarro, total_carros: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-2 py-3.5 outline-none text-center disabled:opacity-50 disabled:bg-slate-900" />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Año de Serie</label>
                    <select disabled={nuevoCarro.id_serie !== 'nuevo' && nuevoCarro.anio_serie !== ""} value={nuevoCarro.anio_serie} onChange={(e) => setNuevoCarro({...nuevoCarro, anio_serie: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 outline-none disabled:opacity-50 disabled:bg-slate-900 cursor-pointer">
                      <option value="">-- Año --</option>
                      {aniosDisponibles.map(anio => <option key={anio} value={anio}>{anio}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Estado del Auto</label>
                    <select value={nuevoCarro.id_estado_carro} onChange={(e) => setNuevoCarro({...nuevoCarro, id_estado_carro: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 outline-none cursor-pointer">
                      <option value="">-- Seleccionar --</option>
                      {estadosCarro.map(ec => <option key={ec.id_estado_carro} value={ec.id_estado_carro}>{ec.estado_carro}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Escala</label>
                    <select value={nuevoCarro.id_escala} onChange={(e) => setNuevoCarro({...nuevoCarro, id_escala: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 outline-none cursor-pointer">
                      <option value="">-- Seleccionar --</option>
                      {escalas.map(es => <option key={es.id_escala} value={es.id_escala}>{es.escala}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Rareza</label>
                    <select disabled={!idFabAct} value={nuevoCarro.rareza} onChange={(e) => setNuevoCarro({...nuevoCarro, rareza: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 outline-none disabled:opacity-50 cursor-pointer">
                      <option value="">-- Seleccionar --</option>
                      {rarezasFiltradas.map(r => <option key={r.id_rareza} value={r.rareza}>{r.rareza}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Valor Estimado ($)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={nuevoCarro.valor} onChange={(e) => setNuevoCarro({...nuevoCarro, valor: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-emerald-300 rounded-xl px-4 py-3.5 outline-none font-mono" />
                  </div>
                </div>

              </div>

              <div className="mt-4 pt-6 border-t border-slate-800 flex gap-3">
                <button type="submit" disabled={guardando} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg disabled:opacity-50 flex justify-center items-center">
                  {guardando ? "Guardando..." : (cocheEditando ? "Actualizar Pieza" : "Aparcar en mi Garaje")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {nuevosLogros.length > 0 && <AchievementUnlock logros={nuevosLogros} onClose={() => setNuevosLogros([])} />}
    </main>
  );
}