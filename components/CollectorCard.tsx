import Image from "next/image";

interface CardProps {
  modelo: string;
  marca: string;
  rareza: string;
  valor: number;
  imagenUrl?: string; // Hacemos la imagen opcional para manejar fallbacks
}

export default function CollectorCard({ modelo, marca, rareza, valor, imagenUrl }: CardProps) {
  return (
    <div className="w-full flex flex-col bg-[#0b1120] border border-slate-800/50 rounded-2xl overflow-hidden hover:shadow-[0_0_15px_rgba(8,145,178,0.15)] hover:border-cyan-900/50 transition-all duration-300 group cursor-pointer">
      
      {/* Zona de la Foto (Optimizada con next/image) */}
      <div className="h-48 w-full bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
        {imagenUrl ? (
          <Image 
            src={imagenUrl} 
            alt={`Carro a escala ${marca} ${modelo}`} 
            fill // Ocupa todo el contenedor padre
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={80} // Balance perfecto entre peso y calidad visual
          />
        ) : (
          <span className="text-slate-600 text-sm font-medium tracking-widest uppercase group-hover:text-cyan-600/50 transition-colors z-10">
            Sin Imagen
          </span>
        )}
      </div>

      {/* Detalles del Auto */}
      <div className="p-5 flex flex-col gap-2 relative z-10 bg-[#0b1120]">
        <span className="text-xs font-semibold text-cyan-500 tracking-wider uppercase">{marca}</span>
        <h3 className="text-xl font-bold text-slate-100 truncate">{modelo}</h3>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/50">
          <span className="text-xs font-medium px-2 py-1 rounded bg-slate-800 text-slate-300">{rareza}</span>
          <span className="text-sm font-bold text-emerald-400">${valor}</span>
        </div>
      </div>
    </div>
  );
}