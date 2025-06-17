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
  Switch,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomTab from '../../components/BottomTab';

export default function CriarEscalasScreen({ navigation }) {
  const [dataCulto, setDataCulto] = useState('');
  const [marcarEnsaio, setMarcarEnsaio] = useState(false);
  const [dataEnsaio, setDataEnsaio] = useState('');
  const [horaEnsaio, setHoraEnsaio] = useState('');
  const [showDatePickerCulto, setShowDatePickerCulto] = useState(false);
  const [showDatePickerEnsaio, setShowDatePickerEnsaio] = useState(false);
  const [showTimePickerEnsaio, setShowTimePickerEnsaio] = useState(false);

  const [ministros, setMinistros] = useState([]);
  const [ministrosEscalados, setMinistrosEscalados] = useState([]);
  const [modalMinistrosVisible, setModalMinistrosVisible] = useState(false);

  const [musicasDisponiveis, setMusicasDisponiveis] = useState([]);
  const [musicasSelecionadas, setMusicasSelecionadas] = useState([]);
  const [modalMusicasVisible, setModalMusicasVisible] = useState(false); // Novo modal para busca de músicas
  const [musicaSearchQuery, setMusicaSearchQuery] = useState(''); // Estado para o input de busca de músicas
  const [filteredMusicas, setFilteredMusicas] = useState([]); // Músicas filtradas pela busca
  const [currentMusicIndexForSingers, setCurrentMusicIndexForSingers] = useState(null); // Para saber qual música estamos editando os cantores
  const [modalCantoresMusicaVisible, setModalCantoresMusicaVisible] = useState(false); // Modal para selecionar cantores da música

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar ministros
        const ministrosSnap = await getDocs(collection(db, 'ministros'));
        const listaMinistros = ministrosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMinistros(listaMinistros);

        // Carregar músicas
        const musicasSnap = await getDocs(collection(db, 'musicas'));
        const listaMusicas = musicasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMusicasDisponiveis(listaMusicas);
        setFilteredMusicas(listaMusicas); // Inicializa as músicas filtradas
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados. Tente novamente mais tarde.');
      }
    };
    carregarDados();
  }, []);

  // Efeito para filtrar músicas quando a busca ou a lista de músicas disponíveis muda
  useEffect(() => {
    if (musicaSearchQuery) {
      const lowerCaseQuery = musicaSearchQuery.toLowerCase();
      const filtered = musicasDisponiveis.filter(musica =>
        musica.nome.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredMusicas(filtered);
    } else {
      setFilteredMusicas(musicasDisponiveis);
    }
  }, [musicaSearchQuery, musicasDisponiveis]);

  // --- Funções para Seleção de Data e Hora ---
  const onChangeCultoDate = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePickerCulto(false);
    setDataCulto(currentDate.toISOString().split('T')[0]); // Formato AAAA-MM-DD
  };

  const onChangeEnsaioDate = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePickerEnsaio(false);
    setDataEnsaio(currentDate.toISOString().split('T')[0]); // Formato AAAA-MM-DD
  };

  const onChangeEnsaioTime = (event, selectedTime) => {
    const currentTime = selectedTime || new Date();
    setShowTimePickerEnsaio(false);
    setHoraEnsaio(currentTime.toTimeString().split(' ')[0].substring(0, 5)); // Formato HH:MM
  };

  // --- Funções para Ministros ---
  const toggleMinistroEscalado = (id) => {
    setMinistrosEscalados(prev => {
      const isCurrentlyEscalado = prev.includes(id);
      if (isCurrentlyEscalado) {
        // Se o ministro for removido da escala geral, remove também de todas as músicas
        setMusicasSelecionadas(prevMusicas => {
          return prevMusicas.map(musica => ({
            ...musica,
            cantores: musica.cantores.filter(cantorId => cantorId !== id),
          }));
        });
        return prev.filter(mId => mId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getMinistroNomeById = (id) => {
    const ministro = ministros.find(m => m.id === id);
    return ministro ? ministro.nome : 'Ministro Desconhecido';
  };

  const getMinistroFotoById = (id) => {
    const ministro = ministros.find(m => m.id === id);
    return ministro ? ministro.fotoURL : null;
  };

  const getMinistroIniciaisById = (id) => {
    const ministro = ministros.find(m => m.id === id);
    if (!ministro || !ministro.nome) return '';
    return ministro.nome
      .split(' ')
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  };

  // --- Funções para Músicas ---
  const handleAdicionarMusica = (musicaId) => {
    const musicaJaAdicionada = musicasSelecionadas.some(m => m.musicaId === musicaId);
    if (musicaJaAdicionada) {
      Alert.alert('Atenção', 'Esta música já foi adicionada à escala.');
      return;
    }

    const musica = musicasDisponiveis.find(m => m.id === musicaId);
    if (musica) {
      setMusicasSelecionadas(prev => [
        ...prev,
        {
          musicaId: musica.id,
          musicaNome: musica.nome,
          cifra: musica.cifra,
          video: musica.video || '',
          cantores: [],
        },
      ]);
      setModalMusicasVisible(false); // Fecha o modal após adicionar
      setMusicaSearchQuery(''); // Limpa a busca
    }
  };

  const handleRemoverMusica = (index) => {
    Alert.alert(
      'Remover Música',
      'Tem certeza que deseja remover esta música da escala?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          onPress: () => {
            setMusicasSelecionadas(prev => prev.filter((_, i) => i !== index));
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleOpenCifra = (link) => {
    Linking.openURL(link).catch(err => console.error('Erro ao abrir link:', err));
  };

  const updateMusicaVideoLink = (index, text) => {
    const newMusicas = [...musicasSelecionadas];
    newMusicas[index].video = text;
    setMusicasSelecionadas(newMusicas);
  };

  // Função para extrair o ID do vídeo do YouTube e montar a URL de embed
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;

    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
    const match = url.match(regExp);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0`;
    }
    return null;
  };

  // Funções para cantores da música
  const openCantoresMusicaModal = (index) => {
    setCurrentMusicIndexForSingers(index);
    setModalCantoresMusicaVisible(true);
  };

  const toggleCantorMusica = (ministroId) => {
    if (currentMusicIndexForSingers !== null) {
      setMusicasSelecionadas(prevMusicas => {
        const newMusicas = [...prevMusicas];
        const cantoresDaMusica = newMusicas[currentMusicIndexForSingers].cantores;
        if (cantoresDaMusica.includes(ministroId)) {
          newMusicas[currentMusicIndexForSingers].cantores = cantoresDaMusica.filter(
            id => id !== ministroId
          );
        } else {
          newMusicas[currentMusicIndexForSingers].cantores = [...cantoresDaMusica, ministroId];
        }
        return newMusicas;
      });
    }
  };

  const getCantoresSelecionadosParaMusica = (index) => {
    return musicasSelecionadas[index]?.cantores || [];
  };

  const removerCantorDaMusica = (musicaIndex, cantorId) => {
    setMusicasSelecionadas(prevMusicas => {
      const newMusicas = [...prevMusicas];
      newMusicas[musicaIndex].cantores = newMusicas[musicaIndex].cantores.filter(
        id => id !== cantorId
      );
      return newMusicas;
    });
  };

  // --- Função para Criar Escala ---
  const criarEscala = async () => {
    if (!dataCulto) {
      Alert.alert('Erro', 'Por favor, selecione a data do culto.');
      return;
    }

    if (marcarEnsaio && (!dataEnsaio || !horaEnsaio)) {
      Alert.alert('Erro', 'Por favor, preencha a data e hora do ensaio.');
      return;
    }

    if (ministrosEscalados.length === 0) {
      Alert.alert('Erro', 'Por favor, escale ao menos um músico.');
      return;
    }

    if (musicasSelecionadas.length === 0) {
      Alert.alert('Erro', 'Por favor, adicione ao menos uma música.');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Erro', 'Você precisa estar logado para criar uma escala.');
        return;
      }

      await addDoc(collection(db, 'escalas'), {
        criadoEm: new Date(),
        criadoPor: currentUser.uid,
        dataCulto: dataCulto,
        ensaio: marcarEnsaio,
        dataEnsaio: marcarEnsaio ? dataEnsaio : null,
        horaEnsaio: marcarEnsaio ? horaEnsaio : null,
        musicas: musicasSelecionadas.map(m => ({
          cantores: m.cantores,
          cifra: m.cifra,
          musicaId: m.musicaId,
          musicaNome: m.musicaNome,
          video: m.video,
        })),
        usuariosEscalados: ministrosEscalados,
      });

      Alert.alert('Sucesso', 'Escala criada com sucesso!');
      setDataCulto('');
      setMarcarEnsaio(false);
      setDataEnsaio('');
      setHoraEnsaio('');
      setMinistrosEscalados([]);
      setMusicasSelecionadas([]);
      navigation.goBack?.();
    } catch (e) {
      console.error('Erro ao criar escala:', e);
      Alert.alert('Erro', 'Não foi possível criar a escala. Tente novamente.');
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Input de Data do Culto */}
        <TouchableOpacity onPress={() => setShowDatePickerCulto(true)}>
          <TextInput
            style={styles.input}
            placeholder="Data do culto: AAAA-MM-DD"
            value={dataCulto}
            editable={false}
          />
        </TouchableOpacity>
        {showDatePickerCulto && (
          <DateTimePicker
            testID="datePickerCulto"
            value={new Date()}
            mode="date"
            display="default"
            onChange={onChangeCultoDate}
          />
        )}

        {/* Marcar Ensaio + Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Marcar ensaio</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#6ACF9E' }}
            thumbColor={marcarEnsaio ? '#f4f3f4' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setMarcarEnsaio}
            value={marcarEnsaio}
          />
        </View>

        {/* Inputs de Data e Hora do Ensaio (condicional) */}
        {marcarEnsaio && (
          <View>
            <TouchableOpacity onPress={() => setShowDatePickerEnsaio(true)}>
              <TextInput
                style={styles.input}
                placeholder="Data do ensaio: AAAA-MM-DD"
                value={dataEnsaio}
                editable={false}
              />
            </TouchableOpacity>
            {showDatePickerEnsaio && (
              <DateTimePicker
                testID="datePickerEnsaio"
                value={new Date()}
                mode="date"
                display="default"
                onChange={onChangeEnsaioDate}
              />
            )}

            <TouchableOpacity onPress={() => setShowTimePickerEnsaio(true)}>
              <TextInput
                style={styles.input}
                placeholder="Hora do ensaio: HH:MM"
                value={horaEnsaio}
                editable={false}
              />
            </TouchableOpacity>
            {showTimePickerEnsaio && (
              <DateTimePicker
                testID="timePickerEnsaio"
                value={new Date()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onChangeEnsaioTime}
              />
            )}
          </View>
        )}

        {/* Título Músicos */}
        <Text style={styles.sectionTitle}>Músicos</Text>
        <View style={styles.cantoresContainer}>
          {ministrosEscalados.map(id => {
            const ministro = ministros.find(m => m.id === id);
            if (!ministro) return null;

            return (
              <View key={id} style={styles.cantorBox}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => toggleMinistroEscalado(id)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>

                {ministro.fotoURL ? (
                  <Image source={{ uri: ministro.fotoURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarSemFoto]}>
                    <Text style={styles.avatarIniciais}>
                      {ministro.nome
                        .split(' ')
                        .slice(0, 2)
                        .map(p => p[0].toUpperCase())
                        .join('')}
                    </Text>
                  </View>
                )}
                <Text style={styles.nomeCantor}>{ministro.nome}</Text>
                <Text style={styles.subtituloCantor}>{ministro.area}</Text>
              </View>
            );
          })}

          {/* Botão de adicionar músico */}
          <TouchableOpacity onPress={() => setModalMinistrosVisible(true)} style={styles.cantorBox}>
            <View style={[styles.avatar, styles.avatarAdd]}>
              <Text style={{ fontSize: 30, color: '#6ACF9E' }}>+</Text>
            </View>
            <Text style={styles.nomeCantor}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        {/* Título Louvores */}
        <Text style={styles.sectionTitle}>Louvores</Text>
        <TouchableOpacity
          style={styles.pickerInputSimulated}
          onPress={() => setModalMusicasVisible(true)}
        >
          <Text style={styles.pickerInputSimulatedText}>Selecione os louvores</Text>
        </TouchableOpacity>

        {/* Lista de Músicas Selecionadas */}
        {musicasSelecionadas.map((musica, index) => {
          const embedUrl = getYouTubeEmbedUrl(musica.video);
          return (
            <View key={index} style={styles.musicaCard}>
              <Text style={styles.musicaTitle}>{index + 1}. {musica.musicaNome}</Text>
              <TouchableOpacity onPress={() => handleOpenCifra(musica.cifra)}>
                <Text style={styles.musicaLink}>Cifra: {musica.cifra}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Link do vídeo (se já tiver cadastrado)"
                value={musica.video}
                onChangeText={(text) => updateMusicaVideoLink(index, text)}
              />
              {/* WebView para o vídeo do YouTube */}
              {embedUrl && (
                <View style={styles.videoContainer}>
                  <WebView
                    style={styles.videoPlayer}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    source={{ uri: embedUrl }}
                  />
                </View>
              )}
              <Text style={styles.musicaSubTitle}>Na voz de:</Text>
              <View style={styles.cantoresContainer}>
                {getCantoresSelecionadosParaMusica(index).map(cantorId => {
                  const cantor = ministros.find(m => m.id === cantorId);
                  if (!cantor) return null;
                  return (
                    <View key={cantorId} style={styles.cantorBox}>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removerCantorDaMusica(index, cantorId)}
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
                    </View>
                  );
                })}
                <TouchableOpacity onPress={() => openCantoresMusicaModal(index)} style={styles.cantorBox}>
                  <View style={[styles.avatar, styles.avatarAdd]}>
                    <Text style={{ fontSize: 30, color: '#6ACF9E' }}>+</Text>
                  </View>
                  <Text style={styles.nomeCantor}>Adicionar</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.removeMusicaButton}
                onPress={() => handleRemoverMusica(index)}
              >
                <Text style={styles.removeMusicaButtonText}>REMOVER MÚSICA</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Botão Criar Escala */}
        <TouchableOpacity style={styles.button} onPress={criarEscala}>
          <Text style={styles.buttonText}>CRIAR ESCALA</Text>
        </TouchableOpacity>

        {/* Modal para Adicionar Músicos (Geral) */}
        <Modal
          visible={modalMinistrosVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalMinistrosVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Músicos</Text>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {ministros.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => toggleMinistroEscalado(m.id)}
                    style={[
                      styles.modalItem,
                      ministrosEscalados.includes(m.id) && styles.modalItemSelected,
                    ]}
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
                    <Text style={{ marginLeft: 10 }}>{m.nome} ({m.area})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.button} onPress={() => setModalMinistrosVisible(false)}>
                <Text style={styles.buttonText}>FECHAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Novo Modal para Seleção de Músicas com Busca */}
        <Modal
          visible={modalMusicasVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setModalMusicasVisible(false);
            setMusicaSearchQuery(''); // Limpa a busca ao fechar
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Buscar e Selecionar Louvores</Text>
              <TextInput
                style={styles.input}
                placeholder="Buscar música por nome..."
                value={musicaSearchQuery}
                onChangeText={setMusicaSearchQuery}
              />
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {filteredMusicas.length > 0 ? (
                  filteredMusicas.map(musica => (
                    <TouchableOpacity
                      key={musica.id}
                      onPress={() => handleAdicionarMusica(musica.id)}
                      style={[
                        styles.modalItem,
                        musicasSelecionadas.some(m => m.musicaId === musica.id) && styles.modalItemSelected,
                      ]}
                      disabled={musicasSelecionadas.some(m => m.musicaId === musica.id)} // Desabilita se já selecionada
                    >
                      <Text style={{ marginLeft: 10, flex: 1 }}>{musica.nome}</Text>
                      {musicasSelecionadas.some(m => m.musicaId === musica.id) && (
                        <Text style={{ color: '#6ACF9E', fontWeight: 'bold' }}>ADICIONADA</Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noResultsText}>Nenhuma música encontrada ou disponível.</Text>
                )}
              </ScrollView>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setModalMusicasVisible(false);
                  setMusicaSearchQuery('');
                }}
              >
                <Text style={styles.buttonText}>FECHAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal para Adicionar Cantores para uma Música Específica */}
        <Modal
          visible={modalCantoresMusicaVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalCantoresMusicaVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Cantores para a Música</Text>
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {ministros
                  .filter(m => m.area === 'Cantor(a)' && ministrosEscalados.includes(m.id)) // Filtra por ministros que são 'Cantor(a)' e já estão escalados em 'Músicos'
                  .map(m => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => toggleCantorMusica(m.id)}
                    style={[
                      styles.modalItem,
                      getCantoresSelecionadosParaMusica(currentMusicIndexForSingers)?.includes(m.id) && styles.modalItemSelected,
                    ]}
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
                    <Text style={{ marginLeft: 10 }}>{m.nome} ({m.area})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.button} onPress={() => setModalCantoresMusicaVisible(false)}>
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
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
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  inputPickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    paddingVertical: 0,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  pickerItem: {
    fontSize: 16,
  },
  musicaCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
  },
  musicaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  musicaLink: {
    color: '#007bff',
    textDecorationLine: 'underline',
    marginBottom: 10,
    fontSize: 14,
  },
  musicaSubTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#555',
  },
  removeMusicaButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
  },
  removeMusicaButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  videoContainer: {
    height: 200,
    marginBottom: 10,
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  videoPlayer: {
    flex: 1,
  },
  pickerInputSimulated: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: 50,
  },
  pickerInputSimulatedText: {
    fontSize: 16,
    color: '#777',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});
