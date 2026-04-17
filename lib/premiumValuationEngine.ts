"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function calcularValorPremium(
  modelo: string,
  id_fabricante: number | null,
  id_rareza: number | null,
  id_presentacion: number | null,
  anio: number | null,
  id_estado: number | null
): Promise<number> {
  
  if (!modelo || modelo.trim() === "") return 0;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  let P_retail = 40; 
  let B = 1.0;       
  let Q = 1.0;       
  let C = 1.0;       
  let D = 1.0;       
  let r = 0.08; 

  // 1. Extraemos TODO de la Base de Datos en paralelo
  const [resFab, resRar, resPres, resEst, resDemanda, resConf] = await Promise.all([
    id_fabricante ? supabase.from('fabricante').select('factor_marca').eq('id_fabricante', id_fabricante).single() : Promise.resolve({ data: null }),
    id_rareza ? supabase.from('rareza').select('multiplicador_rareza').eq('id_rareza', id_rareza).single() : Promise.resolve({ data: null }),
    id_presentacion ? supabase.from('presentacion').select('precio_base').eq('id_presentacion', id_presentacion).single() : Promise.resolve({ data: null }),
    id_estado ? supabase.from('estado_carro').select('multiplicador_estado').eq('id_estado_carro', id_estado).single() : Promise.resolve({ data: null }),
    supabase.from('hype_keywords').select('palabra_clave, nivel_demanda'),
    supabase.from('configuracion').select('clave, valor')
  ]);

  if (resFab.data?.factor_marca) B = parseFloat(resFab.data.factor_marca);
  if (resRar.data?.multiplicador_rareza) Q = parseFloat(resRar.data.multiplicador_rareza);
  if (resPres.data?.precio_base) P_retail = parseFloat(resPres.data.precio_base);
  if (resEst.data?.multiplicador_estado) C = parseFloat(resEst.data.multiplicador_estado);
  
  // Extraer Configuraciones Globales
  let multAlta = 1.4;
  let multMedia = 1.2;
  let multBaja = 0.8;

  if (resConf.data) {
    const rData = resConf.data.find(c => c.clave === 'apreciacion_anual');
    if (rData) r = parseFloat(rData.valor);

    const aData = resConf.data.find(c => c.clave === 'demanda_alta');
    if (aData) multAlta = parseFloat(aData.valor);

    const mData = resConf.data.find(c => c.clave === 'demanda_media');
    if (mData) multMedia = parseFloat(mData.valor);

    const bData = resConf.data.find(c => c.clave === 'demanda_baja');
    if (bData) multBaja = parseFloat(bData.valor);
  }

  // 2. Escaneamos la Demanda / Hype (Clasificando por Nivel Global)
  const modeloLower = modelo.toLowerCase();
  if (resDemanda.data && resDemanda.data.length > 0) {
    // Buscamos si el nombre del modelo contiene alguna de nuestras etiquetas
    const match = resDemanda.data.find(d => modeloLower.includes(d.palabra_clave.toLowerCase()));
    
    if (match) {
      if (match.nivel_demanda === 'ALTA') D = multAlta;
      else if (match.nivel_demanda === 'MEDIA') D = multMedia;
      else if (match.nivel_demanda === 'BAJA') D = multBaja;
    }
  }

  // 3. Apreciación Histórica (1 + r)^n
  let n = 0;
  const currentYear = new Date().getFullYear(); 
  if (anio && anio > 1900 && anio <= currentYear) {
    n = currentYear - anio;
  }
  const appreciation = Math.pow((1 + r), n);

  // 4. LA GRAN FÓRMULA
  let V_final = (P_retail * B * Q) * appreciation * C * D;
  
  return Math.round(V_final / 10) * 10;
}