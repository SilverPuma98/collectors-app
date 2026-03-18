// 1. EL CONTRATO (Interface)
// Aquí definimos qué necesita este molde para funcionar.
// Es como decirle a la fábrica: "Para hacer esta tarjeta, necesito obligatoriamente un titulo, serie y rareza".
interface CardProps {
  titulo: string;
  serie: string;
  rareza: string;
}

// 2. EL COMPONENTE (Función)
// Esta función recibe los datos (props) y devuelve el diseño visual.
export default function CollectorCard({ titulo, serie, rareza }: CardProps) {
  
  return (
    // CONTENEDOR PRINCIPAL
    // Clases de Tailwind explicadas:
    // w-80: Ancho fijo
    // rounded-xl: Bordes redondeados
    // border-slate-700: Color del borde gris oscuro
    // bg-slate-800: Fondo de la tarjeta
    // hover:border-blue-500: Al pasar el mouse, el borde se pone azul
    <div className="w-80 rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-lg hover:border-blue-500 transition-all cursor-pointer group">
      
      {/* ZONA DE FOTO (Simulada) */}
      <div className="h-40 w-full rounded-lg bg-slate-700 flex items-center justify-center mb-4 group-hover:bg-slate-600 transition-colors">
        <span className="text-slate-500 font-medium">Foto del Auto</span>
      </div>

      {/* TÍTULO */}
      <h3 className="text-xl font-bold text-white mb-1">
        {titulo}
      </h3>

      {/* DETALLES */}
      <div className="text-sm text-slate-400">
        <p>Serie: {serie}</p>
        
        {/* LÓGICA VISUAL (Operador Ternario) */}
        {/* Si rareza es 'STH', fondo amarillo. Si no, gris. */}
        <span className={`inline-block mt-3 px-2 py-1 rounded text-xs font-bold 
        ${
            rareza === 'STH' 
              ? 'bg-yellow-500 text-black'    // Estilo para Super Treasure Hunt
              : rareza === 'TH' 
              ? 'bg-blue-500 text-black'    // Estilo para Treasure Hunt
              : 'bg-slate-600 text-white'     // Estilo normal
        }
        `}>
          {rareza}
        </span>
      </div>
    </div>
  );
}