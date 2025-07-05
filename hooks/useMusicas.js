import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';

export const useMusicas = () => {
  const [musicas, setMusicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [userChurchId, setUserChurchId] = useState(null);

  const carregarMusicas = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      // Buscar igreja do usuário
      const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
      let foundIgrejaId = null;

      for (const docIgreja of igrejasSnapshot.docs) {
        const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
        const usuarioDocSnap = await getDoc(usuarioDocRef);

        if (usuarioDocSnap.exists()) {
          foundIgrejaId = docIgreja.id;
          break;
        }
      }

      if (!foundIgrejaId) {
        setError('Não foi possível encontrar a igreja associada ao seu usuário');
        setLoading(false);
        return;
      }

      setUserChurchId(foundIgrejaId);

      // Buscar músicas da igreja
      const musicasRef = collection(db, 'igrejas', foundIgrejaId, 'musicas');
      const musicasSnap = await getDocs(musicasRef);

      const musicasData = musicasSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMusicas(musicasData);

    } catch (err) {
      console.error('Erro ao carregar músicas:', err);
      setError('Erro ao carregar músicas. Verifique sua conexão');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredMusicas = musicas.filter(musica =>
    musica.nome?.toLowerCase().includes(search.toLowerCase()) ||
    musica.artista?.toLowerCase().includes(search.toLowerCase()) ||
    musica.tom?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    carregarMusicas();
  }, [carregarMusicas]);

  return {
    musicas: filteredMusicas,
    loading,
    error,
    search,
    setSearch,
    userChurchId,
    carregarMusicas,
  };
}; 