// lib/levelEngine.ts

export function calcularNivel(cantidadLogros: number) {
  // Nivel 10 - La cima absoluta (Fórmula 1 / Hypercars)
  if (cantidadLogros >= 100) {
    return { nivel: 10, titulo: "Campeón Mundial", bg: "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500", text: "text-amber-950", shadow: "shadow-amber-500/60", border: "border-amber-200", icon: "🏆" };
  }
  // Nivel 9 - Resistencia / Le Mans
  if (cantidadLogros >= 90) {
    return { nivel: 9, titulo: "Piloto Hypercar", bg: "bg-gradient-to-r from-rose-500 to-red-600", text: "text-white", shadow: "shadow-red-500/50", border: "border-rose-400", icon: "🏁" };
  }
  // Nivel 8 - Rally / WRC
  if (cantidadLogros >= 80) {
    return { nivel: 8, titulo: "Leyenda del Rally", bg: "bg-gradient-to-r from-orange-500 to-amber-600", text: "text-white", shadow: "shadow-orange-500/50", border: "border-orange-400", icon: "🦂" };
  }
  // Nivel 7 - Drifting / Formula D
  if (cantidadLogros >= 70) {
    return { nivel: 7, titulo: "Rey del Drift", bg: "bg-gradient-to-r from-purple-500 to-fuchsia-600", text: "text-white", shadow: "shadow-purple-500/50", border: "border-purple-400", icon: "💨" };
  }
  // Nivel 6 - NASCAR / Drag Racing
  if (cantidadLogros >= 60) {
    return { nivel: 6, titulo: "Bestia del 1/4 Milla", bg: "bg-gradient-to-r from-blue-600 to-indigo-700", text: "text-white", shadow: "shadow-blue-500/50", border: "border-blue-400", icon: "⚡" };
  }
  // Nivel 5 - Gran Turismo / GT3
  if (cantidadLogros >= 50) {
    return { nivel: 5, titulo: "Piloto GT", bg: "bg-gradient-to-r from-cyan-500 to-blue-500", text: "text-white", shadow: "shadow-cyan-500/50", border: "border-cyan-300", icon: "🐆" };
  }
  // Nivel 4 - Carreras Callejeras (Tuning)
  if (cantidadLogros >= 40) {
    return { nivel: 4, titulo: "Corredor Callejero", bg: "bg-gradient-to-r from-emerald-500 to-teal-600", text: "text-white", shadow: "shadow-emerald-500/50", border: "border-emerald-400", icon: "🌃" };
  }
  // Nivel 3 - Track Days / Aficionado de Pista
  if (cantidadLogros >= 30) {
    return { nivel: 3, titulo: "Entusiasta de Pista", bg: "bg-gradient-to-r from-lime-400 to-emerald-500", text: "text-emerald-950", shadow: "shadow-lime-500/50", border: "border-lime-300", icon: "⏱️" };
  }
  // Nivel 2 - Karting (El inicio de todo piloto)
  if (cantidadLogros >= 15) {
    return { nivel: 2, titulo: "Piloto de Karting", bg: "bg-gradient-to-r from-sky-400 to-cyan-500", text: "text-cyan-950", shadow: "shadow-sky-500/50", border: "border-sky-300", icon: "🏎️" };
  }
  // Nivel 1 (Default) - Fanático / Espectador
  return { nivel: 1, titulo: "Rookie", bg: "bg-gradient-to-r from-slate-200 to-slate-300", text: "text-slate-800", shadow: "shadow-slate-300/50", border: "border-slate-400", icon: "🔰" };
}