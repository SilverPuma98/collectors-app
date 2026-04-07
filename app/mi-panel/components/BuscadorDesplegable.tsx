"use client";

import { useState, useEffect, useRef } from "react";

export default function BuscadorDesplegable({ 
  opciones, 
  valorSeleccionado, 
  onSelect, 
  placeholder, 
  disabled = false,
  permiteNuevo = true
}: {
  opciones: {id: string, label: string}[],
  valorSeleccionado: string,
  onSelect: (id: string, textoNuevo: string) => void,
  placeholder: string,
  disabled?: boolean,
  permiteNuevo?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (valorSeleccionado && valorSeleccionado !== "nuevo") {
      const opt = opciones.find(o => o.id === valorSeleccionado);
      if (opt) setBusqueda(opt.label);
    } else if (valorSeleccionado !== "nuevo") {
      setBusqueda("");
    }
  }, [valorSeleccionado, opciones]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (valorSeleccionado && valorSeleccionado !== "nuevo") {
          const opt = opciones.find(o => o.id === valorSeleccionado);
          if (opt) setBusqueda(opt.label);
        } else if (valorSeleccionado !== "nuevo") {
          setBusqueda("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [valorSeleccionado, opciones]);

  const filtradas = opciones.filter(o => o.label.toLowerCase().includes(busqueda.toLowerCase()));
  const exactMatch = opciones.some(o => o.label.toLowerCase() === busqueda.trim().toLowerCase());
  const showAdd = permiteNuevo && busqueda.trim().length > 0 && !exactMatch;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={busqueda}
          onChange={e => {
            setBusqueda(e.target.value);
            setIsOpen(true);
            if (valorSeleccionado && valorSeleccionado !== "nuevo") onSelect("", ""); 
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors disabled:bg-slate-100 disabled:text-slate-400 placeholder:text-slate-400 shadow-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 ring-1 ring-black/5">
          {filtradas.length === 0 && !showAdd && (
            <div className="p-4 text-sm text-slate-500 text-center font-medium">No se encontraron resultados</div>
          )}
          {filtradas.map(opt => (
            <div
              key={opt.id}
              onClick={() => { onSelect(opt.id, ""); setBusqueda(opt.label); setIsOpen(false); }}
              className="p-3 hover:bg-cyan-50 hover:text-cyan-700 cursor-pointer text-sm font-medium text-slate-700 transition-colors"
            >
              {opt.label}
            </div>
          ))}
          {showAdd && (
            <div
              onClick={() => { onSelect("nuevo", busqueda.trim()); setIsOpen(false); }}
              className="p-3 bg-cyan-50 hover:bg-cyan-100 cursor-pointer text-sm font-black text-cyan-700 flex items-center gap-2 transition-colors sticky bottom-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Crear "{busqueda.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}