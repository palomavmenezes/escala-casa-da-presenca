import React, { useState, useRef } from 'react';
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
import { doc, setDoc, getDocs, query, collection, where } from 'firebase/firestore';

export default function Cadastro({ navigation }) {
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
  const [isRegistering, setIsRegistering] = useState(false);

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
    setIsRegistering(true);

    if (!nome || !sobrenome || !email || !senha || !musicoArea || !telefone || !nomeIgreja) {
      setErro('Por favor, preencha todos os campos obrigatórios (incluindo o nome da igreja).');
      setIsRegistering(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      setIsRegistering(false);
      return;
    }

    try {
      const lideresRef = collection(db, 'lideres');

      // 1. Verificar se já existe um líder com este e-mail PENDENTE de aprovação
      const qExistente = query(lideresRef, where('email', '==', email), where('aprovado', '==', false));
      const querySnapshotExistente = await getDocs(qExistente);

      if (!querySnapshotExistente.empty) {
        // Encontrou um cadastro pendente com o mesmo e-mail
        const userIdExistente = querySnapshotExistente.docs[0].id;
        Alert.alert(
          'Cadastro Pendente!',
          'Já existe um cadastro para este e-mail aguardando a finalização do pagamento. Você será redirecionado para a página de informações de pagamento.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Pagamento', { userId: userIdExistente })
            },
          ],
          { cancelable: false }
        );
        setIsRegistering(false);
        return; // Sai da função para não prosseguir com novo cadastro
      }

      // 2. Verificar se já existe um líder cadastrado para esta igreja
      const qIgrejaExistente = query(lideresRef, where('nomeIgreja', '==', nomeIgreja));
      const querySnapshotIgrejaExistente = await getDocs(qIgrejaExistente);

      if (!querySnapshotIgrejaExistente.empty) {
        setErro('Já existe um líder cadastrado para esta igreja. Por favor, entre em contato com o suporte ou use outra igreja.');
        setIsRegistering(false);
        return;
      }

      // 3. Se não há cadastro pendente e o nome da igreja é único, cria um novo usuário
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      console.log('Usuário criado no Authentication:', user.uid);

      await setDoc(doc(db, 'lideres', user.uid), {
        nome: nome,
        sobrenome: sobrenome,
        email: email,
        telefone: telefone,
        area: musicoArea,
        nomeIgreja: nomeIgreja,
        isLider: true,
        aprovado: false, // Inicia como falso
        modoProAtivo: false, // Inicia como falso
        cadastradoEm: new Date(),
      });

      console.log('Documento de líder criado no Firestore para:', user.uid);

      setSucesso('Cadastro realizado com sucesso! Agora finalize o pagamento para ativar sua conta.');

      Alert.alert(
        'Cadastro Concluído!',
        'Para ativar sua conta de líder e ter acesso total, por favor, realize o pagamento da assinatura. Você será redirecionado para os detalhes de pagamento.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Pagamento', { userId: user.uid })
          },
        ],
        { cancelable: false }
      );

    } catch (error) {
      console.error('Erro ao cadastrar:', error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
        // Se o e-mail já está em uso NO FIREBASE AUTH (não no Firestore)
        // Isso significa que a conta Auth existe, mas pode não ter um doc no Firestore
        // ou o doc já está aprovado.
        // Você pode tentar fazer login para verificar o status ou apenas informar.
        setErro('Este e-mail já está em uso. Por favor, tente fazer login ou use outro e-mail.');
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

        <TouchableOpacity style={styles.button} onPress={cadastrar} disabled={isRegistering}>
          {isRegistering ? (
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
  infoContainer: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
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
  footerAttention: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 3,
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