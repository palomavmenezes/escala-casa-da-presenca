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
  ActivityIndicator, // Adicionado para estado de carregamento
} from 'react-native';
import { WebView } from 'react-native-webview';
import { db, auth } from '../../services/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  updateDoc, // Importado para atualizar documentos
  deleteDoc, // Importado para deletar documentos
} from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomTab from '../../components/layout/BottomTab';
import { useRoute } from '@react-navigation/native'; // Importado para obter parâmetros de rota
import Ionicons from 'react-native-vector-icons/Ionicons';
import MusicianList from '../../components/domain/MusicianList';
import SectionTitle from '../../components/ui/SectionTitle';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import theme from '../../components/theme';
import MusicianGrid from '../../components/domain/MusicianGrid';
import SelectMusicianModal from '../../components/domain/SelectMusicianModal';
import SelectAreaModal from '../../components/domain/SelectAreaModal';
import SelectMusicModal from '../../components/domain/SelectMusicModal';
import SelectSingerModal from '../../components/domain/SelectSingerModal';

export default function EditarEscalas({ navigation }) {
  const route = useRoute();
  const { escala } = route.params; // Obtém o objeto da escala a ser editada

  const [dataCulto, setDataCulto] = useState('');
  const [marcarEnsaio, setMarcarEnsaio] = useState(false);
  const [dataEnsaio, setDataEnsaio] = useState('');
  const [horaEnsaio, setHoraEnsaio] = useState('');
  const [showDatePickerCulto, setShowDatePickerCulto] = useState(false);
  const [showDatePickerEnsaio, setShowDatePickerEnsaio] = useState(false);
  const [showTimePickerEnsaio, setShowTimePickerEnsaio] = useState(false);

  const [ministros, setMinistros] = useState([]); // Todos os usuários/ministros da igreja
  const [ministrosEscalados, setMinistrosEscalados] = useState([]); // IDs dos ministros selecionados para a escala
  const [modalMinistrosVisible, setModalMinistrosVisible] = useState(false);

  const [musicasDisponiveis, setMusicasDisponiveis] = useState([]); // Todas as músicas da igreja
  const [musicasSelecionadas, setMusicasSelecionadas] = useState([]); // Músicas selecionadas para a escala
  const [modalMusicasVisible, setModalMusicasVisible] = useState(false);
  const [musicaSearchQuery, setMusicaSearchQuery] = useState('');
  const [filteredMusicas, setFilteredMusicas] = useState([]);
  const [currentMusicIndexForSingers, setCurrentMusicIndexForSingers] = useState(null);
  const [modalCantoresMusicaVisible, setModalCantoresMusicaVisible] = useState(false);

  const [userChurchId, setUserChurchId] = useState(null); // ID da igreja do usuário
  const [loading, setLoading] = useState(true); // Estado de carregamento para busca de dados
  const [telaErro, setTelaErro] = useState(''); // Estado para exibir erros

  const [currentMinistroBeingEdited, setCurrentMinistroBeingEdited] = useState(null);
  const [ministroRolesSelected, setMinistroRolesSelected] = useState([]);
  const [modalMinistroRolesVisible, setModalMinistroRolesVisible] = useState(false);

  const areaOptions = ['Voz', 'Backing Vocal', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Apoio Técnico'];

  // Efeito para carregar os dados iniciais da escala e dados específicos da igreja (ministros, músicas)
  useEffect(() => {
    const carregarDadosDaEscalaEComuns = async () => {
      setLoading(true);
      setTelaErro('');

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setTelaErro('Usuário não autenticado. Faça login para editar escalas.');
        setLoading(false);
        navigation.navigate('Login');
        return;
      }

      // Verifica se a escala e seus IDs essenciais estão presentes
      if (!escala || !escala.id || !escala.igrejaId) {
        setTelaErro('Dados da escala para edição estão incompletos ou ausentes.');
        setLoading(false);
        return;
      }

      // Define os estados iniciais com os dados da escala passada
      setDataCulto(escala.dataCulto || '');
      setMarcarEnsaio(escala.ensaio || false);
      setDataEnsaio(escala.dataEnsaio || '');
      setHoraEnsaio(escala.horaEnsaio || '');
      setMinistrosEscalados(escala.usuariosEscalados || []);
      // Mapeia as músicas existentes para o formato de estado, garantindo que 'cantores' sejam IDs
      setMusicasSelecionadas(escala.musicas?.map(m => ({
        musicaId: m.musicaId,
        musicaNome: m.musicaNome,
        cifra: m.cifra,
        video: m.video || '',
        tom: m.tom || '', // Inclui 'tom' se estiver disponível no documento original da música
        cantores: m.cantores || [], // Garante que cantores são IDs
      })) || []);

      try {
        const igrejaId = escala.igrejaId; // Usa o igrejaId da própria escala
        setUserChurchId(igrejaId);

        // Carrega todos os usuários (ministros) aprovados da igreja específica
        const ministrosQuery = query(
          collection(db, 'igrejas', igrejaId, 'usuarios'),
          where('aprovado', '==', true)
        );
        const ministrosSnap = await getDocs(ministrosQuery);
        const listaMinistros = ministrosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMinistros(listaMinistros);

        // Carrega todas as músicas da igreja específica
        const musicasQuery = collection(db, 'igrejas', igrejaId, 'musicas');
        const musicasSnap = await getDocs(musicasQuery);
        const listaMusicas = musicasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMusicasDisponiveis(listaMusicas);
        setFilteredMusicas(listaMusicas); // Inicializa a lista filtrada
      } catch (error) {
        console.error('Erro ao buscar dados para edição da escala:', error);
        setTelaErro('Não foi possível carregar os dados para edição. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    carregarDadosDaEscalaEComuns();
  }, [escala, navigation]); // Adiciona 'escala' e 'navigation' como dependências

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

  // --- Funções para Seleção de Data e Hora (Mantidas do CriarEscalas) ---
  const onChangeCultoDate = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePickerCulto(false);
    setDataCulto(currentDate.toISOString().split('T')[0]);
  };

  const onChangeEnsaioDate = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePickerEnsaio(false);
    setDataEnsaio(currentDate.toISOString().split('T')[0]);
  };

  const onChangeEnsaioTime = (event, selectedTime) => {
    const currentTime = selectedTime || new Date();
    setShowTimePickerEnsaio(false);
    setHoraEnsaio(currentTime.toTimeString().split(' ')[0].substring(0, 5));
  };

  // --- Funções para Ministros (Mantidas) ---
  const handleAdicionarMinistro = (ministro) => {
    setCurrentMinistroBeingEdited(ministro.id);
    setMinistroRolesSelected([]); // Começa sem áreas selecionadas
    setModalMinistroRolesVisible(true);
  };

  const saveMinistroRoles = () => {
    setMinistrosEscalados(prev => {
      const exists = prev.some(m => m.userId === currentMinistroBeingEdited);
      if (exists) {
        return prev.map(m =>
          m.userId === currentMinistroBeingEdited ? { ...m, areas: ministroRolesSelected } : m
        );
      } else {
        return [...prev, { userId: currentMinistroBeingEdited, areas: ministroRolesSelected }];
      }
    });
    setModalMinistroRolesVisible(false);
    setCurrentMinistroBeingEdited(null);
    setMinistroRolesSelected([]);
  };

  const removerMinistroEscalado = (userId) => {
    setMinistrosEscalados(prev => prev.filter(m => m.userId !== userId));
  };

  const formatarAreas = (areas) => {
    if (!areas || areas.length === 0) return '';
    if (areas.length === 1) return areas[0];
    return areas.slice(0, -1).join(', ') + ' e ' + areas[areas.length - 1];
  };

  const getMinistroNomeById = (id) => {
    const ministro = ministros.find(m => m.id === id);
    return ministro ? ministro.nome : 'Autor desconhecido';
  };

  // Usando 'foto' como o campo para a URL da foto, com base na sua estrutura de dados
  const getMinistroFotoById = (id) => {
    const ministro = ministros.find(m => m.id === id);
    return ministro ? ministro.foto : null;
  };

  const getMinistroIniciaisById = (id) => {
    const ministro = ministros.find(m => m.id === id);
    if (!ministro || !ministro.nome) return '';
    // Corrigido para usar nome e sobrenome, se disponíveis, para iniciais
    const nomeCompleto = `${ministro.nome} ${ministro.sobrenome || ''}`.trim();
    return nomeCompleto
      .split(' ')
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  };

  // --- Funções para Músicas (Mantidas) ---
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
          tom: musica.tom || '', // Inclui tom se disponível no documento da música
          cantores: [],
        },
      ]);
      setModalMusicasVisible(false);
      setMusicaSearchQuery('');
    }
  };

  const handleRemoverMusica = (index) => {
    Alert.alert(
      'Remover Música',
      'Tem certeza que deseja remover esta música da escala?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', onPress: () => {
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

  // Função mais robusta para extrair o ID do vídeo do YouTube e montar a URL de embed
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
    const match = url.match(regExp);
    if (match && match[1]) {
      // Adiciona parâmetros para um player mais limpo (sem logo YouTube, sem vídeos relacionados)
      return `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0`;
    }
    return null;
  };

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

  // --- Função para Salvar Edições na Escala (Update) ---
  const salvarEdicaoEscala = async () => {
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
    if (!userChurchId) {
      Alert.alert('Erro', 'Não foi possível determinar a igreja do usuário.');
      return;
    }
    if (!escala || !escala.id) {
      Alert.alert('Erro', 'ID da escala não encontrado para atualização.');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Erro', 'Você precisa estar logado para editar uma escala.');
        return;
      }

      // Referência ao documento da escala a ser atualizada
      const escalaRef = doc(db, 'igrejas', userChurchId, 'escalas', escala.id);

      // Montar arrays corretos
      const usuariosEscalados = (ministrosEscalados || []).map(m => ({
        userId: m.userId,
        roles: m.areas || [],
      }));
      const usuariosEscaladosIds = usuariosEscalados.map(u => u.userId);

      await updateDoc(escalaRef, {
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
          tom: m.tom || '',
        })),
        usuariosEscalados,
        usuariosEscaladosIds,
        ultimaEdicaoEm: new Date(),
        editadoPor: currentUser.uid,
      });

      Alert.alert('Sucesso', 'Escala atualizada com sucesso!');
      navigation.goBack?.();
    } catch (e) {
      console.error('Erro ao salvar edição da escala:', e);
      Alert.alert('Erro', 'Não foi possível atualizar a escala. Tente novamente.');
    }
  };

  // --- Função para Deletar Escala ---
  const deletarEscala = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja DELETAR esta escala? Esta ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Deletar', style: 'destructive', onPress: async () => {
            if (!userChurchId || !escala || !escala.id) {
              Alert.alert('Erro', 'Não foi possível deletar a escala. Dados incompletos.');
              return;
            }
            try {
              const escalaRef = doc(db, 'igrejas', userChurchId, 'escalas', escala.id);
              await deleteDoc(escalaRef);
              Alert.alert('Sucesso', 'Escala deletada com sucesso!');
              navigation.goBack?.(); // Volta para a tela anterior após a exclusão
            } catch (e) {
              console.error('Erro ao deletar escala:', e);
              Alert.alert('Erro', 'Não foi possível deletar a escala. Tente novamente.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Renderiza estado de carregamento
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando escala para edição...</Text>
      </View>
    );
  }

  // Renderiza estado de erro
  if (telaErro) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{telaErro}</Text>
        <Button onPress={() => navigation.goBack()} iconLeft="arrow-back" style={styles.button}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Editar Escala</Text>

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
            // Inicializa com a data atual da escala ou a data de hoje se vazia
            value={dataCulto ? new Date(dataCulto) : new Date()}
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
                // Inicializa com a data atual do ensaio ou a data de hoje se vazia
                value={dataEnsaio ? new Date(dataEnsaio) : new Date()}
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
                // Usa uma data fictícia para inicializar o picker de tempo
                value={horaEnsaio ? new Date(`2000-01-01T${horaEnsaio}`) : new Date()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onChangeEnsaioTime}
              />
            )}
          </View>
        )}

        {/* Título Músicos */}
        <SectionTitle>Músicos</SectionTitle>
        <MusicianList
          musicians={ministrosEscalados.map(ministro => {
            const dados = ministros.find(m => m.id === ministro.userId);
            return {
              userId: ministro.userId,
              nome: dados?.nome || '',
              foto: dados?.foto,
              iniciais: getMinistroIniciaisById(ministro.userId),
              areas: formatarAreas(ministro.areas),
            };
          })}
          onEditAreas={m => openMinistroRolesModal(m.userId)}
          onRemove={m => removerMinistroEscalado(m.userId)}
        />

        {/* Título Músicas */}
        <Text style={styles.sectionTitle}>Músicas</Text>
        <TouchableOpacity
          style={styles.pickerInputSimulated}
          onPress={() => setModalMusicasVisible(true)}
        >
          <Text style={styles.pickerInputSimulatedText}>Selecione as músicas</Text>
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
              {musica.tom && ( // Exibe o tom da música se disponível
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
                      {cantor.foto ? ( // Usando 'cantor.foto'
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
                    <Text style={{ fontSize: 30, color: theme.colors.secondary }}>+</Text>
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

        {/* Botão Salvar Edição */}
        <Button 
          title="SALVAR EDIÇÃO DA ESCALA" 
          onPress={salvarEdicaoEscala}
          style={styles.button}
          iconRight="checkmark-outline"
        />

                {/* Botão Deletar Escala */}
        <Button 
          title="DELETAR ESCALA" 
          onPress={deletarEscala}
          style={[styles.button, styles.deleteButton]}
          iconRight="trash-outline"
        />

        {/* Modal para Adicionar Músicos */}
        <SelectMusicianModal
          visible={modalMinistrosVisible}
          onClose={() => setModalMinistrosVisible(false)}
          ministros={ministros}
          ministrosEscalados={ministrosEscalados}
          onSelect={handleAdicionarMinistro}
          cantorSearchQuery={cantorSearchQuery}
          setCantorSearchQuery={setCantorSearchQuery}
        />

        {/* Modal para Seleção de Músicas */}
        <SelectMusicModal
          visible={modalMusicasVisible}
          onClose={() => setModalMusicasVisible(false)}
          musicas={filteredMusicas}
          musicasSelecionadas={musicasSelecionadas}
          onSelect={handleAdicionarMusicas}
          musicaSearchQuery={musicaSearchQuery}
          setMusicaSearchQuery={setMusicaSearchQuery}
        />

        {/* Modal para Adicionar Cantores */}
        <SelectSingerModal
          visible={modalCantoresMusicaVisible}
          onClose={() => setModalCantoresMusicaVisible(false)}
          cantores={ministros.filter(m => ministrosEscalados.some(ms => ms.userId === m.id))}
          cantoresSelecionados={getCantoresSelecionadosParaMusica(currentMusicIndexForSingers) || []}
          onToggle={toggleCantorMusica}
          getIniciais={getMinistroIniciaisById}
        />

        {/* Modal para Seleção de Áreas */}
        <SelectAreaModal
          visible={modalMinistroRolesVisible}
          onClose={() => setModalMinistroRolesVisible(false)}
          areaOptions={areaOptions}
          selectedAreas={ministroRolesSelected}
          onToggleArea={area => setMinistroRolesSelected(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])}
          onSave={saveMinistroRoles}
        />
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
  deleteButton: {
    backgroundColor: '#dc3545', // Cor vermelha para o botão de deletar
    marginTop: 10, // Espaçamento extra do botão de salvar
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