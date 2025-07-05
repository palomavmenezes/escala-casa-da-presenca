import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  collection, 
  where, 
  writeBatch, 
  getDoc, 
  addDoc 
} from 'firebase/firestore';
import { useNotifications } from './useNotifications';

export const useCadastroMembro = (navigation) => {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isAreaPickerVisible, setIsAreaPickerVisible] = useState(false);
  const [isChurchPickerVisible, setIsChurchPickerVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingChurches, setIsLoadingChurches] = useState(true);
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [isMinisterForCults, setIsMinisterForCults] = useState(false);

  const musicianAreas = ['Cantor(a)', 'Tecladista', 'Guitarrista', 'Baixista', 'Baterista', 'Violão'];

  // Hook de notificações
  const { notifyNovoMembro } = useNotifications(selectedChurch?.id);

  const fetchChurches = useCallback(async () => {
    setIsLoadingChurches(true);
    try {
      const igrejasRef = collection(db, 'igrejas');
      const querySnapshot = await getDocs(query(igrejasRef));

      const loadedChurches = [];
      for (const docSnap of querySnapshot.docs) {
        const churchData = docSnap.data();
        if (churchData.modoProAtivo === true) {
          loadedChurches.push({ id: docSnap.id, ...churchData });
        }
      }
      setChurches(loadedChurches);
    } catch (error) {
      console.error('Erro ao buscar igrejas:', error);
      setErro('Erro ao carregar a lista de igrejas. Tente novamente.');
    } finally {
      setIsLoadingChurches(false);
    }
  }, []);

  const selectMusicianArea = (area) => {
    setIsAreaPickerVisible(false);
  };

  const selectChurch = (church) => {
    setSelectedChurch(church);
    setIsChurchPickerVisible(false);
  };

  const cadastrar = async () => {
    setErro('');
    setSucesso('');
    setIsRegistering(true);

    if (!nome || !sobrenome || !email || !senha || !telefone || !selectedChurch) {
      setErro('Por favor, preencha todos os campos obrigatórios e selecione sua igreja.');
      setIsRegistering(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      setIsRegistering(false);
      return;
    }

    try {
      // Verificar se já existe um usuário com este e-mail aguardando aprovação
      const usuariosRef = collection(db, 'igrejas', selectedChurch.id, 'usuarios');
      const qEmailPendente = query(usuariosRef,
                                   where('email', '==', email),
                                   where('aprovado', '==', false));
      const querySnapshotEmailPendente = await getDocs(qEmailPendente);

      if (!querySnapshotEmailPendente.empty) {
        Alert.alert(
          'Cadastro Pendente!',
          'Já existe um cadastro para este e-mail aguardando aprovação nesta igreja. Por favor, aguarde a aprovação ou entre em contato com seu líder/suporte.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Login')
            },
          ],
          { cancelable: false }
        );
        setIsRegistering(false);
        return;
      }
      
      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      const memberUserId = user.uid;

      const batch = writeBatch(db);
      const memberUsuarioDocRef = doc(db, 'igrejas', selectedChurch.id, 'usuarios', memberUserId);

      // Salvar perfil do membro no Firestore
      batch.set(memberUsuarioDocRef, {
        aprovado: false,
        cadastradoEm: new Date(),
        email: email,
        foto: '',
        igrejaId: selectedChurch.id,
        isLider: false,
        isMinisterForCults: false,
        nome: nome,
        sobrenome: sobrenome,
        telefone: telefone,
      });

      await batch.commit();

      // Criar notificação para o líder principal da igreja
      const liderPrincipalId = selectedChurch.liderPrincipalId;
      if (liderPrincipalId) {
        await notifyNovoMembro(
          { id: memberUserId, nome, sobrenome, email },
          liderPrincipalId
        );
      }

      Alert.alert(
        'Cadastro Enviado!',
        'Seu cadastro foi enviado para aprovação do líder da igreja selecionada. Você será notificado assim que for aprovado.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ],
        { cancelable: false }
      );

    } catch (error) {
      console.error('Erro ao cadastrar membro:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(
            'E-mail em Uso',
            'Este e-mail já está em uso por outra conta. Por favor, tente fazer login ou use outro e-mail.'
        );
      } else if (error.code === 'auth/invalid-email') {
        setErro('O endereço de e-mail é inválido.');
      } else if (error.code === 'auth/weak-password') {
        setErro('A senha é muito fraca. Escolha uma senha mais forte.');
      } else {
        setErro(`Erro ao cadastrar: ${error.message}`);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    fetchChurches();
  }, [fetchChurches]);

  return {
    nome,
    setNome,
    sobrenome,
    setSobrenome,
    email,
    setEmail,
    telefone,
    setTelefone,
    senha,
    setSenha,
    showPassword,
    setShowPassword,
    erro,
    sucesso,
    isAreaPickerVisible,
    setIsAreaPickerVisible,
    isChurchPickerVisible,
    setIsChurchPickerVisible,
    isRegistering,
    isLoadingChurches,
    churches,
    selectedChurch,
    isMinisterForCults,
    setIsMinisterForCults,
    musicianAreas,
    selectMusicianArea,
    selectChurch,
    cadastrar,
  };
}; 