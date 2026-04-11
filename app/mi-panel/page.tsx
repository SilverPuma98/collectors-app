"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { evaluarLogros } from "@/lib/logrosEngine";
import AchievementUnlock from "@/components/AchievementUnlock";
import TrophyShowcase from "@/components/TrophyShowcase";
import { calcularValorAproximado } from "@/lib/valuationEngine";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TabFeedback from "./components/TabFeedback";
import TabRafaga from "./components/TabRafaga";
import TabRadar from "./components/TabRadar";
import TabPerfil from "./components/TabPerfil";
import TabBoveda from "./components/TabBoveda";
import ModalPublicacion from "./components/ModalPublicacion";

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
  const [estadosMexico, setEstadosMexico] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guardandoCarro, setGuardandoCarro] = useState(false);
  const [cocheEditando, setCocheEditando] = useState<number | null>(null);
  
  const [fotoArchivoCarro, setFotoArchivoCarro] = useState<File | null>(null);
  const [fotoPreviewCarro, setFotoPreviewCarro] = useState<string | null>(null);
  const [fotosExtraNuevas, setFotosExtraNuevas] = useState<File[]>([]);
  const [fotosExtraPreview, setFotosExtraPreview] = useState<string[]>([]);
  const [fotosExtraExistentes, setFotosExtraExistentes] = useState<string[]>([]);

  const [nuevosLogros, setNuevosLogros] = useState<string[]>([]);
  const [misTrofeos, setMisTrofeos] = useState<any[]>([]);

  const estadoInicialCarro = {
    modelo: "", id_fabricante: "", otro_fabricante: "", id_marca: "", otra_marca: "",
    id_serie: "", otra_serie: "", rareza: "", rareza_custom_texto: "", id_presentacion: "", otra_presentacion: "", valor: "", id_escala: "", id_estado_carro: "", 
    no_carro: "", total_carros: "", anio_serie: "", para_cambio: false, para_venta: false,
    es_lote: false, es_preventa: false, fecha_llegada: "",
    es_subasta: false, precio_inicial: "", incremento_minimo: "10", fecha_cierre_subasta: "",
    es_custom: false, valor_base: "", costo_materiales: ""
  };

  const [nuevoCarro, setNuevoCarro] = useState(estadoInicialCarro);

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

      // ✨ ACTUALIZACIÓN: Jalar la información de rareza
      const { data: carrosData } = await supabase.from('carro').select(`*, marca(marca), serie(*), fabricante(fabricante), presentacion(presentacion), rareza(rareza), carro_custom(*)`).eq('id_usuario', perfilData.id_usuario).order('id_carro', { ascending: false });
      if (carrosData) setMisCarros(carrosData);

      const { data: todosLosLogros } = await supabase.from('logro').select('*').order('id_logro', { ascending: true });
      const { data: misLogrosData } = await supabase.from('usuario_logro').select('id_logro').eq('id_usuario', perfilData.id_usuario);
      
      if (todosLosLogros) {
        const misIds = misLogrosData?.map(ml => ml.id_logro) || [];
        setMisTrofeos(todosLosLogros.map(logro => ({...logro, unlocked: misIds.includes(logro.id_logro)})));
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

  const abrirModalCarro = async (carro: any = null) => {
    if (carro) {
      setCocheEditando(carro.id_carro);
      const idMarcaReal = marcas.find(m => m.marca === carro.marca?.marca)?.id_marca || "";
      const idSerieReal = carro.serie?.id_serie || "";

      let subData = null;
      if (carro.es_subasta) {
        const { data } = await supabase.from('subasta').select('*').eq('id_carro', carro.id_carro).single();
        subData = data;
      }

      let fechaCierreStr = "";
      if (subData?.fecha_cierre) {
        const d = new Date(subData.fecha_cierre);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        fechaCierreStr = d.toISOString().slice(0, 16);
      }

      const datosCustom = carro.carro_custom?.[0] || {};
      const valBase = datosCustom.valor_base || "";
      const costMat = datosCustom.costo_materiales || "";

      const valorCustomPreCalculado = carro.es_custom 
        ? calcularValorAproximado(
            carro.modelo, carro.fabricante?.fabricante, carro.rareza?.rareza, "Individual Básico", parseInt(carro.serie?.anio), "Loose",
            { valor_base: valBase, costo_materiales: costMat }
          )
        : "";

      // ✨ MAGIA: Reemplazo masivo de variables rotas por la función String() segura
      setNuevoCarro({ 
        modelo: carro.modelo || "", 
        id_fabricante: (carro.es_custom && !carro.id_fabricante) ? "nuevo" : String(carro.id_fabricante || ""), 
        otro_fabricante: datosCustom.fabricante || "", 
        id_marca: (carro.es_custom && !idMarcaReal) ? "nuevo" : String(idMarcaReal || ""), 
        otra_marca: datosCustom.marca || "", 
        id_serie: (carro.es_custom && !idSerieReal) ? "nuevo" : String(idSerieReal || ""), 
        otra_serie: datosCustom.serie || "", 
        // ✨ CORRECCIÓN EXACTA DEL ERROR QUE ME MANDASTE:
        rareza: (carro.es_custom && datosCustom.rareza) ? "nuevo" : String(carro.id_rareza || ""), 
        rareza_custom_texto: datosCustom.rareza || "", 
        id_presentacion: (carro.es_custom && !carro.id_presentacion) ? "nuevo" : String(carro.id_presentacion || ""), 
        otra_presentacion: datosCustom.presentacion || "Individual Básico", 
        valor: carro.es_custom ? String(valorCustomPreCalculado || "") : String(carro.valor || ""), 
        id_escala: String(carro.escala || ""), 
        id_estado_carro: String(carro.estado_carro || ""), 
        no_carro: String(carro.no_carro || ""), 
        total_carros: String(carro.serie?.no_carros || ""), 
        anio_serie: (carro.es_custom && !carro.serie?.anio && datosCustom.anio) ? String(datosCustom.anio || "") : String(carro.serie?.anio || ""), 
        para_cambio: carro.para_cambio || false, 
        para_venta: carro.para_venta || false, 
        es_lote: carro.es_lote || false,
        es_preventa: carro.es_preventa || false, 
        fecha_llegada: carro.fecha_llegada || "", 
        es_subasta: carro.es_subasta || false,
        precio_inicial: String(subData?.precio_inicial || ""), 
        incremento_minimo: subData?.incremento_minimo ? String(subData.incremento_minimo) : "10",
        fecha_cierre_subasta: fechaCierreStr,
        es_custom: carro.es_custom || false,
        valor_base: String(valBase || ""), 
        costo_materiales: String(costMat || "")
      });
      setFotoPreviewCarro(carro.imagen_url || null);
      if (carro.es_lote && carro.galeria) setFotosExtraExistentes(carro.galeria); else setFotosExtraExistentes([]);
      setFotosExtraNuevas([]); setFotosExtraPreview([]);
    } else {
      setCocheEditando(null); setFotoPreviewCarro(null); setFotosExtraExistentes([]); setFotosExtraNuevas([]); setFotosExtraPreview([]);
      setNuevoCarro(estadoInicialCarro);
    }
    setFotoArchivoCarro(null); setIsModalOpen(true);
  };

  const eliminarCarro = async (idCarro: number) => {
    if (!window.confirm("⚠️ ¿Eliminar esta pieza de tu colección?")) return;
    const { error } = await supabase.from('carro').delete().eq('id_carro', idCarro);
    if (error) alert("Error: " + error.message); else cargarDatosCentrales();
  };

  const cerrarModal = () => { 
    setIsModalOpen(false); setCocheEditando(null); setFotoArchivoCarro(null); setFotoPreviewCarro(null); 
    setFotosExtraNuevas([]); setFotosExtraPreview([]); setFotosExtraExistentes([]);
    setNuevoCarro(estadoInicialCarro);
  };

  if (cargandoDatos) return <div className="flex min-h-screen items-center justify-center text-cyan-600 bg-slate-50 animate-pulse font-bold tracking-widest">ABRIENDO PANEL...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cyan-200 selection:text-cyan-900 pb-20">
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
        <aside className="flex flex-row lg:flex-col gap-2 lg:col-span-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <button onClick={() => setTabActiva("boveda")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "boveda" ? "bg-white border-2 border-cyan-500 shadow-md text-cyan-700" : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> Mi Bóveda</button>
          <button onClick={() => setTabActiva("perfil")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "perfil" ? "bg-white border-2 border-cyan-500 shadow-md text-cyan-700" : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Configurar Perfil</button>
          <button onClick={() => setTabActiva("logros")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "logros" ? "bg-white border-2 border-cyan-500 shadow-md text-cyan-700" : "bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-700"}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg> Álbum de Logros</button>
          {(miPerfil?.rol === 'VENDEDOR' || miPerfil?.rol === 'SUPER_ADMIN') && (
            <>
              <button onClick={() => setTabActiva("rafaga")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "rafaga" ? "bg-amber-50 border-2 border-amber-500 shadow-md text-amber-700" : "bg-transparent text-slate-500 hover:bg-amber-100/50 hover:text-amber-700"}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> Subida Masiva (PRO)</button>
              <button onClick={() => setTabActiva("radar")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "radar" ? "bg-red-50 border-2 border-red-500 shadow-md text-red-700" : "bg-transparent text-slate-500 hover:bg-red-50 hover:text-red-700"}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg> Radar de Clientes</button>
            </>
          )}
          <button onClick={() => setTabActiva("feedback")} className={`whitespace-nowrap text-left px-5 py-3.5 rounded-2xl font-bold transition-all flex items-center gap-3 ${tabActiva === "feedback" ? "bg-indigo-50 border-2 border-indigo-500 shadow-md text-indigo-700" : "bg-transparent text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg> Soporte / Ideas</button>
        </aside>

        <main className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 min-h-[600px]">
          {tabActiva === "boveda" && <TabBoveda misCarros={misCarros} abrirModalCarro={abrirModalCarro} eliminarCarro={eliminarCarro} />}
          {tabActiva === "perfil" && <TabPerfil miPerfil={miPerfil} estadosMexico={estadosMexico} cargarDatosCentrales={cargarDatosCentrales} />}
          {tabActiva === "logros" && <div className="animate-in fade-in duration-300"><TrophyShowcase trofeos={misTrofeos} /></div>}
          {tabActiva === "rafaga" && <TabRafaga miPerfil={miPerfil} marcas={marcas} cargarDatosCentrales={cargarDatosCentrales} setTabActiva={setTabActiva} />}
          {tabActiva === "radar" && <TabRadar miPerfil={miPerfil} />}
          {tabActiva === "feedback" && <TabFeedback miPerfil={miPerfil} />}
        </main>
      </div>

      {isModalOpen && (
        <ModalPublicacion 
          miPerfil={miPerfil}
          nuevoCarro={nuevoCarro} setNuevoCarro={setNuevoCarro}
          cocheEditando={cocheEditando}
          fotoArchivoCarro={fotoArchivoCarro} setFotoArchivoCarro={setFotoArchivoCarro}
          fotoPreviewCarro={fotoPreviewCarro} setFotoPreviewCarro={setFotoPreviewCarro}
          fotosExtraNuevas={fotosExtraNuevas} setFotosExtraNuevas={setFotosExtraNuevas}
          fotosExtraPreview={fotosExtraPreview} setFotosExtraPreview={setFotosExtraPreview}
          fotosExtraExistentes={fotosExtraExistentes} setFotosExtraExistentes={setFotosExtraExistentes}
          fabricantes={fabricantes} marcas={marcas} series={series} rarezas={rarezas}
          presentaciones={presentaciones} escalas={escalas} estadosCarro={estadosCarro}
          guardandoCarro={guardandoCarro} setGuardandoCarro={setGuardandoCarro}
          cerrarModal={cerrarModal} cargarDatosCentrales={cargarDatosCentrales}
          setNuevosLogros={setNuevosLogros} evaluarLogros={evaluarLogros}
          calcularValorAproximado={calcularValorAproximado} aniosDisponibles={aniosDisponibles}
        />
      )}

      {nuevosLogros.length > 0 && <AchievementUnlock logros={nuevosLogros} onClose={() => setNuevosLogros([])} />}
    </div>
  );
}