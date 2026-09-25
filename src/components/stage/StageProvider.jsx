import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
const Context = createContext(null);
export const useStage = () => useContext(Context);
export default function StageProvider({ children }) {
  const [songs, setSongs] = useState([]), [sets, setSets] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const refresh = async () => { const [a,b] = await Promise.all([base44.entities.Song.list('-updated_date'), base44.entities.Setlist.list('-updated_date')]); setSongs(a); setSets(b); };
  useEffect(() => { refresh().catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  const saveSong = async (data, id) => { const result = id ? await base44.entities.Song.update(id, data) : await base44.entities.Song.create(data); await refresh(); return result; };
  const saveSet = async (data, id) => { const result = id ? await base44.entities.Setlist.update(id, data) : await base44.entities.Setlist.create(data); await refresh(); return result; };
  return <Context.Provider value={{songs,sets,loading,error,refresh,saveSong,saveSet}}>{children}</Context.Provider>;
}