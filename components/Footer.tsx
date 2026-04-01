import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050810] border-t border-slate-800/60 pt-16 pb-8 relative overflow-hidden">
      {/* Luces sutiles de fondo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-24 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Marca y Descripción (Ocupa 2 columnas en PC) */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="text-2xl font-black text-white tracking-wider flex items-center gap-1 group w-fit">
              COLLECTORS<span className="text-cyan-500 group-hover:text-cyan-400 transition-colors">.</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              La bóveda digital definitiva. Valúa tus piezas con Inteligencia Artificial, compra, vende e intercambia de forma segura con la comunidad más grande de coleccionistas.
            </p>
          </div>

          {/* Explorar */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">Explorar</h3>
            <Link href="/mercado" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Mercado Global</Link>
            <Link href="/calculadora" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Calculadora IA</Link>
            <Link href="/ranking" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Salón de la Fama</Link>
          </div>

          {/* Legal y Soporte */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">Plataforma</h3>
            <Link href="/terminos" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Términos de Servicio</Link>
            <Link href="/privacidad" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Política de Privacidad</Link>
            <Link href="/registro-vendedor" className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              Aplicar como Tienda
            </Link>
            <Link href="/mi-panel" className="text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Contacto / Soporte</Link>
          </div>
        </div>

        {/* 🚀 LA FAMILIA DE MARCAS (SPACE MONKEY & FAKE STORY) */}
        <div className="border-t border-slate-800/80 pt-10 pb-6 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Orgullosamente el hermano menor de</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            
            {/* SPACE MONKEY */}
            <a href="https://spacemonkeystore.com.mx/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group transition-transform hover:scale-105">
              <span className="text-2xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">🐒</span>
              <span className="font-black text-slate-400 group-hover:text-purple-400 transition-colors tracking-widest uppercase text-sm md:text-base">Space Monkey</span>
            </a>

            <span className="text-slate-800 hidden md:block">|</span>

            {/* FAKE STORY */}
            <div className="flex items-center gap-2 group transition-transform hover:scale-105 cursor-default">
              <span className="text-2xl grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">🎭</span>
              <span className="font-black text-slate-400 group-hover:text-rose-400 transition-colors tracking-widest uppercase text-sm md:text-base">Fake Story</span>
            </div>

          </div>
        </div>

        {/* Derechos de Autor y Redes */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-600">
            &copy; {currentYear} Collectors. Todos los derechos reservados.
          </p>
          
          <div className="flex gap-4">
            <a href="#" className="text-slate-600 hover:text-white transition-colors" aria-label="Facebook">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="#" className="text-slate-600 hover:text-white transition-colors" aria-label="Instagram">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}