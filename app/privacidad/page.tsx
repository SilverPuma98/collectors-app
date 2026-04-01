import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#050810] text-slate-300 font-sans selection:bg-cyan-900 selection:text-cyan-50 pb-20">
      
      {/* HEADER */}
      <div className="bg-[#0b1120] border-b border-slate-800 py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-32 bg-cyan-900/20 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4 relative z-10">Política de Privacidad</h1>
        <p className="text-slate-400 font-medium relative z-10">Protección de Datos y Transparencia | Última actualización: Noviembre 2024</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12 space-y-10">
        
        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            1. Información que Recopilamos
          </h2>
          <p className="leading-relaxed mb-3">
            Para ofrecerte la mejor experiencia en <strong>Collectors</strong>, recopilamos los siguientes datos:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Datos de Cuenta:</strong> Correo electrónico y contraseña (encriptada de forma segura mediante Supabase).</li>
            <li><strong>Datos Públicos del Perfil:</strong> Nombre de usuario, foto de perfil/logo y los autos que registras en tu bóveda.</li>
            <li><strong>Datos de Contacto y Ubicación:</strong> Estado y Municipio. En el caso de las Tiendas PRO o usuarios con amigos mutuos, el número de WhatsApp y enlaces a redes sociales.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            2. Uso de la Información
          </h2>
          <p className="leading-relaxed mb-3">
            Tus datos se utilizan exclusivamente para el funcionamiento interno de la plataforma:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Conectar a coleccionistas de la misma zona geográfica para facilitar intercambios locales.</li>
            <li>Generar "Gafetes Virtuales" automatizados para que los vendedores sepan quién los contacta vía WhatsApp.</li>
            <li>Mejorar nuestro algoritmo de valuación mediante el análisis de las piezas subidas a la plataforma.</li>
            <li>Enviar correos electrónicos críticos, como la recuperación de contraseñas.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            3. Compartición de Datos (Lo que NO hacemos)
          </h2>
          <p className="leading-relaxed">
            <strong>Collectors NO vende, alquila ni comercializa</strong> tu información personal, número de teléfono o correo electrónico a terceros, agencias de publicidad o empresas externas. Tu número de WhatsApp y redes sociales están ocultos por defecto y solo se revelan bajo reglas estrictas de la plataforma (ser una Tienda oficial o ser seguido mutuamente por otro coleccionista).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            4. Seguridad de los Datos
          </h2>
          <p className="leading-relaxed">
            La seguridad de tu bóveda es nuestra prioridad. Utilizamos <strong>Supabase</strong> como nuestra infraestructura de base de datos, la cual cumple con los más altos estándares de la industria en encriptación y seguridad de la información. Las contraseñas nunca son legibles para los administradores de Collectors.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
            5. Tus Derechos y Eliminación de Cuenta
          </h2>
          <p className="leading-relaxed">
            Como usuario, tienes el derecho de editar tu información en cualquier momento desde tu Panel. Si deseas eliminar tu cuenta de forma permanente, junto con todos tus autos, reseñas y reportes, puedes solicitar la eliminación enviando un mensaje directo al soporte de la plataforma o utilizando los canales oficiales.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-500 mb-4">Si tienes dudas sobre esta política, por favor contáctanos.</p>
          <Link href="/" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">
            Entendido, volver al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}