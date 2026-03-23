import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Iniciamos la respuesta base de Next.js
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Creamos el cliente de Supabase optimizado para el Servidor (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          })
          supabaseResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Obtenemos el usuario real validando el token JWT (Máxima Seguridad)
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const path = url.pathname

  // 4. LÓGICA DE NEGOCIO Y PROTECCIÓN DE RUTAS
  const rutasProtegidas = ['/mi-garaje', '/admin', '/perfil/editar'] // Agrega aquí más rutas si lo necesitas
  const esRutaProtegida = rutasProtegidas.some((ruta) => path.startsWith(ruta))

  // Escenario A: Usuario NO logueado intenta entrar a una bóveda privada
  if (esRutaProtegida && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Escenario B: Usuario SÍ logueado intenta ir al login o registro (¡Ya no lo necesita!)
  if (user && (path === '/login' || path === '/registro')) {
    url.pathname = '/mi-garaje'
    return NextResponse.redirect(url)
  }

  // 5. Devolvemos la respuesta (con las cookies de sesión actualizadas si fue necesario)
  return supabaseResponse
}

// 6. MATCHER (Rendimiento)
// Le decimos a Next.js que NO ejecute este middleware en archivos estáticos, 
// imágenes o código interno. ¡Solo en rutas que visita el usuario!
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}