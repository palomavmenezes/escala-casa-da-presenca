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
  ActivityIndicator, // ADDED: Import ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomTab from '../../components/BottomTab';

export default function CriarEscalas({ navigation }) {
  const [dataCulto, setDataCulto] = useState('');
  const [marcarEnsaio, setMarcarEnsaio] = useState(false);
  const [dataEnsaio, setDataEnsaio] = useState('');
  const [horaEnsaio, setHoraEnsaio] = useState('');
  const [showDatePickerCulto, setShowDatePickerCulto] = useState(false);
  const [showDatePickerEnsaio, setShowDatePickerEnsaio] = useState(false);
  const [showTimePickerEnsaio, setShowTimePickerEnsaio] = useState(false);

  const [ministros, setMinistros] = useState([]); // All active users from the church
  const [ministrosEscalados, setMinistrosEscalados] = useState([]); // IDs of selected ministers for the scale
  const [modalMinistrosVisible, setModalMinistrosVisible] = useState(false);

  const [musicasDisponiveis, setMusicasDisponiveis] = useState([]);
  const [musicasSelecionadas, setMusicasSelecionadas] = useState([]);
  const [modalMusicasVisible, setModalMusicasVisible] = useState(false);
  const [musicaSearchQuery, setMusicaSearchQuery] = useState('');
  const [filteredMusicas, setFilteredMusicas] = useState([]);
  const [currentMusicIndexForSingers, setCurrentMusicIndexForSingers] = useState(null);
  const [modalCantoresMusicaVisible, setModalCantoresMusicaVisible] = useState(false);

  const [userChurchId, setUserChurchId] = useState(null);
  const [loading, setLoading] = useState(true); // ADDED: Loading state for data fetching
  const [telaErro, setTelaErro] = useState(''); // ADDED: State to display errors

  // ADDED: State for minister search query and filtered ministers in modal
  const [cantorSearchQuery, setCantorSearchQuery] = useState('');
  const [filteredMinistros, setFilteredMinistros] = useState([]);

  useEffect(() => {
    const carregarDadosDoUsuarioEIgreja = async () => {
      setLoading(true); // Set loading true at the start
      setTelaErro(''); // Clear any previous errors

      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        setTelaErro('Usuário não autenticado. Por favor, faça login.'); // Set error for display
        setLoading(false); // Stop loading
        navigation.navigate('Login'); // Redirect to login
        return;
      }

      try {
        let foundIgrejaId = null;

        // Try to find the user's church ID by querying all churches
        const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));

        for (const docIgreja of igrejasSnapshot.docs) {
          const usuarioDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);
          const usuarioDocSnap = await getDoc(usuarioDocRef);

          if (usuarioDocSnap.exists()) {
            foundIgrejaId = docIgreja.id; // Found the user's church
            break;
          }
        }

        if (!foundIgrejaId) {
          Alert.alert('Erro', 'Não foi possível encontrar a igreja associada ao seu usuário.');
          setTelaErro('Não foi possível encontrar a igreja associada ao seu usuário.');
          setLoading(false);
          // Talvez redirecionar para uma tela de configuração de igreja ou logout
          navigation.goBack();
          return;
        }

        setUserChurchId(foundIgrejaId);

        // Carregar ministros (usuários) aprovados da igreja específica
        const ministrosQuery = query(
          collection(db, 'igrejas', foundIgrejaId, 'usuarios'), // Use foundIgrejaId here
          where('aprovado', '==', true) // Filter only approved users
        );
        const ministrosSnap = await getDocs(ministrosQuery);
        const listaMinistros = ministrosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMinistros(listaMinistros);
        setFilteredMinistros(listaMinistros); // Initialize filtered list with all ministers

        // Carregar músicas da igreja específica
        const musicasQuery = collection(db, 'igrejas', foundIgrejaId, 'musicas'); // Use foundIgrejaId here
        const musicasSnap = await getDocs(musicasQuery);
        const listaMusicas = musicasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMusicasDisponiveis(listaMusicas);
        setFilteredMusicas(listaMusicas); // Initialize filtered list
      } catch (error) {
        console.error('Erro ao buscar dados do usuário ou da igreja:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados. Tente novamente mais tarde.');
        setTelaErro('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false); // Stop loading regardless of success or error
      }
    };
    carregarDadosDoUsuarioEIgreja();
  }, [navigation]); // Added navigation to dependency array as it's used inside

  // ADDED: Effect to filter ministers when search query or available ministers change
  useEffect(() => {
    if (cantorSearchQuery) {
      const lowerCaseQuery = cantorSearchQuery.toLowerCase();
      const filtered = ministros.filter(user =>
        user.nome.toLowerCase().includes(lowerCaseQuery) ||
        (user.sobrenome && user.sobrenome.toLowerCase().includes(lowerCaseQuery)) ||
        (user.area && user.area.toLowerCase().includes(lowerCaseQuery)) // Allow searching by area too
      );
      setFilteredMinistros(filtered);
    } else {
      setFilteredMinistros(ministros);
    }
  }, [cantorSearchQuery, ministros]);


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

  // Corrected to use 'foto' field as per your data structure
  const getMinistroFotoById = (id) => {
    const ministro = ministros.find(m => m.id === id);
    return ministro ? ministro.foto : null; // Changed from fotoURL to foto
  };

  // Corrected to include sobrenome in initials
  const getMinistroIniciaisById = (id) => {
    const ministro = ministros.find(m => m.id === id);
    if (!ministro || !ministro.nome) return '';
    const nomeCompleto = `${ministro.nome} ${ministro.sobrenome || ''}`.trim();
    return nomeCompleto
      .split(' ')
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  };

  // --- Funções para Músicas ---
  const handleAdicionarMusicas = (musicaId) => {
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
          tom: musica.tom || '', // Added 'tom' field for consistency if needed in scale music data
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
      if (!userChurchId) {
        Alert.alert('Erro', 'Não foi possível determinar a igreja do usuário.');
        return;
      }

      // Adicionar a escala dentro da subcollection 'escalas' da igreja
      await addDoc(collection(db, 'igrejas', userChurchId, 'escalas'), {
        criadoEm: new Date(),
        criadoPor: currentUser.uid,
        igrejaId: userChurchId, // Adiciona o ID da igreja à escala
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
          tom: m.tom || '', // Include tom in the saved scale music data
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

  // ADDED: Loading and Error UI
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando dados da igreja...</Text>
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

                {ministro.foto ? ( // Corrected from fotoURL to foto
                  <Image source={{ uri: ministro.foto }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarSemFoto]}>
                    <Text style={styles.avatarIniciais}>
                      {getMinistroIniciaisById(id)}
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
              {musica.cifra && (
                <TouchableOpacity onPress={() => handleOpenCifra(musica.cifra)}>
                  <Text style={styles.musicaLink}>Cifra: {musica.cifra}</Text>
                </TouchableOpacity>
              )}
              {musica.tom && ( // Display 'tom' if it exists
                <Text style={styles.musicaSubTitle}>Tom: {musica.tom}</Text>
              )}
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
                      {cantor.foto ? ( // Corrected from fotoURL to foto
                        <Image source={{ uri: cantor.foto }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarSemFoto]}>
                          <Text style={styles.avatarIniciais}>
                            {getMinistroIniciaisById(cantorId)}
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
          onRequestClose={() => {
            setModalMinistrosVisible(false);
            setCantorSearchQuery(''); // Clear search on modal close
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Músicos</Text>
              {/* ADDED: Search input in the modal */}
              <TextInput
                style={styles.input}
                placeholder="Buscar por nome ou área..."
                value={cantorSearchQuery}
                onChangeText={setCantorSearchQuery}
              />
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {filteredMinistros.length === 0 ? ( // Using filteredMinistros
                  <Text style={styles.noResultsText}>Nenhum usuário ativo disponível na sua igreja.</Text>
                ) : (
                  // REMOVED: .filter(m => m.area === 'Cantor(a)')
                  filteredMinistros.map(m => ( // Using filteredMinistros
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => toggleMinistroEscalado(m.id)}
                      style={[
                        styles.modalItem,
                        ministrosEscalados.includes(m.id) && styles.modalItemSelected,
                      ]}
                    >
                      {m.foto ? ( // Corrected from fotoURL to foto
                        <Image source={{ uri: m.foto }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarSemFoto]}>
                          <Text style={styles.avatarIniciais}>
                            {getMinistroIniciaisById(m.id)}
                          </Text>
                        </View>
                      )}
                      <Text style={{ marginLeft: 10 }}>{m.nome} ({m.area})</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={styles.button} onPress={() => {
                setModalMinistrosVisible(false);
                setCantorSearchQuery(''); // Clear search on close
              }}>
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
                      onPress={() => handleAdicionarMusicas(musica.id)}
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
          onRequestClose={() => {
            setModalCantoresMusicaVisible(false);
            setCantorSearchQuery(''); // Clear search on modal close
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Cantores para a Música</Text>
              {/* ADDED: Search input in the modal */}
              <TextInput
                style={styles.input}
                placeholder="Buscar por nome ou área..."
                value={cantorSearchQuery}
                onChangeText={setCantorSearchQuery}
              />
              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {ministros.length === 0 ? ( // Added check for empty list
                  <Text style={styles.noResultsText}>Nenhum usuário ativo disponível na sua igreja.</Text>
                ) : (
                  // REMOVED: .filter(m => m.area === 'Cantor(a)' && ministrosEscalados.includes(m.id))
                  // Now only filters by search query among the initially loaded ministers
                  filteredMinistros.map(m => ( // Using filteredMinistros
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => toggleCantorMusica(m.id)}
                      style={[
                        styles.modalItem,
                        getCantoresSelecionadosParaMusica(currentMusicIndexForSingers)?.includes(m.id) && styles.modalItemSelected,
                      ]}
                    >
                      {m.foto ? ( // Corrected from fotoURL to foto
                        <Image source={{ uri: m.foto }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarSemFoto]}>
                          <Text style={styles.avatarIniciais}>
                            {getMinistroIniciaisById(m.id)}
                          </Text>
                        </View>
                      )}
                      <Text style={{ marginLeft: 10 }}>{m.nome} ({m.area})</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={styles.button} onPress={() => {
                setModalCantoresMusicaVisible(false);
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
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  loadingContainer: { // ADDED: Styles for loading
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  loadingText: { // ADDED: Styles for loading text
    marginTop: 10,
    fontSize: 16,
    color: '#003D29',
  },
  errorContainer: { // ADDED: Styles for error container
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F6FA',
  },
  errorText: { // ADDED: Styles for error text
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
  button: { // Re-added button styles from previous context for the error screen
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
  buttonText: { // Re-added buttonText styles
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
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