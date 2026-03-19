import CollectorCard from "@/components/CollectorCard";

export default async function Home() {
  
  // Por ahora, crearemos 4 autos "de prueba" para ver cómo se comporta 
  // la grilla responsiva antes de conectarla a tu tabla CARRO.
  const autosPrueba = [
    { id: 1, modelo: "Nissan Skyline GT-R (R34)", marca: "Nissan", rareza: "Super TH", valor: 150.00 },
    { id: 2, modelo: "'67 Camaro", marca: "Chevrolet", rareza: "Común", valor: 5.00 },
    { id: 3, modelo: "Porsche 911 GT3 RS", marca: "Porsche", rareza: "Premium", valor: 25.00 },
    { id: 4, modelo: "Volkswagen T1 Panel Bus", marca: "Volkswagen", rareza: "Treasure Hunt", valor: 45.00 },
  ];

  return (
    // Fondo general extremadamente oscuro (slate-950 casi negro)
    <main className="p-6 md:p-12 font-sans">
      
      

      {/* EL ESCAPARATE RESPONSIVO (La Grilla) */}
      <section className="max-w-7xl mx-auto">
        {/* Aquí está la magia de Tailwind: 
            grid-cols-1: 1 columna en celular
            md:grid-cols-2: 2 columnas en tablets
            lg:grid-cols-4: 4 columnas en monitores grandes
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {autosPrueba.map((auto) => (
            <CollectorCard 
              key={auto.id}
              modelo={auto.modelo}
              marca={auto.marca}
              rareza={auto.rareza}
              valor={auto.valor}
            />
          ))}
        </div>
      </section>

    </main>
  );
}