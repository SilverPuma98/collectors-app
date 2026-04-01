import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const seguidor_id = formData.get('seguidor_id')?.toString();
  const seguido_id = formData.get('seguido_id')?.toString();
  const accion = formData.get('accion')?.toString();

  if (!seguidor_id || !seguido_id || !accion) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: any) { cookieStore.delete({ name, ...options }); },
      },
    }
  );

  if (accion === 'follow') {
    // 1. Insertamos al seguidor
    await supabase.from('seguidor').insert([
      { seguidor_id: parseInt(seguidor_id), seguido_id: parseInt(seguido_id) }
    ]);

    // 2. 🔔 CREAMOS LA NOTIFICACIÓN
    // Obtenemos el nombre del seguidor para que el mensaje sea personalizado
    const { data: perfilSeguidor } = await supabase.from('usuario').select('nombre_usuario').eq('id_usuario', parseInt(seguidor_id)).single();
    
    if (perfilSeguidor) {
      await supabase.from('notificacion').insert([{
        id_usuario: parseInt(seguido_id),
        tipo: 'SEGUIDOR',
        mensaje: `@${perfilSeguidor.nombre_usuario} ha comenzado a seguir tu radar.`
      }]);
    }

  } else if (accion === 'unfollow') {
    await supabase.from('seguidor').delete()
      .eq('seguidor_id', parseInt(seguidor_id))
      .eq('seguido_id', parseInt(seguido_id));
  }

  const referer = request.headers.get('referer') || '/';
  return NextResponse.redirect(referer, 303);
}