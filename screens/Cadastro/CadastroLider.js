import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCadastroLider } from '../../hooks/useCadastroLider';
import theme from '../../components/theme';
import styles from './CadastroLider.styles';

export default function CadastroLider({ navigation }) {
  const {
    nome,
    setNome,
    sobrenome,
    setSobrenome,
    nomeGrupo,
    setNomeGrupo,
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
    cadastrar,
  } = useCadastroLider(navigation);

  const sobrenomeInputRef = useRef(null);
  const nomeGrupoInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const telefoneInputRef = useRef(null);
  const senhaInputRef = useRef(null);

  // Redirecionar para Pagamento após sucesso
  const handleCadastrar = async () => {
    const ok = await cadastrar();
    if (ok) {
      navigation.replace('Pagamento');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8F9FB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40 }}>
        {/* Nome */}
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#B0B0B0" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            returnKeyType="next"
            onSubmitEditing={() => sobrenomeInputRef.current?.focus()}
            autoCapitalize="words"
          />
        </View>
        {/* Sobrenome */}
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color="#B0B0B0" style={styles.icon} />
          <TextInput
            ref={sobrenomeInputRef}
            style={styles.input}
            placeholder="Sobrenome"
            value={sobrenome}
            onChangeText={setSobrenome}
            returnKeyType="next"
            onSubmitEditing={() => nomeGrupoInputRef.current?.focus()}
            autoCapitalize="words"
          />
        </View>
        {/* Nome do grupo */}
        <View style={styles.inputContainer}>
          <Feather name="users" size={20} color="#B0B0B0" style={styles.icon} />
          <TextInput
            ref={nomeGrupoInputRef}
            style={styles.input}
            placeholder="Nome do grupo"
            value={nomeGrupo}
            onChangeText={setNomeGrupo}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            autoCapitalize="words"
          />
        </View>
        {/* Email */}
        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#B0B0B0" style={styles.icon} />
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder="email@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => telefoneInputRef.current?.focus()}
            autoCapitalize="none"
          />
        </View>
        {/* Telefone */}
        <View style={styles.inputContainer}>
          <Feather name="phone" size={20} color="#B0B0B0" style={styles.icon} />
          <TextInput
            ref={telefoneInputRef}
            style={styles.input}
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => senhaInputRef.current?.focus()}
          />
        </View>
        {/* Senha */}
        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color="#B0B0B0" style={styles.icon} />
          <TextInput
            ref={senhaInputRef}
            style={[styles.input, { paddingRight: 36 }]}
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleCadastrar}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={[styles.eyeIcon, { position: 'absolute', right: 16 }]}> 
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#B0B0B0" />
          </TouchableOpacity>
        </View>

        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}
        {sucesso ? <Text style={styles.successText}>{sucesso}</Text> : null}

        <TouchableOpacity
          style={styles.cadastrarButton}
          onPress={handleCadastrar}
          disabled={isCadastroLidering}
          activeOpacity={0.85}
        >
          {isCadastroLidering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.cadastrarButtonText}>CADASTRAR</Text>
              <Feather name="arrow-right" size={22} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Ao se cadastrar, você estará se registrando como <Text style={{ fontWeight: 'bold' }}>Líder do Grupo de Música</Text>. Para ativar sua conta e ter acesso completo ao aplicativo, será necessário realizar o pagamento de <Text style={{ fontWeight: 'bold', color: '#22C55E' }}>R$9,99/mês</Text> via Pix ou transferência.
        </Text>
        <Text style={styles.footerText}>
          <Text style={{ fontWeight: 'bold' }}>Atenção!</Text> Apenas líderes de grupos podem se cadastrar por aqui. Músicos devem realizar o cadastro como membro e aguardar a aprovação do líder do grupo.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
