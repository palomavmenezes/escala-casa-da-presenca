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
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'; // Importado deleteDoc
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../services/firebase'; // Importado auth para currentUser
import BottomTab from '../../components/layout/BottomTab';
import styles from './EscalaDetalhes.styles';
import SectionTitle from '../../components/ui/SectionTitle';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import theme from '../../components/theme';
import ResponsibleMinisterCard from '../../components/domain/ResponsibleMinisterCard';
import MinistersGrid from '../../components/domain/MinistersGrid';
import MusicDetailCard from '../../components/domain/MusicDetailCard';
import ScaleActions from '../../components/domain/ScaleActions';
import { getIniciais, formatarAreas, formatarData, getYouTubeEmbedUrl, getTempoRelativo } from '../../utils/escala';
import { useComentarios } from '../../hooks/useComentarios';
import { useNotifications } from '../../hooks/useNotifications';

export default function EscalaDetalhes() {
  const route = useRoute();
  const navigation = useNavigation();
  const { escala, comentarioId, scrollToComment } = route.params;

  const [escalaDetalhesCompletos, setEscalaDetalhesCompletos] = useState(null);
  const [ministrosDetalhes, setMinistrosDetalhes] = useState([]);
  const [currentUserProfile, setCurrentUserProfile] = useState(null); // NOVO: Perfil do usuário logado
  const [loading, setLoading] = useState(true);
  const [telaErro, setTelaErro] = useState('');
  const [scrollViewRef, setScrollViewRef] = useState(null);

  // Chamar sempre o hook no topo, com parâmetros nulos se necessário
  const {
    comentarios,
    loading: loadingComentarios,
    erro: erroComentarios,
    addComentario,
    editComentario,
    deleteComentario,
    currentUser,
    getSuggestions,
  } = useComentarios(
    escalaDetalhesCompletos?.id || null,
    escalaDetalhesCompletos?.igrejaId || null
  );

  // Hook de notificações
  const { notifyEscalaAlterada } = useNotifications(escalaDetalhesCompletos?.igrejaId || null);
  const [novoComentario, setNovoComentario] = useState('');
  const [comentarioEditando, setComentarioEditando] = useState(null); // id do comentário em edição
  const [textoEditando, setTextoEditando] = useState('');
  const [localSuggestions, setLocalSuggestions] = useState([]); // NOVO: sugestões locais
  const [showLocalSuggestions, setShowLocalSuggestions] = useState(false); // NOVO: controle local

  // Scroll para comentário específico quando necessário
  useEffect(() => {
    if (scrollToComment && comentarioId && comentarios.length > 0 && scrollViewRef) {
      // Aguardar um pouco para garantir que os comentários foram renderizados
      setTimeout(() => {
        const comentarioIndex = comentarios.findIndex(c => c.id === comentarioId);
        if (comentarioIndex !== -1) {
          // Calcular posição aproximada do comentário
          const scrollPosition = comentarioIndex * 100; // Aproximação
          scrollViewRef.scrollTo({ y: scrollPosition, animated: true });
        }
      }, 500);
    }
  }, [scrollToComment, comentarioId, comentarios, scrollViewRef]);

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

              // Notificar usuários escalados sobre o cancelamento
              if (escalaDetalhesCompletos.usuariosEscalados?.length > 0) {
                await notifyEscalaAlterada(
                  escalaDetalhesCompletos,
                  escalaDetalhesCompletos.usuariosEscalados,
                  'cancelled'
                );
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

  // Função para iniciar edição
  const handleEditarComentario = (comentario) => {
    setComentarioEditando(comentario.id);
    setTextoEditando(comentario.texto);
  };

  // Função para salvar edição
  const handleSalvarEdicao = () => {
    if (!textoEditando.trim()) return;
    editComentario(comentarioEditando, textoEditando);
    setComentarioEditando(null);
    setTextoEditando('');
  };

  // Função para cancelar edição
  const handleCancelarEdicao = () => {
    setComentarioEditando(null);
    setTextoEditando('');
  };

  // Função para deletar
  const handleDeletarComentario = (comentarioId) => {
    Alert.alert(
      'Excluir comentário',
      'Tem certeza que deseja excluir este comentário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteComentario(comentarioId) },
      ]
    );
  };

  // Função para renderizar texto do comentário com destaque para menções
  function renderComentario(texto) {
    if (!texto) return null;
    // Regex melhorada para capturar @Nome Sobrenome ou @Nome
    const partes = texto.split(/(@[\wÀ-ÿ]+(?:\s+[\wÀ-ÿ]+)*)/g);
    return partes.map((parte, idx) =>
      parte.startsWith('@') ? (
        <Text key={idx} style={{ color: '#4ADE80', fontWeight: 'bold' }}>{parte}</Text>
      ) : (
        <Text key={idx} style={{ color: '#232D3F', fontSize: 14 }}>{parte}</Text>
      )
    );
  }

  // Atualizar sugestões locais conforme o texto do comentário
  useEffect(() => {
    const match = novoComentario.match(/@([\wÀ-ÿ ]*)$/i);
    if (match) {
      const sugestoes = getSuggestions(novoComentario);
      setLocalSuggestions(sugestoes);
      setShowLocalSuggestions(sugestoes.length > 0);
    } else {
      setShowLocalSuggestions(false);
    }
  }, [novoComentario, getSuggestions]);

  // Função para enviar novo comentário
  const handleEnviarComentario = () => {
    if (!novoComentario.trim()) return;
    if (!currentUserProfile) return; // Garante que o perfil está carregado
    addComentario(novoComentario, {
      id: currentUserProfile.id,
      nome: currentUserProfile.nome,
      foto: currentUserProfile.foto || '',
    });
    setNovoComentario('');
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
        <Button onPress={() => navigation.goBack()} iconLeft="arrow-back" style={styles.button}>
          Voltar
        </Button>
      </View>
    );
  }

  if (!escalaDetalhesCompletos) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Não foi possível carregar os detalhes da escala.</Text>
        <Button onPress={() => navigation.goBack()} iconLeft="arrow-back" style={styles.button}>
          Voltar
        </Button>
      </View>
    );
  }

  // Dados formatados
  const dataCultoFormatada = escalaDetalhesCompletos.dataCulto
    ? formatarData(escalaDetalhesCompletos.dataCulto)
    : 'Data desconhecida';

  const dataEnsaioFormatada = escalaDetalhesCompletos.ensaio && escalaDetalhesCompletos.dataEnsaio && escalaDetalhesCompletos.horaEnsaio
    ? `${formatarData(escalaDetalhesCompletos.dataEnsaio)} às ${escalaDetalhesCompletos.horaEnsaio}`
    : null;

  const ministroResponsavel = getMinistroById(escalaDetalhesCompletos.criadoPor);

  // Verificações de permissão
  const isCreator = auth.currentUser?.uid === escalaDetalhesCompletos.criadoPor;
  const canManage = currentUserProfile?.isLider || isCreator;

  // Lista de músicos escalados (com áreas)
  const musicosEscalados = (escalaDetalhesCompletos.usuariosEscalados || []).map((u) => {
    const ministro = getMinistroById(u.userId);
    if (!ministro) return null;
    return {
      id: ministro.id,
      nome: ministro.nome,
      foto: ministro.foto,
      areas: u.roles,
      sobrenome: ministro.sobrenome || '',
    };
  }).filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView 
        ref={setScrollViewRef}
        contentContainerStyle={{ padding: 0, paddingBottom: 32 }}
      >
        {/* Card Criador do Repertório */}
        <View style={{ marginHorizontal: 18, marginVertical: 16 }}>
          <View style={{ backgroundColor: '#2B423B', borderRadius: 32, flexDirection: 'row', alignItems: 'center', padding: 10, paddingLeft: 16 }}>
            <Avatar
              nome={ministroResponsavel?.nome}
              foto={ministroResponsavel?.foto}
              size={48}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text style={{ color: theme.colors.secondary, fontWeight: 'bold', fontSize: 15 }}>Criador do Repertório</Text>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{ministroResponsavel?.nome} {ministroResponsavel?.sobrenome}</Text>
            </View>
          </View>
        </View>

        {/* Escalados para o culto */}
        <View style={{ marginHorizontal: 18, marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#232D3F', marginBottom: 8 }}>
            Escalados para o culto {dataCultoFormatada}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }} contentContainerStyle={{ gap: 16 }}>
            {musicosEscalados.map((m, idx) => (
              <View key={m.id || idx} style={{ alignItems: 'center', width: 72 }}>
                <Avatar nome={m.nome} foto={m.foto} size={56} />
                <Text style={{ fontSize: 13, color: '#232D3F', fontWeight: 'bold', marginTop: 4 }} numberOfLines={1}>{m.nome?.split(' ')[0]}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }} numberOfLines={2}>{formatarAreas(m.areas)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Card de Ensaio */}
        {dataEnsaioFormatada && (
          <View style={{ marginHorizontal: 18, marginBottom: 16 }}>
            <View style={{ backgroundColor: '#A7F3D0', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: '#232D3F', fontWeight: 'bold', fontSize: 16 }}>Ensaio: {dataEnsaioFormatada}</Text>
            </View>
          </View>
        )}

        {/* Título Repertório */}
        <View style={{ marginHorizontal: 18, marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#232D3F', marginBottom: 8 }}>Repertório</Text>
        </View>

        {/* Lista de músicas */}
        <View style={{ marginHorizontal: 18, marginBottom: 16 }}>
          {(escalaDetalhesCompletos.musicas || []).map((musica, idx) => {
            // Cantores da música (array de IDs ou objetos)
            const cantores = (musica.cantores || []).map(c => {
              const id = typeof c === 'string' ? c : c?.id;
              return getMinistroById(id);
            }).filter(Boolean);
            const videoUrl = Array.isArray(musica.video) ? musica.video[0] : musica.video;
            return (
              <View key={musica.musicaId || musica.id || idx} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: theme.colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 15, flex: 1 }} numberOfLines={1}>{`${idx + 1}. ${musica.musicaNome || musica.nome}`}</Text>
                  {musica.tom && (
                    <View style={{ backgroundColor: '#A7F3D0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, marginLeft: 10 }}>
                      <Text style={{ color: '#232D3F', fontWeight: 'bold', fontSize: 13 }}>Tom: {musica.tom}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: '#232D3F', fontSize: 13, marginBottom: 6 }}>Na voz de:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  {cantores.length === 0 ? (
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Nenhum cantor(a) selecionado</Text>
                  ) : (
                    cantores.map((c, i) => (
                      <Avatar key={c.id ? `${c.id}-${i}` : i} nome={c.nome} sobrenome={c.sobrenome} foto={c.foto} size={32} style={{ marginRight: 6 }} />
                    ))
                  )}
                </View>
                {videoUrl && getYouTubeEmbedUrl(videoUrl) && (
                  <View style={{ height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
                    <WebView
                      style={{ flex: 1 }}
                      javaScriptEnabled
                      domStorageEnabled
                      source={{ uri: getYouTubeEmbedUrl(videoUrl) }}
                    />
                  </View>
                )}
                {musica.cifra && (
                  <Button
                    title="VER NO CIFRA CLUB"
                    onPress={() => Linking.openURL(musica.cifra)}
                    style={{ marginTop: 4 }}
                    iconRight="open-outline"
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Botões de ação */}
        {canManage && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 18, marginBottom: 18 }}>
            <Button style={{ flex: 1, marginRight: 8 }} onPress={handleEditScale} iconRight="create-outline">EDITAR</Button>
            <Button style={{ flex: 1, backgroundColor: theme.colors.danger }} onPress={handleCancelScale} iconRight="close-outline">CANCELAR</Button>
          </View>
        )}

        {/* Área de Comentários */}
        <View style={{ marginHorizontal: 18, marginBottom: 24 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#232D3F', marginBottom: 8 }}>Comentários</Text>
          {/* Lista de comentários */}
          <View style={{ minHeight: 80, backgroundColor: '#F7F7F7', borderRadius: 12, padding: 0, marginBottom: 12 }}>
            {loadingComentarios ? (
              <Text style={{ color: '#6B7280', fontSize: 14, padding: 12 }}>Carregando comentários...</Text>
            ) : erroComentarios ? (
              <Text style={{ color: 'red', fontSize: 14, padding: 12 }}>{erroComentarios}</Text>
            ) : comentarios.length === 0 ? (
              <Text style={{ color: '#6B7280', fontSize: 14, padding: 12 }}>Nenhum comentário ainda.</Text>
            ) : (
              comentarios.map((comentario) => {
                const isOwn = comentario.criadoPor === currentUser?.uid;
                const isHighlighted = scrollToComment && comentario.id === comentarioId;
                return (
                  <View 
                    key={comentario.id} 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'flex-start', 
                      padding: 12, 
                      borderBottomWidth: 1, 
                      borderBottomColor: '#eee',
                      backgroundColor: isHighlighted ? '#E8F5E8' : 'transparent',
                      borderLeftWidth: isHighlighted ? 4 : 0,
                      borderLeftColor: isHighlighted ? theme.colors.primary : 'transparent'
                    }}
                  >
                    <Avatar nome={comentario.nome} foto={comentario.foto} size={36} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={{ fontWeight: 'bold', color: '#232D3F', fontSize: 14 }}>{comentario.nome}</Text>
                        {/* Tempo relativo */}
                        {comentario.criadoEm && (
                          <Text style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>{getTempoRelativo(comentario.criadoEm)}</Text>
                        )}
                      </View>
                      {comentarioEditando === comentario.id ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TextInput
                            style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 6, fontSize: 14 }}
                            value={textoEditando}
                            onChangeText={setTextoEditando}
                            autoCapitalize="sentences"
                            autoCorrect={false}
                            autoComplete="off"
                          />
                          <TouchableOpacity onPress={handleSalvarEdicao} style={{ marginLeft: 8 }}>
                            <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Salvar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleCancelarEdicao()} style={{ marginLeft: 8 }}>
                            <Text style={{ color: theme.colors.danger, fontWeight: 'bold' }}>Cancelar</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {renderComentario(comentario.texto)}
                        </View>
                      )}
                    </View>
                    {/* Botões de editar/excluir (apenas para o próprio usuário) */}
                    {isOwn && comentarioEditando !== comentario.id && (
                      <View style={{ flexDirection: 'row', marginLeft: 6 }}>
                        <TouchableOpacity onPress={() => handleEditarComentario(comentario)}>
                          <Text style={{ color: theme.colors.primary, fontSize: 13, marginRight: 8 }}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeletarComentario(comentario.id)}>
                          <Text style={{ color: theme.colors.danger, fontSize: 13 }}>Excluir</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
          {/* Input de novo comentário */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12 }}>
            <TextInput
              style={{ flex: 1, height: 44 }}
              placeholder="Deixe um comentário..."
              value={novoComentario}
              onChangeText={text => setNovoComentario(text)}
              onSubmitEditing={handleEnviarComentario}
              editable={!!currentUserProfile}
              returnKeyType="send"
              autoCapitalize="sentences"
              autoCorrect={false}
              autoComplete="off"
            />
            <Button style={{ marginLeft: 8, paddingHorizontal: 18 }} onPress={handleEnviarComentario} disabled={!novoComentario.trim()}>ENVIAR</Button>
          </View>
          {showLocalSuggestions && (
            <View style={{ backgroundColor: '#fff', borderRadius: 8, elevation: 2, marginHorizontal: 18, marginTop: 2, maxHeight: 180 }}>
              {localSuggestions.length === 0 && <Text style={{ padding: 8, color: '#888' }}>Nenhum usuário encontrado</Text>}
              {localSuggestions.map(u => (
                <TouchableOpacity key={u.id} onPress={() => {
                  setNovoComentario(prev => prev.replace(/@[\wÀ-ÿ ]*$/, `@${u.nome}${u.sobrenome ? ' ' + u.sobrenome : ''} `));
                  setShowLocalSuggestions(false);
                }} style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
                  <Avatar nome={u.nome} sobrenome={u.sobrenome} foto={u.foto} size={28} style={{ marginRight: 8 }} />
                  <Text>{u.nome}{u.sobrenome ? ' ' + u.sobrenome : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <BottomTab navigation={navigation} />
    </View>
  );
}