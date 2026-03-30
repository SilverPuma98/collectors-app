"use client";

import { useState, useEffect } from "react";
import { calcularValorAproximado } from "@/lib/valuationEngine";
import Link from "next/link";

export default function CalculadoraPage() {
  const [modelo, setModelo] = useState("");
  const [fabricante, setFabricante] = useState("Hot Wheels");
  const [rareza, setRareza] = useState("Común");
  const [anio, setAnio] = useState<string>("");
  const [estado, setEstado] = useState("Blíster Excelente Condición");
  
  const [valorCalculado, setValorCalculado] = useState(0);
  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    // Efecto visual de cálculo
    setAnimando(true);
    const timeout = setTimeout(() => {
      const anioNum = parseInt(anio) || new Date().getFullYear();
      const valor = calcularValorAproximado(modelo, fabricante, rareza, anioNum, estado);
      setValorCalculado(valor);
      setAnimando(false);
    }, 400); 

    return () => clearTimeout(timeout);
  }, [modelo, fabricante, rareza, anio, estado]);

  return (
    <main className="min-h-screen bg-[#050810] p-4 md:p-8 selection:bg-cyan-900 selection:text-cyan-50 flex items-center justify-center font-sans">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-400 font-bold text-sm mb-6 bg-cyan-950/50 px-4 py-2 rounded-full border border-cyan-900/50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Volver al inicio
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Calculadora de <span className="text-cyan-500">Avaluos</span></h1>
          <p className="text-slate-400 max-w-xl mx-auto">Descubre el valor aproximado de mercado de tus piezas utilizando nuestro motor de análisis algorítmico.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* PANEL DE DATOS */}
          <div className="md:col-span-7 bg-[#0b1120] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col gap-5">
              
              <div>
                <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Modelo / Casting</label>
                <input type="text" placeholder="Ej. Nissan Skyline GT-R R34" value={modelo} onChange={(e) => setModelo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Fabricante</label>
                  <select value={fabricante} onChange={(e) => setFabricante(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500 cursor-pointer appearance-none">
                    <option value="Hot Wheels">Hot Wheels</option>
                    <option value="Matchbox">Matchbox</option>
                    <option value="Majorette">Majorette</option>
                    <option value="Maisto">Maisto / Bburago</option>
                    <option value="Jada">Jada Toys</option>
                    <option value="Greenlight">Greenlight</option>
                    <option value="M2">M2 Machines</option>
                    <option value="Mini GT">Mini GT</option>
                    <option value="Inno64">Inno64 / Tarmac</option>
                    <option value="Kaido House">Kaido House</option>
                    <option value="Pop Race">Pop Race</option>
                    <option value="Tomica">Tomica / TLV</option>
                    <option value="Kyosho">Kyosho</option>
                    <option value="AutoArt">AutoArt</option>
                    <option value="PGM">PGM</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Rareza / Variante</label>
                  <select value={rareza} onChange={(e) => setRareza(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500 cursor-pointer appearance-none">
                    <option value="Común">Básico / Común</option>
                    <option value="Premium">Premium (Goma/Metal)</option>
                    <option value="Treasure Hunt (TH)">Treasure Hunt (TH)</option>
                    <option value="Super Treasure Hunt (STH)">Súper Treasure Hunt (STH)</option>
                    <option value="RLC">RLC / Convención / Elite</option>
                    <option value="Chase">Chase (M2, Mini GT, Matchbox)</option>
                    <option value="Super Chase">Super Chase / Raw Metal</option>
                    <option value="Green Machine">Green Machine (Greenlight)</option>
                    <option value="White Lightning">White Lightning / Ultra Red</option>
                    <option value="Zamac">Zamac / Variante de Tienda</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Año de Salida</label>
                  <input type="number" placeholder="Ej. 2018" value={anio} onChange={(e) => setAnio(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-700" />
                </div>
                <div>
                  <label className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-2 block">Estado Físico</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-500 cursor-pointer appearance-none">
                    <option value="Blíster Excelente Condición">Blíster Excelente Condición</option>
                    <option value="Blíster Buena Condición">Blíster Buena Condición</option>
                    <option value="Blíster Mala Condición">Blíster Mala Condición</option>
                    <option value="Loose">Loose</option>
                    <option value="Buena Condición">Buena Condición (Suelto)</option>
                    <option value="Mal Estado">Mal Estado</option>
                    <option value="Chatarra">Chatarra</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* PANEL DE RESULTADO */}
          <div className="md:col-span-5 bg-gradient-to-br from-cyan-900 to-slate-900 border border-cyan-800/50 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="relative z-10 w-full">
              <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-4">Valor Estimado de Mercado</p>
              
              <div className={`h-24 flex items-center justify-center transition-all duration-300 ${animando ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100 blur-none'}`}>
                <span className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter">
                  ${valorCalculado.toLocaleString('es-MX')} <span className="text-2xl text-cyan-500">MXN</span>
                </span>
              </div>
              
              <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent my-6"></div>
              
              <ul className="text-left text-xs text-cyan-100/70 space-y-2 font-medium">
                <li className="flex justify-between"><span>Efecto de Apreciación:</span> <span className="text-emerald-400">+8% Anual</span></li>
                <li className="flex justify-between">
                  <span>Demanda de Mercado:</span> 
                  <span className="text-amber-400">
                    {valorCalculado > 1500 ? '🔥 Nivel Dios' : valorCalculado > 600 ? '⭐ Alta' : 'Normal'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}