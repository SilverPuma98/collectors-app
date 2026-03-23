"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function evaluarLogros(idUsuario: number) {
  const cookieStore = await cookies();
  
  // 1. Conexión segura al servidor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 2. EXTRAER DATOS ACTUALES (El estado del jugador)
  // A. ¿Cuántos autos tiene?
  const { count: totalCarros } = await supabase
    .from('carro')
    .select('*', { count: 'exact', head: true })
    .eq('id_usuario', idUsuario);

  // B. ¿Qué logros ya tiene? (Para no dárselos dos veces)
  const { data: logrosActuales } = await supabase
    .from('usuario_logro')
    .select('logro(codigo_regla)')
    .eq('id_usuario', idUsuario);
    
  const codigosDesbloqueados = logrosActuales?.map((item: any) => item.logro.codigo_regla) || [];

  // C. Catálogo de logros disponibles
  const { data: catalogoLogros } = await supabase.from('logro').select('*');
  if (!catalogoLogros) return [];

  // 3. EL MOTOR DE REGLAS (La Inteligencia Artificial)
  const nuevosLogrosAInsertar = [];
  const nombresLogrosGanados = []; // Para avisarle al frontend

  const horaActual = new Date().getHours(); // Hora del servidor

  for (const logro of catalogoLogros) {
    // Si ya lo tiene, nos lo saltamos
    if (codigosDesbloqueados.includes(logro.codigo_regla)) continue;

    let cumpleRequisito = false;

    // MATRIZ DE REGLAS (Aquí agregaremos más en el futuro)
    switch (logro.codigo_regla) {
      case 'PRIMER_REGISTRO':
        if (totalCarros && totalCarros >= 1) cumpleRequisito = true;
        break;
      case 'CARROS_10':
        if (totalCarros && totalCarros >= 10) cumpleRequisito = true;
        break;
      case 'CARROS_50':
        if (totalCarros && totalCarros >= 50) cumpleRequisito = true;
        break;
      case 'CARROS_100':
        if (totalCarros && totalCarros >= 100) cumpleRequisito = true;
        break;
      case 'CAZADOR_NOCTURNO':
        // Rango de 12:00 AM a 4:00 AM
        if (horaActual >= 0 && horaActual <= 4) cumpleRequisito = true;
        break;
      // case 'TIENE_STH': 
      // Aquí en el futuro haríamos una consulta para ver si tiene rareza "STH"
    }

    // Si cumplió la regla de este logro, lo preparamos para guardarlo
    if (cumpleRequisito) {
      nuevosLogrosAInsertar.push({
        id_usuario: idUsuario,
        id_logro: logro.id_logro
      });
      nombresLogrosGanados.push(logro.nombre);
    }
  }

  // 4. GUARDAR EN BASE DE DATOS
  if (nuevosLogrosAInsertar.length > 0) {
    const { error } = await supabase.from('usuario_logro').insert(nuevosLogrosAInsertar);
    if (error) {
      console.error("Error al otorgar logro:", error);
      return [];
    }
  }

  // 5. Devolvemos los nombres de las medallas ganadas para mostrar la alerta
  return nombresLogrosGanados;
}