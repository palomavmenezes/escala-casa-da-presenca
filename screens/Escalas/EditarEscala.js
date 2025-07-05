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
  Platform,
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
import Avatar from '../../components/ui/Avatar';

export default function EditarEscalas({ navigation, route }) {
  const { escala } = route.params;
  // Estados principais do formulário
  const [ministros, setMinistros] = useState([]);
  const [musicas, setMusicas] = useState([]);
  const [form, setForm] = useState({
    ministros: [],
    musicas: [],
    dataCulto: '',
    horaCulto: '',
    dataEnsaio: '',
    horaEnsaio: '',
    observacoes: '',
  });
  const [modals, setModals] = useState({
    selectMusician: false,
    selectArea: false,
    selectMusic: false,
    selectSinger: false,
    areaMusico: null,
    musicaIdx: null,
  });
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [marcarEnsaio, setMarcarEnsaio] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEnsaioDatePicker, setShowEnsaioDatePicker] = useState(false);
  const [showEnsaioTimePicker, setShowEnsaioTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [telaErro, setTelaErro] = useState('');
  const [igrejaId, setIgrejaId] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Usuário não autenticado');
        if (!escala || !escala.id || !escala.igrejaId) throw new Error('Dados da escala ausentes');
        setIgrejaId(escala.igrejaId);
        // Buscar ministros
        const ministrosSnap = await getDocs(collection(db, 'igrejas', escala.igrejaId, 'usuarios'));
        const listaMinistros = ministrosSnap.docs.map(doc => {
          const data = doc.data();
          let iniciais = '';
          if (data.nome) {
            const partes = data.nome.trim().split(' ');
            iniciais = partes[0][0].toUpperCase();
            if (partes.length > 1) {
              iniciais += partes[partes.length - 1][0].toUpperCase();
            }
          }
          return { id: doc.id, ...data, iniciais };
        });
        setMinistros(listaMinistros);
        // Buscar músicas
        const musicasSnap = await getDocs(collection(db, 'igrejas', escala.igrejaId, 'musicas'));
        setMusicas(musicasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // Preencher formulário com dados da escala
        setForm({
          ministros: (escala.usuariosEscalados || []).map(m => {
            const user = listaMinistros.find(u => u.id === m.userId);
            return user ? { ...user, areas: m.roles || [] } : { id: m.userId, areas: m.roles || [] };
          }),
          musicas: (escala.musicas || []).map(m => ({
            ...m,
            cantores: (m.cantores || []).map(cid => {
              const cantor = listaMinistros.find(u => u.id === cid || u.id === cid.id);
              return cantor ? { id: cantor.id, nome: cantor.nome, foto: cantor.foto, iniciais: cantor.iniciais } : { id: cid };
            })
          })),
          dataCulto: escala.dataCulto instanceof Date
            ? escala.dataCulto.toISOString().split('T')[0]
            : (typeof escala.dataCulto === 'string' ? escala.dataCulto : ''),
          horaCulto: escala.horaCulto || '',
          dataEnsaio: escala.dataEnsaio instanceof Date
            ? escala.dataEnsaio.toISOString().split('T')[0]
            : (typeof escala.dataEnsaio === 'string' ? escala.dataEnsaio : ''),
          horaEnsaio: escala.horaEnsaio || '',
          observacoes: escala.observacoes || '',
        });
        setMarcarEnsaio(!!escala.dataEnsaio);
      } catch (e) {
        setTelaErro(e.message || 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, [escala]);

  // Handlers de seleção de datas/horas
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setForm({ ...form, dataCulto: formattedDate });
    }
  };
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toTimeString().split(' ')[0].substring(0, 5);
      setForm({ ...form, horaCulto: formattedTime });
    }
  };
  const onEnsaioDateChange = (event, selectedDate) => {
    setShowEnsaioDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setForm({ ...form, dataEnsaio: formattedDate });
    }
  };
  const onEnsaioTimeChange = (event, selectedTime) => {
    setShowEnsaioTimePicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toTimeString().split(' ')[0].substring(0, 5);
      setForm({ ...form, horaEnsaio: formattedTime });
    }
  };

  // Handlers para músicos, áreas, músicas, cantores (iguais ao cadastro)
  const onSelectMusician = (musico) => {
    if ((form.ministros || []).some(m => m.id === musico.id)) return;
    setForm(prev => ({ ...prev, ministros: [...prev.ministros, musico] }));
    setSelectedAreas(musico.areas || []);
    setModals(m => ({ ...m, selectMusician: false, selectArea: true, areaMusico: musico }));
  };
  const onSaveAreas = () => {
    setForm(prev => ({
      ...prev,
      ministros: prev.ministros.map(m =>
        m.id === modals.areaMusico.id ? { ...m, areas: selectedAreas } : m
      )
    }));
    setModals(m => ({ ...m, selectArea: false, areaMusico: null }));
    setSelectedAreas([]);
  };
  const onToggleArea = (area) => {
    setSelectedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };
  const onAddSinger = (musicaIdx, cantorId) => {
    setForm(prev => {
      const musicas = [...prev.musicas];
      const cantores = musicas[musicaIdx].cantores || [];
      if (!cantores.some(c => c.id === cantorId)) {
        const cantor = ministros.find(m => m.id === cantorId);
        musicas[musicaIdx].cantores = [...cantores, cantor ? { id: cantor.id, nome: cantor.nome, foto: cantor.foto, iniciais: cantor.iniciais } : { id: cantorId }];
      }
      return { ...prev, musicas };
    });
    setModals(m => ({ ...m, selectSinger: false, musicaIdx: null }));
  };

  // Handler para salvar edição (update)
  const handleSaveEdicao = async () => {
    if (!form.dataCulto) {
      Alert.alert('Erro', 'Data do culto obrigatória');
      return;
    }
    if (!escala || !escala.id || !igrejaId) {
      Alert.alert('Erro', 'Dados da escala ausentes');
      return;
    }
    try {
      setLoading(true);
      // Montar arrays corretos
      const usuariosEscalados = (form.ministros || []).map(m => ({
        userId: m.id,
        roles: m.areas || [],
      }));
      const usuariosEscaladosIds = usuariosEscalados.map(u => u.userId);
      const musicasParaSalvar = (form.musicas || []).map(musica => ({
        ...musica,
        cantores: (musica.cantores || []).map(c => c.id),
      }));
      await updateDoc(doc(db, 'igrejas', igrejaId, 'escalas', escala.id), {
        dataCulto: form.dataCulto,
        horaCulto: form.horaCulto,
        dataEnsaio: marcarEnsaio ? form.dataEnsaio : '',
        horaEnsaio: marcarEnsaio ? form.horaEnsaio : '',
        musicas: musicasParaSalvar,
        usuariosEscalados,
        usuariosEscaladosIds,
        observacoes: form.observacoes,
        ultimaEdicaoEm: new Date(),
        editadoPor: auth.currentUser?.uid,
      });
      Alert.alert('Sucesso', 'Escala editada com sucesso!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Erro ao salvar edição.');
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar a lista de músicas selecionadas
  const getMusicasText = () => {
    if (!form.musicas || form.musicas.length === 0) {
      return 'Selecione as músicas';
    }
    return form.musicas.map(m => m.titulo || m.nome).join(', ');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#003D29' }}>Carregando escala para edição...</Text>
      </View>
    );
  }
  if (telaErro) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F5F6FA' }}>
        <Text style={{ textAlign: 'center', color: 'red', fontSize: 16, marginBottom: 20 }}>{telaErro}</Text>
        <Button onPress={() => navigation.goBack()} iconLeft="arrow-back" style={{ marginTop: 10 }}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ paddingHorizontal: 18, paddingTop: 18 }}>
        {/* Data do culto */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Input
            value={form.dataCulto}
            onChangeText={text => setForm({ ...form, dataCulto: text })}
            placeholder="Selecione a data do culto"
            editable={false}
          />
        </TouchableOpacity>
        {/* Hora do culto */}
        <TouchableOpacity onPress={() => setShowTimePicker(true)}>
          <Input
            value={form.horaCulto || ''}
            onChangeText={text => setForm({ ...form, horaCulto: text })}
            placeholder="Selecione a hora do culto"
            editable={false}
          />
        </TouchableOpacity>
        {/* DateTimePickers */}
        {showDatePicker && (
          <DateTimePicker
            value={form.dataCulto ? new Date(form.dataCulto) : new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={form.horaCulto ? new Date(`2000-01-01T${form.horaCulto}`) : new Date()}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <Text style={{ color: theme.colors.text, marginRight: 8 }}>Marcar ensaio</Text>
          <Switch value={marcarEnsaio} onValueChange={setMarcarEnsaio} />
        </View>
        {marcarEnsaio && (
          <>
            <TouchableOpacity onPress={() => setShowEnsaioDatePicker(true)}>
              <Input
                value={form.dataEnsaio || ''}
                onChangeText={text => setForm({ ...form, dataEnsaio: text })}
                placeholder="Selecione a data do ensaio"
                editable={false}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEnsaioTimePicker(true)}>
              <Input
                value={form.horaEnsaio || ''}
                onChangeText={text => setForm({ ...form, horaEnsaio: text })}
                placeholder="Selecione a hora do ensaio"
                editable={false}
              />
            </TouchableOpacity>
            {/* DateTimePickers para ensaio */}
            {showEnsaioDatePicker && (
              <DateTimePicker
                value={form.dataEnsaio ? new Date(form.dataEnsaio) : new Date()}
                mode="date"
                display="default"
                onChange={onEnsaioDateChange}
              />
            )}
            {showEnsaioTimePicker && (
              <DateTimePicker
                value={form.horaEnsaio ? new Date(`2000-01-01T${form.horaEnsaio}`) : new Date()}
                mode="time"
                display="default"
                onChange={onEnsaioTimeChange}
              />
            )}
          </>
        )}
        <SectionTitle style={{ marginTop: 24, marginBottom: 8 }}>Músicos</SectionTitle>
        <MusicianGrid
          musicians={form.ministros || []}
          onAdd={() => setModals({ ...modals, selectMusician: true })}
          onRemove={musico => {
            if (musico.id !== auth.currentUser?.uid) {
              setForm(prev => ({ ...prev, ministros: prev.ministros.filter(m => m.id !== musico.id) }));
            }
          }}
          onEditArea={musico => {
            setSelectedAreas(musico.areas || []);
            setModals({ ...modals, selectArea: true, areaMusico: musico });
          }}
        />
        <SelectMusicianModal
          visible={modals.selectMusician}
          onClose={() => setModals({ ...modals, selectMusician: false })}
          onSelect={onSelectMusician}
          ministros={ministros.filter(m => !(form.ministros || []).some(e => e.id === m.id))}
          ministrosEscalados={form.ministros || []}
        />
        <SelectAreaModal
          visible={modals.selectArea}
          onClose={() => { setModals({ ...modals, selectArea: false, areaMusico: null }); setSelectedAreas([]); }}
          areaOptions={['Cantor(a)', 'Teclado', 'Guitarra', 'Baixo', 'Bateria', 'Violão', 'Backing Vocal', 'Apoio Técnico']}
          selectedAreas={selectedAreas}
          onToggleArea={onToggleArea}
          onSave={onSaveAreas}
        />
        <SectionTitle style={{ marginTop: 24, marginBottom: 8 }}>Músicas</SectionTitle>
        <TouchableOpacity onPress={() => setModals({ ...modals, selectMusic: true })}>
          <Input
            placeholder="Selecione as músicas"
            value={getMusicasText()}
            editable={false}
            style={{ marginBottom: 8 }}
          />
        </TouchableOpacity>
        <SelectMusicModal
          visible={modals.selectMusic}
          onClose={() => setModals({ ...modals, selectMusic: false })}
          musicas={musicas}
          musicasSelecionadas={form.musicas}
          onSelect={musica => {
            if ((form.musicas || []).some(m => m.id === musica.id)) return;
            setForm(prev => ({ ...prev, musicas: [...prev.musicas, musica] }));
          }}
        />
        {(form.musicas || []).map((musica, idx) => {
          const cantoresEscalados = (form.ministros || []).filter(m => (m.areas || []).includes('Cantor(a)'));
          const cantoresDisponiveis = cantoresEscalados.filter(m => !(musica.cantores || []).some(c => c.id === m.id));
          const cantoresSelecionadosIds = (musica.cantores || []).map(c => c.id);
          return (
            <View key={musica.id || idx} style={{ backgroundColor: '#F7F7F7', borderRadius: 16, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white }}>
              <Text style={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 15, marginBottom: 4 }}>{`${idx + 1}. ${musica.titulo || musica.nome}`}</Text>
              <Input
                label="Tom"
                value={musica.tom || ''}
                placeholder="Digite o tom da música"
                onChangeText={text => {
                  const musicas = [...form.musicas];
                  musicas[idx] = { ...musicas[idx], tom: text };
                  setForm({ ...form, musicas });
                }}
                style={{ marginBottom: 8 }}
              />
              <Input
                label="Cifra"
                value={musica.cifra || ''}
                placeholder="Link da cifra"
                onChangeText={text => {
                  const musicas = [...form.musicas];
                  musicas[idx] = { ...musicas[idx], cifra: text };
                  setForm({ ...form, musicas });
                }}
                style={{ marginBottom: 8 }}
              />
              <Input
                label="Vídeo"
                value={musica.video || ''}
                placeholder="Link do vídeo"
                onChangeText={text => {
                  const musicas = [...form.musicas];
                  musicas[idx] = { ...musicas[idx], video: text };
                  setForm({ ...form, musicas });
                }}
                style={{ marginBottom: 8 }}
              />
              <Text style={{ fontWeight: 'bold', color: theme.colors.primary, marginBottom: 6 }}>Na voz de:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 }}>
                {(musica.cantores && musica.cantores.length > 0) && (
                  (musica.cantores || [])
                    .filter(cantor => cantor && cantor.id)
                    .map((cantor, cidx) => (
                      <View key={cantor.id || cidx} style={{ alignItems: 'center', marginRight: 16, width: 64 }}>
                        <View style={{ position: 'relative', marginBottom: 4, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                          <Avatar uri={cantor.foto} initials={cantor.iniciais} size={54} style={{ borderWidth: 2, borderColor: theme.colors.secondary }} />
                          <TouchableOpacity
                            style={{ position: 'absolute', top: -10, left: -10, backgroundColor: theme.colors.white, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', zIndex: 2, borderWidth: 1, borderColor: theme.colors.primary }}
                            onPress={() => {
                              const musicas = [...form.musicas];
                              musicas[idx].cantores = (musicas[idx].cantores || []).filter((_, i) => i !== cidx);
                              setForm({ ...form, musicas });
                            }}
                          >
                            <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>×</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: '600', textAlign: 'center', marginTop: 2 }} numberOfLines={1}>{cantor.nome}</Text>
                      </View>
                    ))
                )}
                {/* Botão para adicionar cantor sempre visível */}
                <TouchableOpacity
                  style={{ alignItems: 'center', width: 64, marginRight: 8 }}
                  onPress={() => setModals({ ...modals, selectSinger: true, musicaIdx: idx })}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center', width: 54, height: 54, borderRadius: 32, borderWidth: 2, borderColor: theme.colors.secondary, backgroundColor: '#F3F7F5' }}>
                    <Text style={{ fontSize: 32, color: theme.colors.secondary }}>+</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: '600', textAlign: 'center', marginTop: 2 }}>Adicionar</Text>
                </TouchableOpacity>
              </View>
              <Button variant="secondary" onPress={() => {
                setForm(prev => ({ ...prev, musicas: prev.musicas.filter((_, i) => i !== idx) }));
              }} style={{ marginTop: 8 }} iconRight="trash-outline">
                Remover Música
              </Button>
              <SelectSingerModal
                visible={modals.selectSinger && modals.musicaIdx === idx}
                onClose={() => setModals({ ...modals, selectSinger: false, musicaIdx: null })}
                cantores={cantoresDisponiveis}
                cantoresSelecionados={cantoresSelecionadosIds}
                onToggle={cantorId => onAddSinger(idx, cantorId)}
              />
            </View>
          );
        })}
        <Button
          title="SALVAR"
          onPress={handleSaveEdicao}
          style={{ marginTop: 24, marginBottom: 24 }}
          iconRight="arrow-forward"
        />
      </ScrollView>
      <BottomTab navigation={navigation} />
    </View>
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