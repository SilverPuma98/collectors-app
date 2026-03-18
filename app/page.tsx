import Image from "next/image";
// IMPORTANTE: Aquí importamos el molde que acabamos de crear.
// El símbolo '@' es un atajo que significa "la raíz de mi proyecto".
import CollectorCard from "@/components/CollectorCard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8">
      
      {/* Encabezado */}
      <div className="z-10 max-w-5xl w-full flex flex-col items-center text-center font-sans mb-12">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6">
          COLLECTORS
        </h1>
        <p className="text-slate-400 text-xl">
          Tu garaje virtual empieza aquí.
        </p>
      </div>

      {/* AQUÍ USAMOS NUESTRO MOLDE (COMPONENTE) */}
      <div className="flex flex-wrap gap-8 justify-center">
        
        {/* Tarjeta 1: Le pasamos datos de un auto común */}
        <CollectorCard 
          titulo="Nissan Skyline GT-R (R34)" 
          serie="HW Turbo" 
          rareza="Común" 
        />

        {/* Tarjeta 2: Le pasamos datos de un auto especial */}
        <CollectorCard 
          titulo="'67 Camaro" 
          serie="Then and Now" 
          rareza="STH" 
        />

         {/* Tarjeta 3: Otro ejemplo para que veas lo fácil que es replicar */}
         <CollectorCard 
          titulo="Porsche 911 GT3" 
          serie="Factory Fresh" 
          rareza="TH" 
        />

      </div>

    </main>
  );
}