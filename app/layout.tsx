import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Importamos tus nuevos componentes
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collectors | Garaje Virtual",
  description: "Registra, administra y explora colecciones de autos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* AQUI ESTÁ EL CAMBIO DE COLOR: 
        bg-slate-900 es el fondo oscuro pero suave (gris carbón).
        flex flex-col min-h-screen asegura que el Footer no flote si hay poco contenido.
      */}
      <body className={`${inter.className} bg-slate-900 text-slate-300 flex flex-col min-h-screen`}>
        
        {/* 1. El Menú Global */}
        <Navbar />

        {/* 2. El contenido de la página actual (ej. page.tsx) */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 3. El Footer Global */}
        <Footer />
        
      </body>
    </html>
  );
}