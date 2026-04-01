"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaStar, FaRegStar, FaEdit, FaTrash } from "react-icons/fa";
import Link from "next/link";

export default function SeccionResenas({ idVendedor, miIdUsuario, esVendedor }: { idVendedor: number, miIdUsuario: number | null, esVendedor: boolean }) {
  const [resenas, setResenas] = useState<any[]>([]);
  const [promedio, setPromedio] = useState(0);
  const [cargando, setCargando] = useState(true);

  // Estados del formulario
  const [miResena, setMiResena] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [estrellasSeleccionadas, setEstrellasSeleccionadas] = useState(0);
  const [estrellasHover, setEstrellasHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarResenas();
  }, [idVendedor, miIdUsuario]);

  const cargarResenas = async () => {
    // 1. Traer reseñas
    const { data: revs } = await supabase.from('review_vendedor').select('*').eq('id_vendedor', idVendedor).order('created_at', { ascending: false });
    
    if (revs && revs.length > 0) {
      // 2. Traer perfiles de los compradores para mostrar sus nombres y fotos
      const idsCompradores = revs.map(r => r.id_comprador);
      const { data: users } = await supabase.from('usuario').select('id_usuario, nombre_usuario, link_img_perf').in('id_usuario', idsCompradores);
      
      const resenasConUsuario = revs.map(r => ({
        ...r,
        usuario: users?.find(u => u.id_usuario === r.id_comprador)
      }));

      setResenas(resenasConUsuario);
      
      // Promedio
      const suma = revs.reduce((acc, curr) => acc + curr.calificacion, 0);
      setPromedio(suma / revs.length);

      // Ver si yo ya comenté
      if (miIdUsuario) {
        const laMia = resenasConUsuario.find(r => r.id_comprador === miIdUsuario);
        if (laMia) {
          setMiResena(laMia);
          setEstrellasSeleccionadas(laMia.calificacion);
          setComentario(laMia.comentario);
        }
      }
    } else {
      setResenas([]);
      setPromedio(0);
    }
    setCargando(false);
  };

  const guardarResena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estrellasSeleccionadas === 0) { alert("Por favor selecciona al menos 1 estrella."); return; }
    if (!comentario.trim()) { alert("Por favor escribe un comentario."); return; }
    setGuardando(true);

    const payload = {
      id_comprador: miIdUsuario,
      id_vendedor: idVendedor,
      calificacion: estrellasSeleccionadas,
      comentario: comentario.trim()
    };

    if (miResena) {
      // Editar
      const { error } = await supabase.from('review_vendedor').update(payload).eq('id_review', miResena.id_review);
      if (error) alert("Error al editar: " + error.message);
      else { alert("✅ Reseña actualizada."); setEditando(false); cargarResenas(); }
    } else {
      // Crear nueva
      const { error } = await supabase.from('review_vendedor').insert([payload]);
      if (error) alert("Error al publicar: " + error.message);
      else { alert("✅ Reseña publicada con éxito."); setEditando(false); cargarResenas(); }
    }
    setGuardando(false);
  };

  const eliminarResena = async (idReview: number) => {
    if (!window.confirm("⚠️ ¿Estás seguro de eliminar tu reseña? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from('review_vendedor').delete().eq('id_review', idReview);
    if (error) alert("Error al eliminar: " + error.message);
    else {
      alert("🗑️ Reseña eliminada.");
      setMiResena(null);
      setEstrellasSeleccionadas(0);
      setComentario("");
      cargarResenas();
    }
  };

  // Función para renderizar estrellas fijas (las de las reviews ya hechas)
  const renderEstrellasFijas = (calificacion: number) => {
    return (
      <div className="flex gap-1 text-amber-400">
        {[1, 2, 3, 4, 5].map(num => (
          num <= calificacion ? <FaStar key={num} className="w-4 h-4" /> : <FaRegStar key={num} className="w-4 h-4 text-slate-300" />
        ))}
      </div>
    );
  };

  if (cargando) return <div className="py-10 text-center text-slate-400 animate-pulse font-bold">Cargando reputación...</div>;

  return (
    <div className="w-full mt-12 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
      
      {/* HEADER: PROMEDIO DE ESTRELLAS */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-6 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FaStar className="text-amber-400" /> Reputación del Vendedor
          </h2>
          <p className="text-slate-500 text-sm">Basado en la experiencia de otros coleccionistas.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl">
          <div className="text-4xl font-black text-slate-800">{promedio.toFixed(1)}</div>
          <div>
            {renderEstrellasFijas(Math.round(promedio))}
            <p className="text-xs text-slate-500 font-bold mt-1">{resenas.length} reseñas en total</p>
          </div>
        </div>
      </div>

      {/* ZONA DE ESCRITURA (Si soy comprador y no es mi perfil) */}
      {!esVendedor && miIdUsuario && (!miResena || editando) && (
        <form onSubmit={guardarResena} className="mb-10 bg-slate-50 border border-cyan-200 rounded-2xl p-5 shadow-inner">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
            {miResena ? "Editar tu experiencia" : "Califica tu experiencia con este vendedor"}
          </h3>
          
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                type="button"
                onMouseEnter={() => setEstrellasHover(num)}
                onMouseLeave={() => setEstrellasHover(0)}
                onClick={() => setEstrellasSeleccionadas(num)}
                className="text-3xl transition-transform hover:scale-110 focus:outline-none"
              >
                {num <= (estrellasHover || estrellasSeleccionadas) ? <FaStar className="text-amber-400 drop-shadow-md" /> : <FaRegStar className="text-slate-300" />}
              </button>
            ))}
          </div>

          <textarea
            required
            placeholder="¿Cómo fue el trato? ¿El paquete llegó bien protegido? ¿Lo recomiendas?"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors resize-none mb-4 shadow-sm"
          />

          <div className="flex gap-3">
            <button type="submit" disabled={guardando} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md disabled:opacity-50">
              {guardando ? "Publicando..." : (miResena ? "Actualizar Reseña" : "Publicar Reseña")}
            </button>
            {editando && (
              <button type="button" onClick={() => { setEditando(false); setEstrellasSeleccionadas(miResena.calificacion); setComentario(miResena.comentario); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all">
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* LISTA DE RESEÑAS */}
      <div className="flex flex-col gap-4">
        {resenas.length === 0 ? (
          <p className="text-center text-slate-400 font-medium py-6">Aún no hay reseñas registradas. ¡Sé el primero en calificar!</p>
        ) : (
          resenas.map((r) => {
            const esMia = r.id_comprador === miIdUsuario;
            // 🧠 CÁLCULO DE LOS 5 DÍAS PARA BORRAR
            const diasPasados = (new Date().getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
            const puedeEliminar = diasPasados <= 5;

            return (
              <div key={r.id_review} className={`p-5 rounded-2xl border ${esMia ? 'bg-cyan-50/50 border-cyan-200' : 'bg-white border-slate-100'} shadow-sm flex flex-col gap-3`}>
                
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Link href={`/perfil/${r.usuario?.nombre_usuario}`} className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300 flex-shrink-0">
                      {r.usuario?.link_img_perf ? <img src={r.usuario.link_img_perf} alt="Avatar" className="w-full h-full object-cover" /> : <FaRegStar className="w-full h-full p-2 text-slate-400" />}
                    </Link>
                    <div>
                      <Link href={`/perfil/${r.usuario?.nombre_usuario}`} className="font-bold text-slate-800 hover:text-cyan-600 transition-colors">
                        {r.usuario?.nombre_usuario || 'Coleccionista Anónimo'}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(r.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>
                  {renderEstrellasFijas(r.calificacion)}
                </div>

                <p className="text-slate-600 text-sm leading-relaxed">{r.comentario}</p>

                {esMia && !editando && (
                  <div className="flex gap-4 mt-2 pt-3 border-t border-slate-200/60">
                    <button onClick={() => setEditando(true)} className="text-xs font-bold text-cyan-600 hover:text-cyan-500 flex items-center gap-1">
                      <FaEdit /> Editar
                    </button>
                    {puedeEliminar ? (
                      <button onClick={() => eliminarResena(r.id_review)} className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1">
                        <FaTrash /> Eliminar
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium flex items-center italic">
                        (La eliminación expira tras 5 días)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}