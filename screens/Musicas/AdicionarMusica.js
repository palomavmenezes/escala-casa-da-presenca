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
  ActivityIndicator,
  Switch
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import BottomTab from '../../components/BottomTab';

export default function AdicionarMusica() {
  const navigation = useNavigation();
  const route = useRoute();

  const [nome, setNome] = useState('');
  const [cantorOriginal, setCantorOriginal] = useState('');
  const [cifra, setCifra] = useState('');
  const [cifraConteudo, setCifraConteudo] = useState('');
  const [video, setVideo] = useState('');
  const [tom, setTom] = useState('');
  const [cantores, setCantores] = useState([]);
  const [usuariosIgrejaDisponiveis, setUsuariosIgrejaDisponiveis] = useState([]);
  const [modalUsuariosVisible, setModalUsuariosVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [userChurchId, setUserChurchId] = useState(null);
  const [telaErro, setTelaErro] = useState('');

  // NEW: State for singer search query and filtered singers
  const [cantorSearchQuery, setCantorSearchQuery] = useState('');
  const [filteredCantores, setFilteredCantores] = useState([]);

  useEffect(() => {
    const fetchUserAndChurchData = async () => {
      setIsLoading(true);
      setTelaErro('');

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setTelaErro('Usuário não autenticado. Faça login para continuar.');
        setIsLoading(false);
        return;
      }

      try {
        let foundIgrejaId = null;
        const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));

        for (const docIgreja of igrejasSnapshot.docs) {
          const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
          const usuarioDocSnap = await getDoc(usuarioDocRef);

          if (usuarioDocSnap.exists()) {
            foundIgrejaId = docIgreja.id;
            break;
          }
        }

        if (!foundIgrejaId) {
          setTelaErro('Não foi possível encontrar a igreja associada ao seu usuário.');
          setIsLoading(false);
          return;
        }

        setUserChurchId(foundIgrejaId);

        const usuariosRef = collection(db, 'igrejas', foundIgrejaId, 'usuarios');
        const q = query(usuariosRef, where('aprovado', '==', true));
        const snapshot = await getDocs(q);

        const usuariosAtivos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUsuariosIgrejaDisponiveis(usuariosAtivos);
        setFilteredCantores(usuariosAtivos); // Initialize filtered list
      } catch (err) {
        console.error('Erro ao buscar dados de usuário e igreja:', err);
        setTelaErro('Erro ao carregar dados da sua igreja. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndChurchData();
  }, []);

  // NEW: Effect to filter singers when search query or available singers change
  useEffect(() => {
    if (cantorSearchQuery) {
      const lowerCaseQuery = cantorSearchQuery.toLowerCase();
      const filtered = usuariosIgrejaDisponiveis.filter(user =>
        user.nome.toLowerCase().includes(lowerCaseQuery) ||
        (user.sobrenome && user.sobrenome.toLowerCase().includes(lowerCaseQuery)) ||
        (user.area && user.area.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredCantores(filtered);
    } else {
      setFilteredCantores(usuariosIgrejaDisponiveis);
    }
  }, [cantorSearchQuery, usuariosIgrejaDisponiveis]);

  const toggleCantor = (id) => {
    setCantores(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const getUsuarioInfoById = (id) => {
    return usuariosIgrejaDisponiveis.find(u => u.id === id);
  };

  const salvarMusica = async () => {
    if (!nome.trim() || (!cifra.trim() && !cifraConteudo.trim())) {
      Alert.alert('Erro', 'Preencha ao menos o nome da música e o link ou conteúdo da cifra.');
      return;
    }

    if (!userChurchId) {
      Alert.alert('Erro', 'ID da igreja não disponível. Não foi possível salvar a música. Por favor, reinicie o aplicativo.');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Erro', 'Você precisa estar logado para cadastrar uma música.');
        return;
      }

      await addDoc(collection(db, 'igrejas', userChurchId, 'musicas'), {
        nome: nome.trim(),
        cantorOriginal: cantorOriginal.trim(),
        cifra: cifra.trim(),
        cifraConteudo: cifraConteudo.trim(),
        video: video.trim(),
        tom: tom.trim(),
        cantores: cantores,
        criadoEm: new Date(),
        criadoPor: currentUser.uid,
        igrejaId: userChurchId
      });

      Alert.alert('Sucesso', 'Música cadastrada com sucesso!');
      setNome('');
      setCantorOriginal('');
      setCifra('');
      setCifraConteudo('');
      setVideo('');
      setTom('');
      setCantores([]);
      navigation.goBack?.();
    } catch (e) {
      console.error('Erro ao salvar música:', e);
      Alert.alert('Erro', `Não foi possível salvar a música. ${e.message}. Verifique suas permissões.`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando usuários...</Text>
      </View>
    );
  }

  if (telaErro) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{telaErro}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Cadastrar Louvor</Text>

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
          placeholder="Link do cifraclub (opcional)"
          value={cifra}
          onChangeText={setCifra}
          keyboardType="url" />

        <TextInput
          style={[styles.input, styles.cifraConteudoInput]}
          placeholder="Cole ou digite a cifra/letra aqui..."
          value={cifraConteudo}
          onChangeText={setCifraConteudo}
          multiline={true}
          numberOfLines={8}
          textAlignVertical="top"
        />

        <TextInput
          style={styles.input}
          placeholder="Link do vídeo (versão YouTube)"
          value={video}
          onChangeText={setVideo}
          keyboardType="url" />
        <TextInput
          style={styles.input}
          placeholder="Tom da música"
          value={tom}
          onChangeText={setTom} />

        <Text style={styles.sectionTitle}>Nas vozes de:</Text>
        <View style={styles.cantoresContainer}>
          {cantores.map(id => {
            const cantor = getUsuarioInfoById(id);
            if (!cantor) return null;

            return (
              <View key={id} style={styles.cantorBox}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => toggleCantor(id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>

                {cantor.foto ? (
                  <Image source={{ uri: cantor.foto }} style={styles.avatar} />
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
                <Text style={styles.subtituloCantor}>{cantor.area}</Text>
              </View>
            );
          })}

          <TouchableOpacity onPress={() => setModalUsuariosVisible(true)} style={styles.cantorBox}>
            <View style={[styles.avatar, styles.avatarAdd]}>
              <Text style={{ fontSize: 30, color: '#6ACF9E' }}>+</Text>
            </View>
            <Text style={styles.nomeCantor}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={salvarMusica}>
          <Text style={styles.buttonText}>CADASTRAR LOUVOR</Text>
        </TouchableOpacity>

        <Modal
          visible={modalUsuariosVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setModalUsuariosVisible(false);
            setCantorSearchQuery(''); // Clear search on modal close
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Músicos</Text>
              {/* NEW: Search input in the modal */}
              <TextInput
                style={styles.input}
                placeholder="Buscar por nome ou área..."
                value={cantorSearchQuery}
                onChangeText={setCantorSearchQuery}
              />
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {filteredCantores.length === 0 ? ( // Use filteredCantores
                  <Text style={styles.noResultsText}>Nenhum usuário ativo encontrado.</Text>
                ) : (
                  filteredCantores // Use filteredCantores
                    .map(m => (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => {
                          toggleCantor(m.id);
                          setModalUsuariosVisible(false);
                        }}
                        style={[
                          styles.modalItem,
                          cantores.includes(m.id) && styles.modalItemSelected
                        ]}
                      >
                        {m.foto ? (
                          <Image source={{ uri: m.foto }} style={styles.avatar} />
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
                        <Text style={{ marginLeft: 10 }}>{m.nome} ({m.area})</Text>
                      </TouchableOpacity>
                    ))
                )}
              </ScrollView>
              <TouchableOpacity style={styles.button} onPress={() => {
                setModalUsuariosVisible(false);
                setCantorSearchQuery(''); // Clear search on close
              }}>
                <Text style={styles.buttonText}>FECHAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <BottomTab navigation={navigation} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#003D29',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F6FA',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  cifraConteudoInput: {
    height: 150,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  cantoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  cantorBox: {
    alignItems: 'center',
    width: 80,
    position: 'relative',
    padding: 5,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DDF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    fontWeight: '600',
    color: '#444',
  },
  subtituloCantor: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5C5C',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#6ACF9E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '75%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  modalItemSelected: {
    backgroundColor: '#e0ffe0',
    borderColor: '#6ACF9E',
    borderWidth: 1,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});