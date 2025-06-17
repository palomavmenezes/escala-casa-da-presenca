import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const passwordInputRef = useRef(null);

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuário autenticado no Firebase Auth:', user.email, 'UID:', user.uid);

      // --- Tentar encontrar o usuário na coleção 'lideres' primeiro ---
      const liderDocRef = doc(db, 'lideres', user.uid);
      const liderDocSnap = await getDoc(liderDocRef);

      if (liderDocSnap.exists()) {
        const liderData = liderDocSnap.data();
        console.log('Dados do líder encontrados:', liderData);

        if (liderData.aprovado && liderData.modoProAtivo) {
          console.log('Login bem-sucedido: Líder aprovado e com modo Pro Ativo!');
          navigation.navigate('Home');
        } else {
          await auth.signOut();
          console.log('Líder deslogado: Conta não ativada ou modo Pro inativo.');
          Alert.alert(
            'Acesso Negado',
            'Sua conta de líder não está ativa. Por favor, finalize o pagamento ou verifique o status da sua assinatura.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('PaymentInfoScreen', { userId: user.uid }) // Redirecionado para a tela de pagamento
              }
            ],
            { cancelable: false }
          );
        }
        return;
      }

      // --- Se não é líder, tentar encontrar o usuário na coleção 'ministros' ---
      const ministroDocRef = doc(db, 'ministros', user.uid);
      const ministroDocSnap = await getDoc(ministroDocRef);

      if (ministroDocSnap.exists()) {
        const ministroData = ministroDocSnap.data();
        console.log('Dados do ministro encontrados:', ministroData);

        if (ministroData.aprovado) {
          console.log('Login bem-sucedido: Ministro aprovado!');
          navigation.navigate('Home');
        } else {
          await auth.signOut();
          console.log('Ministro deslogado: Não aprovado pelo líder.');
          Alert.alert(
            'Acesso Negado',
            'Sua conta de ministro ainda não foi aprovada pelo seu líder. Por favor, aguarde a aprovação.',
            [{ text: 'OK' }],
            { cancelable: false }
          );
        }
      } else {
        await auth.signOut();
        console.log('Usuário deslogado: Documento no Firestore não encontrado em nenhuma coleção.');
        Alert.alert(
          'Erro de Dados',
          'Não foi possível encontrar seus dados de perfil. Por favor, entre em contato com o suporte para verificar seu cadastro.'
        );
      }

    } catch (firebaseError) {
      console.error('Erro de login:', firebaseError.code, firebaseError.message);
      if (firebaseError.code === 'auth/invalid-email') {
        setError('E-mail inválido. Por favor, verifique e tente novamente.');
      } else if (firebaseError.code === 'auth/user-disabled') {
        setError('Esta conta foi desativada.');
      } else if (
        firebaseError.code === 'auth/invalid-credential' ||
        firebaseError.code === 'auth/wrong-password' ||
        firebaseError.code === 'auth/user-not-found'
      ) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/img/logo-praise-scale.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Entrar</Text>

            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#888" style={styles.icon} />
              <TextInput
                placeholder="email@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#888" style={styles.icon} />
              <TextInput
                ref={passwordInputRef}
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

            <View style={styles.optionsRow}>
              <View style={styles.rememberMeContainer}>
                <Switch
                  onValueChange={setRememberMe}
                  value={rememberMe}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={rememberMe ? '#f5dd4b' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                />
                <Text style={styles.rememberMeText}>Lembrar</Text>
              </View>
              <TouchableOpacity onPress={() => console.log('Esqueceu a senha? (Navegar para tela de recuperação)')}>
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>ENTRAR</Text>
              <AntDesign name="arrowright" size={20} color="white" style={styles.loginButtonIcon} />
            </TouchableOpacity>

            {/* --- Seção de Cadastro Melhorada --- */}
            <View style={styles.registerOptionsContainer}>
              <Text style={styles.registerPromptText}>Não tem uma conta?</Text>
              <View style={styles.registerButtonsContainer}>
                <TouchableOpacity
                  style={[styles.registerButton, styles.leaderRegisterButton]}
                  onPress={() => navigation.navigate('Register')} // Mantém o nome 'Cadastro' para a tela de Líder
                >
                  <Text style={styles.registerButtonText}>Cadastrar como Líder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.registerButton, styles.memberRegisterButton]}
                  onPress={() => navigation.navigate('RegisterMinister')} // Nova tela para cadastro de Membros/Ministros
                >
                  <Text style={styles.registerButtonText}>Cadastrar como Membro</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* --- Fim da Seção de Cadastro Melhorada --- */}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
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
  eyeIcon: {
    paddingLeft: 10,
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#2e78b7',
    fontWeight: '600',
  },
  loginButton: {
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
    marginBottom: 40,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  loginButtonIcon: {
    marginLeft: 5,
  },
  // --- Novas Estilos para a Seção de Cadastro ---
  registerOptionsContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, // Espaço inferior para o rodapé
  },
  registerPromptText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  registerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 350, // Para controlar a largura dos botões
  },
  registerButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%', // Para que fiquem lado a lado com um pequeno espaço
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  leaderRegisterButton: {
    backgroundColor: '#33b85b', // Verde claro
  },
  memberRegisterButton: {
    backgroundColor: '#2e4a3f', // Verde escuro
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Fim das novas seções de estilo. O estilo 'footer' e seus filhos foram removidos
  // pois a nova estrutura do rodapé os substitui.
});