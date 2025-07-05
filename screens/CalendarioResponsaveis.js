import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { db } from '../services/firebase';
import { collection, getDocs, setDoc, doc, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import styles from './Cadastro/CadastroLider.styles';
import Avatar from '../components/ui/Avatar';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isSameOrAfter);

export default function CalendarioResponsaveis({ navigation }) {
  const { userProfile } = useUser();
  const isLider = userProfile?.isLider;
  const igrejaId = userProfile?.igrejaId;
  const nomeLider = userProfile?.nome;

  const [selectedDate, setSelectedDate] = useState(null);
  const [responsaveis, setResponsaveis] = useState({}); // { '2021-07-31': { nome, userId } }
  const [modalVisible, setModalVisible] = useState(false);
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [loadingAtribuir, setLoadingAtribuir] = useState(false);

  // Buscar responsáveis do Firestore e dados atualizados dos usuários
  const fetchResponsaveis = useCallback(async () => {
    if (!igrejaId) return;
    setLoading(true);
    const snap = await getDocs(collection(db, 'igrejas', igrejaId, 'responsaveisRepertorio'));
    const data = {};
    const userIds = [];
    const today = dayjs().format('YYYY-MM-DD');
    snap.forEach(doc => {
      const d = doc.data();
      // Só adiciona se a data for hoje ou futura
      if (d.userId && d.dataISO && d.dataISO >= today) {
        data[d.dataISO] = { userId: d.userId };
        userIds.push(d.userId);
      }
    });
    // Buscar dados atualizados dos usuários
    const usuariosSnap = await getDocs(collection(db, 'igrejas', igrejaId, 'usuarios'));
    const usuariosMap = {};
    usuariosSnap.forEach(doc => { usuariosMap[doc.id] = doc.data(); });
    // Montar objeto final com dados atualizados
    Object.keys(data).forEach(date => {
      const userId = data[date].userId;
      const user = usuariosMap[userId] || {};
      data[date] = {
        userId,
        nome: user.nome || '',
        sobrenome: user.sobrenome || '',
        foto: user.foto || '',
      };
    });
    setResponsaveis(data);
    setLoading(false);
  }, [igrejaId]);

  // Buscar membros isMinisterForCults
  const fetchMembros = useCallback(async () => {
    if (!igrejaId) return;
    setLoadingMembros(true);
    const q = query(collection(db, 'igrejas', igrejaId, 'usuarios'), where('isMinisterForCults', '==', true));
    const snap = await getDocs(q);
    setMembros(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoadingMembros(false);
  }, [igrejaId]);

  useEffect(() => { fetchResponsaveis(); }, [fetchResponsaveis]);

  // Selecionar data
  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    if (isLider) {
      fetchMembros();
      setModalVisible(true);
    }
  };

  // Atribuir responsável: salvar apenas userId
  const atribuirResponsavel = async (membro) => {
    if (!selectedDate || !igrejaId) return;
    setLoadingAtribuir(true);
    await setDoc(doc(db, 'igrejas', igrejaId, 'responsaveisRepertorio', selectedDate), {
      dataISO: selectedDate,
      userId: membro.id,
      igrejaId,
      criadoPor: userProfile.userId,
      criadoEm: serverTimestamp(),
    });
    await fetchResponsaveis();
    setLoadingAtribuir(false);
    setModalVisible(false);
    Alert.alert('Responsável atribuído', `${membro.nome} foi notificado para criar o repertório do dia ${selectedDate.split('-').reverse().join('/')}`);
  };

  // Marcação dos dias
  const markedDates = Object.keys(responsaveis).reduce((acc, date) => {
    const resp = responsaveis[date];
    acc[date] = {
      marked: true,
      dotColor: '#22C55E',
      customStyles: {
        container: { backgroundColor: '#e6f7ee' },
        text: { color: '#233D35', fontWeight: 'bold' },
      },
      ...(resp && resp.foto ? { avatar: resp.foto } : {}),
      ...(resp && resp.nome ? { displayName: resp.nome } : {}),
    };
    return acc;
  }, {});
  if (selectedDate) markedDates[selectedDate] = { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: '#233D35' };

  // Excluir responsável
  const removerResponsavel = async () => {
    if (!selectedDate || !igrejaId) return;
    setLoadingAtribuir(true);
    await deleteDoc(doc(db, 'igrejas', igrejaId, 'responsaveisRepertorio', selectedDate));
    await fetchResponsaveis();
    setLoadingAtribuir(false);
    setModalVisible(false);
    Alert.alert('Responsável removido', `Nenhum responsável atribuído para o dia ${selectedDate.split('-').reverse().join('/')}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FB', padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#233D35', textAlign: 'center', marginBottom: 16 }}>Calendário de Responsáveis</Text>
      {loading && <ActivityIndicator color="#233D35" style={{ marginBottom: 10 }} />}
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        markingType="custom"
        theme={{
          todayTextColor: '#22C55E',
          arrowColor: '#233D35',
          textSectionTitleColor: '#233D35',
        }}
        style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 18 }}
      />
      {/* Lista de responsáveis */}
      <View style={{ marginTop: 10 }}>
        {Object.keys(responsaveis).length === 0 && (
          <Text style={{ color: '#888', textAlign: 'center' }}>Nenhum responsável atribuído ainda.</Text>
        )}
        {Object.entries(responsaveis)
          .filter(([date]) => dayjs(date).isSameOrAfter(dayjs(), 'day'))
          .map(([date, resp]) => (
            <View key={date} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'center' }}>
              <Avatar nome={resp.nome} sobrenome={resp.sobrenome} foto={resp.foto} size={24} style={{ marginRight: 6 }} />
              <Text style={{ color: '#233D35', fontWeight: 'bold' }}>{resp.nome}</Text>
              <Text style={{ color: '#888', marginLeft: 8 }}>({date.split('-').reverse().join('/')})</Text>
            </View>
          ))}
      </View>
      {/* Modal de seleção de responsável */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#233D35', marginBottom: 12 }}>Selecione o responsável</Text>
            {/* Se já existe responsável, mostrar info e botão de remover */}
            {responsaveis[selectedDate] && (
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Avatar nome={responsaveis[selectedDate].nome} sobrenome={responsaveis[selectedDate].sobrenome} foto={responsaveis[selectedDate].foto} size={40} />
                <Text style={{ color: '#233D35', fontWeight: 'bold', marginTop: 4 }}>{responsaveis[selectedDate].nome}</Text>
                <TouchableOpacity onPress={removerResponsavel} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#E53935', fontWeight: 'bold' }}>Remover responsável</Text>
                </TouchableOpacity>
              </View>
            )}
            {loadingMembros || loadingAtribuir ? <ActivityIndicator color="#233D35" /> : (
              <FlatList
                data={membros}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }} onPress={() => atribuirResponsavel(item)}>
                    <Feather name="user" size={18} color="#22C55E" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, color: '#233D35' }}>{item.nome} {item.sobrenome}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center' }}>Nenhum membro disponível.</Text>}
              />
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 18, alignSelf: 'center' }}>
              <Text style={{ color: '#233D35', fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
} 