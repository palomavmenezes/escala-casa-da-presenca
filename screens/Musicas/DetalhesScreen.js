import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomTab from '../../components/BottomTab';

export default function DetalhesScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { musica } = route.params;

  const getYouTubeEmbedUrl = (url) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    const videoId = match ? match[1] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const abrirCifra = () => {
    if (musica.cifra) {
      Linking.openURL(musica.cifra);
    }
  };

  return (
    <><View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.nome}>{musica.nome}</Text>

        {musica.video ? (
          <View style={styles.videoContainer}>
            <WebView
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              source={{ uri: getYouTubeEmbedUrl(musica.video) }} />
          </View>
        ) : (
          <Text style={styles.semVideo}>Sem vídeo disponível</Text>
        )}

        {musica.cifra && (
          <TouchableOpacity style={styles.botaoCifra} onPress={abrirCifra}>
            <Ionicons name="musical-notes" size={20} color="#fff" />
            <Text style={styles.textoBotao}>Abrir Cifra no Cifra Club</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View><BottomTab /></>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
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
    marginBottom: 20,
    color: '#000',
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
  botaoCifra: {
    flexDirection: 'row',
    backgroundColor: '#2F4F4F',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotao: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
});
