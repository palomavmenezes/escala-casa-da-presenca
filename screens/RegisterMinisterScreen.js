import React, { useState } from 'react';
import { View, TextInput, Button, Text, Picker, StyleSheet, Alert, ScrollView } from 'react-native';
import { auth, db } from '../services/firebase'; // mudou firestore para db
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterMinisterScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [area, setArea] = useState('Cantor(a)');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const areas = ['Cantor(a)', 'Tecladista', 'Guitarrista', 'Baixista', 'Baterista'];

  const cadastrar = async () => {
    setErro('');
    if (!nome || !sobrenome || !email || !senha || !telefone) {
      setErro('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

      await setDoc(doc(db, 'ministros', userCredential.user.uid), {
        nome,
        sobrenome,
        area,
        telefone,
        email,
        criadoEm: new Date()
      });

      Alert.alert('Sucesso', 'Ministro cadastrado com sucesso!');
      navigation.goBack();
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cadastrar Novo Ministro</Text>

      <TextInput
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
        autoCapitalize="words"
      />
      <TextInput
        placeholder="Sobrenome"
        value={sobrenome}
        onChangeText={setSobrenome}
        style={styles.input}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Área</Text>
      <Picker
        selectedValue={area}
        onValueChange={setArea}
        style={styles.picker}
      >
        {areas.map((a) => (
          <Picker.Item key={a} label={a} value={a} />
        ))}
      </Picker>

      <TextInput
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
        style={styles.input}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        style={styles.input}
        secureTextEntry
      />

      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      <Button title={loading ? 'Cadastrando...' : 'Cadastrar'} onPress={cadastrar} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
  },
  picker: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});
