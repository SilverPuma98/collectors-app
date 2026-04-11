"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from 'browser-image-compression';
import { calcularValorAproximado } from "@/lib/valuationEngine";

export default function TabRafaga({ 
  miPerfil, 
  marcas, 
  cargarDatosCentrales, 
  setTabActiva 
}: { 
  miPerfil: any, 
  marcas: any[], 
  cargarDatosCentrales: () => void, 
  setTabActiva: (tab: string) => void 
}) {
  const [archivosRafaga, setArchivosRafaga] = useState<{ file: File, preview: string, modelo: string, id_marca: string, valor: string }[]>([]);
  const [subiendoRafaga, setSubiendoRafaga] = useState(false);

  const manejarSeleccionMasiva = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (archivosRafaga.length + files.length > 20) { alert("Máximo 20 fotos a la vez por lote."); return; }
    
    const nuevosArchivos = files.map(f => ({
      file: f, preview: URL.createObjectURL(f), modelo: "", id_marca: "", valor: ""
    }));
    setArchivosRafaga([...archivosRafaga, ...nuevosArchivos]);
  };

  const actualizarItemRafaga = (index: number, campo: string, valorStr: string) => {
    const copia = [...archivosRafaga];
    copia[index] = { ...copia[index], [campo]: valorStr };
    
    if (campo === 'modelo' || campo === 'id_marca') {
       const mod = campo === 'modelo' ? valorStr : copia[index].modelo;
       const idMar = campo === 'id_marca' ? valorStr : copia[index].id_marca;
       if (mod && idMar) {
         // Usamos nombres base para la IA
         const precioSugerido = calcularValorAproximado(mod, "Hot Wheels", "Común", "Individual Básico", new Date().getFullYear(), "Blíster Excelente Condición");
         copia[index].valor = precioSugerido.toString();
       }
    }
    setArchivosRafaga(copia);
  };

  const eliminarDeRafaga = (index: number) => {
    const copia = [...archivosRafaga];
    copia.splice(index, 1);
    setArchivosRafaga(copia);
  };

  const subirLoteRafaga = async () => {
    if (archivosRafaga.some(a => !a.modelo || !a.id_marca)) { alert("Por favor llena el Modelo y Marca de todas las piezas."); return; }
    if (!window.confirm(`¿Subir e insertar estas ${archivosRafaga.length} piezas a la tienda?`)) return;
    
    setSubiendoRafaga(true);
    let errores = 0;

    // ✨ MAGIA TÁCTICA: Buscamos los IDs de los catálogos por defecto para la Ráfaga
    const { data: hwFab } = await supabase.from('fabricante').select('id_fabricante').ilike('fabricante', 'Hot Wheels').single();
    const idFabricanteBase = hwFab?.id_fabricante || null;

    const { data: comunRar } = await supabase.from('rareza').select('id_rareza').ilike('rareza', 'Común').single();
    const idRarezaBase = comunRar?.id_rareza || null;

    const { data: presBasic } = await supabase.from('presentacion').select('id_presentacion').ilike('presentacion', 'Individual Básico').single();
    const idPresentacionBase = presBasic?.id_presentacion || null;

    const { data: blisterEst } = await supabase.from('estado_carro').select('id_estado_carro').ilike('estado_carro', 'Blíster Excelente Condición').single();
    const idEstadoBase = blisterEst?.id_estado_carro || null;


    for (const item of archivosRafaga) {
      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.85 };
        const compressedFile = await imageCompression(item.file, options);
        const extension = compressedFile.name.split('.').pop() || 'jpg';
        const nombreArchivo = `${miPerfil.id_usuario}_rafaga_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
        
        await supabase.storage.from('autos').upload(nombreArchivo, compressedFile);
        const { data: urlData } = supabase.storage.from('autos').getPublicUrl(nombreArchivo);
        
        const precioSugeridoIA = calcularValorAproximado(item.modelo, "Hot Wheels", "Común", "Individual Básico", new Date().getFullYear(), "Blíster Excelente Condición");

        // ✨ ACTUALIZACIÓN MAESTRA: Usamos los IDs en el payload y eliminamos la columna de texto vieja 'rareza'
        const payload = {
          id_usuario: miPerfil.id_usuario, 
          modelo: item.modelo, 
          marca: parseInt(item.id_marca) || null, 
          id_fabricante: idFabricanteBase,
          id_rareza: idRarezaBase,
          id_presentacion: idPresentacionBase,
          estado_carro: idEstadoBase,
          valor: parseFloat(item.valor) || 0,
          valor_calculado: precioSugeridoIA, 
          imagen_url: urlData.publicUrl, 
          estado_aprobacion: 'APROBADO', 
          para_venta: true, 
          para_cambio: false 
        };

        const { error } = await supabase.from('carro').insert([payload]);
        if (error) errores++;
      } catch (err) { errores++; }
    }

    setSubiendoRafaga(false);
    if (errores > 0) alert(`Se subió el lote, pero hubo ${errores} errores.`);
    else alert("✅ ¡Lote completo publicado en la Tienda!");
    
    setArchivosRafaga([]);
    cargarDatosCentrales();
    setTabActiva("boveda"); 
  };

  return (
    <div className="animate-in fade-in duration-300"> 
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6"> 
        <div className="p-4 bg-white rounded-full shadow-sm text-amber-500 shrink-0">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
        </div> 
        <div className="text-center md:text-left"> 
          <h2 className="text-xl font-black text-amber-800 mb-1">Subida Masiva a Tienda</h2> 
          <p className="text-sm text-amber-700/80">Sube hasta 20 piezas al mismo tiempo. Se marcarán automáticamente como "En Venta" y usarán parámetros estándar para agilizar la carga.</p> 
        </div> 
      </div> 

      {archivosRafaga.length === 0 ? ( 
        <div className="w-full"> 
          <input type="file" multiple accept="image/*" id="subida-masiva" className="hidden" onChange={manejarSeleccionMasiva} /> 
          <label htmlFor="subida-masiva" className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50 hover:bg-amber-100/50 rounded-3xl py-20 flex flex-col items-center justify-center cursor-pointer transition-colors shadow-inner"> 
            <svg className="w-12 h-12 text-amber-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> 
            <span className="font-bold text-amber-600 text-lg">Selecciona las fotos de tu mercancía</span> 
            <span className="text-sm text-amber-500 mt-1">Máximo 20 fotos por lote.</span> 
          </label> 
        </div> 
      ) : ( 
        <div className="flex flex-col gap-6"> 
          <div className="flex justify-between items-end border-b border-slate-200 pb-2"> 
            <h3 className="font-bold text-slate-800">Lote Actual: {archivosRafaga.length} piezas</h3> 
            <input type="file" multiple accept="image/*" id="agregar-mas" className="hidden" onChange={manejarSeleccionMasiva} /> 
            <label htmlFor="agregar-mas" className="text-xs font-bold text-cyan-600 cursor-pointer hover:text-cyan-500">+ Agregar más fotos</label> 
          </div> 
          
          <div className="flex flex-col gap-4"> 
            {archivosRafaga.map((item, index) => ( 
              <div key={index} className="flex flex-col sm:flex-row gap-4 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm items-center"> 
                <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative"> 
                  <img src={item.preview} alt="preview" className="w-full h-full object-cover" /> 
                  <button onClick={() => eliminarDeRafaga(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button> 
                </div> 
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"> 
                  <input type="text" placeholder="Modelo (Ej. Skyline)" value={item.modelo} onChange={e => actualizarItemRafaga(index, 'modelo', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" /> 
                  <select value={item.id_marca} onChange={e => actualizarItemRafaga(index, 'id_marca', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"> 
                    <option value="">-- Marca --</option> 
                    {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.marca}</option>)} 
                  </select> 
                  <input type="number" placeholder="Precio ($)" value={item.valor} onChange={e => actualizarItemRafaga(index, 'valor', e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-emerald-600 font-bold rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" /> 
                </div> 
              </div> 
            ))} 
          </div> 
          
          <button onClick={subirLoteRafaga} disabled={subiendoRafaga} className="w-full bg-amber-500 hover:bg-amber-400 text-white font-black py-4 rounded-xl shadow-lg transition-all text-lg mt-4 disabled:opacity-50 flex justify-center items-center gap-2"> 
            {subiendoRafaga ? <><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Procesando Lote...</> : `Publicar ${archivosRafaga.length} Piezas en mi Tienda`} 
          </button> 
        </div> 
      )} 
    </div> 
  );
}