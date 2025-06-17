import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Cadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [musicoArea, setMusicoArea] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ministro, setministro] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isAreaPickerVisible, setIsAreaPickerVisible] = useState(false);

  const sobrenomeInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const telefoneInputRef = useRef(null);
  const senhaInputRef = useRef(null);

  const musicianAreas = ['Cantor(a)', 'Tecladista', 'Guitarrista', 'Baixista', 'Baterista', 'Violão'];

  const selectMusicianArea = (area) => {
    setMusicoArea(area);
    setIsAreaPickerVisible(false);
    emailInputRef.current?.focus();
  };

  const cadastrar = async () => {
    setErro('');
    setSucesso('');

    if (!nome || !sobrenome || !email || !senha || !musicoArea || !telefone) {
      setErro('Por favor, preencha todos os campos obrigatórios e selecione a área do músico.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      console.log('Usuário criado no Authentication:', user.uid);

      await setDoc(doc(db, 'ministros', user.uid), {
        nome: nome,
        sobrenome: sobrenome,
        email: email,
        telefone: telefone,
        area: musicoArea,
        ministro: ministro,
        aprovado: false,
        createdAt: new Date(),
      });

      console.log('Informações do ministro salvas no Firestore para UID:', user.uid);
      setSucesso('Cadastro realizado com sucesso! Aguarde a aprovação do líder.');

      Alert.alert(
        'Cadastro Enviado!',
        'Seu cadastro foi enviado com sucesso e está aguardando aprovação do líder.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
        { cancelable: false }
      );

    } catch (error) {
      console.error('Erro ao cadastrar:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está em uso. Por favor, use outro.');
      } else if (error.code === 'auth/invalid-email') {
        setErro('O endereço de e-mail é inválido.');
      } else if (error.code === 'auth/weak-password') {
        setErro('A senha é muito fraca. Escolha uma senha mais forte.');
      } else {
        setErro(`Erro ao cadastrar: ${error.message}`);
      }
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
            // No Picker/Modal customizado, a navegação de foco é manual após a seleção
          />
        </View>

        {/* Musician Area Selection - Using TouchableOpacity to open the Modal */}
        <TouchableOpacity onPress={() => setIsAreaPickerVisible(true)} style={styles.inputContainer}>
          <MaterialIcons name="audiotrack" size={20} color="#888" style={styles.icon} />
          <Text style={[styles.selectDisplayText, musicoArea ? { color: '#333' } : { color: '#888' }]}>
            {musicoArea || "Selecione a área do músico"}
          </Text>
          <AntDesign name="down" size={16} color="#888" style={styles.dropdownIcon} />
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
          <Text style={styles.switchText}>Ministro será responsável por cultos?</Text>
          <Switch
            onValueChange={setministro}
            value={ministro}
            trackColor={{ false: '#767577', true: '#86f0a6' }}
            thumbColor={ministro ? '#33b85b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>

        {/* Error and Success Messages container */}
        <View style={styles.messageContainer}>
          {erro ? <Text style={styles.errorMessage}>{erro}</Text> : null}
          {sucesso ? <Text style={styles.successMessage}>{sucesso}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={cadastrar}>
          <Text style={styles.buttonText}>CADASTRAR</Text>
          <AntDesign name="arrowright" size={20} color="white" style={styles.buttonIcon} />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <Text style={styles.footerSubText}>Fale com o líder do louvor da sua igreja.</Text>
        </View>
      </ScrollView>

      {/* Musician Area Selection Modal - KEPT as requested */}
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
            <Text style={styles.modalTitle}>Selecione a Área do Músico</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30, 
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    paddingRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectDisplayText: { 
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 17 : 0,
  },
  dropdownIcon: {
    marginLeft: 'auto',
  },
  eyeIcon: {
    paddingLeft: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchText: {
    fontSize: 16,
    color: '#333',
  },
  messageContainer: {
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#2e4a3f',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 5,
    fontSize: 14,
  },
  successMessage: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 5,
    fontSize: 14,
  },
  footer: {
    marginBottom: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  footerSubText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
});