import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { useNotifications } from './useNotifications';

export const useCriarEscala = (navigation) => {
  const [ministros, setMinistros] = useState([]);
  const [musicas, setMusicas] = useState([]);
  const [escala, setEscala] = useState({
    ministros: [],
    musicas: [],
    dataCulto: '',
    horaCulto: '',
    dataEnsaio: '',
    horaEnsaio: '',
    observacoes: '',
  });
  const [modals, setModals] = useState({
    selectMusician: false,
    selectArea: false,
    selectMusic: false,
    selectSinger: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [igrejaId, setIgrejaId] = useState(null);

  // Hook de notificações
  const { notifyEscalaCriada } = useNotifications(igrejaId);

  // Buscar ministros e músicas da igreja do usuário
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        let foundIgrejaId = null;
        const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
        for (const docIgreja of igrejasSnapshot.docs) {
          const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
          const usuarioDocSnap = await getDoc(usuarioDocRef);
          if (usuarioDocSnap.exists()) {
            foundIgrejaId = docIgreja.id;
            break;
          }
        }
        if (!foundIgrejaId) return;
        setIgrejaId(foundIgrejaId);
        // Ministros
        const ministrosSnap = await getDocs(collection(db, 'igrejas', foundIgrejaId, 'usuarios'));
        setMinistros(ministrosSnap.docs.map(doc => {
          const data = doc.data();
          let iniciais = '';
          if (data.nome) {
            const partes = data.nome.trim().split(' ');
            iniciais = partes[0][0].toUpperCase();
            if (partes.length > 1) {
              iniciais += partes[partes.length - 1][0].toUpperCase();
            }
          }
          return { id: doc.id, ...data, iniciais };
        }));
        // Músicas
        const musicasSnap = await getDocs(collection(db, 'igrejas', foundIgrejaId, 'musicas'));
        setMusicas(musicasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        setErrors({ global: 'Erro ao carregar dados da igreja.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handlers para adicionar/remover músicos e músicas
  const handleAddMusico = (musico) => {
    setEscala((prev) => ({ ...prev, ministros: [...prev.ministros, musico] }));
  };
  const handleRemoveMusico = (idx) => {
    setEscala((prev) => ({ ...prev, ministros: prev.ministros.filter((_, i) => i !== idx) }));
  };
  const handleAddMusica = (musica) => {
    setEscala((prev) => ({ ...prev, musicas: [...prev.musicas, musica] }));
  };
  const handleRemoveMusica = (idx) => {
    setEscala((prev) => ({ ...prev, musicas: prev.musicas.filter((_, i) => i !== idx) }));
  };

  // Handlers para seleção em modais
  const handleSelectMusician = (musico) => {
    handleAddMusico(musico);
    setModals((m) => ({ ...m, selectMusician: false }));
  };
  const handleSelectArea = () => setModals((m) => ({ ...m, selectArea: false }));
  const handleSelectMusic = (musica) => {
    handleAddMusica(musica);
    setModals((m) => ({ ...m, selectMusic: false }));
  };
  const handleSelectSinger = () => setModals((m) => ({ ...m, selectSinger: false }));

  // Salvar escala no Firestore
  const handleSaveEscala = async () => {
    setLoading(true);
    setErrors({});
    if (!escala.dataCulto) {
      setErrors({ dataCulto: 'Data do evento obrigatória' });
      setLoading(false);
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Usuário não autenticado');
      let foundIgrejaId = null;
      const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
      for (const docIgreja of igrejasSnapshot.docs) {
        const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
        const usuarioDocSnap = await getDoc(usuarioDocRef);
        if (usuarioDocSnap.exists()) {
          foundIgrejaId = docIgreja.id;
          break;
        }
      }
      if (!foundIgrejaId) throw new Error('Igreja não encontrada');
      // Montar arrays corretos
      const usuariosEscalados = (escala.ministros || []).map(m => ({
        userId: m.id,
        roles: m.areas || [],
      }));
      const usuariosEscaladosIds = usuariosEscalados.map(u => u.userId);
      // Montar objeto para salvar
      const musicasParaSalvar = (escala.musicas || []).map(musica => ({
        ...musica,
        cantores: (musica.cantores || []).map(c => typeof c === 'string' ? c : c.id),
      }));
      const escalaParaSalvar = {
        ...escala,
        musicas: musicasParaSalvar,
        usuariosEscalados,
        usuariosEscaladosIds,
        igrejaId: foundIgrejaId,
        criadoPor: currentUser.uid,
        criadoEm: new Date(),
      };
      delete escalaParaSalvar.ministros;
      const escalaDoc = await addDoc(collection(db, 'igrejas', foundIgrejaId, 'escalas'), escalaParaSalvar);
      
      // Notificar usuários escalados
      if (usuariosEscalados.length > 0) {
        await notifyEscalaCriada(
          { id: escalaDoc.id, ...escalaParaSalvar },
          usuariosEscalados
        );
      }
      
      Alert.alert('Sucesso', 'Escala criada com sucesso!');
      if (navigation && navigation.goBack) navigation.goBack();
    } catch (e) {
      setErrors({ global: e.message || 'Erro ao salvar escala.' });
    } finally {
      setLoading(false);
    }
  };

  return {
    ministros,
    musicas,
    escala,
    setEscala,
    handleAddMusico,
    handleRemoveMusico,
    handleAddMusica,
    handleRemoveMusica,
    handleSaveEscala,
    modals,
    setModals,
    handleSelectMusician,
    handleSelectArea,
    handleSelectMusic,
    handleSelectSinger,
    loading,
    errors,
    setErrors,
  };
}; 