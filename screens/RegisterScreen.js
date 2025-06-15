import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { auth } from '../services/firebase'; // Verifique se o caminho está correto
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function Cadastro({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const cadastrar = async () => {
    setErro('');
    setSucesso('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      console.log('Usuário criado:', userCredential.user);
      setSucesso('Cadastro realizado com sucesso!');

      // Espera 2 segundos e redireciona para Login
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error) {
      setErro(error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ marginBottom: 10, borderWidth: 1, padding: 8 }}
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={{ marginBottom: 10, borderWidth: 1, padding: 8 }}
      />
      <Button title="Cadastrar" onPress={cadastrar} />
      {erro ? <Text style={{ color: 'red', marginTop: 10 }}>{erro}</Text> : null}
      {sucesso ? <Text style={{ color: 'green', marginTop: 10 }}>{sucesso}</Text> : null}
    </View>
  );
}
