import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { auth, db } from '../services/firebase';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterMinisterScreen({ navigation }) {
  const [form, setForm] = useState({
    nome: '',
    sobrenome: '',
    area: 'Cantor(a)',
    telefone: '',
    email: '',
    senha: '',
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const areas = ['Cantor(a)', 'Tecladista', 'Guitarrista', 'Baixista', 'Baterista'];

  const handleChange = (field, value) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
  };

  const cadastrar = async () => {
    setErro('');

    const camposObrigatorios = ['nome', 'sobrenome', 'email', 'senha', 'telefone'];
    const camposVazios = camposObrigatorios.filter((campo) => !form[campo]);

    if (camposVazios.length > 0) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.senha);

      await setDoc(doc(db, 'ministros', userCredential.user.uid), {
        ...form,
        criadoEm: new Date(),
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
        value={form.nome}
        onChangeText={(value) => handleChange('nome', value)}
        style={styles.input}
        autoCapitalize="words"
      />
      <TextInput
        placeholder="Sobrenome"
        value={form.sobrenome}
        onChangeText={(value) => handleChange('sobrenome', value)}
        style={styles.input}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Área</Text>
      <Picker
        selectedValue={form.area}
        onValueChange={(value) => handleChange('area', value)}
        style={styles.picker}
      >
        {areas.map((a) => (
          <Picker.Item key={a} label={a} value={a} />
        ))}
      </Picker>

      <TextInput
        placeholder="Telefone"
        value={form.telefone}
        onChangeText={(value) => handleChange('telefone', value)}
        style={styles.input}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={(value) => handleChange('email', value)}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Senha"
        value={form.senha}
        onChangeText={(value) => handleChange('senha', value)}
        style={styles.input}
        secureTextEntry
      />

      {erro ? <Text style={styles.error}>{erro}</Text> : null}

      <Button
        title={loading ? 'Cadastrando...' : 'Cadastrar'}
        onPress={cadastrar}
        disabled={loading}
      />
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
