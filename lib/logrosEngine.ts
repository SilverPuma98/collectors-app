"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function evaluarLogros(idUsuario: number) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: misCarros } = await supabase
    .from('carro')
    .select(`
      modelo, valor_calculado, para_venta, para_cambio, id_fabricante, es_custom,
      serie(anio),
      estado_carro_rel:estado_carro(estado_carro),
      fabricante_rel:fabricante(fabricante),
      rareza_rel:rareza(rareza),
      carro_custom(rareza)
    `)
    .eq('id_usuario', idUsuario);

  if (!misCarros) return [];

  const { data: logrosActuales } = await supabase
    .from('usuario_logro')
    .select('logro(codigo_regla)')
    .eq('id_usuario', idUsuario);
    
  const codigosDesbloqueados = logrosActuales?.map((item: any) => item.logro.codigo_regla) || [];

  const { data: catalogoLogros } = await supabase.from('logro').select('*');
  if (!catalogoLogros) return [];

  // ====================================================================
  // 🧠 FASE 1: CONTADORES MASIVOS MEJORADOS
  // ====================================================================
  const stats = {
    total: misCarros.length,
    valorTotal: 0,
    topValor: 0,
    hw: 0, mbx: 0, m2: 0, gl: 0, mgt: 0, jada: 0, tomica: 0, kaido: 0, inno: 0,
    jdm: 0, muscle: 0, euro: 0, ferrari: 0, porsche: 0, lambo: 0, nissan: 0, ford: 0, vw: 0, chevy: 0,
    th: 0, sth: 0, chase: 0, rlc: 0, premium: 0,
    mint: 0, loose: 0, junk: 0,
    venta: 0, cambio: 0, exhibicion: 0,
    d70s: 0, d80s: 0, d90s: 0, d00s: 0,
    marcasUnicas: new Set<number>()
  };

  misCarros.forEach((c: any) => {
    const mod = (c.modelo || '').toLowerCase();
    
    const rRaw = c.es_custom && c.carro_custom?.[0]?.rareza ? c.carro_custom[0].rareza : c.rareza_rel;
    const rar = (typeof rRaw === 'object' ? (rRaw?.rareza || "") : (rRaw || "")).toLowerCase();
    
    const estadoObj = Array.isArray(c.estado_carro_rel) ? c.estado_carro_rel[0] : c.estado_carro_rel;
    const est = (estadoObj?.estado_carro || '').toLowerCase();
    
    const fabObj = Array.isArray(c.fabricante_rel) ? c.fabricante_rel[0] : c.fabricante_rel;
    const fab = (fabObj?.fabricante || '').toLowerCase();
    
    const serieObj = Array.isArray(c.serie) ? c.serie[0] : c.serie;
    const anio = serieObj?.anio || 0;
    
    const val = c.valor_calculado || 0;
    
    if (c.id_fabricante) stats.marcasUnicas.add(c.id_fabricante);

    stats.valorTotal += val;
    if (val > stats.topValor) stats.topValor = val;

    // 🚀 FABRICANTES (Escáner Agresivo)
    if (fab.includes('hot wheels') || fab.includes('hw')) stats.hw++;
    if (fab.includes('matchbox') || fab.includes('mbx')) stats.mbx++;
    if (fab.includes('m2') || fab.includes('m2 machines')) stats.m2++;
    if (fab.includes('greenlight') || fab.includes('green light')) stats.gl++;
    if (fab.includes('mini gt') || fab.includes('minigt') || fab.includes('mini-gt')) stats.mgt++;
    if (fab.includes('jada') || fab.includes('jada toys')) stats.jada++;
    if (fab.includes('tomica') || fab.includes('tomy')) stats.tomica++;
    if (fab.includes('kaido') || fab.includes('kaidohouse')) stats.kaido++;
    if (fab.includes('inno') || fab.includes('inno64')) stats.inno++;

    // 🏎️ TEMÁTICAS (Diccionario Expandido)
    if (['skyline', 'gt-r', 'gtr', 'supra', 'rx-7', 'rx7', 'civic', 'datsun', 'nsx', 'ae86', 's2000', 'impreza', 'wrx', 'evo', 'evolution', 'silvia', 's13', 's14', 's15', '350z', '370z', 'fairlady'].some(k => mod.includes(k))) stats.jdm++;
    if (['mustang', 'camaro', 'charger', 'challenger', 'corvette', 'shelby', 'bel air', 'pontiac', 'gto', 'firebird', 'plymouth', 'barracuda', 'viper'].some(k => mod.includes(k))) stats.muscle++;
    if (['bmw', 'audi', 'mercedes', 'benz', 'volkswagen', 'porsche', 'ferrari', 'lamborghini', 'mclaren', 'aston', 'bugatti', 'renault', 'peugeot', 'pagani'].some(k => mod.includes(k))) stats.euro++;
    
    if (mod.includes('ferrari') || mod.includes('enzo') || mod.includes('f40') || mod.includes('testarossa')) stats.ferrari++;
    if (mod.includes('porsche') || mod.includes('911') || mod.includes('carrera') || mod.includes('gt3')) stats.porsche++;
    if (mod.includes('lamborghini') || mod.includes('countach') || mod.includes('huracan') || mod.includes('aventador') || mod.includes('diablo')) stats.lambo++;
    if (mod.includes('nissan') || mod.includes('datsun') || mod.includes('skyline') || mod.includes('silvia')) stats.nissan++;
    if (mod.includes('ford') || mod.includes('mustang') || mod.includes('bronco') || mod.includes('raptor') || mod.includes('gt40')) stats.ford++;
    if (mod.includes('vw') || mod.includes('volkswagen') || mod.includes('kombi') || mod.includes('beetle') || mod.includes('golf') || mod.includes('vocho')) stats.vw++;
    if (mod.includes('chevy') || mod.includes('chevrolet') || mod.includes('camaro') || mod.includes('corvette') || mod.includes('silverado')) stats.chevy++;

    // 💎 RAREZAS (Escáner Agresivo)
    if ((rar.includes('treasure hunt') || rar.includes('th')) && !rar.includes('super') && !rar.includes('sth')) stats.th++;
    if (rar.includes('super treasure') || rar.includes('sth') || rar.includes('super t-hunt')) stats.sth++;
    if (rar.includes('chase') || rar.includes('white lightning') || rar.includes('green machine') || rar.includes('raw')) stats.chase++;
    if (rar.includes('rlc') || rar.includes('convention') || rar.includes('red line club')) stats.rlc++;
    if (rar.includes('premium') || rar.includes('car culture') || rar.includes('boulevard') || rar.includes('elite')) stats.premium++;

    // 📦 ESTADO FÍSICO
    if (est.includes('blíster') || est.includes('blister') || est.includes('sellado') || est.includes('caja') || est.includes('tarjeta')) stats.mint++;
    if (est.includes('loose') || est.includes('suelto') || (est.includes('condición') && !est.includes('blíster'))) stats.loose++;
    if (est.includes('chatarra') || est.includes('mal estado') || est.includes('junk')) stats.junk++;

    // 🤝 COMERCIO
    if (c.para_venta) stats.venta++;
    else if (c.para_cambio) stats.cambio++;
    else stats.exhibicion++;

    // 📅 DÉCADAS
    if (anio >= 1970 && anio <= 1979) stats.d70s++;
    if (anio >= 1980 && anio <= 1989) stats.d80s++;
    if (anio >= 1990 && anio <= 1999) stats.d90s++;
    if (anio >= 2000 && anio <= 2009) stats.d00s++;
  });

  const horaActual = new Date().getHours(); 

  // ====================================================================
  // 🏆 FASE 2: DICCIONARIO DE REGLAS
  // ====================================================================
  const reglas: Record<string, () => boolean> = {
    // Progresión Total
    'CARROS_1': () => stats.total >= 1,
    'CARROS_10': () => stats.total >= 10,
    'CARROS_25': () => stats.total >= 25,
    'CARROS_50': () => stats.total >= 50,
    'CARROS_100': () => stats.total >= 100,
    'CARROS_250': () => stats.total >= 250,
    'CARROS_500': () => stats.total >= 500,
    'CARROS_1000': () => stats.total >= 1000,

    // Riqueza
    'VALOR_1K': () => stats.valorTotal >= 1000,
    'VALOR_5K': () => stats.valorTotal >= 5000,
    'VALOR_10K': () => stats.valorTotal >= 10000,
    'VALOR_25K': () => stats.valorTotal >= 25000,
    'VALOR_50K': () => stats.valorTotal >= 50000,
    'VALOR_100K': () => stats.valorTotal >= 100000,
    'VALOR_250K': () => stats.valorTotal >= 250000,
    'VALOR_500K': () => stats.valorTotal >= 500000,
    
    // Top Auto
    'TOP_500': () => stats.topValor >= 500,
    'TOP_1K': () => stats.topValor >= 1000,
    'TOP_2K': () => stats.topValor >= 2000,
    'TOP_5K': () => stats.topValor >= 5000,

    // Marcas
    'HW_10': () => stats.hw >= 10,
    'HW_50': () => stats.hw >= 50,
    'HW_100': () => stats.hw >= 100,
    'HW_250': () => stats.hw >= 250,
    'MBX_5': () => stats.mbx >= 5,
    'MBX_25': () => stats.mbx >= 25,
    'MBX_50': () => stats.mbx >= 50,
    'M2_5': () => stats.m2 >= 5,
    'M2_20': () => stats.m2 >= 20,
    'GL_5': () => stats.gl >= 5,
    'GL_20': () => stats.gl >= 20,
    'MGT_5': () => stats.mgt >= 5,
    'MGT_20': () => stats.mgt >= 20,
    'JADA_5': () => stats.jada >= 5,
    'TOMICA_5': () => stats.tomica >= 5,
    'KAIDO_5': () => stats.kaido >= 5,
    'INNO_5': () => stats.inno >= 5,

    // Temáticas
    'JDM_1': () => stats.jdm >= 1,
    'JDM_10': () => stats.jdm >= 10,
    'JDM_25': () => stats.jdm >= 25,
    'JDM_50': () => stats.jdm >= 50,
    'MUSCLE_5': () => stats.muscle >= 5,
    'MUSCLE_15': () => stats.muscle >= 15,
    'MUSCLE_30': () => stats.muscle >= 30,
    'EURO_5': () => stats.euro >= 5,
    'EURO_20': () => stats.euro >= 20,
    'FERRARI_1': () => stats.ferrari >= 1,
    'FERRARI_10': () => stats.ferrari >= 10,
    'PORSCHE_1': () => stats.porsche >= 1,
    'PORSCHE_10': () => stats.porsche >= 10,
    'LAMBO_1': () => stats.lambo >= 1,
    'LAMBO_10': () => stats.lambo >= 10,
    'NISSAN_5': () => stats.nissan >= 5,
    'FORD_5': () => stats.ford >= 5,
    'VW_5': () => stats.vw >= 5,
    'CHEVY_5': () => stats.chevy >= 5,

    // Rarezas
    'TH_1': () => stats.th >= 1,
    'TH_10': () => stats.th >= 10,
    'STH_1': () => stats.sth >= 1,
    'STH_5': () => stats.sth >= 5,
    'CHASE_1': () => stats.chase >= 1,
    'CHASE_5': () => stats.chase >= 5,
    'RLC_1': () => stats.rlc >= 1,
    'RLC_5': () => stats.rlc >= 5,
    'PREMIUM_10': () => stats.premium >= 10,
    'PREMIUM_50': () => stats.premium >= 50,

    // Estado & Comercio
    'MINT_25': () => stats.mint >= 25,
    'MINT_100': () => stats.mint >= 100,
    'LOOSE_25': () => stats.loose >= 25,
    'LOOSE_100': () => stats.loose >= 100,
    'JUNK_1': () => stats.junk >= 1,
    'JUNK_5': () => stats.junk >= 5,
    'VENTA_5': () => stats.venta >= 5,
    'VENTA_25': () => stats.venta >= 25,
    'VENTA_100': () => stats.venta >= 100,
    'CAMBIO_5': () => stats.cambio >= 5,
    'CAMBIO_25': () => stats.cambio >= 25,
    'EXHIBICION_50': () => stats.exhibicion >= 50,

    // Décadas
    'D70S_1': () => stats.d70s >= 1,
    'D80S_3': () => stats.d80s >= 3,
    'D90S_5': () => stats.d90s >= 5,
    'D00S_10': () => stats.d00s >= 10,

    // Actividad Especial
    'CAZADOR_NOCTURNO': () => horaActual >= 0 && horaActual <= 4 && stats.total > 0,
    'EARLY_BIRD': () => horaActual >= 5 && horaActual <= 8 && stats.total > 0,
    'CENA_POLLO': () => stats.total >= 1, 
    'DIVERSIDAD_5': () => stats.marcasUnicas.size >= 5,
    'DIVERSIDAD_10': () => stats.marcasUnicas.size >= 10
  };

  const nuevosLogrosAInsertar = [];
  const nombresLogrosGanados = []; 

  // ====================================================================
  // 🚀 FASE 3: EVALUACIÓN EN CASCADA
  // ====================================================================
  for (const logro of catalogoLogros) {
    if (codigosDesbloqueados.includes(logro.codigo_regla)) continue;

    if (reglas[logro.codigo_regla] && reglas[logro.codigo_regla]()) {
      nuevosLogrosAInsertar.push({ id_usuario: idUsuario, id_logro: logro.id_logro });
      nombresLogrosGanados.push(logro.nombre);
    }
  }

  // ====================================================================
  // 💾 FASE 4: GUARDADO
  // ====================================================================
  if (nuevosLogrosAInsertar.length > 0) {
    const { error } = await supabase.from('usuario_logro').insert(nuevosLogrosAInsertar);
    if (error) {
      console.error("Error al otorgar logro:", error);
      return [];
    }
  }

  return nombresLogrosGanados;
}