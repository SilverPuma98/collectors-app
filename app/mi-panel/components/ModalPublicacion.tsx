"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from 'browser-image-compression';
import BuscadorDesplegable from "./BuscadorDesplegable";

export default function ModalPublicacion({
  miPerfil,
  nuevoCarro,
  setNuevoCarro,
  cocheEditando,
  fotoArchivoCarro,
  setFotoArchivoCarro,
  fotoPreviewCarro,
  setFotoPreviewCarro,
  fotosExtraNuevas,
  setFotosExtraNuevas,
  fotosExtraPreview,
  setFotosExtraPreview,
  fotosExtraExistentes,
  setFotosExtraExistentes,
  fabricantes,
  marcas,
  series,
  rarezas,
  presentaciones,
  escalas,
  estadosCarro,
  guardandoCarro,
  setGuardandoCarro,
  cerrarModal,
  cargarDatosCentrales,
  setNuevosLogros,
  evaluarLogros,
  calcularValorAproximado,
  aniosDisponibles
}: any) {

  const idFabAct = parseInt(nuevoCarro.id_fabricante) || null;
  const seriesFiltradas = idFabAct ? series.filter((s: any) => s.id_fabricante === idFabAct) : series;
  const rarezasFiltradas = idFabAct ? rarezas.filter((r: any) => r.id_fabricante === idFabAct) : rarezas;
  const presentacionesFiltradas = idFabAct ? presentaciones.filter((p: any) => p.id_fabricante === idFabAct) : presentaciones; 

  const opcionesFabricante = fabricantes.map((f: any) => ({ id: String(f.id_fabricante), label: f.fabricante }));
  const opcionesMarca = marcas.map((m: any) => ({ id: String(m.id_marca), label: m.marca }));
  const opcionesSerie = seriesFiltradas.map((s: any) => ({ id: String(s.id_serie), label: `${s.serie} ${s.anio ? `(${s.anio})` : ''}` }));
  const opcionesRareza = rarezasFiltradas.map((r: any) => ({ id: String(r.id_rareza), label: r.rareza }));
  const opcionesPresentacion = presentacionesFiltradas.map((p: any) => ({ id: String(p.id_presentacion), label: p.presentacion })); 
  const opcionesEstado = estadosCarro.map((e: any) => ({ id: String(e.id_estado_carro), label: e.estado_carro }));
  const opcionesEscala = escalas.map((e: any) => ({ id: String(e.id_escala), label: e.escala }));

  const esUsuarioVIP = miPerfil?.rol === 'SUPER_ADMIN' || miPerfil?.rol === 'VENDEDOR'; 

  const crearSiEsNuevo = async (tabla: string, columna: string, idSeleccionado: string, valorNuevo: string, extraData: any = {}) => {
    if (idSeleccionado !== "nuevo") return parseInt(idSeleccionado) || null;
    if (!valorNuevo) return null;
    const existente = await supabase.from(tabla).select(`id_${tabla}`).ilike(columna, valorNuevo).single();
    if (existente.data) return (existente.data as Record<string, any>)[`id_${tabla}`];
    const { data } = await supabase.from(tabla).insert([{ [columna]: valorNuevo, ...extraData }]).select().single();
    return data ? (data as Record<string, any>)[`id_${tabla}`] : null;
  };

  const manejarFotosExtra = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const maxFotosRestantes = 5 - (fotosExtraNuevas.length + fotosExtraExistentes.length);
    if (files.length > maxFotosRestantes) {
      alert(`Solo puedes subir ${maxFotosRestantes} foto(s) extra más.`);
      return;
    }

    const nuevosArchivos = files.map(f => f);
    const nuevosPreviews = files.map(f => URL.createObjectURL(f));

    setFotosExtraNuevas([...fotosExtraNuevas, ...nuevosArchivos]);
    setFotosExtraPreview([...fotosExtraPreview, ...nuevosPreviews]);
  };

  const eliminarFotoExtraNueva = (index: number) => {
    const nuevosArchivos = [...fotosExtraNuevas];
    const nuevosPreviews = [...fotosExtraPreview];
    nuevosArchivos.splice(index, 1);
    nuevosPreviews.splice(index, 1);
    setFotosExtraNuevas(nuevosArchivos);
    setFotosExtraPreview(nuevosPreviews);
  };

  const eliminarFotoExtraExistente = (index: number) => {
    const nuevasExistentes = [...fotosExtraExistentes];
    nuevasExistentes.splice(index, 1);
    setFotosExtraExistentes(nuevasExistentes);
  };

  const guardarCarro = async (e: React.FormEvent) => {
    e.preventDefault(); setGuardandoCarro(true);
    
    let imagenUrlFinal = fotoPreviewCarro?.includes('blob:') ? null : fotoPreviewCarro;
    if (fotoArchivoCarro) {
      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.85 };
        const compressedFile = await imageCompression(fotoArchivoCarro, options);
        const extension = compressedFile.name.split('.').pop() || 'jpg';
        const nombreArchivo = `${miPerfil.id_usuario}_carro_${Date.now()}.${extension}`;
        await supabase.storage.from('autos').upload(nombreArchivo, compressedFile);
        const { data } = supabase.storage.from('autos').getPublicUrl(nombreArchivo);
        imagenUrlFinal = data.publicUrl;
      } catch (error) { alert("Error al optimizar la fotografía principal."); setGuardandoCarro(false); return; }
    }

    let urlsExtraFinales = [...fotosExtraExistentes];
    if (nuevoCarro.es_lote && fotosExtraNuevas.length > 0) {
      for (let i = 0; i < fotosExtraNuevas.length; i++) {
        try {
          const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.8 };
          const compressedFile = await imageCompression(fotosExtraNuevas[i], options);
          const extension = compressedFile.name.split('.').pop() || 'jpg';
          const nombreArchivo = `${miPerfil.id_usuario}_extra_${Date.now()}_${i}.${extension}`;
          await supabase.storage.from('autos').upload(nombreArchivo, compressedFile);
          const { data } = supabase.storage.from('autos').getPublicUrl(nombreArchivo);
          urlsExtraFinales.push(data.publicUrl);
        } catch (error) {
          console.error("Error subiendo foto extra:", error);
        }
      }
    }

    let finalIdFab = null, finalIdMar = null, finalIdSer = null, finalIdPres = null, finalIdRareza = null;

    if (!nuevoCarro.es_custom) {
      finalIdFab = await crearSiEsNuevo('fabricante', 'fabricante', nuevoCarro.id_fabricante, nuevoCarro.otro_fabricante);
      finalIdMar = await crearSiEsNuevo('marca', 'marca', nuevoCarro.id_marca, nuevoCarro.otra_marca);
      
      finalIdSer = await crearSiEsNuevo('serie', 'serie', nuevoCarro.id_serie, nuevoCarro.otra_serie, { 
        id_fabricante: finalIdFab, anio: parseInt(nuevoCarro.anio_serie) || null, no_carros: parseInt(nuevoCarro.total_carros) || null 
      });
      
      if (finalIdSer && nuevoCarro.id_serie !== "nuevo" && esUsuarioVIP) {
        await supabase.from('serie').update({
          anio: parseInt(nuevoCarro.anio_serie) || null, no_carros: parseInt(nuevoCarro.total_carros) || null, id_fabricante: finalIdFab
        }).eq('id_serie', finalIdSer);
      }

      finalIdPres = await crearSiEsNuevo('presentacion', 'presentacion', nuevoCarro.id_presentacion, nuevoCarro.otra_presentacion, { id_fabricante: finalIdFab });
      finalIdRareza = await crearSiEsNuevo('rareza', 'rareza', nuevoCarro.rareza, nuevoCarro.rareza_custom_texto, { id_fabricante: finalIdFab });
    } else {
      finalIdFab = nuevoCarro.id_fabricante !== "nuevo" ? parseInt(nuevoCarro.id_fabricante) : null;
      finalIdMar = nuevoCarro.id_marca !== "nuevo" ? parseInt(nuevoCarro.id_marca) : null;
      finalIdSer = nuevoCarro.id_serie !== "nuevo" ? parseInt(nuevoCarro.id_serie) : null;
      finalIdPres = nuevoCarro.id_presentacion !== "nuevo" ? parseInt(nuevoCarro.id_presentacion) : null;
      finalIdRareza = nuevoCarro.rareza !== "nuevo" ? parseInt(nuevoCarro.rareza) : null;
    }

    const finalAnio = parseInt(nuevoCarro.anio_serie) || new Date().getFullYear();
    const nombreEst = estadosCarro.find((e: any) => String(e.id_estado_carro) === String(nuevoCarro.id_estado_carro))?.estado_carro || "";
    const nombreFab = fabricantes.find((f: any) => String(f.id_fabricante) === String(nuevoCarro.id_fabricante))?.fabricante || nuevoCarro.otro_fabricante;
    
    const { data: rarData } = finalIdRareza ? await supabase.from('rareza').select('rareza').eq('id_rareza', finalIdRareza).single() : { data: null };
    const nombreRarezaFinal = nuevoCarro.es_custom && nuevoCarro.rareza === 'nuevo' ? nuevoCarro.rareza_custom_texto : (rarData?.rareza || "");

    const { data: presData } = finalIdPres ? await supabase.from('presentacion').select('presentacion').eq('id_presentacion', finalIdPres).single() : { data: null };
    const nombrePresFinal = nuevoCarro.es_custom && nuevoCarro.id_presentacion === 'nuevo' ? nuevoCarro.otra_presentacion : (presData?.presentacion || "Individual Básico");
    
    let sugeridoIA = 0;
    if (nuevoCarro.es_custom) {
      sugeridoIA = (parseFloat(nuevoCarro.valor_base) || 0) + (parseFloat(nuevoCarro.costo_materiales) || 0);
    } else if (!nuevoCarro.es_lote) {
      sugeridoIA = calcularValorAproximado(nuevoCarro.modelo, nombreFab, nombreRarezaFinal, nombrePresFinal, finalAnio, nombreEst);
    }

    const payload: any = {
      modelo: nuevoCarro.modelo, 
      id_fabricante: finalIdFab, 
      marca: finalIdMar, 
      serie: finalIdSer,  
      id_rareza: finalIdRareza || null, 
      // ✨ MAGIA: Quitamos la columna 'rareza' para que Supabase ya no explote
      id_presentacion: finalIdPres || null, 
      valor: parseFloat(nuevoCarro.valor) || 0, 
      valor_calculado: sugeridoIA,
      escala: parseInt(nuevoCarro.id_escala) || null, 
      estado_carro: parseInt(nuevoCarro.id_estado_carro) || null, 
      no_carro: parseInt(nuevoCarro.no_carro) || null, 
      para_cambio: nuevoCarro.para_cambio, 
      para_venta: nuevoCarro.para_venta,
      es_lote: nuevoCarro.es_lote, 
      es_preventa: nuevoCarro.es_preventa, 
      fecha_llegada: nuevoCarro.es_preventa ? (nuevoCarro.fecha_llegada || null) : null,
      galeria: nuevoCarro.es_lote ? urlsExtraFinales : [],
      es_subasta: nuevoCarro.es_subasta,
      es_custom: nuevoCarro.es_custom
    };
    if (imagenUrlFinal) payload.imagen_url = imagenUrlFinal;

    let idCarroFinal = cocheEditando;

    if (cocheEditando) {
      const { error } = await supabase.from('carro').update(payload).eq('id_carro', cocheEditando);
      if (error) { alert("Error al editar: " + error.message); setGuardandoCarro(false); return; }
    } else {
      payload.id_usuario = miPerfil.id_usuario;
      payload.estado_aprobacion = 'APROBADO'; 
      const { data: newCarroData, error } = await supabase.from('carro').insert([payload]).select().single();
      if (error) { alert("Error al registrar: " + error.message); setGuardandoCarro(false); return; }
      idCarroFinal = newCarroData.id_carro;
    }

    if (nuevoCarro.es_custom && idCarroFinal) {
      const customPayload = {
        id_carro: idCarroFinal,
        id_usuario: miPerfil.id_usuario,
        fabricante: nuevoCarro.id_fabricante === 'nuevo' ? nuevoCarro.otro_fabricante : null,
        marca: nuevoCarro.id_marca === 'nuevo' ? nuevoCarro.otra_marca : null,
        serie: nuevoCarro.id_serie === 'nuevo' ? nuevoCarro.otra_serie : null,
        presentacion: nuevoCarro.id_presentacion === 'nuevo' ? nuevoCarro.otra_presentacion : null,
        rareza: nuevoCarro.rareza === 'nuevo' ? nuevoCarro.rareza_custom_texto : null,
        anio: parseInt(nuevoCarro.anio_serie) || null,
        valor_base: parseFloat(nuevoCarro.valor_base) || 0,
        costo_materiales: parseFloat(nuevoCarro.costo_materiales) || 0
      };

      const { data: existingCustom } = await supabase.from('carro_custom').select('id_custom').eq('id_carro', idCarroFinal).single();
      if (existingCustom) {
        await supabase.from('carro_custom').update(customPayload).eq('id_custom', existingCustom.id_custom);
      } else {
        await supabase.from('carro_custom').insert([customPayload]);
      }
    } else if (!nuevoCarro.es_custom && cocheEditando) {
      await supabase.from('carro_custom').delete().eq('id_carro', idCarroFinal);
    }

    if (nuevoCarro.es_subasta && idCarroFinal) {
      const subastaPayload: any = {
          id_carro: idCarroFinal, id_vendedor: miPerfil.id_usuario,
          precio_inicial: parseFloat(nuevoCarro.precio_inicial) || 0,
          incremento_minimo: parseFloat(nuevoCarro.incremento_minimo) || 10,
          fecha_cierre: new Date(nuevoCarro.fecha_cierre_subasta).toISOString(),
          estado: 'ACTIVA'
      };

      if (cocheEditando) {
          const { data: existingSubasta } = await supabase.from('subasta').select('id_subasta').eq('id_carro', idCarroFinal).single();
          if (existingSubasta) { await supabase.from('subasta').update(subastaPayload).eq('id_subasta', existingSubasta.id_subasta);
          } else { subastaPayload.precio_actual = subastaPayload.precio_inicial; await supabase.from('subasta').insert([subastaPayload]); }
      } else {
          subastaPayload.precio_actual = subastaPayload.precio_inicial;
          await supabase.from('subasta').insert([subastaPayload]);
      }
    } else if (!nuevoCarro.es_subasta && cocheEditando) {
        await supabase.from('subasta').delete().eq('id_carro', idCarroFinal);
    }

    setGuardandoCarro(false);
    cargarDatosCentrales(); 
    cerrarModal();
    
    if (!cocheEditando) {
      const medallasGanadas = await evaluarLogros(miPerfil.id_usuario); 
      if (medallasGanadas && medallasGanadas.length > 0) setNuevosLogros(medallasGanadas); 
    } else {
      alert("¡Publicación actualizada exitosamente!");
    }
  };

  const serieSeleccionadaObj = series.find((s: any) => String(s.id_serie) === String(nuevoCarro.id_serie));
  const serieTieneAnio = serieSeleccionadaObj && serieSeleccionadaObj.anio !== null;
  const serieTieneTotal = serieSeleccionadaObj && serieSeleccionadaObj.no_carros !== null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200 overflow-y-auto pt-10 pb-10">
      <div className="bg-white w-full md:max-w-2xl overflow-visible rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200 my-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-3xl">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{cocheEditando ? "Editar Publicación" : "Nueva Publicación"}<span className="text-cyan-500">.</span></h3>
          <button onClick={cerrarModal} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        
        <form onSubmit={guardarCarro} className="p-6 flex flex-col gap-6">
          
          <div className="w-full">
            <input type="file" accept="image/*" capture="environment" id="foto-carro" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setFotoArchivoCarro(f); setFotoPreviewCarro(URL.createObjectURL(f)); } }} />
            <label htmlFor="foto-carro" className={`w-full aspect-[4/3] sm:aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group shadow-inner ${fotoPreviewCarro ? 'border-cyan-300' : 'border-slate-300 hover:border-cyan-400 bg-slate-50'}`}>
              {fotoPreviewCarro ? (
                <><img src={fotoPreviewCarro} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity"><span className="text-white font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full">Cambiar Foto Principal</span></div></>
              ) : (
                <div className="text-center p-6 flex flex-col items-center gap-3 text-slate-500"><div className="p-4 bg-white shadow-sm rounded-full border border-slate-200"><svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg></div><p className="font-bold text-sm text-cyan-600">Tocar para Cámara / Galería</p></div>
              )}
            </label>
          </div>

          <div className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${nuevoCarro.es_custom ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setNuevoCarro({...nuevoCarro, es_custom: !nuevoCarro.es_custom})}>
            <div>
              <p className={`text-sm font-bold flex items-center gap-2 ${nuevoCarro.es_custom ? 'text-sky-700' : 'text-slate-600'}`}>🎨 Pieza Customizada</p>
              <p className="text-xs text-slate-500 mt-1">Modo libre: Crea tu propia serie y rareza sin afectar la bóveda global.</p>
            </div>
            <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${nuevoCarro.es_custom ? 'bg-sky-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${nuevoCarro.es_custom ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
          </div>

          {(miPerfil?.rol === 'VENDEDOR' || miPerfil?.rol === 'SUPER_ADMIN') && (
            <div className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${nuevoCarro.es_lote ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setNuevoCarro({...nuevoCarro, es_lote: !nuevoCarro.es_lote, es_subasta: false})}>
              <div>
                <p className={`text-sm font-bold flex items-center gap-2 ${nuevoCarro.es_lote ? 'text-purple-700' : 'text-slate-600'}`}>📦 Vender como Lote</p>
                <p className="text-xs text-slate-500 mt-1">Desactiva la IA y te permite subir galería extra.</p>
              </div>
              <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${nuevoCarro.es_lote ? 'bg-purple-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${nuevoCarro.es_lote ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
            </div>
          )}

          {nuevoCarro.es_lote && (
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mb-2 block">📸 Fotos Adicionales del Lote (Max 5)</label>
              
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {fotosExtraExistentes.map((url: string, i: number) => (
                  <div key={`ext-${i}`} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 relative group">
                    <img src={url} alt={`Extra ${i}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => eliminarFotoExtraExistente(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                  </div>
                ))}
                {fotosExtraPreview.map((url: string, i: number) => (
                  <div key={`new-${i}`} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 relative group">
                    <img src={url} alt={`Nueva ${i}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => eliminarFotoExtraNueva(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                  </div>
                ))}
                {(fotosExtraNuevas.length + fotosExtraExistentes.length) < 5 && (
                  <div className="w-20 h-20 shrink-0">
                    <input type="file" multiple accept="image/*" id="fotos-extra" className="hidden" onChange={manejarFotosExtra} />
                    <label htmlFor="fotos-extra" className="w-full h-full bg-white border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors text-purple-400 hover:text-purple-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="z-[36]">
              <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">{nuevoCarro.es_lote ? 'Título del Lote *' : 'Modelo del Auto *'}</label>
              <input type="text" required placeholder={nuevoCarro.es_lote ? "Ej. Lote de 5 Skyline GTR R34" : "Ej. Skyline GT-R R34"} value={nuevoCarro.modelo} onChange={(e) => setNuevoCarro({...nuevoCarro, modelo: e.target.value})} className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-500 shadow-sm" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="z-[35]">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Fabricante Base *</label>
                <BuscadorDesplegable opciones={opcionesFabricante} valorSeleccionado={nuevoCarro.id_fabricante} onSelect={(id: string, text: string) => setNuevoCarro({...nuevoCarro, id_fabricante: id, otro_fabricante: text})} placeholder="Buscar o crear..." permiteNuevo={true} />
              </div>
              <div className="z-[34]">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Marca de Auto *</label>
                <BuscadorDesplegable opciones={opcionesMarca} valorSeleccionado={nuevoCarro.id_marca} onSelect={(id: string, text: string) => setNuevoCarro({...nuevoCarro, id_marca: id, otra_marca: text})} placeholder="Buscar o crear..." permiteNuevo={true} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="z-[33]">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block flex items-center gap-1">📦 Presentación / Empaque</label>
                <BuscadorDesplegable opciones={opcionesPresentacion} valorSeleccionado={nuevoCarro.id_presentacion} onSelect={(id: string, text: string) => setNuevoCarro({...nuevoCarro, id_presentacion: id, otra_presentacion: text})} placeholder="Ej. 5-Pack, Individual..." disabled={!idFabAct && !nuevoCarro.es_custom} permiteNuevo={true} />
              </div>
              <div className="z-[32]">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block flex items-center gap-1">💎 Nivel de Rareza</label>
                <BuscadorDesplegable 
                  opciones={opcionesRareza} 
                  valorSeleccionado={nuevoCarro.rareza} 
                  onSelect={(id: string, text: string) => setNuevoCarro({...nuevoCarro, rareza: id, rareza_custom_texto: text})} 
                  placeholder={nuevoCarro.es_custom ? "Pieza Única..." : "Variante (TH, Chase...)"} 
                  disabled={!idFabAct && !nuevoCarro.es_custom} 
                  permiteNuevo={true} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="sm:col-span-5 z-[31]">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Serie (Filtrada)</label>
                <BuscadorDesplegable opciones={opcionesSerie} valorSeleccionado={nuevoCarro.id_serie} onSelect={(id: string, text: string) => setNuevoCarro({...nuevoCarro, id_serie: id, otra_serie: text})} placeholder="Ej. Exotics" disabled={!idFabAct && nuevoCarro.id_fabricante !== 'nuevo' && !nuevoCarro.es_custom} permiteNuevo={true} />
              </div>
              <div className="sm:col-span-3 flex gap-2 z-[30]">
                <div className="w-1/2">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">No.</label>
                  <input type="number" placeholder="3" value={nuevoCarro.no_carro} onChange={(e) => setNuevoCarro({...nuevoCarro, no_carro: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-2 py-3 outline-none text-center shadow-sm" />
                </div>
                <div className="flex items-center pt-5 text-slate-400 font-bold">/</div>
                <div className="w-1/2">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Total</label>
                  <input type="number" placeholder="10" disabled={(nuevoCarro.id_serie !== 'nuevo' && serieTieneTotal) && !esUsuarioVIP && !nuevoCarro.es_custom} value={nuevoCarro.total_carros} onChange={(e) => setNuevoCarro({...nuevoCarro, total_carros: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-2 py-3 outline-none text-center disabled:bg-slate-100 disabled:text-slate-400 shadow-sm" />
                </div>
              </div>
              <div className="sm:col-span-4 z-[29]">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Año</label>
                <select disabled={(nuevoCarro.id_serie !== 'nuevo' && serieTieneAnio) && !esUsuarioVIP && !nuevoCarro.es_custom} value={nuevoCarro.anio_serie} onChange={(e) => setNuevoCarro({...nuevoCarro, anio_serie: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-3 outline-none disabled:bg-slate-100 cursor-pointer shadow-sm">
                  <option value="">-- Seleccionar --</option>
                  {aniosDisponibles.map((anio: number) => <option key={anio} value={anio}>{anio}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="z-[28]">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Estado Físico</label>
                <BuscadorDesplegable opciones={opcionesEstado} valorSeleccionado={nuevoCarro.id_estado_carro} onSelect={(id: string, text: string) => setNuevoCarro({...nuevoCarro, id_estado_carro: id})} placeholder="Seleccionar..." permiteNuevo={false} />
              </div>
              <div className="z-[27]">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Escala</label>
                <BuscadorDesplegable opciones={opcionesEscala} valorSeleccionado={nuevoCarro.id_escala} onSelect={(id: string, text: string) => setNuevoCarro({...nuevoCarro, id_escala: id})} placeholder="Seleccionar..." permiteNuevo={false} />
              </div>
            </div>

            {nuevoCarro.es_custom && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-sky-700 font-bold uppercase tracking-wider block mb-2">Valor Pieza Base ($)</label>
                  <input type="number" step="0.01" placeholder="Ej. 50.00" value={nuevoCarro.valor_base || ""} onChange={(e) => setNuevoCarro({...nuevoCarro, valor_base: e.target.value})} className="w-full bg-white border border-sky-300 text-sky-800 font-black rounded-lg px-4 py-3 outline-none focus:border-sky-500 shadow-sm" />
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-sky-700 font-bold uppercase tracking-wider block mb-2">Costo Materiales ($)</label>
                  <input type="number" step="0.01" placeholder="Ej. 100.00" value={nuevoCarro.costo_materiales || ""} onChange={(e) => setNuevoCarro({...nuevoCarro, costo_materiales: e.target.value})} className="w-full bg-white border border-sky-300 text-sky-800 font-black rounded-lg px-4 py-3 outline-none focus:border-sky-500 shadow-sm" />
                </div>
              </div>
            )}

            {miPerfil?.rol === 'VENDEDOR' || miPerfil?.rol === 'SUPER_ADMIN' ? (
              <div className="space-y-2 mt-2">
                
                <div className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${nuevoCarro.para_venta ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setNuevoCarro({...nuevoCarro, para_venta: !nuevoCarro.para_venta, para_cambio: false, es_subasta: false, es_preventa: false})}>
                  <div>
                    <p className={`text-sm font-bold flex items-center gap-2 ${nuevoCarro.para_venta ? 'text-amber-700' : 'text-slate-600'}`}>💲 En Venta</p>
                    <p className="text-xs text-slate-500 mt-1">Se publicará en la tienda de Collectors.</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${nuevoCarro.para_venta ? 'bg-amber-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${nuevoCarro.para_venta ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                </div>

                {nuevoCarro.para_venta && (
                  <div className="pl-4 border-l-2 border-slate-200 space-y-2 ml-4">
                    
                    <div className={`border p-4 rounded-xl flex flex-col gap-3 transition-colors ${nuevoCarro.es_subasta ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setNuevoCarro({...nuevoCarro, es_subasta: !nuevoCarro.es_subasta, es_preventa: false, es_lote: false})}>
                        <div>
                          <p className={`text-sm font-bold flex items-center gap-2 ${nuevoCarro.es_subasta ? 'text-rose-700' : 'text-slate-600'}`}>🔨 Enviar a Subasta</p>
                          <p className="text-xs text-slate-500 mt-1">Recibe pujas en tiempo real. Desactiva lotes y preventas.</p>
                        </div>
                        <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${nuevoCarro.es_subasta ? 'bg-rose-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${nuevoCarro.es_subasta ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                      </div>
                      
                      {nuevoCarro.es_subasta && (
                        <div className="animate-in fade-in slide-in-from-top-2 pt-2 border-t border-rose-100 flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mb-1 block">Precio Inicial ($) *</label>
                                    <input type="number" required={nuevoCarro.es_subasta} value={nuevoCarro.precio_inicial} onChange={(e) => setNuevoCarro({...nuevoCarro, precio_inicial: e.target.value})} className="w-full bg-white border border-rose-200 text-rose-900 font-bold rounded-lg px-3 py-2 outline-none focus:border-rose-400 shadow-sm text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mb-1 block">Puja Mínima ($) *</label>
                                    <input type="number" required={nuevoCarro.es_subasta} value={nuevoCarro.incremento_minimo} onChange={(e) => setNuevoCarro({...nuevoCarro, incremento_minimo: e.target.value})} className="w-full bg-white border border-rose-200 text-rose-900 font-bold rounded-lg px-3 py-2 outline-none focus:border-rose-400 shadow-sm text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mb-1 block">Fecha y Hora de Cierre *</label>
                                <input type="datetime-local" required={nuevoCarro.es_subasta} value={nuevoCarro.fecha_cierre_subasta} onChange={(e) => setNuevoCarro({...nuevoCarro, fecha_cierre_subasta: e.target.value})} className="w-full bg-white border border-rose-200 text-rose-900 font-medium rounded-lg px-3 py-2 outline-none focus:border-rose-400 shadow-sm text-sm" />
                            </div>
                        </div>
                      )}
                    </div>

                    {!nuevoCarro.es_subasta && (
                      <div className={`border p-4 rounded-xl flex flex-col gap-3 transition-colors ${nuevoCarro.es_preventa ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setNuevoCarro({...nuevoCarro, es_preventa: !nuevoCarro.es_preventa})}>
                          <div>
                            <p className={`text-sm font-bold flex items-center gap-2 ${nuevoCarro.es_preventa ? 'text-indigo-700' : 'text-slate-600'}`}>⏳ Es Preventa</p>
                          </div>
                          <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${nuevoCarro.es_preventa ? 'bg-indigo-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${nuevoCarro.es_preventa ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                        </div>
                        
                        {nuevoCarro.es_preventa && (
                          <div className="animate-in fade-in slide-in-from-top-2 pt-2 border-t border-indigo-100">
                            <label className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-1 block">Fecha de Llegada *</label>
                            <input type="date" required={nuevoCarro.es_preventa} value={nuevoCarro.fecha_llegada} onChange={(e) => setNuevoCarro({...nuevoCarro, fecha_llegada: e.target.value})} className="w-full bg-white border border-indigo-200 text-indigo-900 font-medium rounded-lg px-3 py-2 outline-none focus:border-indigo-400 shadow-sm text-sm" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!nuevoCarro.es_subasta && (
                       <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <div className="flex justify-between items-end mb-1">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Valor de Venta ($)</label>
                            {(!cocheEditando && nuevoCarro.modelo && !nuevoCarro.es_lote && !nuevoCarro.es_custom) && <span className="text-[9px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">IA Automática 🤖</span>}
                            {nuevoCarro.es_custom && <span className="text-[9px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">Costo Materiales 🎨</span>}
                          </div>
                          <input type="number" step="0.01" required={nuevoCarro.para_venta} placeholder="0.00" value={nuevoCarro.valor} onChange={(e) => setNuevoCarro({...nuevoCarro, valor: e.target.value})} className="w-full bg-white border border-slate-300 text-emerald-600 font-black rounded-lg px-4 py-3 outline-none focus:border-cyan-500 shadow-sm" />
                       </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <div className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${nuevoCarro.para_cambio ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setNuevoCarro({...nuevoCarro, para_cambio: !nuevoCarro.para_cambio})}>
                  <div>
                    <p className={`text-sm font-bold flex items-center gap-2 ${nuevoCarro.para_cambio ? 'text-emerald-700' : 'text-slate-600'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg> Disponible para Intercambio</p>
                    <p className="text-xs text-slate-500 mt-1">Actívalo si quieres recibir ofertas de otros usuarios.</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${nuevoCarro.para_cambio ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${nuevoCarro.para_cambio ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Valor de la Pieza ($)</label>
                    {(!cocheEditando && nuevoCarro.modelo && !nuevoCarro.es_lote && !nuevoCarro.es_custom) && <span className="text-[9px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">IA Automática 🤖</span>}
                    {nuevoCarro.es_custom && <span className="text-[9px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">Costo Materiales 🎨</span>}
                  </div>
                  <input type="number" step="0.01" placeholder="0.00" value={nuevoCarro.valor} onChange={(e) => setNuevoCarro({...nuevoCarro, valor: e.target.value})} className="w-full bg-white border border-slate-300 text-emerald-600 font-black rounded-lg px-4 py-3 outline-none focus:border-cyan-500 shadow-sm" />
                </div>
              </div>
            )}

          </div>
          <div className="mt-2 pt-6 border-t border-slate-100 flex gap-3">
            <button type="submit" disabled={guardandoCarro} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50">{guardandoCarro ? "Guardando..." : (cocheEditando ? "Actualizar Publicación" : "Publicar Pieza")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}