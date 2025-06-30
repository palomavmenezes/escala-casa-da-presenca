import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'; // Importado deleteDoc
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../services/firebase'; // Importado auth para currentUser
import BottomTab from '../../components/BottomTab';
import styles from './EscalaDetalhes.styles';

export default function EscalaDetalhes() {
  const route = useRoute();
  const navigation = useNavigation();
  const { escala } = route.params;

  const [escalaDetalhesCompletos, setEscalaDetalhesCompletos] = useState(null);
  const [ministrosDetalhes, setMinistrosDetalhes] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState(null); // NOVO: Perfil do usuário logado
  const [loading, setLoading] = useState(true);
  const [telaErro, setTelaErro] = useState('');

  useEffect(() => {
    const carregarDetalhes = async () => {
      setLoading(true);
      setTelaErro('');

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setTelaErro('Usuário não autenticado.');
        setLoading(false);
        return;
      }

      if (!escala || !escala.id || !escala.igrejaId) {
        setTelaErro('Dados da escala ou ID da igreja ausentes.');
        setLoading(false);
        return;
      }

      try {
        const igrejaId = escala.igrejaId;

        // 1. BUSCAR O PERFIL DO USUÁRIO LOGADO
        const currentUserDocRef = doc(db, 'igrejas', igrejaId, 'usuarios', currentUser.uid);
        const currentUserSnap = await getDoc(currentUserDocRef);
        if (currentUserSnap.exists()) {
          setCurrentUserProfile({ id: currentUserSnap.id, ...currentUserSnap.data() });
        } else {
          setTelaErro('Perfil do usuário logado não encontrado.');
          setLoading(false);
          return;
        }

        // 2. BUSCAR OS DETALHES COMPLETOS DA ESCALA
        const escalaRef = doc(db, 'igrejas', igrejaId, 'escalas', escala.id);
        const escalaSnap = await getDoc(escalaRef);

        if (!escalaSnap.exists()) {
          setTelaErro('Escala não encontrada.');
          setLoading(false);
          return;
        }

        const dadosEscala = escalaSnap.data();
        setEscalaDetalhesCompletos({
          id: escalaSnap.id,
          ...dadosEscala,
          // Converte Firestore Timestamps para Date objects (se eles forem armazenados como timestamps)
          dataCulto: dadosEscala.dataCulto ? new Date(dadosEscala.dataCulto + 'T00:00:00') : null,
          dataEnsaio: dadosEscala.dataEnsaio ? new Date(dadosEscala.dataEnsaio + 'T00:00:00') : null,
        });

        // 3. BUSCAR TODOS OS USUÁRIOS DA IGREJA para obter detalhes como foto e nome
        const usuariosRef = collection(db, 'igrejas', igrejaId, 'usuarios');
        const usuariosSnap = await getDocs(usuariosRef);
        const todosUsuariosDaIgreja = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMinistrosDetalhes(todosUsuariosDaIgreja);

      } catch (error) {
        console.error('Erro ao carregar detalhes da escala:', error);
        setTelaErro('Erro ao carregar os detalhes da escala. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    carregarDetalhes();
  }, [escala]);

  const getMinistroById = (id) => {
    return ministrosDetalhes.find(m => m.id === id);
  };

  const getIniciais = (nome = '', sobrenome = '') => {
    const nomes = nome.trim().split(' ');
    const primeiraLetra = nomes[0]?.[0]?.toUpperCase() || '';
    const segundaLetra = nomes.length > 1 ? nomes[nomes.length - 1]?.[0]?.toUpperCase() || '' : sobrenome?.[0]?.toUpperCase() || '';
    return (primeiraLetra + segundaLetra).substring(0,2);
  };

  const getYouTubeEmbedUrl = url => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0` : null;
  };

  // NOVO: Funções para Editar/Cancelar
  const handleEditScale = () => {
    if (escalaDetalhesCompletos) {
      // Navegar para a tela de edição, passando os dados completos da escala
      // Você precisará ter uma tela 'EditarEscala' (ou similar) configurada na navegação
      navigation.navigate('EditarEscala', { escala: escalaDetalhesCompletos });
    }
  };

  const handleCancelScale = () => {
    Alert.alert(
      "Cancelar Escala",
      "Tem certeza que deseja cancelar esta escala? Esta ação é irreversível.",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          onPress: async () => {
            if (!escalaDetalhesCompletos || !currentUserProfile) {
              Alert.alert('Erro', 'Dados insuficientes para cancelar a escala.');
              return;
            }
            try {
              const escalaRef = doc(db, 'igrejas', escalaDetalhesCompletos.igrejaId, 'escalas', escalaDetalhesCompletos.id);
              await deleteDoc(escalaRef);

              // Opcional: Enviar uma notificação para os usuários escalados informando o cancelamento
              const notificationMessage = `A escala para ${escalaDetalhesCompletos.dataCulto?.toLocaleDateString('pt-BR')} foi cancelada.`;
              for (const escalado of escalaDetalhesCompletos.usuariosEscalados) {
                await addDoc(collection(db, 'igrejas', escalaDetalhesCompletos.igrejaId, 'usuarios', escalado.userId, 'notificacoes'), {
                  type: 'scale_cancelled',
                  igrejaId: escalaDetalhesCompletos.igrejaId,
                  escalaId: escalaDetalhesCompletos.id,
                  escalaDate: escalaDetalhesCompletos.dataCulto?.toISOString().split('T')[0],
                  eventType: 'cancelled',
                  message: notificationMessage,
                  timestamp: new Date(),
                  read: false,
                  recipientId: escalado.userId,
                  criadoPor: auth.currentUser.uid,
                });
              }

              Alert.alert("Sucesso", "Escala cancelada com sucesso!");
              navigation.goBack(); // Volta para a tela anterior (Home ou Lista de Escalas)
            } catch (e) {
              console.error("Erro ao cancelar escala:", e);
              Alert.alert("Erro", `Não foi possível cancelar a escala. ${e.message}`);
            }
          },
        },
      ]
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

  if (!escalaDetalhesCompletos) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Não foi possível carregar os detalhes da escala.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dataCultoFormatada = escalaDetalhesCompletos.dataCulto
    ? escalaDetalhesCompletos.dataCulto.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Data desconhecida';

  const dataEnsaioFormatada = escalaDetalhesCompletos.ensaio && escalaDetalhesCompletos.dataEnsaio && escalaDetalhesCompletos.horaEnsaio
    ? `${escalaDetalhesCompletos.dataEnsaio.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} às ${escalaDetalhesCompletos.horaEnsaio}`
    : null;

  const ministroResponsavel = getMinistroById(escalaDetalhesCompletos.criadoPor);

  // Verificações de permissão
  const isCreator = auth.currentUser?.uid === escalaDetalhesCompletos.criadoPor;
  const canManage = currentUserProfile?.isLider || isCreator; // Pode editar/cancelar se for líder OU o criador

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Ministro responsável */}
        {ministroResponsavel && (
          <View style={styles.responsavelContainer}>
            {ministroResponsavel.foto ? (
              <Image source={{ uri: ministroResponsavel.foto }} style={styles.responsavelFoto} />
            ) : (
              <View style={[styles.responsavelFoto, styles.iniciaisBox]}>
                <Text style={styles.iniciais}>{getIniciais(ministroResponsavel.nome, ministroResponsavel.sobrenome)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.responsavelTitulo}>Escala criada por</Text>
              <Text style={styles.responsavelNome}>{ministroResponsavel.nome}</Text>
            </View>
          </View>
        )}

        {/* Data do Culto */}
        <Text style={styles.dataCulto}>Culto de {dataCultoFormatada}:</Text>

        {/* Ministros Escalados */}
        <Text style={styles.sectionTitle}>Equipe Escalada</Text>
        <View style={styles.ministrosGrid}>
          {escalaDetalhesCompletos.usuariosEscalados?.length > 0 ? (
            escalaDetalhesCompletos.usuariosEscalados.map(escalado => {
              const ministro = getMinistroById(escalado.userId);
              if (!ministro) return null;

              return (
                <View key={escalado.userId} style={styles.ministroItem}>
                  {ministro.foto ? (
                    <Image source={{ uri: ministro.foto }} style={styles.fotoMinistro} />
                  ) : (
                    <View style={[styles.iniciaisBox, styles.fotoMinistro]}>
                      <Text style={styles.iniciais}>{getIniciais(ministro.nome, ministro.sobrenome)}</Text>
                    </View>
                  )}
                  <Text style={styles.nomeMinistro}>{ministro.nome}</Text>
                  {escalado.roles && escalado.roles.length > 0 && (
                    <Text style={styles.cargoMinistro}>{escalado.roles.join(', ')}</Text>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhum músico escalado.</Text>
          )}
        </View>

        {/* Ensaio */}
        {dataEnsaioFormatada && (
          <View style={styles.ensaioBox}>
            <Text style={styles.ensaioTexto}>
              Ensaio: {dataEnsaioFormatada}
            </Text>
          </View>
        )}

        {/* Louvores */}
        <Text style={styles.sectionTitle}>Louvores</Text>
        {escalaDetalhesCompletos.musicas?.length > 0 ? (
          escalaDetalhesCompletos.musicas.map((musica, index) => {
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
                        const ministro = getMinistroById(cantorId);
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
                  <View style={styles.videoContainer}>
                    <WebView
                      style={styles.webview}
                      javaScriptEnabled
                      domStorageEnabled
                      source={{ uri: embedUrl }}
                    />
                  </View>
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

        
        {/* Botões de Ação (Editar/Cancelar) - Visíveis apenas para o criador ou líder */}
        {canManage && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.editButton} onPress={handleEditScale}>
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelScale}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
      <BottomTab />
    </>
  );
}