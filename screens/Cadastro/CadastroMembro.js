import React, { useState, useRef, useEffect } from 'react';
import styles from './CadastroMembro.styles';
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
  ActivityIndicator,
  Switch
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, query, collection, where, writeBatch, getDoc } from 'firebase/firestore';

export default function CadastroMembro({ navigation }) {
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
  const [isChurchPickerVisible, setIsChurchPickerVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingChurches, setIsLoadingChurches] = useState(true);

  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);

  const [isMinisterForCults, setIsMinisterForCults] = useState(false);

  const sobrenomeInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const telefoneInputRef = useRef(null);
  const senhaInputRef = useRef(null);

  const musicianAreas = ['Cantor(a)', 'Tecladista', 'Guitarrista', 'Baixista', 'Baterista', 'Violão'];

  useEffect(() => {
    const fetchChurches = async () => {
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
    };
    fetchChurches();
  }, []); // Sem dependências de route.params aqui

  const selectMusicianArea = (area) => {
    setMusicoArea(area);
    setIsAreaPickerVisible(false);
    emailInputRef.current?.focus();
  };

  const selectChurch = (church) => {
    setSelectedChurch(church);
    setIsChurchPickerVisible(false);
    emailInputRef.current?.focus();
  };

  const cadastrar = async () => {
    setErro('');
    setSucesso('');
    setIsRegistering(true);

    if (!nome || !sobrenome || !email || !senha || !musicoArea || !telefone || !selectedChurch) {
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
      const usuariosRef = collection(db, 'usuarios'); // collectionGroup
      const qEmailPendente = query(usuariosRef,
                                   where('email', '==', email),
                                   where('aprovado', '==', false));
      const querySnapshotEmailPendente = await getDocs(qEmailPendente);

      if (!querySnapshotEmailPendente.empty) {
        // Se um cadastro pendente for encontrado, pegamos o ID do documento (que é o userId)
        const userIdExistente = querySnapshotEmailPendente.docs[0].id;
        const igrejaIdExistente = querySnapshotEmailPendente.docs[0].data().igrejaId; // Pega o igrejaId do documento de usuário
        
        Alert.alert(
          'Cadastro Pendente!',
          'Já existe um cadastro para este e-mail aguardando aprovação em outra igreja ou está pendente. Por favor, aguarde a aprovação ou entre em contato com seu líder/suporte.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Pagamento', { userId: userIdExistente, igrejaId: igrejaIdExistente })
            },
          ],
          { cancelable: false }
        );
        setIsRegistering(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      const memberUserId = user.uid; // Este é o UID do novo usuário, que será o ID do seu documento de perfil

      console.log('Usuário (Membro) criado no Authentication:', memberUserId);

      const batch = writeBatch(db);
      // O documento do usuário na subcoleção terá o UID do usuário como seu ID
      const memberUsuarioDocRef = doc(db, 'igrejas', selectedChurch.id, 'usuarios', memberUserId);

      batch.set(memberUsuarioDocRef, {
        userId: memberUserId,
        nome: nome,
        sobrenome: sobrenome,
        email: email,
        telefone: telefone,
        area: musicoArea,
        isLider: false,
        aprovado: false,
        igrejaId: selectedChurch.id,
        isMinisterForCults: isMinisterForCults,
        cadastradoEm: new Date(),
      });

      await batch.commit();

      console.log('Documento de Membro criado no Firestore para:', memberUserId, 'na Igreja:', selectedChurch.nomeIgreja);

      setSucesso('Cadastro realizado com sucesso! Aguarde a aprovação do líder da sua igreja.');

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
        <Text style={styles.headerTitle}>Cadastro de Membro</Text>

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
            {musicoArea || "Selecione sua área principal (ex: Cantor(a))"}
          </Text>
          <AntDesign name="down" size={16} color="#888" style={styles.dropdownIcon} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsChurchPickerVisible(true)} style={styles.inputContainer}>
          <MaterialIcons name="church" size={20} color="#888" style={styles.icon} />
          <Text style={[styles.selectDisplayText, selectedChurch ? { color: '#333' } : { color: '#888' }]}>
            {selectedChurch ? selectedChurch.nomeIgreja : (isLoadingChurches ? 'Carregando igrejas...' : 'Selecione sua Igreja')}
          </Text>
          {isLoadingChurches ? (
            <ActivityIndicator size="small" color="#888" style={styles.dropdownIcon} />
          ) : (
            <AntDesign name="down" size={16} color="#888" style={styles.dropdownIcon} />
          )}
        </TouchableOpacity>

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

        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>Será responsável por cultos (Ministro)?</Text>
          <Switch
            onValueChange={setIsMinisterForCults}
            value={isMinisterForCults}
            trackColor={{ false: '#767577', true: '#86f0a6' }}
            thumbColor={isMinisterForCults ? '#33b85b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>

        <View style={styles.messageContainer}>
          {erro ? <Text style={styles.errorMessage}>{erro}</Text> : null}
          {sucesso ? <Text style={styles.successMessage}>{sucesso}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={cadastrar} disabled={isRegistering}>
          {isRegistering ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.buttonText}>CADASTRAR</Text>
              <AntDesign name="arrowright" size={20} color="white" style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerAttention}>Atenção:</Text>
          <Text style={styles.footerText}>Seu cadastro de membro precisa ser aprovado pelo líder da sua igreja.</Text>
        </View>
      </ScrollView>

      {/* Musician Area Selection Modal */}
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

      {/* Church Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isChurchPickerVisible}
        onRequestClose={() => setIsChurchPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsChurchPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione sua Igreja</Text>
            {isLoadingChurches ? (
              <ActivityIndicator size="large" color="#2e4a3f" style={{ paddingVertical: 20 }} />
            ) : churches.length === 0 ? (
              <Text style={styles.noChurchesText}>Nenhuma igreja encontrada. Verifique sua conexão ou tente mais tarde.</Text>
            ) : (
              <FlatList
                data={churches}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => selectChurch(item)}
                  >
                    <Text style={styles.modalOptionText}>{item.nomeIgreja}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsChurchPickerVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}