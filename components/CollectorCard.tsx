interface CardProps {
  modelo: string;
  marca: string;
  rareza: string;
  valor: number;
}

export default function CollectorCard({ modelo, marca, rareza, valor }: CardProps) {
  return (
    // Diseño Frío, Oscuro y Minimalista. 
    // border-slate-800/50 da un borde súper sutil. hover:border-cyan-900 le da ese toque "frío" al pasar el mouse.
    <div className="w-full flex flex-col bg-[#0b1120] border border-slate-800/50 rounded-2xl overflow-hidden hover:shadow-[0_0_15px_rgba(8,145,178,0.15)] hover:border-cyan-900/50 transition-all duration-300 group cursor-pointer">
      
      {/* Zona de la Foto (Minimalista, fondo gris azulado oscuro) */}
      <div className="h-48 w-full bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
        {/* Aquí luego irá la foto real (LINK_IMG) */}
        <span className="text-slate-600 text-sm font-medium tracking-widest uppercase group-hover:text-cyan-600/50 transition-colors">
          Sin Imagen
        </span>
      </div>

      {/* Detalles del Auto */}
      <div className="p-5 flex flex-col gap-2">
        {/* Marca (Sutil) */}
        <span className="text-xs font-semibold text-cyan-500 tracking-wider uppercase">
          {marca}
        </span>
        
        {/* Modelo (Protagonista, blanco puro) */}
        <h3 className="text-xl font-bold text-slate-100 truncate">
          {modelo}
        </h3>

        {/* Footer de la tarjeta: Rareza y Valor */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/50">
          <span className="text-xs font-medium px-2 py-1 rounded bg-slate-800 text-slate-300">
            {rareza}
          </span>
          <span className="text-sm font-bold text-emerald-400">
            ${valor}
          </span>
        </div>
      </div>
    </div>
  );
}