import React, { useState, useRef } from 'react';
import styles from './CadastroLider.styles';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, query, collection, where, writeBatch } from 'firebase/firestore';

export default function CadastroLider({ navigation }) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [musicoArea, setMusicoArea] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isAreaPickerVisible, setIsAreaPickerVisible] = useState(false);
  const [isCadastroLidering, setIsCadastroLidering] = useState(false);

  const [nomeIgreja, setNomeIgreja] = useState('');

  const sobrenomeInputRef = useRef(null);
  const nomeIgrejaInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const telefoneInputRef = useRef(null);
  const senhaInputRef = useRef(null);

  const musicianAreas = ['Cantor(a)', 'Tecladista', 'Guitarrista', 'Baixista', 'Baterista', 'Violão'];

  const selectMusicianArea = (area) => {
    setMusicoArea(area);
    setIsAreaPickerVisible(false);
    nomeIgrejaInputRef.current?.focus();
  };

  const cadastrar = async () => {
    setErro('');
    setSucesso('');
    setIsCadastroLidering(true);

    if (!nome || !sobrenome || !email || !senha || !musicoArea || !telefone || !nomeIgreja) {
      setErro('Por favor, preencha todos os campos obrigatórios (incluindo o nome da igreja).');
      setIsCadastroLidering(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      setIsCadastroLidering(false);
      return;
    }

    try {
      const igrejasRef = collection(db, 'igrejas');
      const qIgrejaExistente = query(igrejasRef, where('nomeIgreja', '==', nomeIgreja));
      const querySnapshotIgrejaExistente = await getDocs(qIgrejaExistente);

      if (!querySnapshotIgrejaExistente.empty) {
        setErro('Já existe uma igreja cadastrada com este nome. Por favor, verifique o nome ou entre em contato com o suporte.');
        setIsCadastroLidering(false);
        return;
      }

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
              onPress: () => navigation.replace('Pagamento', { userId: userIdExistente, igrejaId: querySnapshotEmailPendente.docs[0].data().igrejaId })
            },
          ],
          { cancelable: false }
        );
        setIsCadastroLidering(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      const liderUserId = user.uid;

      console.log('Usuário (Líder) criado no Authentication:', liderUserId);

      const batch = writeBatch(db);

      const novaIgrejaDocRef = doc(collection(db, 'igrejas'));
      const igrejaId = novaIgrejaDocRef.id;

      const liderUsuarioDocRef = doc(db, 'igrejas', igrejaId, 'usuarios', liderUserId);

      batch.set(novaIgrejaDocRef, {
        nomeIgreja: nomeIgreja,
        liderPrincipalId: liderUserId,
        modoProAtivo: false,
        cadastradoEm: new Date(),
      });

      batch.set(liderUsuarioDocRef, {
        foto: '',
        nome: nome,
        sobrenome: sobrenome,
        email: email,
        telefone: telefone,
        area: musicoArea,
        isMinisterForCults: true,
        isLider: true,
        aprovado: true,
        igrejaId: igrejaId,
        cadastradoEm: new Date(),
      });

      await batch.commit();

      console.log('Documento da Igreja e do Líder criados no Firestore. Igreja ID:', igrejaId);

      setSucesso('Cadastro realizado com sucesso! Agora finalize o pagamento para ativar sua conta.');

      Alert.alert(
        'Cadastro Concluído!',
        'Para ativar sua conta de líder e ter acesso total, por favor, realize o pagamento da assinatura. Você será redirecionado para os detalhes de pagamento.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Pagamento', { userId: liderUserId, igrejaId: igrejaId })
          },
        ],
        { cancelable: false }
      );

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
    } finally {
      setIsCadastroLidering(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#888" style={styles.icon} />
          <TextInput
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => sobrenomeInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#888" style={styles.icon} />
          <TextInput
            ref={sobrenomeInputRef}
            placeholder="Sobrenome"
            value={sobrenome}
            onChangeText={setSobrenome}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <TouchableOpacity onPress={() => setIsAreaPickerVisible(true)} style={styles.inputContainer}>
          <MaterialIcons name="audiotrack" size={20} color="#888" style={styles.icon} />
          <Text style={[styles.selectDisplayText, musicoArea ? { color: '#333' } : { color: '#888' }]}>
            {musicoArea || "Selecione sua área principal (ex: Tecladista)"}
          </Text>
          <AntDesign name="down" size={16} color="#888" style={styles.dropdownIcon} />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <MaterialIcons name="church" size={20} color="#888" style={styles.icon} />
          <TextInput
            ref={nomeIgrejaInputRef}
            placeholder="Nome da sua Igreja"
            value={nomeIgreja}
            onChangeText={setNomeIgreja}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#888" style={styles.icon} />
          <TextInput
            ref={emailInputRef}
            placeholder="email@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={() => telefoneInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="phone" size={20} color="#888" style={styles.icon} />
          <TextInput
            ref={telefoneInputRef}
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={() => senhaInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#888" style={styles.icon} />
          <TextInput
            ref={senhaInputRef}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!showPassword}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={cadastrar}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Ao se cadastrar, você estará se registrando como **Líder do Grupo de Louvor**. Para ativar sua conta e ter acesso completo ao aplicativo, será necessário realizar o pagamento de **R$9,99/mês** via Pix ou transferência.
          </Text>
        </View>

        <View style={styles.messageContainer}>
          {erro ? <Text style={styles.errorMessage}>{erro}</Text> : null}
          {sucesso ? <Text style={styles.successMessage}>{sucesso}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={cadastrar} disabled={isCadastroLidering}>
          {isCadastroLidering ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.buttonText}>CADASTRAR E CONTINUAR</Text>
              <AntDesign name="arrowright" size={20} color="white" style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerAttention}>Atenção:</Text>
          <Text style={styles.footerText}>Apenas líderes de grupos de louvor podem se cadastrar por aqui.</Text>
          <Text style={styles.footerText}>Ministros devem ser convidados e aprovados pelo seu líder.</Text>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isAreaPickerVisible}
        onRequestClose={() => setIsAreaPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsAreaPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione sua Área</Text>
            <FlatList
              data={musicianAreas}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => selectMusicianArea(item)}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsAreaPickerVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
