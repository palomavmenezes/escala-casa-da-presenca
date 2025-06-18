import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import BottomTab from '../../components/BottomTab';
import styles from './EscalaDetalhes.styles';
import { db, auth } from '../../services/firebase'; // Import auth to check user permissions
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for icons on buttons

// Importa WebView apenas para plataformas nativas
let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function EscalaDetalhes() {
  const route = useRoute();
  const navigation = useNavigation();
  const { escala } = route.params;

  const [ministrosDetalhes, setMinistrosDetalhes] = useState([]);
  const [escaladosComDetalhes, setEscaladosComDetalhes] = useState([]);
  const [ministroResponsavelDetalhes, setMinistroResponsavelDetalhes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [telaErro, setTelaErro] = useState('');
  const [isUserAuthorizedToEdit, setIsUserAuthorizedToEdit] = useState(false); // Novo estado para autorização

  useEffect(() => {
    const carregarDetalhes = async () => {
      setLoading(true);
      setTelaErro('');

      if (!escala || !escala.id || !escala.igrejaId) {
        setTelaErro('Dados da escala ou ID da igreja ausentes.');
        setLoading(false);
        return;
      }

      try {
        const igrejaId = escala.igrejaId;

        const currentUser = auth.currentUser;
        if (currentUser) {
          const userProfileRef = doc(db, 'igrejas', igrejaId, 'usuarios', currentUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);

          let userIsLider = false;
          let userIsMinisterForCults = false;

          if (userProfileSnap.exists()) {
            const userProfileData = userProfileSnap.data();
            userIsLider = userProfileData.isLider === true;
            userIsMinisterForCults = userProfileData.isMinisterForCults === true;
          }

          const igrejaDocRef = doc(db, 'igrejas', igrejaId);
          const igrejaDocSnap = await getDoc(igrejaDocRef);
          let isLiderPrincipal = false;
          if (igrejaDocSnap.exists()) {
            const igrejaData = igrejaDocSnap.data();
            isLiderPrincipal = igrejaData.liderPrincipalId === currentUser.uid;
          }

          // Lógica de autorização baseada nas regras do Firebase
          if (isLiderPrincipal || userIsMinisterForCults) {
            setIsUserAuthorizedToEdit(true);
          } else {
            setIsUserAuthorizedToEdit(false);
          }
        } else {
          setIsUserAuthorizedToEdit(false); // Não autenticado, sem permissão
        }


        const usuariosRef = collection(db, 'igrejas', igrejaId, 'usuarios');
        const usuariosSnap = await getDocs(usuariosRef);
        const todosUsuariosDaIgreja = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMinistrosDetalhes(todosUsuariosDaIgreja);

        const responsavel = todosUsuariosDaIgreja.find(m => m.id === escala.criadoPor);
        if (responsavel) {
          setMinistroResponsavelDetalhes(responsavel);
        }

        const escaladosIds = escala.usuariosEscalados || [];
        const filteredEscalados = todosUsuariosDaIgreja.filter(m => escaladosIds.includes(m.id));
        setEscaladosComDetalhes(filteredEscalados);

      } catch (error) {
        setTelaErro('Erro ao carregar os detalhes da escala. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    carregarDetalhes();
  }, [escala]);

  const getIniciais = (nome = '', sobrenome = '') => {
    const nomes = nome.trim().split(' ');
    const primeiraLetra = nomes[0]?.[0]?.toUpperCase() || '';
    const segundaLetra = nomes.length > 1 ? nomes[1]?.[0]?.toUpperCase() || '' : sobrenome?.[0]?.toUpperCase() || '';
    return primeiraLetra + segundaLetra;
  };

  const getYouTubeEmbedUrl = url => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0` : null;
  };

  const handleEditEscala = () => {
    if (escala && escala.id && escala.igrejaId) {
      navigation.navigate('EditarEscala', { escala: escala });
    } else {
      Alert.alert('Erro', 'Não foi possível carregar os dados necessários para editar a escala.');
    }
  };

  const handleCancelEscala = () => {
    Alert.alert(
      'Descartar Escala',
      'Tem certeza que deseja cancelar esta escala? Esta ação a removerá completamente.',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim', 
          style: 'destructive',
          onPress: async () => {
            if (!escala || !escala.id || !escala.igrejaId) {
              Alert.alert('Erro', 'Não foi possível cancelar a escala. Dados incompletos.');
              return;
            }
            try {
              const escalaRef = doc(db, 'igrejas', escala.igrejaId, 'escalas', escala.id);
              await deleteDoc(escalaRef);
              Alert.alert('Sucesso', 'Escala cancelada com sucesso!');
              navigation.goBack?.();
            } catch (e) {
              console.error('Erro ao cancelar escala:', e);
              Alert.alert('Erro', `Não foi possível cancelar a escala. ${e.message}.`);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando detalhes da escala...</Text>
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

  const dataCultoFormatada = escala.dataCulto instanceof Date
    ? escala.dataCulto.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Data desconhecida';

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Ministro responsável */}
        {ministroResponsavelDetalhes && (
          <View style={styles.responsavelContainer}>
            {ministroResponsavelDetalhes.foto ? (
              <Image source={{ uri: ministroResponsavelDetalhes.foto }} style={styles.responsavelFoto} />
            ) : (
              <View style={[styles.responsavelFoto, styles.iniciaisBox]}>
                <Text style={styles.iniciais}>{getIniciais(ministroResponsavelDetalhes.nome, ministroResponsavelDetalhes.sobrenome)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.responsavelTitulo}>Escala criada por</Text>
              <Text style={styles.responsavelNome}>{ministroResponsavelDetalhes.nome}</Text>
            </View>
          </View>
        )}

        {/* Data do Culto */}
        <Text style={styles.dataCulto}>Culto de {dataCultoFormatada}:</Text>

        {/* Ministros Escalados */}
        <Text style={styles.sectionTitle}>Equipe Escalada</Text>
        <View style={styles.ministrosGrid}>
          {escaladosComDetalhes.length > 0 ? (
            escaladosComDetalhes.map(m => (
              <View key={m.id} style={styles.ministroItem}>
                {m.foto ? (
                  <Image source={{ uri: m.foto }} style={styles.fotoMinistro} />
                ) : (
                  <View style={[styles.iniciaisBox, styles.fotoMinistro]}>
                    <Text style={styles.iniciais}>{getIniciais(m.nome, m.sobrenome)}</Text>
                  </View>
                )}
                <Text style={styles.nomeMinistro}>{m.nome}</Text>
                <Text style={styles.cargoMinistro}>{m.area}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum músico escalado.</Text>
          )}
        </View>

        {/* Ensaio */}
        {escala.ensaio && escala.dataEnsaio && escala.horaEnsaio && (
          <View style={styles.ensaioBox}>
            <Text style={styles.ensaioTexto}>
              Ensaio: {escala.dataEnsaio} às {escala.horaEnsaio}
            </Text>
          </View>
        )}

        {/* Louvores */}
        <Text style={styles.sectionTitle}>Louvores</Text>
        {escala.musicas?.length > 0 ? (
          escala.musicas.map((musica, index) => {
            const embedUrl = getYouTubeEmbedUrl(musica.video);
            return (
              <View key={index} style={styles.cardMusica}>
                <View style={styles.headerMusica}>
                  <Text style={styles.nomeMusica}>{index + 1}. {musica.musicaNome}</Text>
                  {musica.tom && (
                    <View style={styles.tomBox}>
                      <Text style={styles.tomTexto}>Tom {musica.tom}</Text>
                    </View>
                  )}
                </View>

                {/* Vozes */}
                {Array.isArray(musica.cantores) && musica.cantores.length > 0 && (
                  <View style={styles.vozesContainer}>
                    <Text style={styles.vozesTitulo}>Na voz de:</Text>
                    <View style={styles.vozesFotos}>
                      {musica.cantores.map((cantorId) => {
                        const ministro = ministrosDetalhes.find(m => m.id === cantorId);
                        if (!ministro) return null;

                        return (
                          <View key={cantorId} style={styles.vozItem}>
                            {ministro.foto ? (
                              <Image source={{ uri: ministro.foto }} style={styles.vozFoto} />
                            ) : (
                              <View style={[styles.iniciaisBoxVoz, styles.iniciaisBox]}>
                                <Text style={styles.iniciais}>
                                  {getIniciais(ministro.nome, ministro.sobrenome)}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.nomeVoz}>{ministro.nome}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Vídeo */}
                {embedUrl && (
                  Platform.OS === 'web' ? (
                    <iframe
                      title={`youtube-video-${musica.musicaId}`}
                      style={styles.videoPlayerWeb} // Você precisará adicionar 'videoPlayerWeb' no seu EscalaDetalhes.styles
                      src={embedUrl}
                      allowFullScreen
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                  ) : (
                    <View style={styles.videoContainer}>
                      <WebView
                        style={styles.webview}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        source={{ uri: embedUrl }}
                      />
                    </View>
                  )
                )}

                {/* Botão Cifra */}
                {musica.cifra && (
                  <TouchableOpacity
                    style={styles.botaoCifra}
                    onPress={() => Linking.openURL(musica.cifra)}
                  >
                    <Text style={styles.textoCifra}>VER NO CIFRA CLUB →</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Nenhum louvor cadastrado para esta escala.</Text>
        )}

        {/* Botões de Ação: Editar e Cancelar */}
        {isUserAuthorizedToEdit && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEditEscala}>
              <Ionicons name="create-outline" size={20} color="#fff" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleCancelEscala}>
              <Ionicons name="close-circle-outline" size={20} color="#fff" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BottomTab />
    </>
  );
}