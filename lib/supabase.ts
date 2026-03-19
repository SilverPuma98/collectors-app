import { createClient } from '@supabase/supabase-js'

// 1. Sacamos las llaves de tu caja fuerte (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 2. Creamos y exportamos la conexión (El equivalente a tu $conn en PHP)
export const supabase = createClient(supabaseUrl, supabaseKey)