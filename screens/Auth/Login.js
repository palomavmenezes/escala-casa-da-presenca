import React, { useState, useRef } from 'react';
import styles from './Login.styles';
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
  ActivityIndicator
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, getDocs, query, collectionGroup, where } from 'firebase/firestore';
import Button from '../../components/ui/Button';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordInputRef = useRef(null);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const usuariosRef = collectionGroup(db, 'usuarios');
      const q = query(usuariosRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await auth.signOut();
        Alert.alert(
          'Erro de Perfil',
          'Não foi possível encontrar seus dados de perfil. Por favor, entre em contato com o suporte para verificar seu cadastro.'
        );
        setIsLoading(false);
        return;
      }

      const userDocSnap = querySnapshot.docs[0];
      const userData = userDocSnap.data();
      const igrejaIdDoUsuario = userData.igrejaId;

      let igrejaData = null;
      if (igrejaIdDoUsuario) {
        const igrejaDocRef = doc(db, 'igrejas', igrejaIdDoUsuario);
        const igrejaDocSnap = await getDoc(igrejaDocRef);
        if (igrejaDocSnap.exists()) {
          igrejaData = igrejaDocSnap.data();
        } else {
          await auth.signOut();
          Alert.alert(
            'Erro de Igreja',
            'Sua igreja não foi encontrada. Por favor, entre em contato com o suporte.'
          );
          setIsLoading(false);
          return;
        }
      } else {
        await auth.signOut();
        Alert.alert(
          'Erro de Perfil',
          'Seu perfil não está vinculado a uma igreja. Por favor, entre em contato com o suporte.'
        );
        setIsLoading(false);
        return;
      }

      // Lógica de autenticação centralizada
      const isAprovado = userData.aprovado === true;
      const isLider = userData.isLider === true;
      const modoProAtivoDaIgreja = igrejaData.modoProAtivo === true;

      let autenticacaoPermitida = false;
      let mensagemNegacao = '';
      let telaRedirecionamentoAposNegacao = null;

      if (isLider) {
        if (isAprovado && modoProAtivoDaIgreja) {
          autenticacaoPermitida = true;
        } else {
          mensagemNegacao = 'Sua conta de líder não está ativa ou o modo Pro da sua igreja está inativo. Por favor, verifique o status da sua assinatura.';
          if (modoProAtivoDaIgreja === false) {
             telaRedirecionamentoAposNegacao = 'Pagamento';
          }
        }
      } else {
        if (isAprovado) {
          autenticacaoPermitida = true;
        } else {
          mensagemNegacao = 'Sua conta ainda não foi aprovada pelo líder da sua igreja. Por favor, aguarde a aprovação.';
        }
      }

      if (autenticacaoPermitida) {
        // Pequeno delay para permitir que o UserContext carregue os dados
        setTimeout(() => {
          navigation.navigate('Home', { userId: user.uid, igrejaId: igrejaIdDoUsuario, isLider: isLider });
        }, 300);
      } else {
        await auth.signOut();
        Alert.alert(
          'Acesso Negado',
          mensagemNegacao,
          telaRedirecionamentoAposNegacao ?
            [{ text: 'OK', onPress: () => navigation.replace(telaRedirecionamentoAposNegacao, { userId: user.uid, igrejaId: igrejaIdDoUsuario }) }]
            : [{ text: 'OK' }],
          { cancelable: false }
        );
      }

    } catch (firebaseError) {
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
    } finally {
      setIsLoading(false);
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
                source={require('../../assets/img/logo-praise-scale.png')}
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

            <Button 
              title="ENTRAR"
              onPress={handleLogin} 
              disabled={isLoading}
              loading={isLoading}
              style={{ marginBottom: 40 }}
              iconRight={!isLoading ? "arrow-forward" : null}
            />

            <View style={styles.registerOptionsContainer}>
              <Text style={styles.registerPromptText}>Não tem uma conta?</Text>
              <View style={styles.registerButtonsContainer}>
                <TouchableOpacity
                  style={[styles.registerButton, styles.leaderCadastroLiderButton]}
                  onPress={() => navigation.navigate('CadastroLider')}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.registerButtonText}>Cadastrar como Líder</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.registerButton, styles.memberCadastroLiderButton]}
                  onPress={() => navigation.navigate('CadastroMembro')}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.registerButtonText}>Cadastrar como Membro</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}