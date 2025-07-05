import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

export const useEscalas = () => {
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEscalas = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setEscalas([]);
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
        setEscalas([]);
        setLoading(false);
        return;
      }

      // Buscar escalas da igreja
      const escalasRef = collection(db, 'igrejas', foundIgrejaId, 'escalas');
      const snapshot = await getDocs(escalasRef);
      const escalasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEscalas(escalasData);
    } catch (err) {
      setEscalas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEscalas();
  }, [fetchEscalas]);

  return { escalas, loading };
}; 