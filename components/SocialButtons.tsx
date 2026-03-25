"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SocialButtons({ perfilId, initialFollowers, initialLikes }: { perfilId: number, initialFollowers: number, initialLikes: number }) {
  const router = useRouter();
  const [miIdUsuario, setMiIdUsuario] = useState<number | null>(null);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const [followersCount, setFollowersCount] = useState(initialFollowers);
  const [likesCount, setLikesCount] = useState(initialLikes);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarEstadoSocial();
  }, [perfilId]);

  const verificarEstadoSocial = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: miPerfil } = await supabase.from('usuario').select('id_usuario').eq('correo', user.email).single();
    if (!miPerfil) { setLoading(false); return; }
    
    setMiIdUsuario(miPerfil.id_usuario);

    // ¿Ya lo sigo?
    const { data: seguidor } = await supabase.from('seguidor').select('*').eq('seguidor_id', miPerfil.id_usuario).eq('seguido_id', perfilId).single();
    if (seguidor) setIsFollowing(true);

    // ¿Ya le di like?
    const { data: like } = await supabase.from('perfil_like').select('*').eq('usuario_id', miPerfil.id_usuario).eq('perfil_id', perfilId).single();
    if (like) setIsLiked(true);

    setLoading(false);
  };

  const toggleFollow = async () => {
    if (!miIdUsuario) { router.push('/login'); return; }
    
    if (isFollowing) {
      await supabase.from('seguidor').delete().eq('seguidor_id', miIdUsuario).eq('seguido_id', perfilId);
      setFollowersCount(prev => prev - 1);
    } else {
      await supabase.from('seguidor').insert([{ seguidor_id: miIdUsuario, seguido_id: perfilId }]);
      setFollowersCount(prev => prev + 1);
    }
    setIsFollowing(!isFollowing);
  };

  const toggleLike = async () => {
    if (!miIdUsuario) { router.push('/login'); return; }
    
    if (isLiked) {
      await supabase.from('perfil_like').delete().eq('usuario_id', miIdUsuario).eq('perfil_id', perfilId);
      setLikesCount(prev => prev - 1);
    } else {
      await supabase.from('perfil_like').insert([{ usuario_id: miIdUsuario, perfil_id: perfilId }]);
      setLikesCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  if (loading) return <div className="h-10"></div>; // Placeholder mientras carga

  // Si soy yo mismo, solo muestro los números, no los botones
  if (miIdUsuario === perfilId) {
    return (
      <div className="flex gap-4 mt-4 text-slate-300 font-bold">
        <div className="flex flex-col items-center"><span className="text-xl text-white">{followersCount}</span><span className="text-[10px] uppercase text-cyan-500">Seguidores</span></div>
        <div className="flex flex-col items-center"><span className="text-xl text-white">{likesCount}</span><span className="text-[10px] uppercase text-pink-500">Likes</span></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      {/* Contadores */}
      <div className="flex gap-6 text-slate-300 font-bold">
        <div className="flex flex-col items-center"><span className="text-xl text-white">{followersCount}</span><span className="text-[10px] uppercase text-cyan-500">Seguidores</span></div>
        <div className="flex flex-col items-center"><span className="text-xl text-white">{likesCount}</span><span className="text-[10px] uppercase text-pink-500">Likes</span></div>
      </div>
      
      {/* Botones */}
      <div className="flex gap-3">
        <button onClick={toggleFollow} className={`px-6 py-2 rounded-full font-bold text-sm transition-all border ${isFollowing ? 'bg-transparent border-slate-600 text-slate-400 hover:text-white hover:border-slate-400' : 'bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/50'}`}>
          {isFollowing ? 'Siguiendo' : 'Seguir'}
        </button>
        
        <button onClick={toggleLike} className={`flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm transition-all border ${isLiked ? 'bg-pink-600/20 border-pink-600 text-pink-500' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-pink-400 hover:border-pink-900'}`}>
          <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : 'fill-none'} stroke-current`} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          {isLiked ? 'Te gusta' : 'Dar Like'}
        </button>
      </div>
    </div>
  );
}