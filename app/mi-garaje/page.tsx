"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import CollectorCard from "@/components/CollectorCard";
import { evaluarLogros } from "@/lib/logrosEngine";

// NUEVA IMPORTACIÓN: El componente Premium de Gamificación
import AchievementUnlock from "@/components/AchievementUnlock";

export default function MiGaraje() {
  // 1. Estados de Datos
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [miPerfil, setMiPerfil] = useState<any>(null);
  const [misCarros, setMisCarros] = useState<any[]>([]);
  
  // 2. Catálogos Base
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [rarezas, setRarezas] = useState<any[]>([]);

  // 3. Estados de UI y Formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  
  // NUEVO ESTADO: Para controlar la animación de la medalla
  const [nuevosLogros, setNuevosLogros] = useState<string[]>([]);

  const [nuevoCarro, setNuevoCarro] = useState({
    modelo: "", fabricante: "", marca: "", serie: "", rareza: "", valor: ""
  });

  useEffect(() => {
    inicializarGaraje();
  }, []);

  const inicializarGaraje = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: perfil } = await supabase.from('usuario').select('*').eq('correo', user.email).single();
      
      if (perfil) {
        setMiPerfil(perfil);
        await Promise.all([
          cargarCatalogos(),
          cargarMisCarros(perfil.id_usuario)
        ]);
      }
    }
    setCargandoDatos(false);
  };

  const cargarCatalogos = async () => {
    const [resFab, resMar, resSer, resRar] = await Promise.all([
      supabase.from('fabricante').select('*').order('fabricante'),
      supabase.from('marca').select('*').order('marca'),
      supabase.from('serie').select('*'),
      supabase.from('rareza').select('*')
    ]);
    if (resFab.data) setFabricantes(resFab.data);
    if (resMar.data) setMarcas(resMar.data);
    if (resSer.data) setSeries(resSer.data);
    if (resRar.data) setRarezas(resRar.data);
  };

  const cargarMisCarros = async (idUsuario: number) => {
    const { data } = await supabase
      .from('carro')
      .select(`*, marca(marca), serie(serie)`)
      .eq('id_usuario', idUsuario)
      .order('id_carro', { ascending: false });
      
    if (data) setMisCarros(data);
  };

  const manejarCapturaFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoArchivo(file); 
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  // MAGIC CREATE: Resuelve textos a IDs y crea lo inexistente
  const resolverOCrearCatalogo = async (tabla: string, columna: string, valorEscrito: string, extraData: any = {}) => {
    if (!valorEscrito) return null;
    
    const existente = await supabase.from(tabla).select(`id_${tabla}`).ilike(columna, valorEscrito).single();
    
    if (existente.data) return (existente.data as Record<string, any>)[`id_${tabla}`];
    
    const { data } = await supabase.from(tabla).insert([{ [columna]: valorEscrito, ...extraData }]).select().single();
    
    return data ? (data as Record<string, any>)[`id_${tabla}`] : null;
  };

  const guardarNuevoCarro = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setGuardando(true);

    let imagenUrlFinal = null;
    if (fotoArchivo) {
      const extension = fotoArchivo.name.split('.').pop();
      const nombreArchivo = `${miPerfil.id_usuario}_${Date.now()}.${extension}`;
      await supabase.storage.from('autos').upload(nombreArchivo, fotoArchivo);
      const { data } = supabase.storage.from('autos').getPublicUrl(nombreArchivo);
      imagenUrlFinal = data.publicUrl;
    }

    const idFab = await resolverOCrearCatalogo('fabricante', 'fabricante', nuevoCarro.fabricante);
    const idMar = await resolverOCrearCatalogo('marca', 'marca', nuevoCarro.marca);
    const idSer = await resolverOCrearCatalogo('serie', 'serie', nuevoCarro.serie, { id_fabricante: idFab });

    const payload = {
      id_usuario: miPerfil.id_usuario,
      modelo: nuevoCarro.modelo,
      id_fabricante: idFab,
      marca: idMar,  
      serie: idSer,  
      rareza: nuevoCarro.rareza, 
      valor: parseFloat(nuevoCarro.valor) || 0,
      link_img: imagenUrlFinal,
      estado_aprobacion: (miPerfil.rol === 'SUPER_ADMIN' || miPerfil.rol === 'COLABORADOR') ? 'APROBADO' : 'PENDIENTE'
    };

    const { error } = await supabase.from('carro').insert([payload]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      cargarMisCarros(miPerfil.id_usuario); 
      cargarCatalogos(); 
      cerrarModal();
      
      // DISPARAMOS EL MOTOR DE LOGROS
      const medallasGanadas = await evaluarLogros(miPerfil.id_usuario);
      
      // UX: ACTIVAMOS LA ANIMACIÓN (Sin alert feo)
      if (medallasGanadas && medallasGanadas.length > 0) {
        setNuevosLogros(medallasGanadas);
      }
    }
    setGuardando(false);
  };

  const cerrarModal = () => {
    setIsModalOpen(false); 
    setFotoArchivo(null); 
    setFotoPreview(null);
    setNuevoCarro({ modelo: "", fabricante: "", marca: "", serie: "", rareza: "", valor: "" });
  };

  const idFabricanteActual = fabricantes.find(f => f.fabricante.toLowerCase() === nuevoCarro.fabricante.toLowerCase())?.id_fabricante;
  const seriesFiltradas = idFabricanteActual ? series.filter(s => s.id_fabricante === idFabricanteActual) : series;
  const rarezasFiltradas = idFabricanteActual ? rarezas.filter(r => r.id_fabricante === idFabricanteActual) : rarezas;

  if (cargandoDatos) {
    return (
      <div className="flex min-h-screen items-center justify-center text-cyan-500 animate-pulse font-bold tracking-widest">
        ABRIENDO GARAJE...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050810] p-4 md:p-10 font-sans selection:bg-cyan-900 selection:text-cyan-50 relative overflow-x-hidden">
      
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Mi Garaje<span className="text-cyan-500">.</span></h1>
          <p className="text-slate-400 mt-2 text-lg">Colección de <span className="text-cyan-400 font-semibold">{miPerfil?.nombre_usuario || miPerfil?.correo}</span></p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)] flex justify-center items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          Registrar Auto
        </button>
      </header>

      <section className="max-w-7xl mx-auto">
        {misCarros.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed px-4">
            <p className="text-slate-500">Aún no hay joyas en tu garaje.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {misCarros.map((carro) => (
              <div key={carro.id_carro} className="relative">
                {carro.estado_aprobacion === 'PENDIENTE' && (
                  <div className="absolute top-2 right-2 z-20 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                    EN REVISIÓN
                  </div>
                )}
                <CollectorCard 
                  modelo={carro.modelo}
                  marca={carro.marca?.marca || "Sin Marca"}
                  rareza={carro.rareza || "Común"}
                  valor={carro.valor}
                  imagenUrl={carro.link_img}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL DE CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full sm:max-w-lg max-h-[95vh] overflow-y-auto sm:rounded-2xl rounded-t-3xl border-t sm:border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white tracking-wider">Nueva Pieza<span className="text-cyan-500">.</span></h3>
              <button onClick={cerrarModal} className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={guardarNuevoCarro} className="p-6 flex flex-col gap-6">
              
              <div className="w-full">
                <input type="file" accept="image/*" capture="environment" id="foto-upload" className="hidden" onChange={manejarCapturaFoto} />
                <label htmlFor="foto-upload" className={`w-full aspect-video sm:aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group shadow-inner ${fotoPreview ? 'border-cyan-500' : 'border-slate-700 hover:border-cyan-500 bg-slate-950/50'}`}>
                  {fotoPreview ? (
                    <>
                      <img src={fotoPreview} alt="Vista previa" className="w-full h-full object-cover animate-in fade-in" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                        <span className="text-white font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full">Cambiar Toma</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center gap-4 transition-colors group-hover:text-cyan-400 text-slate-500">
                      <div className="p-4 bg-slate-800 rounded-full border border-slate-700 group-hover:border-cyan-700 group-hover:bg-slate-900 transition-colors">
                        <svg className="w-10 h-10 text-cyan-600 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-bold text-base text-cyan-500 group-hover:text-cyan-400">Tocar para Cámara o Galería</p>
                        <p className="text-xs text-slate-600">Sube una foto real de tu pieza</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Modelo del Auto *</label>
                  <input type="text" required placeholder="Ej. Skyline GT-R R34" value={nuevoCarro.modelo} onChange={(e) => setNuevoCarro({...nuevoCarro, modelo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-700" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Fabricante * (Buscador)</label>
                    <input list="lista-fabricantes" required placeholder="Ej. Hot Wheels" value={nuevoCarro.fabricante} onChange={(e) => setNuevoCarro({...nuevoCarro, fabricante: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-700" />
                    <datalist id="lista-fabricantes">
                      {fabricantes.map(f => <option key={f.id_fabricante} value={f.fabricante} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Marca de Auto * (Buscador)</label>
                    <input list="lista-marcas" required placeholder="Ej. Nissan" value={nuevoCarro.marca} onChange={(e) => setNuevoCarro({...nuevoCarro, marca: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-700" />
                    <datalist id="lista-marcas">
                      {marcas.map(m => <option key={m.id_marca} value={m.marca} />)}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Serie (Buscador Dinámico)</label>
                    <input list="lista-series" placeholder="Ej. HW Turbo" value={nuevoCarro.serie} onChange={(e) => setNuevoCarro({...nuevoCarro, serie: e.target.value})} disabled={!nuevoCarro.fabricante} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none transition-all disabled:opacity-40 placeholder:text-slate-700" />
                    <datalist id="lista-series">
                      {seriesFiltradas.map(s => <option key={s.id_serie} value={s.serie} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Rareza (Buscador Dinámico)</label>
                    <input list="lista-rarezas" placeholder="Ej. Treasure Hunt" value={nuevoCarro.rareza} onChange={(e) => setNuevoCarro({...nuevoCarro, rareza: e.target.value})} disabled={!nuevoCarro.fabricante} className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none transition-all disabled:opacity-40 placeholder:text-slate-700" />
                    <datalist id="lista-rarezas">
                      {rarezasFiltradas.map(r => <option key={r.id_rareza} value={r.rareza} />)}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-cyan-500 font-bold uppercase tracking-wider mb-2 block">Valor Estimado ($)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={nuevoCarro.valor} onChange={(e) => setNuevoCarro({...nuevoCarro, valor: e.target.value})} className="w-full bg-slate-950 border border-slate-700 text-emerald-300 rounded-xl px-4 py-3.5 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-700 font-mono" />
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-slate-800">
                <button type="submit" disabled={guardando} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                  {guardando ? (
                    <><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Guardando en la bóveda...</>
                  ) : "Aparcar en mi Garaje"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANIMACIÓN PREMIUM DE LOGRO GANADO */}
      {nuevosLogros.length > 0 && (
        <AchievementUnlock logros={nuevosLogros} onClose={() => setNuevosLogros([])} />
      )}
      
    </main>
  );
}