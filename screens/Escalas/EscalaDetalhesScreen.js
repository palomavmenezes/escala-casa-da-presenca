import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import BottomTab from '../../components/BottomTab';

export default function EscalaDetalhesScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { escala } = route.params;
    const [ministros, setMinistros] = useState([]);
    const [ministroResponsavel, setMinistroResponsavel] = useState(null);

    useEffect(() => {
        const carregarMinistros = async () => {
            try {
                const snap = await getDocs(collection(db, 'ministros'));
                const todos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const escalados = escala.usuariosEscalados || [];
                const filtrados = todos.filter(m => escalados.includes(m.id));
                const responsavel = todos.find(m => m.nome === escala.ministroResponsavel);

                setMinistros(filtrados);
                setMinistroResponsavel(responsavel);
            } catch (error) {
                console.error('Erro ao carregar ministros:', error);
            }
        };

        carregarMinistros();
    }, []);

    const getIniciais = (nome = '', sobrenome = '') => {
        const nomes = nome.trim().split(' ');
        const primeiraLetra = nomes[0]?.[0]?.toUpperCase() || '';
        const segundaLetra = nomes[1]?.[0]?.toUpperCase() || sobrenome?.[0]?.toUpperCase() || '';
        return primeiraLetra + segundaLetra;
    };

    const getYouTubeEmbedUrl = url => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    };

    return (
        <><ScrollView contentContainerStyle={styles.container}>
            {/* Ministro responsável */}
            {ministroResponsavel && (
                <View style={styles.responsavelContainer}>
                    <Image source={{ uri: ministroResponsavel.foto }} style={styles.responsavelFoto} />
                    <View>
                        <Text style={styles.responsavelTitulo}>Ministro Responsável</Text>
                        <Text style={styles.responsavelNome}>{ministroResponsavel.nome}</Text>
                    </View>
                </View>
            )}

            {/* Data do Culto */}
            <Text style={styles.dataCulto}>Culto {escala.dataCulto}:</Text>

            {/* Ministros Escalados */}
            <View style={styles.ministrosGrid}>
                {ministros.map(m => (
                    <View key={m.id} style={styles.ministroItem}>
                        {m.foto ? (
                            <Image source={{ uri: m.foto }} style={styles.fotoMinistro} />
                        ) : (
                            <View style={styles.iniciaisBox}>
                                <Text style={styles.iniciais}>{getIniciais(m.nome, m.sobrenome)}</Text>
                            </View>
                        )}
                        <Text style={styles.nomeMinistro}>{m.nome}</Text>
                        <Text style={styles.cargoMinistro}>{m.area}</Text>
                    </View>
                ))}
            </View>

            {/* Ensaio */}
            {escala.dataEnsaio && (
                <View style={styles.ensaioBox}>
                    <Text style={styles.ensaioTexto}>
                        Ensaio: {escala.dataEnsaio} às {escala.horaEnsaio}
                    </Text>
                </View>
            )}

            {/* Louvores */}
            {escala.musicas?.map((musica, index) => (
                <View key={index} style={styles.cardMusica}>
                    <View style={styles.headerMusica}>
                        <Text style={styles.nomeMusica}>{index + 1}. {musica.musicaNome}</Text>
                        <View style={styles.tomBox}>
                            <Text style={styles.tomTexto}>Tom {musica.tom || '-'}</Text>
                        </View>
                    </View>

                    {/* Vozes */}
                    {Array.isArray(musica.cantores) && musica.cantores.length > 0 && (
                        <View style={styles.vozesContainer}>
                            <Text style={styles.vozesTitulo}>Nas vozes de:</Text>
                            <View style={styles.vozesFotos}>
                                {musica.cantores.map((cantorId) => {
                                    const ministro = ministros.find(m => m.id === cantorId);
                                    if (!ministro) return null;

                                    return (
                                        <View key={cantorId} style={styles.vozItem}>
                                            {ministro.foto ? (
                                                <Image source={{ uri: ministro.foto }} style={styles.vozFoto} />
                                            ) : (
                                                <View style={styles.iniciaisBoxVoz}>
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
                    {musica.video && (
                        <View style={styles.videoContainer}>
                            <WebView
                                style={styles.webview}
                                javaScriptEnabled
                                domStorageEnabled
                                source={{ uri: getYouTubeEmbedUrl(musica.video) }} />
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
            ))}
        </ScrollView><BottomTab /></>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: 60,
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
    ministrosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    ministroItem: {
        width: '25%',
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
    },
    cargoMinistro: {
        fontSize: 12,
        color: '#6B7280',
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
    },
    tomBox: {
        backgroundColor: '#6EE7B7',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
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
    },
    vozesTitulo: {
        fontWeight: '600',
        color: '#444',
        marginBottom: 8,
    },
    vozesFotos: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    vozItem: {
        alignItems: 'center',
        marginRight: 12,
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
        marginBottom: 30,
        textAlign: 'center',
        color: '#374151',
    }
});
