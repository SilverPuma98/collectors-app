// lib/levelEngine.ts

export function calcularNivel(cantidadLogros: number) {
  // Nivel Máximo
  if (cantidadLogros >= 120) {
    return { nivel: 6, titulo: "Leyenda", bg: "bg-gradient-to-r from-amber-400 to-red-500", text: "text-amber-900", shadow: "shadow-amber-500/50", border: "border-amber-200", icon: "👑" };
  }
  // Nivel 5
  if (cantidadLogros >= 100) {
    return { nivel: 5, titulo: "Maestro", bg: "bg-gradient-to-r from-orange-400 to-amber-500", text: "text-orange-950", shadow: "shadow-orange-500/50", border: "border-orange-300", icon: "🔥" };
  }
  // Nivel 4
  if (cantidadLogros >= 80) {
    return { nivel: 4, titulo: "Cazador Elite", bg: "bg-gradient-to-r from-purple-500 to-pink-500", text: "text-white", shadow: "shadow-purple-500/50", border: "border-purple-300", icon: "🎯" };
  }
  // Nivel 3
  if (cantidadLogros >= 60) {
    return { nivel: 3, titulo: "Coleccionista", bg: "bg-gradient-to-r from-cyan-500 to-blue-500", text: "text-white", shadow: "shadow-cyan-500/50", border: "border-cyan-300", icon: "💎" };
  }
  // Nivel 2
  if (cantidadLogros >= 40) {
    return { nivel: 2, titulo: "Aficionado", bg: "bg-gradient-to-r from-emerald-400 to-green-500", text: "text-emerald-950", shadow: "shadow-emerald-500/50", border: "border-emerald-300", icon: "🔰" };
  }
  // Nivel 1 (Default)
  return { nivel: 1, titulo: "Espectador", bg: "bg-gradient-to-r from-slate-200 to-slate-300", text: "text-slate-800", shadow: "shadow-slate-300/50", border: "border-slate-400", icon: "👀" };
}