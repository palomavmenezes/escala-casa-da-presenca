import React, { useState, useEffect } from 'react';
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
import { collection, addDoc, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomTab from '../../components/layout/BottomTab';
import { Ionicons } from '@expo/vector-icons';
import SectionTitle from '../../components/ui/SectionTitle';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CustomModal from '../../components/ui/Modal';
import theme from '../../components/theme';
import MusicianGrid from '../../components/domain/MusicianGrid';
import SelectMusicianModal from '../../components/domain/SelectMusicianModal';
import SelectAreaModal from '../../components/domain/SelectAreaModal';
import SelectMusicModal from '../../components/domain/SelectMusicModal';
import SelectSingerModal from '../../components/domain/SelectSingerModal';
import { useCriarEscala } from '../../hooks/useCriarEscala';
import Avatar from '../../components/ui/Avatar';

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const areaOptions = [
  'Cantor(a)', 'Teclado', 'Guitarra', 'Baixo', 'Bateria', 'Violão', 'Backing Vocal', 'Apoio Técnico'
];

export default function CriarEscalas({ navigation }) {
  const {
    ministros,
    musicas,
    escala,
    setEscala,
    handleAddMusico,
    handleRemoveMusico,
    handleAddMusica,
    handleRemoveMusica,
    handleSaveEscala,
    modals,
    setModals,
    handleSelectMusician,
    handleSelectArea,
    handleSelectMusic,
    handleSelectSinger,
    loading,
    errors,
    setErrors
  } = useCriarEscala();

  // Estado para inputs de ensaio
  const [marcarEnsaio, setMarcarEnsaio] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEnsaioDatePicker, setShowEnsaioDatePicker] = useState(false);
  const [showEnsaioTimePicker, setShowEnsaioTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  // Estado local para áreas selecionadas na modal
  const [selectedAreas, setSelectedAreas] = useState([]);

  // Adicionar usuário logado automaticamente como ministro
  useEffect(() => {
    if (auth.currentUser && ministros.length > 0 && escala.ministros.length === 0) {
      const user = ministros.find(m => m.id === auth.currentUser.uid);
      if (user) {
        setEscala(prev => ({ ...prev, ministros: [user] }));
      }
    }
  }, [ministros]);

  useEffect(() => {
    navigation.setOptions({ title: 'Cadastrando Escala' });
  }, [navigation]);

  // Lógica para adicionar músico e abrir modal de área
  const onSelectMusician = (musico) => {
    if ((escala.ministros || []).some(m => m.id === musico.id)) return; // já escalado, não faz nada
    handleAddMusico(musico);
    setSelectedAreas(musico.areas || []);
    setModals((m) => ({ ...m, selectMusician: false, selectArea: true, areaMusico: musico }));
  };

  // Lógica para salvar áreas do músico
  const onSaveAreas = () => {
    setEscala((prev) => ({
      ...prev,
      ministros: prev.ministros.map(m =>
        m.id === modals.areaMusico.id ? { ...m, areas: selectedAreas } : m
      )
    }));
    setModals((m) => ({ ...m, selectArea: false, areaMusico: null }));
    setSelectedAreas([]);
  };

  // Alternar seleção de área
  const onToggleArea = (area) => {
    setSelectedAreas((prev) =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  // Lógica para adicionar cantor a uma música (agora adiciona apenas o id)
  const onAddSinger = (musicaIdx, cantorId) => {
    setEscala((prev) => {
      const musicas = [...prev.musicas];
      const cantores = musicas[musicaIdx].cantores || [];
      if (!cantores.includes(cantorId)) {
        musicas[musicaIdx].cantores = [...cantores, cantorId];
      }
      return { ...prev, musicas };
    });
    setModals((m) => ({ ...m, selectSinger: false, musicaIdx: null }));
  };

  // Handlers para DateTimePicker
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setEscala({ ...escala, dataCulto: formattedDate });
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toTimeString().split(' ')[0].substring(0, 5);
      setEscala({ ...escala, horaCulto: formattedTime });
    }
  };

  const onEnsaioDateChange = (event, selectedDate) => {
    setShowEnsaioDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setEscala({ ...escala, dataEnsaio: formattedDate });
    }
  };

  const onEnsaioTimeChange = (event, selectedTime) => {
    setShowEnsaioTimePicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toTimeString().split(' ')[0].substring(0, 5);
      setEscala({ ...escala, horaEnsaio: formattedTime });
    }
  };

  // Função para formatar a lista de músicas selecionadas
  const getMusicasText = () => {
    if (!escala.musicas || escala.musicas.length === 0) {
      return 'Selecione as músicas';
    }
    return escala.musicas.map(m => m.titulo || m.nome).join(', ');
  };

  // Ao salvar a escala, garantir que cada música salva apenas os IDs dos cantores
  const musicasParaSalvar = (escala.musicas || []).map(musica => ({
    ...musica,
    cantores: (musica.cantores || []).map(c => typeof c === 'string' ? c : c.id),
  }));

  return (
    <>
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ paddingHorizontal: 18, paddingTop: 18 }}>
      {/* Data do culto */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Input 
          value={escala.dataCulto} 
          onChangeText={text => setEscala({ ...escala, dataCulto: text })} 
          placeholder="Selecione a data do culto" 
          editable={false}
        />
      </TouchableOpacity>

      {/* Hora do culto */}
      <TouchableOpacity onPress={() => setShowTimePicker(true)}>
        <Input 
          value={escala.horaCulto || ''} 
          onChangeText={text => setEscala({ ...escala, horaCulto: text })} 
          placeholder="Selecione a hora do culto" 
          editable={false}
        />
      </TouchableOpacity>

      {/* DateTimePickers */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
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
              value={escala.dataEnsaio || ''} 
              onChangeText={text => setEscala({ ...escala, dataEnsaio: text })} 
              placeholder="Selecione a data do ensaio" 
              editable={false}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEnsaioTimePicker(true)}>
            <Input 
              value={escala.horaEnsaio || ''} 
              onChangeText={text => setEscala({ ...escala, horaEnsaio: text })} 
              placeholder="Selecione a hora do ensaio" 
              editable={false}
            />
          </TouchableOpacity>
          
          {/* DateTimePickers para ensaio */}
          {showEnsaioDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={onEnsaioDateChange}
            />
          )}
          {showEnsaioTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={onEnsaioTimeChange}
            />
          )}
        </>
      )}

      <SectionTitle style={{ marginTop: 24, marginBottom: 8 }}>Músicos</SectionTitle>
      <MusicianGrid
        musicians={escala.ministros || []}
        onAdd={() => setModals({ ...modals, selectMusician: true })}
        onRemove={(musico) => {
          // Impede remover o usuário logado
          if (musico.id !== auth.currentUser?.uid) {
            const idx = escala.ministros.findIndex(m => m.id === musico.id);
            if (idx !== -1) handleRemoveMusico(idx);
          }
        }}
        onEditArea={(musico) => {
          setSelectedAreas(musico.areas || []);
          setModals({ ...modals, selectArea: true, areaMusico: musico });
        }}
      />
      <SelectMusicianModal
        visible={modals.selectMusician}
        onClose={() => setModals({ ...modals, selectMusician: false })}
        onSelect={onSelectMusician}
        ministros={(ministros || []).filter(m => !(escala.ministros || []).some(e => e.id === m.id))}
        ministrosEscalados={escala.ministros || []}
      />
      <SelectAreaModal
        visible={modals.selectArea}
        onClose={() => { setModals({ ...modals, selectArea: false, areaMusico: null }); setSelectedAreas([]); }}
        areaOptions={areaOptions}
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
      
      {(escala.musicas || []).map((musica, idx) => {
        // Filtrar cantores escalados
        const cantoresEscalados = (escala.ministros || []).filter(m => (m.areas || []).includes('Cantor(a)'));
        // Filtrar para não mostrar quem já está na lista de cantores da música
        const cantoresDisponiveis = cantoresEscalados.filter(m => !(musica.cantores || []).some(c => c.id === m.id));
        // IDs dos cantores já selecionados
        const cantoresSelecionadosIds = (musica.cantores || []).map(c => c.id);

        return (
          <View key={musica.id || idx} style={{ backgroundColor: '#F7F7F7', borderRadius: 16, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white }}>
            <Text style={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 15, marginBottom: 4 }}>{`${idx + 1}. ${musica.titulo || musica.nome}`}</Text>
            <Input
              label="Tom"
              value={musica.tom || ''}
              placeholder="Digite o tom da música"
              onChangeText={text => {
                const musicas = [...escala.musicas];
                musicas[idx] = { ...musicas[idx], tom: text };
                setEscala({ ...escala, musicas });
              }}
              style={{ marginBottom: 8 }}
            />
            <Input
              label="Cifra"
              value={musica.cifra || ''}
              placeholder="Link da cifra"
              onChangeText={text => {
                const musicas = [...escala.musicas];
                musicas[idx] = { ...musicas[idx], cifra: text };
                setEscala({ ...escala, musicas });
              }}
              style={{ marginBottom: 8 }}
            />
            <Input
              label="Vídeo"
              value={musica.video || ''}
              placeholder="Link do vídeo"
              onChangeText={text => {
                const musicas = [...escala.musicas];
                musicas[idx] = { ...musicas[idx], video: text };
                setEscala({ ...escala, musicas });
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
                            const musicas = [...escala.musicas];
                            musicas[idx].cantores = (musicas[idx].cantores || []).filter((_, i) => i !== cidx);
                            setEscala({ ...escala, musicas });
                          }}
                        >
                          <Ionicons name="close" size={16} color={theme.colors.primary} />
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
                  <Ionicons name="add" size={32} color={theme.colors.secondary} />
                </View>
                <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: '600', textAlign: 'center', marginTop: 2 }}>Adicionar</Text>
              </TouchableOpacity>
            </View>
            <Button variant="secondary" onPress={() => handleRemoveMusica(idx)} style={{ marginTop: 8 }} iconRight="trash-outline">
              Remover Música
            </Button>
            <SelectSingerModal
              visible={modals.selectSinger && modals.musicaIdx === idx}
              onClose={() => setModals({ ...modals, selectSinger: false, musicaIdx: null })}
              cantores={cantoresDisponiveis}
              cantoresSelecionados={cantoresSelecionadosIds}
              onToggle={(cantorId) => {
                setEscala((prev) => {
                  const musicas = [...prev.musicas];
                  const cantores = musicas[idx]?.cantores || [];
                  const jaSelecionado = cantores.some(c => c.id === cantorId);
                  if (jaSelecionado) {
                    musicas[idx].cantores = cantores.filter(c => c.id !== cantorId);
                  } else {
                    const cantor = ministros.find(m => m.id === cantorId);
                    if (cantor) musicas[idx].cantores = [...cantores, cantor];
                  }
                  return { ...prev, musicas };
                });
              }}
              getIniciais={(nome) => {
                if (!nome) return '';
                const partes = nome.trim().split(' ');
                let iniciais = partes[0][0].toUpperCase();
                if (partes.length > 1) iniciais += partes[partes.length - 1][0].toUpperCase();
                return iniciais;
              }}
            />
          </View>
        );
      })}
      <SelectMusicModal
        visible={modals.selectMusic}
        onClose={() => setModals({ ...modals, selectMusic: false })}
        onSelect={handleSelectMusic}
        musicas={musicas || []}
        musicasSelecionadas={escala.musicas || []}
      />

      <Button onPress={handleSaveEscala} style={{ marginTop: 10, marginBottom: 68 }} iconRight="checkmark-outline">
        {loading ? 'Salvando...' : 'Salvar Escala'}
      </Button>
      
      <CustomModal visible={!!errors.global} onClose={() => setErrors({ ...errors, global: '' })} title="Erro">
        <Text style={{ color: theme.colors.danger, textAlign: 'center' }}>{errors.global}</Text>
      </CustomModal>
      </ScrollView>
    </View>
    <BottomTab /></>
  );
}