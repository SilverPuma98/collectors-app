import { createBrowserClient } from '@supabase/ssr'

// 1. Sacamos las llaves de tu caja fuerte (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 2. Creamos y exportamos la conexión optimizada para Next.js (Usa Cookies automáticamente)
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)