import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../services/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { useNotifications } from './useNotifications';

export function useComentarios(escalaId, igrejaId) {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]); // lista de usuários da igreja

  // Hook de notificações
  const { notifyMencao, deleteCommentNotifications } = useNotifications(igrejaId);

  // Buscar usuário logado
  useEffect(() => {
    setCurrentUser(auth.currentUser);
  }, []);

  // Buscar comentários
  const fetchComentarios = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      if (!escalaId || !igrejaId) {
        setComentarios([]);
        setLoading(false);
        return;
      }
      const comentariosRef = collection(db, 'igrejas', igrejaId, 'escalas', escalaId, 'comentarios');
      const q = query(comentariosRef, orderBy('criadoEm', 'desc'));
      const snap = await getDocs(q);
      // Buscar todos os usuários da igreja
      const usuariosSnap = await getDocs(collection(db, 'igrejas', igrejaId, 'usuarios'));
      const usuariosMap = {};
      usuariosSnap.docs.forEach(doc => { usuariosMap[doc.id] = { id: doc.id, ...doc.data() }; });
      // Montar comentários com dados atualizados do usuário
      const comentariosComUsuario = snap.docs.map(doc => {
        const data = doc.data();
        const user = usuariosMap[data.criadoPor] || {};
        return {
          id: doc.id,
          texto: data.texto,
          criadoPor: data.criadoPor,
          criadoEm: data.criadoEm,
          nome: user.nome || 'Usuário',
          sobrenome: user.sobrenome || '',
          foto: user.foto || '',
        };
      });
      setComentarios(comentariosComUsuario);
    } catch (e) {
      setErro('Erro ao carregar comentários.');
      setComentarios([]);
    } finally {
      setLoading(false);
    }
  }, [escalaId, igrejaId]);

  useEffect(() => {
    fetchComentarios();
  }, [fetchComentarios]);

  // Buscar usuários da igreja para sugestões
  useEffect(() => {
    async function fetchUsuarios() {
      if (!igrejaId) return;
      const usuariosSnap = await getDocs(collection(db, 'igrejas', igrejaId, 'usuarios'));
      setUsuarios(usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    fetchUsuarios();
  }, [igrejaId]);

  // Função para obter sugestões baseadas no texto
  const getSuggestions = useCallback((texto) => {
    const match = texto.match(/@([\wÀ-ÿ ]*)$/i);
    if (match) {
      const termo = match[1].toLowerCase();
      return usuarios.filter(u =>
        (u.nome + (u.sobrenome ? ' ' + u.sobrenome : '')).toLowerCase().startsWith(termo)
      );
    }
    return [];
  }, [usuarios]);

  // Adicionar comentário
  const addComentario = async (texto, userProfile) => {
    if (!texto || !userProfile) return;
    try {
      const comentariosRef = collection(db, 'igrejas', igrejaId, 'escalas', escalaId, 'comentarios');
      await addDoc(comentariosRef, {
        texto,
        criadoPor: userProfile.id,
        criadoEm: serverTimestamp(),
      });
      fetchComentarios();

      // --- NOVO: Notificações para menções ---
      // 1. Detectar menções (@Nome ou @Nome Sobrenome)
      const mencoes = texto.match(/@([\wÀ-ÿ]+(?: [\wÀ-ÿ]+)?)/g) || [];
      if (mencoes.length > 0) {
        // 2. Buscar todos os usuários da igreja
        const usuariosSnap = await getDocs(collection(db, 'igrejas', igrejaId, 'usuarios'));
        const usuarios = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // 3. Para cada menção, buscar usuário correspondente e notificar
        mencoes.forEach(async (m) => {
          const nomeMencao = m.replace('@', '').trim().toLowerCase();
          const usuariosMencionados = usuarios.filter(u => {
            const nomeCompleto = (u.nome + (u.sobrenome ? ' ' + u.sobrenome : '')).trim().toLowerCase();
            return nomeCompleto === nomeMencao || u.nome.toLowerCase() === nomeMencao;
          });
          for (const usuario of usuariosMencionados) {
            if (usuario.id !== userProfile.id) {
              await notifyMencao(
                { id: doc.id, nome: userProfile.nome, texto },
                usuario,
                escalaId
              );
            }
          }
        });
      }
      // --- FIM NOTIFICAÇÃO ---
    } catch (e) {
      setErro('Erro ao adicionar comentário.');
    }
  };

  // Editar comentário
  const editComentario = async (comentarioId, novoTexto) => {
    if (!comentarioId || !novoTexto) return;
    try {
      const comentarioRef = doc(db, 'igrejas', igrejaId, 'escalas', escalaId, 'comentarios', comentarioId);
      await updateDoc(comentarioRef, { texto: novoTexto });
      fetchComentarios();
    } catch (e) {
      setErro('Erro ao editar comentário.');
    }
  };

  // Excluir comentário
  const deleteComentario = async (comentarioId) => {
    if (!comentarioId) return;
    try {
      // Buscar o comentário antes de excluí-lo para obter o texto e autor
      const comentarioRef = doc(db, 'igrejas', igrejaId, 'escalas', escalaId, 'comentarios', comentarioId);
      const comentarioSnap = await getDoc(comentarioRef);
      
      if (!comentarioSnap.exists()) {
        setErro('Comentário não encontrado.');
        return;
      }
      
      const comentarioData = comentarioSnap.data();
      
      // Excluir o comentário
      await deleteDoc(comentarioRef);
      
      // Excluir notificações relacionadas ao comentário
      await deleteCommentNotifications(comentarioId, comentarioData.texto, comentarioData.criadoPor);
      
      fetchComentarios();
    } catch (e) {
      setErro('Erro ao excluir comentário.');
    }
  };

  return {
    comentarios,
    loading,
    erro,
    addComentario,
    editComentario,
    deleteComentario,
    currentUser,
    fetchComentarios,
    usuarios,
    getSuggestions,
  };
} 