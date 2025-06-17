import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Button,
} from 'react-native';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import BottomTab from '../../components/BottomTab';

export default function AdicionarMusicasScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [cantorOriginal, setCantorOriginal] = useState('');
  const [cifra, setCifra] = useState('');
  const [video, setVideo] = useState('');
  const [tom, setTom] = useState('');
  const [cantores, setCantores] = useState([]);
  const [ministros, setMinistros] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const carregarMinistros = async () => {
      try {
        const snap = await getDocs(collection(db, 'ministros'));
        const lista = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.area === 'Cantor(a)');
        setMinistros(lista);
      } catch (error) {
        console.error('Erro ao buscar ministros:', error);
      }
    };
    carregarMinistros();
  }, []);

  const toggleCantor = (id) => {
    setCantores(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const salvarMusica = async () => {
    if (!nome.trim() || !cifra.trim()) {
      Alert.alert('Erro', 'Preencha ao menos o nome da música e a cifra.');
      return;
    }

    try {
      await addDoc(collection(db, 'musicas'), {
        nome: nome.trim(),
        cantorOriginal: cantorOriginal.trim(),
        cifra: cifra.trim(),
        video: video.trim(),
        tom: tom.trim(),
        cantores,
      });

      Alert.alert('Sucesso', 'Música cadastrada com sucesso!');
      setNome('');
      setCantorOriginal('');
      setCifra('');
      setVideo('');
      setTom('');
      setCantores([]);
      navigation.goBack?.();
    } catch (e) {
      console.error('Erro ao salvar música:', e);
      Alert.alert('Erro', 'Não foi possível salvar a música.');
    }
  };

  return (
    <>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Cadastrar Louvores</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome do louvor"
        value={nome}
        onChangeText={setNome} />
      <TextInput
        style={styles.input}
        placeholder="Nome do cantor original"
        value={cantorOriginal}
        onChangeText={setCantorOriginal} />
      <TextInput
        style={styles.input}
        placeholder="Link do cifraclub"
        value={cifra}
        onChangeText={setCifra} />
      <TextInput
        style={styles.input}
        placeholder="Link do vídeo (versão)"
        value={video}
        onChangeText={setVideo} />
      <TextInput
        style={styles.input}
        placeholder="Tom"
        value={tom}
        onChangeText={setTom} />

      <Text style={styles.sectionTitle}>Nas vozes de:</Text>
      <View style={styles.cantoresContainer}>
        {cantores.map(id => {
          const cantor = ministros.find(m => m.id === id);
          if (!cantor) return null;

          return (
            <View key={id} style={styles.cantorBox}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => toggleCantor(id)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>

              {cantor.fotoURL ? (
                <Image source={{ uri: cantor.fotoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarSemFoto]}>
                  <Text style={styles.avatarIniciais}>
                    {cantor.nome
                      .split(' ')
                      .slice(0, 2)
                      .map(p => p[0].toUpperCase())
                      .join('')}
                  </Text>
                </View>
              )}
              <Text style={styles.nomeCantor}>{cantor.nome}</Text>
              <Text style={styles.subtituloCantor}>Cantor(a)</Text>
            </View>
          );
        })}

        {/* Botão de adicionar cantor */}
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.cantorBox}>
          <View style={[styles.avatar, styles.avatarAdd]}>
            <Text style={{ fontSize: 30, color: '#6ACF9E' }}>+</Text>
          </View>
          <Text style={styles.nomeCantor}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={salvarMusica}>
        <Text style={styles.buttonText}>CADASTRAR</Text>
      </TouchableOpacity>

      {/* Modal para adicionar cantores */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Cantores</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {ministros
                .filter(m => !cantores.includes(m.id))
                .map(m => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      toggleCantor(m.id);
                      setModalVisible(false);
                    } }
                    style={styles.modalItem}
                  >
                    {m.fotoURL ? (
                      <Image source={{ uri: m.fotoURL }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarSemFoto]}>
                        <Text style={styles.avatarIniciais}>
                          {m.nome
                            .split(' ')
                            .slice(0, 2)
                            .map(p => p[0].toUpperCase())
                            .join('')}
                        </Text>
                      </View>
                    )}
                    <Text style={{ marginLeft: 10 }}>{m.nome}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Rodapé */}
    </ScrollView>
    <BottomTab navigation={navigation} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
  },
  cantoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  cantorBox: {
    alignItems: 'center',
    width: 80,
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DDF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSemFoto: {
    backgroundColor: '#DDF7EE',
  },
  avatarAdd: {
    backgroundColor: '#E9FBF4',
    borderWidth: 2,
    borderColor: '#6ACF9E',
  },
  avatarIniciais: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3A3A3A',
  },
  nomeCantor: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  subtituloCantor: {
    fontSize: 11,
    color: '#666',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#FF5C5C',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#6ACF9E',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
