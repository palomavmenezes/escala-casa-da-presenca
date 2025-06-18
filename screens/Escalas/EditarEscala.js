import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Switch,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { db, auth } from '../../services/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc, // Import getDoc
} from 'firebase/firestore';
import styles from './EditarEscala.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomTab from '../../components/BottomTab';
import { useRoute } from '@react-navigation/native';

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function EditarEscala({ navigation }) {
  const route = useRoute();
  const { escala } = route.params;

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
  const [modalMusicasVisible, setModalMusicasVisible] = useState(false);
  const [musicaSearchQuery, setMusicaSearchQuery] = useState('');
  const [filteredMusicas, setFilteredMusicas] = useState([]);
  const [currentMusicIndexForSingers, setCurrentMusicIndexForSingers] = useState(null);
  const [modalCantoresMusicaVisible, setModalCantoresMusicaVisible] = useState(false);

  const [userChurchId, setUserChurchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [telaErro, setTelaErro] = useState('');

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

      if (!escala || !escala.id || !escala.igrejaId) {
        setTelaErro('Dados da escala para edição estão incompletos ou ausentes.');
        setLoading(false);
        return;
      }

      try {
        const igrejaId = escala.igrejaId;
        setUserChurchId(igrejaId);

        // Verifica permissões
        const escalaRef = doc(db, 'igrejas', igrejaId, 'escalas', escala.id);
        const escalaSnap = await getDoc(escalaRef);
        const escalaData = escalaSnap.data();

        if (escalaData.criadoPor !== currentUser.uid) {
          // Verifica se o usuário é líder
          const userRef = doc(db, 'igrejas', igrejaId, 'usuarios', currentUser.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();

          if (!userData?.isLider) {
            setTelaErro('Você não tem permissão para editar esta escala.');
            setLoading(false);
            return;
          }
        }

        setDataCulto(escala.dataCulto || '');
        setMarcarEnsaio(escala.ensaio || false);
        setDataEnsaio(escala.dataEnsaio || '');
        setHoraEnsaio(escala.horaEnsaio || '');
        // Garante que o criador esteja sempre na lista
        setMinistrosEscalados(escala.usuariosEscalados && escala.usuariosEscalados.length > 0 ? escala.usuariosEscalados : [currentUser.uid]);

        setMusicasSelecionadas(escala.musicas?.map(m => ({
          musicaId: m.musicaId,
          musicaNome: m.musicaNome,
          cifra: m.cifra,
          video: m.video || '',
          tom: m.tom || '',
          cantores: m.cantores || [],
        })) || []);

        const ministrosQuery = query(
          collection(db, 'igrejas', igrejaId, 'usuarios'),
          where('aprovado', '==', true)
        );
        const ministrosSnap = await getDocs(ministrosQuery);
        const listaMinistros = ministrosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMinistros(listaMinistros);

        const musicasQuery = collection(db, 'igrejas', igrejaId, 'musicas');
        const musicasSnap = await getDocs(musicasQuery);
        const listaMusicas = musicasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMusicasDisponiveis(listaMusicas);
        setFilteredMusicas(listaMusicas);
      } catch (error) {
        console.error('Erro ao buscar dados para edição da escala:', error);
        setTelaErro('Não foi possível carregar os dados para edição. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    carregarDadosDaEscalaEComuns();
  }, [escala, navigation]);

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

  // Função para lidar com a mudança de data/hora (ajustada para mobile/web)
  const handleDateChange = (setter, showSetter) => (event, selectedValue) => {
    showSetter(false); // Fecha o picker no mobile
    if (selectedValue) {
      setter(selectedValue.toISOString().split('T')[0]);
    }
  };

  const handleTimeChange = (setter, showSetter) => (event, selectedValue) => {
    showSetter(false); // Fecha o picker no mobile
    if (selectedValue) {
      setter(selectedValue.toTimeString().split(' ')[0].substring(0, 5));
    }
  };

  const toggleMinistroEscalado = (id) => {
    setMinistrosEscalados(prev => {
      const isCurrentlyEscalado = prev.includes(id);
      if (isCurrentlyEscalado) {
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
    return ministro ? ministro.foto : null;
  };

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
          tom: musica.tom || '',
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
        {
          text: 'Remover', onPress: () => {
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

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
    const match = url.match(regExp);
    if (match && match[1]) {
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

      const escalaRef = doc(db, 'igrejas', userChurchId, 'escalas', escala.id);

      // Garante que o ID do usuário atual esteja sempre presente
      const usuariosParaSalvar = [...new Set([...ministrosEscalados, currentUser.uid])];

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
        usuariosEscalados: usuariosParaSalvar,
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

  const deletarEscala = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja DELETAR esta escala? Esta ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar', style: 'destructive', onPress: async () => {
            if (!userChurchId || !escala || !escala.id) {
              Alert.alert('Erro', 'Não foi possível deletar a escala. Dados incompletos.');
              return;
            }
            try {
              const escalaRef = doc(db, 'igrejas', userChurchId, 'escalas', escala.id);
              await deleteDoc(escalaRef);
              Alert.alert('Sucesso', 'Escala deletada com sucesso!');
              navigation.goBack?.();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando escala para edição...</Text>
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
        <Text style={styles.header}>Editar Escala</Text>

        {/* Input de Data do Culto */}
        <TouchableOpacity
          onPress={() => setShowDatePickerCulto(true)}
          style={Platform.OS === 'web' ? null : { width: '100%' }}
        >
          <TextInput
            style={styles.input}
            placeholder="Data do culto: AAAA-MM-DD"
            value={dataCulto}
            editable={Platform.OS === 'web'}
            pointerEvents={Platform.OS === 'web' ? 'auto' : 'none'}
            onFocus={() => Platform.OS === 'web' && setShowDatePickerCulto(true)}
            onChangeText={Platform.OS === 'web' ? setDataCulto : undefined}
            type={Platform.OS === 'web' ? 'date' : undefined}
          />
        </TouchableOpacity>
        {Platform.OS !== 'web' && showDatePickerCulto && (
          <DateTimePicker
            testID="datePickerCulto"
            value={dataCulto ? new Date(dataCulto) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange(setDataCulto, setShowDatePickerCulto)}
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
            <TouchableOpacity onPress={() => setShowDatePickerEnsaio(true)} style={Platform.OS === 'web' ? null : { width: '100%' }}>
              <TextInput
                style={styles.input}
                placeholder="Data do ensaio: AAAA-MM-DD"
                value={dataEnsaio}
                editable={Platform.OS === 'web'}
                pointerEvents={Platform.OS === 'web' ? 'auto' : 'none'}
                onFocus={() => Platform.OS === 'web' && setShowDatePickerEnsaio(true)}
                onChangeText={Platform.OS === 'web' ? setDataEnsaio : undefined}
                type={Platform.OS === 'web' ? 'date' : undefined}
              />
            </TouchableOpacity>
            {Platform.OS !== 'web' && showDatePickerEnsaio && (
              <DateTimePicker
                testID="datePickerEnsaio"
                value={dataEnsaio ? new Date(dataEnsaio) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange(setDataEnsaio, setShowDatePickerEnsaio)}
              />
            )}

            <TouchableOpacity onPress={() => setShowTimePickerEnsaio(true)} style={Platform.OS === 'web' ? null : { width: '100%' }}>
              <TextInput
                style={styles.input}
                placeholder="Hora do ensaio: HH:MM"
                value={horaEnsaio}
                editable={Platform.OS === 'web'}
                pointerEvents={Platform.OS === 'web' ? 'auto' : 'none'}
                onFocus={() => Platform.OS === 'web' && setShowTimePickerEnsaio(true)}
                onChangeText={Platform.OS === 'web' ? setHoraEnsaio : undefined}
                type={Platform.OS === 'web' ? 'time' : undefined}
              />
            </TouchableOpacity>
            {Platform.OS !== 'web' && showTimePickerEnsaio && (
              <DateTimePicker
                testID="timePickerEnsaio"
                value={horaEnsaio ? new Date(`2000-01-01T${horaEnsaio}`) : new Date()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChange(setHoraEnsaio, setShowTimePickerEnsaio)}
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

                {ministro.foto ? (
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
              {musica.tom && (
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
                Platform.OS === 'web' ? (
                  <iframe
                    title={`youtube-video-${musica.musicaId}`}
                    style={styles.videoPlayerWeb}
                    src={embedUrl}
                    allowFullScreen
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                ) : (
                  <View style={styles.videoContainer}>
                    <WebView
                      style={styles.videoPlayer}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      source={{ uri: embedUrl }}
                    />
                  </View>
                )
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
                      {cantor.foto ? (
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

        {/* Botão Salvar Edição */}
        <TouchableOpacity style={styles.button} onPress={salvarEdicaoEscala}>
          <Text style={styles.buttonText}>SALVAR EDIÇÃO DA ESCALA</Text>
        </TouchableOpacity>

        {/* Botão Deletar Escala */}
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={deletarEscala}>
          <Text style={styles.buttonText}>DELETAR ESCALA</Text>
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
                    {m.foto ? (
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
            setMusicaSearchQuery('');
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
                      disabled={musicasSelecionadas.some(m => m.musicaId === musica.id)}
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
                  .filter(m => m.area === 'Cantor(a)' && ministrosEscalados.includes(m.id))
                  .map(m => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => toggleCantorMusica(m.id)}
                      style={[
                        styles.modalItem,
                        getCantoresSelecionadosParaMusica(currentMusicIndexForSingers)?.includes(m.id) && styles.modalItemSelected,
                      ]}
                    >
                      {m.foto ? (
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