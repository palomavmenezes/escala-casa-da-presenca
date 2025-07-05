import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useEscalas } from '../../hooks/useEscalas';
import theme from '../../components/theme';
import BottomTab from '../../components/layout/BottomTab';
import EscalaCard from '../../components/domain/EscalaCard';
import ResponsibleMinisterCard from '../../components/domain/ResponsibleMinisterCard';

const calendarioImg = require('../../assets/img/calendar-illustration.png'); // Substitua pelo caminho correto da sua imagem ilustrativa

export default function Escalas({ navigation }) {
  const { escalas, loading } = useEscalas();
  const [tab, setTab] = useState('proximos');

  // Separar escalas em próximas e passadas
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proximas = escalas.filter(e => new Date(e.dataCulto) >= hoje);
  const passadas = escalas.filter(e => new Date(e.dataCulto) < hoje);
  const data = tab === 'proximos' ? proximas : passadas;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 18 }}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, marginBottom: 18 }}>
        <TouchableOpacity
          style={[styles.tab, tab === 'proximos' && styles.tabActive]}
          onPress={() => setTab('proximos')}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, tab === 'proximos' && styles.tabTextActive]}>PRÓXIMOS</Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={tab === 'proximos' ? theme.colors.primary : theme.colors.gray} 
              style={styles.tabIcon}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'passados' && styles.tabActive]}
          onPress={() => setTab('passados')}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, tab === 'passados' && styles.tabTextActive]}>PASSADOS</Text>
            <Ionicons 
              name="chevron-back" 
              size={16} 
              color={tab === 'passados' ? theme.colors.primary : theme.colors.gray} 
              style={styles.tabIcon}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Lista ou mensagem ilustrativa */}
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : data.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
          <Image source={calendarioImg} style={{ width: 180, height: 140, marginBottom: 24 }} resizeMode="contain" />
          <Text style={{ fontWeight: 'bold', color: theme.colors.primary, fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
            {tab === 'proximos' ? 'Nenhuma escala cadastrada' : 'Nenhum evento passado'}
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: 15, textAlign: 'center', maxWidth: 300 }}>
            {tab === 'proximos' 
              ? 'Parece que ainda não existem escalas cadastradas.\nSe você está escalado como responsável de algum culto, clique no ícone "+" e crie a próxima escala.'
              : 'Não há nenhum evento antigo para mostrar.'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('EscalaDetalhes', { escala: item })}
              activeOpacity={0.85}
            >
              <EscalaCard escala={item} />
            </TouchableOpacity>
          )}
        />
      )}
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderRadius: 24,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 0,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginLeft: 6,
  },
  tabActive: {
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: theme.colors.gray,
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDate: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    lineHeight: 22,
  },
  cardMonth: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: -2,
  },
  cardLabel: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  fabIcon: {
    color: theme.colors.white,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -2,
  },
});