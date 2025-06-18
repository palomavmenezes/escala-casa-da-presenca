import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator, // Added for loading state
  Alert,             // Added for error alerts
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'; // Added query, where
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase'; // Ensure 'auth' is not imported if not used
import BottomTab from '../../components/BottomTab';

export default function EscalaDetalhesScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { escala } = route.params; // escala object should now contain igrejaId

  const [ministrosDetalhes, setMinistrosDetalhes] = useState([]); // Stores full details of all users in the church
  const [escaladosComDetalhes, setEscaladosComDetalhes] = useState([]); // Stores full details of only the *escaled* users
  const [ministroResponsavelDetalhes, setMinistroResponsavelDetalhes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [telaErro, setTelaErro] = useState('');

  useEffect(() => {
    const carregarDetalhes = async () => {
      setLoading(true);
      setTelaErro('');

      // Ensure that 'escala' and 'escala.igrejaId' are available
      if (!escala || !escala.id || !escala.igrejaId) {
        setTelaErro('Dados da escala ou ID da igreja ausentes.');
        setLoading(false);
        return;
      }

      try {
        const igrejaId = escala.igrejaId;

        // 1. Fetch ALL users (ministros) for the current church
        // This is efficient because it's a single query to get all potential members
        const usuariosRef = collection(db, 'igrejas', igrejaId, 'usuarios');
        const usuariosSnap = await getDocs(usuariosRef);
        const todosUsuariosDaIgreja = usuariosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMinistrosDetalhes(todosUsuariosDaIgreja); // Store all users for future lookups

        // 2. Identify the responsible minister (criadoPor)
        const responsavel = todosUsuariosDaIgreja.find(m => m.id === escala.criadoPor);
        if (responsavel) {
          setMinistroResponsavelDetalhes(responsavel);
        } else {
          console.warn('Ministro responsável não encontrado para ID:', escala.criadoPor);
          // You might want to display a fallback name or omit this section
        }

        // 3. Get full details for the 'usuariosEscalados'
        const escaladosIds = escala.usuariosEscalados || [];
        const filteredEscalados = todosUsuariosDaIgreja.filter(m => escaladosIds.includes(m.id));
        setEscaladosComDetalhes(filteredEscalados);

      } catch (error) {
        console.error('Erro ao carregar detalhes da escala:', error);
        setTelaErro('Erro ao carregar os detalhes da escala. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    carregarDetalhes();
  }, [escala]); // Re-run effect if 'escala' object changes (e.g., navigation updates it)

  // Corrigido para incluir sobrenome nas iniciais
  const getIniciais = (nome = '', sobrenome = '') => {
    const nomes = nome.trim().split(' ');
    const primeiraLetra = nomes[0]?.[0]?.toUpperCase() || '';
    const segundaLetra = nomes.length > 1 ? nomes[1]?.[0]?.toUpperCase() || '' : sobrenome?.[0]?.toUpperCase() || '';
    return primeiraLetra + segundaLetra;
  };

  const getYouTubeEmbedUrl = url => {
    // A more robust regex for YouTube video IDs
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}?modestbranding=1&rel=0` : null; // Changed to https and added modestbranding/rel for better embed behavior
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

  // Format dataCulto for display
  const dataCultoFormatada = escala.dataCulto instanceof Date
    ? escala.dataCulto.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Data desconhecida';

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Ministro responsável */}
        {ministroResponsavelDetalhes && (
          <View style={styles.responsavelContainer}>
            {ministroResponsavelDetalhes.foto ? ( // Usando 'foto'
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
                {m.foto ? ( // Usando 'foto'
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
                        const ministro = ministrosDetalhes.find(m => m.id === cantorId); // Look up from all church users
                        if (!ministro) return null;

                        return (
                          <View key={cantorId} style={styles.vozItem}>
                            {ministro.foto ? ( // Usando 'foto'
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
      </ScrollView>
      <BottomTab />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 60,
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
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backIcon: {
    color: '#1F2937',
    marginBottom: 10,
  },
  responsavelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    padding: 10,
    marginBottom: 20,
  },
  responsavelFoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  responsavelTitulo: {
    fontSize: 12,
    color: '#6B7280',
  },
  responsavelNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dataCulto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  ministrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start', // Align items to the start
  },
  ministroItem: {
    width: '28%', // Adjust width to fit 3 items per row with gap
    alignItems: 'center',
    marginBottom: 20,
  },
  fotoMinistro: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 6,
  },
  iniciaisBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  iniciais: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  nomeMinistro: {
    fontWeight: '600',
    fontSize: 13,
    color: '#111827',
    textAlign: 'center',
  },
  cargoMinistro: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  ensaioBox: {
    backgroundColor: '#A7F3D0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  ensaioTexto: {
    fontWeight: 'bold',
    color: '#065F46',
    fontSize: 16,
  },
  cardMusica: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  headerMusica: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nomeMusica: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
    flexShrink: 1, // Allow text to shrink
  },
  tomBox: {
    backgroundColor: '#6EE7B7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10, // Add some margin to separate from name
  },
  tomTexto: {
    fontWeight: 'bold',
    color: '#065F46',
    fontSize: 13,
  },
  videoContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  webview: {
    flex: 1,
  },
  botaoCifra: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  textoCifra: {
    color: '#fff',
    fontWeight: '600',
  },
  vozesContainer: {
    marginTop: 10,
    marginBottom: 15, // Added margin for spacing
  },
  vozesTitulo: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  vozesFotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // Use gap for spacing instead of marginRight
  },
  vozItem: {
    alignItems: 'center',
    // Removed marginRight as gap handles it
  },
  vozFoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  iniciaisBoxVoz: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  nomeVoz: {
    fontSize: 12,
    marginTop: 4,
    // Removed fixed marginBottom: 30, it can push next elements down unnecessarily
    textAlign: 'center',
    color: '#374151',
  }
});