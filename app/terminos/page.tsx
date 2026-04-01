import Link from "next/link";

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-slate-300 font-sans selection:bg-cyan-900 selection:text-cyan-50 pb-20">
      
      {/* HEADER SIMPLE */}
      <div className="bg-[#0b1120] border-b border-slate-800 py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-32 bg-cyan-900/20 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 relative z-10">Términos y Condiciones</h1>
        <p className="text-slate-400 font-medium relative z-10">Reglas de la Comunidad | Última actualización: Noviembre 2024</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-10">
        
        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            1. Naturaleza de la Plataforma
          </h2>
          <p className="leading-relaxed">
            <strong>Collectors</strong> es una plataforma digital diseñada como un catálogo y una red social para coleccionistas. Nuestro objetivo principal es facilitar la valuación mediante Inteligencia Artificial y la exhibición de modelos a escala. 
            Collectors <span className="text-white font-bold underline decoration-red-500">NO procesa pagos</span> ni retiene dinero de ninguna transacción.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            2. Responsabilidad de Compra/Venta
          </h2>
          <p className="leading-relaxed mb-3">
            Toda negociación, intercambio o compra-venta se realiza de manera externa a nuestra plataforma (generalmente a través de WhatsApp o Facebook). Por lo tanto:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Collectors no se hace responsable por estafas, piezas falsificadas, o paquetes no enviados.</li>
            <li>El usuario es el único responsable de verificar la identidad y reputación del vendedor o comprador antes de depositar dinero.</li>
            <li>Recomendamos encarecidamente revisar las "Reseñas" públicas en el perfil del vendedor antes de hacer cualquier trato.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            3. Reglas de Conducta y Baneo
          </h2>
          <p className="leading-relaxed mb-3">
            Queremos mantener una comunidad sana y libre de toxicidad. Nos reservamos el derecho de eliminar, suspender o banear permanentemente a cualquier usuario (incluyendo Tiendas PRO) que incurra en las siguientes faltas:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Subir fotos falsas, sacadas de internet o que no pertenezcan a su colección real.</li>
            <li>Recibir múltiples reportes por fraude, estafa o "ghosting" (desaparecer tras recibir un pago).</li>
            <li>Uso de lenguaje ofensivo, discriminatorio o acoso hacia otros coleccionistas en las reseñas.</li>
            <li>Reportar autos de otros usuarios de manera malintencionada y repetitiva sin justificación real.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            4. Privacidad y Datos (WhatsApp/Redes)
          </h2>
          <p className="leading-relaxed">
            Al registrar tu número de WhatsApp o Facebook, entiendes que estos datos serán visibles para los usuarios con los que hagas "Match" (amigos mutuos) o para todos si posees una cuenta de <strong>Vendedor PRO</strong>. Collectors no vende tu información a terceros. Los datos de ubicación (Estado/Municipio) se utilizan únicamente para conectar coleccionistas locales en el "Radar" y el Marketplace.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            5. Valuación con Inteligencia Artificial (BETA)
          </h2>
          <p className="leading-relaxed">
            Los precios generados por nuestro motor de Inteligencia Artificial son <strong>estimaciones matemáticas</strong> basadas en la marca, el fabricante, la rareza y el estado del auto. Estos precios son meramente informativos y no representan un valor de mercado oficial, infalible u obligatorio. Collectors no se responsabiliza por compras o ventas realizadas basándose en estas estimaciones.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-500 mb-4">Al utilizar Collectors, aceptas estas políticas en su totalidad.</p>
          <Link href="/" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">
            Volver al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}