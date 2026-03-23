import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function PerfilRedirectMaster() {
  const cookieStore = await cookies();
  
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/login');
  }

  // Solución CTO: Buscamos por correo, que es 100% seguro que tu cuenta antigua lo tiene
  const { data: perfil } = await supabase
    .from('usuario')
    .select('nombre_usuario')
    .eq('correo', user.email) 
    .single();

  if (perfil?.nombre_usuario) {
    // Lo mandamos a su vitrina pública
    redirect(`/perfil/${encodeURIComponent(perfil.nombre_usuario)}`);
  } else {
    // Solo cae aquí si literalmente el usuario no existe en la tabla
    redirect('/mi-garaje');
  }
}