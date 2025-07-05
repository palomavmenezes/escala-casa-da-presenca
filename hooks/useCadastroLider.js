import { useState, useCallback } from 'react';
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
  writeBatch 
} from 'firebase/firestore';

export const useCadastroLider = (navigation) => {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isCadastroLidering, setIsCadastroLidering] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState('');
  
  const cadastrar = useCallback(async () => {
    setErro('');
    setSucesso('');
    setIsCadastroLidering(true);

    if (!nome || !sobrenome || !email || !senha || !telefone || !nomeGrupo) {
      setErro('Por favor, preencha todos os campos obrigatórios (incluindo o nome do grupo).');
      setIsCadastroLidering(false);
      return false;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      setIsCadastroLidering(false);
      return false;
    }

    try {
      // Verificar se já existe um grupo com este nome
      const gruposRef = collection(db, 'igrejas');
      const qGrupoExistente = query(gruposRef, where('nomeIgreja', '==', nomeGrupo));
      const querySnapshotGrupoExistente = await getDocs(qGrupoExistente);

      if (!querySnapshotGrupoExistente.empty) {
        setErro('Já existe um grupo cadastrado com este nome. Por favor, verifique o nome ou entre em contato com o suporte.');
        setIsCadastroLidering(false);
        return false;
      }

      // Verificar se já existe um usuário com este e-mail aguardando pagamento
      const usuariosRef = collection(db, 'usuarios');
      const qEmailPendente = query(usuariosRef,
        where('email', '==', email),
        where('aprovado', '==', false));
      const querySnapshotEmailPendente = await getDocs(qEmailPendente);

      if (!querySnapshotEmailPendente.empty) {
        const userIdExistente = querySnapshotEmailPendente.docs[0].id;
        Alert.alert(
          'Cadastro Pendente!',
          'Já existe um cadastro para este e-mail aguardando a finalização do pagamento. Você será redirecionado para a página de informações de pagamento.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Pagamento', { 
                userId: userIdExistente, 
                igrejaId: querySnapshotEmailPendente.docs[0].data().igrejaId 
              })
            },
          ],
          { cancelable: false }
        );
        setIsCadastroLidering(false);
        return false;
      }

      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      const liderUserId = user.uid;

      const batch = writeBatch(db);

      // Criar novo grupo
      const novoGrupoDocRef = doc(collection(db, 'igrejas'));
      const grupoId = novoGrupoDocRef.id;

      // Criar perfil do líder
      const liderUsuarioDocRef = doc(db, 'igrejas', grupoId, 'usuarios', liderUserId);

      batch.set(novoGrupoDocRef, {
        igrejaId: grupoId,
        nomeIgreja: nomeGrupo,
        liderPrincipalId: liderUserId,
        modoProAtivo: false,
        cadastradoEm: new Date(),
        logo: '',
      });

      batch.set(liderUsuarioDocRef, {
        aprovado: false,
        cadastradoEm: new Date(),
        email: email,
        foto: '',
        igrejaId: grupoId,
        isLider: true,
        isMinisterForCults: true,
        nome: nome,
        sobrenome: sobrenome,
        telefone: telefone,
      });

      await batch.commit();

      setSucesso('Cadastro realizado com sucesso! Agora finalize o pagamento para ativar sua conta.');

      Alert.alert(
        'Cadastro Concluído!',
        'Para ativar sua conta de líder e ter acesso total, por favor, realize o pagamento da assinatura. Você será redirecionado para os detalhes de pagamento.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Pagamento', { userId: liderUserId, igrejaId: grupoId })
          },
        ],
        { cancelable: false }
      );
      return true;
    } catch (error) {
      console.error('Erro ao cadastrar:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está em uso. Por favor, tente fazer login ou use outro e-mail.');
      } else if (error.code === 'auth/invalid-email') {
        setErro('O endereço de e-mail é inválido.');
      } else if (error.code === 'auth/weak-password') {
        setErro('A senha é muito fraca. Escolha uma senha mais forte.');
      } else {
        setErro(`Erro ao cadastrar: ${error.message}`);
      }
      return false;
    } finally {
      setIsCadastroLidering(false);
    }
  }, [nome, sobrenome, email, senha, telefone, nomeGrupo, navigation]);

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
    isCadastroLidering,
    nomeGrupo,
    setNomeGrupo,
    cadastrar,
  };
}; 