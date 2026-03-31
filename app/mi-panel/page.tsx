"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import CollectorCard from "@/components/CollectorCard";
import { evaluarLogros } from "@/lib/logrosEngine";
import AchievementUnlock from "@/components/AchievementUnlock";
import TrophyShowcase from "@/components/TrophyShowcase";
import { calcularValorAproximado } from "@/lib/valuationEngine";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from 'browser-image-compression';

// ========================================================================
// 🧠 COMPONENTE: Buscador Inteligente Desplegable (Combobox)
// ========================================================================
function BuscadorDesplegable({ 
  opciones, 
  valorSeleccionado, 
  onSelect, 
  placeholder, 
  disabled = false,
  permiteNuevo = true
}: {
  opciones: {id: string, label: string}[],
  valorSeleccionado: string,
  onSelect: (id: string, textoNuevo: string) => void,
  placeholder: string,
  disabled?: boolean,
  permiteNuevo?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (valorSeleccionado && valorSeleccionado !== "nuevo") {
      const opt = opciones.find(o => o.id === valorSeleccionado);
      if (opt) setBusqueda(opt.label);
    } else if (valorSeleccionado !== "nuevo") {
      setBusqueda("");
    }
  }, [valorSeleccionado, opciones]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (valorSeleccionado && valorSeleccionado !== "nuevo") {
          const opt = opciones.find(o => o.id === valorSeleccionado);
          if (opt) setBusqueda(opt.label);
        } else if (valorSeleccionado !== "nuevo") {
          setBusqueda("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [valorSeleccionado, opciones]);

  const filtradas = opciones.filter(o => o.label.toLowerCase().includes(busqueda.toLowerCase()));
  const exactMatch = opciones.some(o => o.label.toLowerCase() === busqueda.trim().toLowerCase());
  const showAdd = permiteNuevo && busqueda.trim().length > 0 && !exactMatch;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={busqueda}
          onChange={e => {
            setBusqueda(e.target.value);
            setIsOpen(true);
            if (valorSeleccionado && valorSeleccionado !== "nuevo") onSelect("", ""); 
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors disabled:bg-slate-100 disabled:text-slate-400 placeholder:text-slate-400 shadow-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black/5">
          {filtradas.length === 0 && !showAdd && (
            <div className="p-4 text-sm text-slate-500 text-center font-medium">No se encontraron resultados</div>
          )}
          {filtradas.map(opt => (
            <div
              key={opt.id}
              onClick={() => { onSelect(opt.id, ""); setBusqueda(opt.label); setIsOpen(false); }}
              className="p-3 hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer text-sm font-medium text-slate-700 transition-colors"
            >
              {opt.label}
            </div>
          ))}
          {showAdd && (
            <div
              onClick={() => { onSelect("nuevo", busqueda.trim()); setIsOpen(false); }}
              className="p-3 bg-cyan-50 hover:bg-cyan-100 cursor-pointer text-sm font-black text-cyan-700 flex items-center gap-2 transition-colors sticky bottom-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Crear "{busqueda.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ========================================================================

export default function MiPanelUsuario() {
  const router = useRouter();
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [miPerfil, setMiPerfil] = useState<any>(null);
  
  const [tabActiva, setTabActiva] = useState("boveda"); 

  const [misCarros, setMisCarros] = useState<any[]>([]);
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [rarezas, setRarezas] = useState<any[]>([]);
  const [presentaciones, setPresentaciones] = useState<any[]>([]); 
  const [escalas, setEscalas] = useState<any[]>([]);
  const [estadosCarro, setEstadosCarro] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState(""); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guardandoCarro, setGuardandoCarro] = useState(false);
  const [cocheEditando, setCocheEditando] = useState<number | null>(null);
  const [fotoArchivoCarro, setFotoArchivoCarro] = useState<File | null>(null);
  const [fotoPreviewCarro, setFotoPreviewCarro] = useState<string | null>(null);
  const [nuevosLogros, setNuevosLogros] = useState<string[]>([]);
  const [misTrofeos, setMisTrofeos] = useState<any[]>([]);

  // 📦 Añadimos `otra_presentacion` para capturar el texto si el usuario crea una nueva
  const [nuevoCarro, setNuevoCarro] = useState({
    modelo: "", id_fabricante: "", otro_fabricante: "", id_marca: "", otra_marca: "",
    id_serie: "", otra_serie: "", rareza: "", id_presentacion: "", otra_presentacion: "", valor: "", id_escala: "", id_estado_carro: "", 
    no_carro: "", total_carros: "", anio_serie: "", para_cambio: false, para_venta: false
  });

  const [archivosRafaga, setArchivosRafaga] = useState<{ file: File, preview: string, modelo: string, id_marca: string, valor: string }[]>([]);
  const [subiendoRafaga, setSubiendoRafaga] = useState(false);

  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  const [estadosMexico, setEstadosMexico] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");
  const [fotoArchivoPerfil, setFotoArchivoPerfil] = useState<File | null>(null);
  const [fotoPreviewPerfil, setFotoPreviewPerfil] = useState<string | null>(null);

  const anioActual = new Date().getFullYear();
  const aniosDisponibles = Array.from({ length: anioActual - 1890 + 1 }, (_, i) => anioActual - i);

  useEffect(() => {
    cargarDatosCentrales();
  }, []);

  const cargarDatosCentrales = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: perfilData } = await supabase.from('usuario').select('*').eq('correo', user.email).single();
    if (perfilData) {
      setMiPerfil(perfilData);
      setNombreUsuario(perfilData.nombre_usuario || "");
      setWhatsapp(perfilData.whatsapp ? perfilData.whatsapp.toString() : "");
      setFacebook(perfilData.facebook || "");
      setLinkMaps(perfilData.link_maps || "");
      setFotoPreviewPerfil(perfilData.link_img_perf);
      setMunicipioSeleccionado(perfilData.id_mun ? perfilData.id_mun.toString() : "");

      if (perfilData.id_mun) {
        const resMun = await supabase.from('municipio').select('id_est').eq('id_mun', perfilData.id_mun).single();
        if (resMun.data) {
          setEstadoSeleccionado(resMun.data.id_est.toString());
          cargarMunicipios(resMun.data.id_est);
        }
      }

      const { data: carrosData } = await supabase.from('carro').select(`*, marca(marca), serie(*), fabricante(fabricante), presentacion(presentacion)`).eq('id_usuario', perfilData.id_usuario).order('id_carro', { ascending: false });
      if (carrosData) setMisCarros(carrosData);

      const { data: todosLosLogros } = await supabase.from('logro').select('*').order('id_logro', { ascending: true });
      const { data: misLogrosData } = await supabase.from('usuario_logro').select('id_logro').eq('id_usuario', perfilData.id_usuario);
      
      if (todosLosLogros) {
        const misIds = misLogrosData?.map(ml => ml.id_logro) || [];
        const logrosMapeados = todosLosLogros.map(logro => ({
          ...logro,
          unlocked: misIds.includes(logro.id_logro)
        }));
        setMisTrofeos(logrosMapeados);
      }
    }

    const [resFab, resMar, resSer, resRar, resPres, resEsc, resEstCarro, resEstMex] = await Promise.all([
      supabase.from('fabricante').select('*').order('fabricante', { ascending: true }),
      supabase.from('marca').select('*').order('marca', { ascending: true }),
      supabase.from('serie').select('*').order('serie', { ascending: true }),
      supabase.from('rareza').select('*').order('rareza', { ascending: true }),
      supabase.from('presentacion').select('*').order('presentacion', { ascending: true }),
      supabase.from('escala').select('*').order('escala', { ascending: true }),
      supabase.from('estado_carro').select('*').order('estado_carro', { ascending: true }),
      supabase.from('estado').select('*').order('estado', { ascending: true })
    ]);
    
    if (resFab.data) setFabricantes(resFab.data);
    if (resMar.data) setMarcas(resMar.data);
    if (resSer.data) setSeries(resSer.data);
    if (resRar.data) setRarezas(resRar.data);
    if (resPres.data) setPresentaciones(resPres.data);
    if (resEsc.data) setEscalas(resEsc.data);
    if (resEstCarro.data) setEstadosCarro(resEstCarro.data);
    if (resEstMex.data) setEstadosMexico(resEstMex.data);

    setCargandoDatos(false);
  };

  const cargarMunicipios = async (idEst: string | number) => {
    if (!idEst) { setMunicipios([]); return; }
    const { data } = await supabase.from('municipio').select('*').eq('id_est', idEst).order('municipio', { ascending: true });
    if (data) setMunicipios(data);
  };

  const manejarCambioEstadoMex = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEst = e.target.value; setEstadoSeleccionado(nuevoEst); setMunicipioSeleccionado(""); cargarMunicipios(nuevoEst);
  };

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault(); setGuardandoPerfil(true);
    if (nombreUsuario.trim() !== miPerfil.nombre_usuario) {
      const { data: usuarioExistente } = await supabase.from('usuario').select('id_usuario').ilike('nombre_usuario', nombreUsuario.trim()).single();
      if (usuarioExistente) { alert("⚠️ Ese nombre de usuario ya está en uso."); setGuardandoPerfil(false); return; }
    }
    let imagenUrlFinal = fotoPreviewPerfil?.includes('blob:') ? null : fotoPreviewPerfil;
    if (fotoArchivoPerfil) {
      try {
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(fotoArchivoPerfil, options);
        const extension = compressedFile.name.split('.').pop() || 'jpg';
        const nombreArchivo = `${miPerfil.id_usuario}_${Date.now()}.${extension}`;
        await supabase.storage.from('avatares').upload(nombreArchivo, compressedFile);
        const { data } = supabase.storage.from('avatares').getPublicUrl(nombreArchivo);
        imagenUrlFinal = data.publicUrl;
      } catch (error) { alert("Error al optimizar imagen."); setGuardandoPerfil(false); return; }
    }
    const payload: any = { nombre_usuario: nombreUsuario.trim(), facebook, whatsapp: whatsapp ? parseInt(whatsapp) : null, id_mun: municipioSeleccionado ? parseInt(municipioSeleccionado) : null, link_img_perf: imagenUrlFinal, link_maps: linkMaps };
    const { error } = await supabase.from('usuario').update(payload).eq('id_usuario', miPerfil.id_usuario);
    if (error) alert("Error al guardar: " + error.message); else alert("Perfil actualizado correctamente.");
    setGuardandoPerfil(false);
  };

  const crearSiEsNuevo = async (tabla: string, columna: string, idSeleccionado: string, valorNuevo: string, extraData: any = {}) => {
    if (idSeleccionado !== "nuevo") return parseInt(idSeleccionado) || null;
    if (!valorNuevo) return null;
    const existente = await supabase.from(tabla).select(`id_${tabla}`).ilike(columna, valorNuevo).single();
    if (existente.data) return (existente.data as Record<string, any>)[`id_${tabla}`];
    const { data } = await supabase.from(tabla).insert([{ [columna]: valorNuevo, ...extraData }]).select().single();
    return data ? (data as Record<string, any>)[`id_${tabla}`] : null;
  };

  useEffect(() => {
    if (!cocheEditando && nuevoCarro.modelo && nuevoCarro.id_fabricante) {
      const timeout = setTimeout(() => {
        // Convertimos IDs a Nombres reales para que la IA entienda
        const fab = fabricantes.find(f => f.id_fabricante.toString() === nuevoCarro.id_fabricante)?.fabricante || nuevoCarro.otro_fabricante;
        const est = estadosCarro.find(e => e.id_estado_carro.toString() === nuevoCarro.id_estado_carro)?.estado_carro || "";
        const anioNum = parseInt(nuevoCarro.anio_serie) || new Date().getFullYear();
        
        // 🚨 AQUÍ ESTABA EL ERROR: Buscamos el NOMBRE de la rareza
        const nombreRar = rarezas.find(r => r.id_rareza.toString() === nuevoCarro.rareza)?.rareza || nuevoCarro.rareza;
        
        // Buscamos el NOMBRE de la presentación
        const nombrePres = presentaciones.find(p => p.id_presentacion.toString() === nuevoCarro.id_presentacion)?.presentacion || nuevoCarro.otra_presentacion || "Individual Básico";

        // Enviamos NOMBRES, no IDs
        const valorSugerido = calcularValorAproximado(nuevoCarro.modelo, fab, nombreRar, nombrePres, anioNum, est);
        
        setNuevoCarro(prev => ({ ...prev, valor: valorSugerido.toString() }));
      }, 500); 

      return () => clearTimeout(timeout);
    }
  }, [nuevoCarro.modelo, nuevoCarro.id_fabricante, nuevoCarro.otro_fabricante, nuevoCarro.rareza, nuevoCarro.id_presentacion, nuevoCarro.otra_presentacion, nuevoCarro.anio_serie, nuevoCarro.id_estado_carro, cocheEditando]);
  useEffect(() => {
    if (nuevoCarro.id_serie && nuevoCarro.id_serie !== "nuevo") {
      const serieSeleccionada = series.find(s => s.id_serie === parseInt(nuevoCarro.id_serie));
      if (serieSeleccionada) setNuevoCarro(prev => ({ ...prev, total_carros: serieSeleccionada.no_carros ? serieSeleccionada.no_carros.toString() : "", anio_serie: serieSeleccionada.anio ? serieSeleccionada.anio.toString() : prev.anio_serie }));
    } else if (nuevoCarro.id_serie === "nuevo") {
      setNuevoCarro(prev => ({ ...prev, total_carros: "", anio_serie: "" })); 
    }
  }, [nuevoCarro.id_serie, series]);

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
      } catch (error) { alert("Error al optimizar la fotografía."); setGuardandoCarro(false); return; }
    }
    const finalIdFab = await crearSiEsNuevo('fabricante', 'fabricante', nuevoCarro.id_fabricante, nuevoCarro.otro_fabricante);
    const finalIdMar = await crearSiEsNuevo('marca', 'marca', nuevoCarro.id_marca, nuevoCarro.otra_marca);
    const finalIdSer = await crearSiEsNuevo('serie', 'serie', nuevoCarro.id_serie, nuevoCarro.otra_serie, { id_fabricante: finalIdFab, anio: parseInt(nuevoCarro.anio_serie) || null, no_carros: parseInt(nuevoCarro.total_carros) || null });
    
    // 📦 CREAR PRESENTACIÓN SI ES NUEVA Y OBTENER SU ID
    const finalIdPres = await crearSiEsNuevo('presentacion', 'presentacion', nuevoCarro.id_presentacion, nuevoCarro.otra_presentacion, { id_fabricante: finalIdFab });

    const finalAnio = parseInt(nuevoCarro.anio_serie) || new Date().getFullYear();
    const nombreEst = estadosCarro.find(e => e.id_estado_carro.toString() === nuevoCarro.id_estado_carro)?.estado_carro || "";
    const nombreFab = fabricantes.find(f => f.id_fabricante.toString() === nuevoCarro.id_fabricante)?.fabricante || nuevoCarro.otro_fabricante;
    const nombreRareza = rarezas.find(r => r.id_rareza.toString() === nuevoCarro.rareza)?.rareza || nuevoCarro.rareza;
    const nombrePres = presentaciones.find(p => p.id_presentacion.toString() === nuevoCarro.id_presentacion)?.presentacion || nuevoCarro.otra_presentacion || "Individual Básico";
    
    const sugeridoIA = calcularValorAproximado(nuevoCarro.modelo, nombreFab, nombreRareza, nombrePres, finalAnio, nombreEst);

    const payload: any = {
      modelo: nuevoCarro.modelo, id_fabricante: finalIdFab, marca: finalIdMar, serie: finalIdSer,  
      rareza: nombreRareza, 
      id_presentacion: finalIdPres || null, // 📦 GUARDAMOS EL ID FINAL
      valor: parseFloat(nuevoCarro.valor) || 0,
      valor_calculado: sugeridoIA,
      escala: parseInt(nuevoCarro.id_escala) || null, estado_carro: parseInt(nuevoCarro.id_estado_carro) || null, no_carro: parseInt(nuevoCarro.no_carro) || null, 
      para_cambio: nuevoCarro.para_cambio, para_venta: nuevoCarro.para_venta
    };
    if (imagenUrlFinal) payload.imagen_url = imagenUrlFinal;

    if (cocheEditando) {
      const { error } = await supabase.from('carro').update(payload).eq('id_carro', cocheEditando);
      if (error) alert("Error al editar: " + error.message); else { cargarDatosCentrales(); cerrarModal(); alert("¡Pieza actualizada!"); }
    } else {
      payload.id_usuario = miPerfil.id_usuario;
      payload.estado_aprobacion = 'APROBADO'; 
      const { error } = await supabase.from('carro').insert([payload]);
      if (error) alert("Error al registrar: " + error.message); else { cargarDatosCentrales(); cerrarModal(); const medallasGanadas = await evaluarLogros(miPerfil.id_usuario); if (medallasGanadas && medallasGanadas.length > 0) setNuevosLogros(medallasGanadas); }
    }
    setGuardandoCarro(false);
  };

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

    for (const item of archivosRafaga) {
      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.85 };
        const compressedFile = await imageCompression(item.file, options);
        const extension = compressedFile.name.split('.').pop() || 'jpg';
        const nombreArchivo = `${miPerfil.id_usuario}_rafaga_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
        
        await supabase.storage.from('autos').upload(nombreArchivo, compressedFile);
        const { data: urlData } = supabase.storage.from('autos').getPublicUrl(nombreArchivo);
        
        const precioSugeridoIA = calcularValorAproximado(item.modelo, "Hot Wheels", "Común", "Individual Básico", new Date().getFullYear(), "Blíster Excelente Condición");

        const payload = {
          id_usuario: miPerfil.id_usuario, modelo: item.modelo, marca: parseInt(item.id_marca) || null, 
          valor: parseFloat(item.valor) || 0,
          valor_calculado: precioSugeridoIA, 
          imagen_url: urlData.publicUrl, estado_aprobacion: 'APROBADO', para_venta: true, para_cambio: false 
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

  const abrirModalCarro = (carro: any = null) => {
    if (carro) {
      setCocheEditando(carro.id_carro);
      const idMarcaReal = marcas.find(m => m.marca === carro.marca?.marca)?.id_marca || "";
      const idSerieReal = carro.serie?.id_serie || "";
      
      const idRarezaReal = rarezas.find(r => r.rareza === carro.rareza && r.id_fabricante === carro.id_fabricante)?.id_rareza || carro.rareza;

      setNuevoCarro({ 
        modelo: carro.modelo || "", 
        id_fabricante: carro.id_fabricante ? carro.id_fabricante.toString() : "", 
        otro_fabricante: "", 
        id_marca: idMarcaReal.toString(), 
        otra_marca: "", 
        id_serie: idSerieReal.toString(), 
        otra_serie: "", 
        rareza: idRarezaReal.toString(), 
        id_presentacion: carro.id_presentacion ? carro.id_presentacion.toString() : "", 
        otra_presentacion: "", // Limpiamos la captura manual
        valor: carro.valor ? carro.valor.toString() : "", 
        id_escala: carro.escala ? carro.escala.toString() : "", 
        id_estado_carro: carro.estado_carro ? carro.estado_carro.toString() : "", 
        no_carro: carro.no_carro ? carro.no_carro.toString() : "", 
        total_carros: carro.serie?.no_carros ? carro.serie.no_carros.toString() : "", 
        anio_serie: carro.serie?.anio ? carro.serie.anio.toString() : "", 
        para_cambio: carro.para_cambio || false, 
        para_venta: carro.para_venta || false 
      });
      setFotoPreviewCarro(carro.imagen_url || null);
    } else {
      setCocheEditando(null); setFotoPreviewCarro(null);
      setNuevoCarro({ modelo: "", id_fabricante: "", otro_fabricante: "", id_marca: "", otra_marca: "", id_serie: "", otra_serie: "", rareza: "", id_presentacion: "", otra_presentacion: "", valor: "", id_escala: "", id_estado_carro: "", no_carro: "", total_carros: "", anio_serie: "", para_cambio: false, para_venta: false });
    }
    setFotoArchivoCarro(null); setIsModalOpen(true);
  };

  const eliminarCarro = async (idCarro: number) => {
    if (!window.confirm("⚠️ ¿Eliminar esta pieza de tu colección?")) return;
    const { error } = await supabase.from('carro').delete().eq('id_carro', idCarro);
    if (error) alert("Error: " + error.message); else cargarDatosCentrales();
  };

  const cerrarModal = () => { setIsModalOpen(false); setCocheEditando(null); setFotoArchivoCarro(null); setFotoPreviewCarro(null); };

  const idFabAct = parseInt(nuevoCarro.id_fabricante) || null;
  const seriesFiltradas = idFabAct ? series.filter(s => s.id_fabricante === idFabAct) : series;
  const rarezasFiltradas = idFabAct ? rarezas.filter(r => r.id_fabricante === idFabAct) : rarezas;
  const presentacionesFiltradas = idFabAct ? presentaciones.filter(p => p.id_fabricante === idFabAct) : presentaciones; 
  
  const carrosFiltrados = misCarros.filter(carro => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    return carro.modelo?.toLowerCase().includes(termino) || carro.marca?.marca?.toLowerCase().includes(termino) || carro.serie?.serie?.toLowerCase().includes(termino) || carro.rareza?.toLowerCase().includes(termino) || carro.fabricante?.fabricante?.toLowerCase().includes(termino);
  });

  const opcionesFabricante = fabricantes.map(f => ({ id: f.id_fabricante.toString(), label: f.fabricante }));
  const opcionesMarca = marcas.map(m => ({ id: m.id_marca.toString(), label: m.marca }));
  const opcionesSerie = seriesFiltradas.map(s => ({ id: s.id_serie.toString(), label: `${s.serie} ${s.anio ? `(${s.anio})` : ''}` }));
  const opcionesRareza = rarezasFiltradas.map(r => ({ id: r.id_rareza.toString(), label: r.rareza }));
  const opcionesPresentacion = presentacionesFiltradas.map(p => ({ id: p.id_presentacion.toString(), label: p.presentacion })); 
  const opcionesEstado = estadosCarro.map(e => ({ id: e.id_estado_carro.toString(), label: e.estado_carro }));
  const opcionesEscala = escalas.map(e => ({ id: e.id_escala.toString(), label: e.escala }));

  if (cargandoDatos) return <div className="flex min-h-screen items-center justify-center text-cyan-600 bg-slate-50 animate-pulse font-bold tracking-widest">ABRIENDO PANEL...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cyan-200 selection:text-cyan-900 pb-20">
      
      {/* HEADER DEL PANEL */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Mi Panel<span className="text-cyan-500">.</span></h1>
            <p className="text-slate-500 mt-1 font-medium">Bienvenido, {miPerfil?.nombre_usuario} {miPerfil?.rol === 'VENDEDOR' && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded ml-2 border border-amber-200">PRO STORE</span>}</p>
          </div>
          <Link href={`/perfil/${miPerfil?.nombre_usuario}`} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            Ver mi Vitrina Pública
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 w-full grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
        
        {/* MENÚ LATERAL */}
        <aside className="flex flex-row lg:flex-col gap-2 lg:col-span-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <button onClick={() => setTabActiva("boveda")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "boveda" ? "bg-white border-2 border-cyan-500 shadow-md text-cyan-700" : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> Mi Bóveda
          </button>
          <button onClick={() => setTabActiva("perfil")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "perfil" ? "bg-white border-2 border-cyan-500 shadow-md text-cyan-700" : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Configurar Perfil
          </button>
          <button onClick={() => setTabActiva("logros")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "logros" ? "bg-white border-2 border-cyan-500 shadow-md text-cyan-700" : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> 
            Álbum de Logros
          </button>
          {(miPerfil?.rol === 'VENDEDOR' || miPerfil?.rol === 'SUPER_ADMIN') && (
            <button onClick={() => setTabActiva("rafaga")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "rafaga" ? "bg-amber-50 border-2 border-amber-500 shadow-md text-amber-700" : "bg-transparent text-slate-500 hover:bg-amber-100/50 hover:text-amber-700"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              Subida Masiva (PRO)
            </button>
          )}
        </aside>

        {/* ÁREA PRINCIPAL */}
        <main className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[600px]">
          
          {/* PANTALLA 1: BÓVEDA */}
          {tabActiva === "boveda" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                <div className="relative w-full md:w-1/2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
                  <input type="text" placeholder="Buscar modelo, marca, rareza..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-3 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-400 focus:bg-white shadow-inner" />
                </div>
                <button onClick={() => abrirModalCarro()} className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> Nueva Pieza
                </button>
              </div>

              {misCarros.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 border border-slate-200 border-dashed rounded-2xl"><p className="text-slate-500 font-medium">Aún no hay joyas en tu bóveda.</p></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {carrosFiltrados.map((carro) => (
                    <div key={carro.id_carro} className="relative group">
                      {carro.estado_aprobacion === 'PENDIENTE' && <div className="absolute top-2 right-2 z-20 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">REVISIÓN</div>}
                      {carro.para_cambio && <div className="absolute top-2 left-2 z-20 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">CAMBIO</div>}
                      {carro.para_venta && <div className="absolute top-2 right-2 z-20 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">💲 EN VENTA</div>}
                      
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                        <button onClick={() => abrirModalCarro(carro)} className="bg-white text-slate-800 px-4 py-2 rounded-lg shadow-lg font-bold text-xs w-28 hover:bg-slate-100">Editar</button>
                        <button onClick={() => eliminarCarro(carro.id_carro)} className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-xs w-28 hover:bg-red-400">Eliminar</button>
                        <Link href={`/pieza/${carro.id_carro}`} className="bg-cyan-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-xs w-28 text-center hover:bg-cyan-500 mt-2">Detalles</Link>
                      </div>
                      
                      <CollectorCard 
                        modelo={carro.modelo} 
                        marca={carro.marca?.marca || "Sin Marca"} 
                        rareza={carro.rareza || "Común"} 
                        presentacion={carro.presentacion?.presentacion}
                        valor={carro.valor} 
                        valorCalculado={carro.valor_calculado} 
                        imagenUrl={carro.imagen_url} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANTALLA 2: CONFIGURAR PERFIL */}
          {tabActiva === "perfil" && (
             <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
               <h2 className="text-2xl font-black text-slate-800 mb-8 border-b border-slate-100 pb-4">Información de Coleccionista</h2>
               <form onSubmit={guardarPerfil} className="flex flex-col gap-8">
                 <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                   <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer group overflow-hidden bg-slate-200 shrink-0">
                     <input type="file" accept="image/*" className="hidden" id="foto-perfil" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setFotoArchivoPerfil(f); setFotoPreviewPerfil(URL.createObjectURL(f)); } }} />
                     <label htmlFor="foto-perfil" className="absolute inset-0 z-10 cursor-pointer"></label>
                     {fotoPreviewPerfil ? <img src={fotoPreviewPerfil} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-slate-400 text-xs font-bold text-center px-2">Subir Foto</span>}
                     <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-white text-xs font-bold">Cambiar</span></div>
                   </div>
                   <div className="w-full">
                     <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Nombre de Usuario</label>
                     <input type="text" required value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors shadow-sm" />
                     <p className="text-[10px] text-slate-400 mt-1 font-medium">⚠️ Si lo cambias, tu enlace público de vitrina también cambiará.</p>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-sm text-slate-800 font-bold uppercase tracking-wider border-b border-slate-200 pb-2 mb-4 flex justify-between">Contacto & Privacidad <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">100% PRIVADO</span></h3>
                   <p className="text-xs text-slate-500 mb-4">Estas redes solo serán visibles para coleccionistas que tú sigas y que te sigan de vuelta.</p>
                   <div className="space-y-4">
                     <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-2 focus-within:border-cyan-500 transition-colors shadow-sm"><span className="text-emerald-500 font-bold text-xl">W</span><input type="number" placeholder="WhatsApp (Ej. 5512345678)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-transparent text-slate-900 py-1.5 outline-none placeholder:text-slate-400 font-medium" /></div>
                     <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-4 py-2 focus-within:border-cyan-500 transition-colors shadow-sm"><span className="text-blue-600 font-bold text-xl">f</span><input type="text" placeholder="Enlace de Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} className="w-full bg-transparent text-slate-900 py-1.5 outline-none placeholder:text-slate-400 font-medium" /></div>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-sm text-slate-800 font-bold uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Ubicación Local</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <select value={estadoSeleccionado} onChange={manejarCambioEstadoMex} className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 shadow-sm font-medium"><option value="">-- Estado --</option>{estadosMexico.map(e => <option key={e.id_est} value={e.id_est}>{e.estado}</option>)}</select>
                     <select disabled={!estadoSeleccionado} value={municipioSeleccionado} onChange={(e) => setMunicipioSeleccionado(e.target.value)} className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 shadow-sm font-medium disabled:bg-slate-100 disabled:text-slate-400"><option value="">-- Municipio --</option>{municipios.map(m => <option key={m.id_mun} value={m.id_mun}>{m.municipio}</option>)}</select>
                   </div>
                 </div>

                 {miPerfil?.rol === 'VENDEDOR' && (
                  <div className="mt-4 border p-4 rounded-xl transition-colors border-slate-200 bg-slate-50 shadow-sm" >
                    <p className="text-sm font-bold flex items-center gap-2 text-slate-700 mb-2">📍 Ubicación Tienda (Google Maps)</p>
                    <input type="text" placeholder="Pega aquí el enlace a Google Maps de tu tienda" value={linkMaps} onChange={(e) => setLinkMaps(e.target.value)} className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 font-medium text-sm" />
                    <p className="text-xs text-slate-500 mt-2">Aparecerá un botón rojo en tu perfil para que los clientes te visiten.</p>
                  </div>
                 )}

                 <div className="pt-4 border-t border-slate-100">
                   <button type="submit" disabled={guardandoPerfil} className="w-full md:w-auto md:px-12 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50">{guardandoPerfil ? "Guardando..." : "Guardar Perfil"}</button>
                 </div>
               </form>
             </div>
          )}

          {/* PANTALLA 3: ÁLBUM DE LOGROS */}
          {tabActiva === "logros" && (
            <div className="animate-in fade-in duration-300">
              <TrophyShowcase trofeos={misTrofeos} />
            </div>
          )}

          {/* PANTALLA 4: MODO RÁFAGA */}
          {tabActiva === "rafaga" && (
            <div className="animate-in fade-in duration-300">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-white rounded-full shadow-sm text-amber-500 shrink-0"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg></div>
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
          )}

        </main>
      </div>

      {/* =================================================================================================================
          🧠 MODAL DE BÓVEDA CON BUSCADORES INTELIGENTES (COMBOBOX)
          ================================================================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200 overflow-y-auto pt-10 pb-10">
          <div className="bg-white w-full md:max-w-xl overflow-visible rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200 my-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-3xl">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{cocheEditando ? "Editar Pieza" : "Nueva Pieza"}<span className="text-cyan-500">.</span></h3>
              <button onClick={cerrarModal} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <form onSubmit={guardarCarro} className="p-6 flex flex-col gap-6">
              
              <div className="w-full">
                <input type="file" accept="image/*" capture="environment" id="foto-carro" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setFotoArchivoCarro(f); setFotoPreviewCarro(URL.createObjectURL(f)); } }} />
                <label htmlFor="foto-carro" className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group shadow-inner ${fotoPreviewCarro ? 'border-cyan-300' : 'border-slate-300 hover:border-cyan-400 bg-slate-50'}`}>
                  {fotoPreviewCarro ? (
                    <><img src={fotoPreviewCarro} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity"><span className="text-white font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full">Cambiar Foto</span></div></>
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center gap-3 text-slate-500"><div className="p-4 bg-white shadow-sm rounded-full border border-slate-200"><svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg></div><p className="font-bold text-sm text-cyan-600">Tocar para Cámara / Galería</p></div>
                  )}
                </label>
              </div>

              <div className="flex flex-col gap-4">
                <div className="z-[36]">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Modelo del Auto *</label>
                  <input type="text" required placeholder="Ej. Skyline GT-R R34" value={nuevoCarro.modelo} onChange={(e) => setNuevoCarro({...nuevoCarro, modelo: e.target.value})} className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-500 shadow-sm" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="z-[35]">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Fabricante *</label>
                    <BuscadorDesplegable 
                      opciones={opcionesFabricante}
                      valorSeleccionado={nuevoCarro.id_fabricante}
                      onSelect={(id, text) => setNuevoCarro({...nuevoCarro, id_fabricante: id, otro_fabricante: text})}
                      placeholder="Buscar o crear..."
                    />
                  </div>
                  <div className="z-[34]">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Marca de Auto *</label>
                    <BuscadorDesplegable 
                      opciones={opcionesMarca}
                      valorSeleccionado={nuevoCarro.id_marca}
                      onSelect={(id, text) => setNuevoCarro({...nuevoCarro, id_marca: id, otra_marca: text})}
                      placeholder="Buscar o crear..."
                    />
                  </div>
                </div>

                {/* 📦 NUEVA SECCIÓN: PRESENTACIÓN Y RAREZA JUNTAS (Mejor diseño) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="z-[33]">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block flex items-center gap-1">📦 Presentación / Empaque</label>
                    <BuscadorDesplegable 
                      opciones={opcionesPresentacion}
                      valorSeleccionado={nuevoCarro.id_presentacion}
                      onSelect={(id, text) => setNuevoCarro({...nuevoCarro, id_presentacion: id, otra_presentacion: text})} // 📦 AGREGADA `otra_presentacion: text` PARA CREAR NUEVAS
                      placeholder="Ej. 5-Pack, Individual..."
                      disabled={!idFabAct}
                      permiteNuevo={true} // 📦 HABILITADO PARA TODOS LOS USUARIOS
                    />
                  </div>
                  <div className="z-[32]">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block flex items-center gap-1">💎 Nivel de Rareza</label>
                    <BuscadorDesplegable 
                      opciones={opcionesRareza}
                      valorSeleccionado={nuevoCarro.rareza}
                      onSelect={(id, text) => setNuevoCarro({...nuevoCarro, rareza: id})}
                      placeholder="Variante (TH, Chase...)"
                      disabled={!idFabAct}
                      permiteNuevo={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="sm:col-span-5 z-[31]">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Serie (Filtrada)</label>
                    <BuscadorDesplegable 
                      opciones={opcionesSerie}
                      valorSeleccionado={nuevoCarro.id_serie}
                      onSelect={(id, text) => setNuevoCarro({...nuevoCarro, id_serie: id, otra_serie: text})}
                      placeholder="Ej. Exotics"
                      disabled={!idFabAct && nuevoCarro.id_fabricante !== 'nuevo'}
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-2 z-[30]">
                    <div className="w-1/2"><label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">No.</label><input type="number" placeholder="3" value={nuevoCarro.no_carro} onChange={(e) => setNuevoCarro({...nuevoCarro, no_carro: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-2 py-3 outline-none text-center shadow-sm" /></div>
                    <div className="flex items-center pt-5 text-slate-400 font-bold">/</div>
                    <div className="w-1/2"><label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Total</label><input type="number" placeholder="10" disabled={nuevoCarro.id_serie !== 'nuevo' && nuevoCarro.total_carros !== ""} value={nuevoCarro.total_carros} onChange={(e) => setNuevoCarro({...nuevoCarro, total_carros: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-2 py-3 outline-none text-center disabled:bg-slate-100 disabled:text-slate-400 shadow-sm" /></div>
                  </div>
                  <div className="sm:col-span-4 z-[29]">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Año</label>
                    <select disabled={nuevoCarro.id_serie !== 'nuevo' && nuevoCarro.anio_serie !== ""} value={nuevoCarro.anio_serie} onChange={(e) => setNuevoCarro({...nuevoCarro, anio_serie: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-3 py-3 outline-none disabled:bg-slate-100 cursor-pointer shadow-sm"><option value="">-- Seleccionar --</option>{aniosDisponibles.map(anio => <option key={anio} value={anio}>{anio}</option>)}</select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="z-[28]">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Estado Físico</label>
                    <BuscadorDesplegable 
                      opciones={opcionesEstado}
                      valorSeleccionado={nuevoCarro.id_estado_carro}
                      onSelect={(id, text) => setNuevoCarro({...nuevoCarro, id_estado_carro: id})}
                      placeholder="Seleccionar..."
                      permiteNuevo={false} 
                    />
                  </div>
                  <div className="z-[27]">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 block">Escala</label>
                    <BuscadorDesplegable 
                      opciones={opcionesEscala}
                      valorSeleccionado={nuevoCarro.id_escala}
                      onSelect={(id, text) => setNuevoCarro({...nuevoCarro, id_escala: id})}
                      placeholder="Seleccionar..."
                      permiteNuevo={false}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="z-[26] sm:col-start-2">
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Valor Estimado ($)</label>
                      {!cocheEditando && nuevoCarro.modelo && <span className="text-[9px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">Autocalculado 🤖</span>}
                    </div>
                    <input type="number" step="0.01" placeholder="0.00" value={nuevoCarro.valor} onChange={(e) => setNuevoCarro({...nuevoCarro, valor: e.target.value})} className="w-full bg-slate-50 border border-slate-300 text-emerald-600 font-black rounded-xl px-4 py-3 outline-none focus:border-cyan-500 shadow-sm" />
                  </div>
                </div>

                {miPerfil?.rol === 'VENDEDOR' || miPerfil?.rol === 'SUPER_ADMIN' ? (
                  <div className={`mt-2 border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${nuevoCarro.para_venta ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setNuevoCarro({...nuevoCarro, para_venta: !nuevoCarro.para_venta, para_cambio: false})}>
                    <div>
                      <p className={`text-sm font-bold flex items-center gap-2 ${nuevoCarro.para_venta ? 'text-amber-700' : 'text-slate-600'}`}>💲 En Venta</p>
                      <p className="text-xs text-slate-500 mt-1">Se publicará con botón de compra en la tienda.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${nuevoCarro.para_venta ? 'bg-amber-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${nuevoCarro.para_venta ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                  </div>
                ) : (
                  <div className={`mt-2 border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${nuevoCarro.para_cambio ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`} onClick={() => setNuevoCarro({...nuevoCarro, para_cambio: !nuevoCarro.para_cambio})}>
                    <div>
                      <p className={`text-sm font-bold flex items-center gap-2 ${nuevoCarro.para_cambio ? 'text-emerald-700' : 'text-slate-600'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg> Disponible para Intercambio</p>
                      <p className="text-xs text-slate-500 mt-1">Actívalo si quieres recibir ofertas de otros usuarios.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${nuevoCarro.para_cambio ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${nuevoCarro.para_cambio ? 'translate-x-6' : 'translate-x-0'}`}></div></div>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-6 border-t border-slate-100 flex gap-3">
                <button type="submit" disabled={guardandoCarro} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50">{guardandoCarro ? "Guardando..." : (cocheEditando ? "Actualizar Pieza" : "Aparcar en la Bóveda")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {nuevosLogros.length > 0 && <AchievementUnlock logros={nuevosLogros} onClose={() => setNuevosLogros([])} />}
    </div>
  );
}