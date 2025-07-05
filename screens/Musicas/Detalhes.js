import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomTab from '../../components/layout/BottomTab';
import { db, auth } from '../../services/firebase'; // Import auth
import { doc, getDoc, deleteDoc } from 'firebase/firestore'; // Import doc, getDoc, deleteDoc

export default function Detalhes() {
  const route = useRoute();
  const navigation = useNavigation();
  const { musica } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [telaErro, setTelaErro] = useState('');
  const [userChurchId, setUserChurchId] = useState(null);
  const [isUserAuthorizedToEdit, setIsUserAuthorizedToEdit] = useState(false); // New state for authorization

  useEffect(() => {
    const checkAuthorization = async () => {
      setIsLoading(true);
      setTelaErro('');

      if (!musica || !musica.id || !musica.igrejaId) {
        setTelaErro('Dados da música ausentes ou incompletos.');
        setIsLoading(false);
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setTelaErro('Usuário não autenticado. Faça login para ver os detalhes.');
        setIsLoading(false);
        return;
      }

      const igrejaIdDaMusica = musica.igrejaId;
      setUserChurchId(igrejaIdDaMusica);

      try {
        // Fetch user's profile to check 'isLider' or 'isMinisterForCults'
        // We assume the user's document exists in: igrejas/{igrejaId}/usuarios/{userId}
        const userProfileRef = doc(db, 'igrejas', igrejaIdDaMusica, 'usuarios', currentUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        let userIsLider = false;
        let userIsMinisterForCults = false;

        if (userProfileSnap.exists()) {
          const userProfileData = userProfileSnap.data();
          userIsLider = userProfileData.isLider === true;
          userIsMinisterForCults = userProfileData.isMinisterForCults === true;
        }

        // Fetch church data to check liderPrincipalId
        const igrejaDocRef = doc(db, 'igrejas', igrejaIdDaMusica);
        const igrejaDocSnap = await getDoc(igrejaDocRef);
        let isLiderPrincipal = false;
        if (igrejaDocSnap.exists()) {
          const igrejaData = igrejaDocSnap.data();
          isLiderPrincipal = igrejaData.liderPrincipalId === currentUser.uid;
        }

        // Authorization logic based on Firebase Rules:
        // allow create, update: if isChurchLeader(igrejaId) || isMinisterForCults(igrejaId);
        if (isLiderPrincipal || userIsMinisterForCults) {
          setIsUserAuthorizedToEdit(true);
        } else {
          setIsUserAuthorizedToEdit(false);
        }

      } catch (error) {
        console.error('Erro ao verificar autorização:', error);
        setTelaErro('Erro ao verificar suas permissões.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [musica]); // Re-run if music changes

  const getYouTubeEmbedUrl = (url) => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0` : null;
  };

  const abrirCifraExterna = () => {
    if (musica.cifra) {
      Linking.openURL(musica.cifra).catch(err => {
        console.error("Erro ao abrir link da cifra externa:", err);
      });
    }
  };

  // Função para lidar com a navegação para a tela de edição
  const handleEditMusic = () => {
    if (userChurchId && musica.id) {
      navigation.navigate('EditarMusica', { musica: { ...musica, igrejaId: userChurchId } });
    } else {
      Alert.alert('Erro', 'Não foi possível carregar os dados necessários para editar a música.');
    }
  };

  // Função para lidar com a exclusão da música
  const handleDeleteMusic = async () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja DELETAR esta música? Esta ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            if (!userChurchId || !musica.id) {
              Alert.alert('Erro', 'Não foi possível deletar a música. Dados incompletos.');
              return;
            }
            try {
              // Constrói a referência correta para o documento da música
              const musicaRef = doc(db, 'igrejas', userChurchId, 'musicas', musica.id);
              await deleteDoc(musicaRef);
              Alert.alert('Sucesso', 'Música deletada com sucesso!');
              navigation.goBack?.(); // Go back to the previous screen (Musicas)
            } catch (e) {
              console.error('Erro ao deletar música:', e);
              Alert.alert('Erro', `Não foi possível deletar a música. ${e.message}. Verifique suas permissões.`);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const embedUrl = musica.video ? getYouTubeEmbedUrl(musica.video) : null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando detalhes da música...</Text>
      </View>
    );
  }

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
      <View style={styles.container}>
          <Text style={styles.nome}>{musica.nome}</Text>

          {musica.cantorOriginal && (
            <Text style={styles.cantorOriginal}>Cantor Original: {musica.cantorOriginal}</Text>
          )}
          {musica.tom && (
            <Text style={styles.tom}>Tom: {musica.tom}</Text>
          )}

          {/* Exibe o conteúdo da cifra/letra */}
          {musica.cifraConteudo ? (
            <View style={styles.cifraContentContainer}>
              <Text style={styles.cifraText}>{musica.cifraConteudo}</Text>
            </View>
          ) : (
            <Text style={styles.semCifra}>Cifra/Letra não cadastrada internamente.</Text>
          )}

          {embedUrl ? (
            <View style={styles.videoContainer}>
              <WebView
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                source={{ uri: embedUrl }}
              />
            </View>
          ) : (
            <Text style={styles.semVideo}>Sem vídeo disponível</Text>
          )}

          {/* Botão para abrir a cifra no Cifra Club (se ainda desejar a opção externa) */}
          {musica.cifra && (
            <TouchableOpacity style={styles.botaoCifra} onPress={abrirCifraExterna}>
              <Ionicons name="musical-notes" size={20} color="#fff" />
              <Text style={styles.textoBotao}>Abrir no Cifra Club</Text>
            </TouchableOpacity>
          )}

          {/* Botões de Editar e Excluir - Visíveis apenas para usuários autorizados */}
          {isUserAuthorizedToEdit && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEditMusic}>
                <Ionicons name="create-outline" size={20} color="#fff" style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteMusic}>
                <Ionicons name="trash-outline" size={20} color="#fff" style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
      </View>
      <BottomTab />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 30,
    paddingHorizontal: 20,
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
  button: { // Reused for error screen button
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
    width: '80%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: { // Reused for error screen button
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
  },
  content: {
    paddingBottom: 40,
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  cantorOriginal: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  tom: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  cifraContentContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cifraText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'monospace',
    color: '#333',
  },
  videoContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  webview: {
    flex: 1,
  },
  semVideo: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  semCifra: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 15,
    marginBottom: 20,
  },
  botaoCifra: {
    flexDirection: 'row',
    backgroundColor: '#2F4F4F',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  // NEW: Styles for action buttons (Edit/Delete)
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 20,
    gap: 10, // Space between buttons
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flex: 1, // Take equal space
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#2e78b7', // Blue color for edit
  },
  deleteButton: {
    backgroundColor: '#dc3545', // Red color for delete
  },
});