// screens/MinhaConta/MinhaConta.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { auth, db } from '../../services/firebase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, updateDoc, collection, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import styles from './MinhaConta.styles'; // Importa os estilos
import SectionTitle from '../../components/ui/SectionTitle';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import theme from '../../components/theme';
import { useUser } from '../../contexts/UserContext';

export default function MinhaConta() {
  const navigation = useNavigation();
  const { userProfile } = useUser();
  const isLider = userProfile?.isLider === true;
  const [logo, setLogo] = useState(null);
  const [nomeIgreja, setNomeIgreja] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState(''); // Email geralmente não é editável diretamente
  const [telefone, setTelefone] = useState(''); // Campo telefone
  const [foto, setFoto] = useState(null); // URL da foto
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [churchId, setChurchId] = useState(null);
  const [instrumentOptions, setInstrumentOptions] = useState([]); // Opções dinâmicas de instrumentos/roles
  const [selectedInstruments, setSelectedInstruments] = useState([]); // Instrumentos selecionados pelo usuário
  const [novaLogoIgreja, setNovaLogoIgreja] = useState(null);

  const instrumentOptionsList = ['Vocal', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Backing Vocal', 'Apoio Técnico'];

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      setLoading(false);
      return;
    }

    let foundIgrejaId = null;
    let userData = null;

    try {
      // 1. Encontrar a igreja do usuário
      const igrejasSnapshot = await getDocs(collection(db, 'igrejas'));
      for (const docIgreja of igrejasSnapshot.docs) {
        const userDocRef = doc(db, 'igrejas', docIgreja.id, 'usuarios', currentUser.uid);

        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          foundIgrejaId = docIgreja.id;

          break;
        }
      }

      if (userData && foundIgrejaId) {
        setChurchId(foundIgrejaId);
        setNome(userData.nome || '');
        setSobrenome(userData.sobrenome || '');
        setEmail(currentUser.email || '');
        setTelefone(userData.telefone || '');
        // Garantir que a foto seja uma string válida ou null
        const fotoUrl = userData.foto && typeof userData.foto === 'string' && userData.foto.trim() !== '' ? userData.foto : null;
        setFoto(fotoUrl);
        setSelectedInstruments(userData.instruments || []);
      } else {
        Alert.alert('Erro', 'Perfil de usuário não encontrado no Firestore.');
        navigation.goBack();
      }
    } catch (e) {
      console.error("Erro ao buscar perfil do usuário:", e);
      Alert.alert('Erro', 'Não foi possível carregar seu perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      // Opcional: Solicitar permissões de mídia ao focar na tela
      (async () => {
        if (Platform.OS !== 'web') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Desculpe, precisamos de permissão para acessar suas fotos para que isso funcione!');
          }
        }
      })();
    }, [fetchUserProfile])
  );

  useEffect(() => {
    if (userProfile?.igrejaId) {
      // Buscar dados da igreja
      const fetchIgreja = async () => {
        const igrejaDoc = await getDoc(doc(db, 'igrejas', userProfile.igrejaId));
        if (igrejaDoc.exists()) {
          const data = igrejaDoc.data();
          setLogo(data.logo || null);
          setNomeIgreja(data.nomeIgreja || '');
        }
      };
      fetchIgreja();
    }
  }, [userProfile?.igrejaId]);

  const handleChoosePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    let selectedUri;

    if (result?.assets && result.assets.length > 0) {
      selectedUri = result.assets[0].uri;
    } else if (result?.uri) {
      selectedUri = result.uri;
    }

    if (selectedUri) {
      await uploadProfilePhoto(selectedUri);
    } else if (!result.canceled) {
      Alert.alert("Erro", "Não foi possível selecionar a imagem.");
    }
  };

  const uploadProfilePhoto = async (uri) => {
    if (!churchId || !auth.currentUser?.uid) {
      Alert.alert('Erro', 'Dados de usuário ou igreja ausentes para upload.');
      return;
    }

    setLoading(true);
    const storage = getStorage();
    // Novo caminho organizado por igreja e usuário
    const fileName = `igrejas/${churchId}/usuarios/${auth.currentUser.uid}/fotoPerfil.jpg`;
    const storageRef = ref(storage, fileName);

    try {
      // Deletar foto antiga se existir
      if (userProfile?.foto) {
        const oldPhotoRef = ref(storage, userProfile.foto);
        try {
          await deleteObject(oldPhotoRef);

        } catch (e) {
          console.warn("Não foi possível deletar foto antiga (pode não existir ou permissão).", e);
        }
      }

      // Upload da nova foto
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const newPhotoURL = await getDownloadURL(storageRef);

      // Atualizar URL da foto no Firestore
      const userDocRef = doc(db, 'igrejas', churchId, 'usuarios', auth.currentUser.uid);
      await updateDoc(userDocRef, { foto: newPhotoURL });

      setFoto(newPhotoURL);
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (e) {
      console.error("Erro ao fazer upload ou atualizar foto:", e);
      Alert.alert('Erro', `Não foi possível atualizar a foto. ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!userProfile?.foto) {
      Alert.alert('Info', 'Você não tem uma foto de perfil para remover.');
      return;
    }
    if (!churchId || !auth.currentUser?.uid) {
      Alert.alert('Erro', 'Dados de usuário ou igreja ausentes para remover foto.');
      return;
    }

    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja remover sua foto de perfil?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          onPress: async () => {
            setLoading(true);
            const storage = getStorage();
            const photoRef = ref(storage, userProfile.foto); // Use a URL completa da foto como referência

            try {
              await deleteObject(photoRef);
              const userDocRef = doc(db, 'igrejas', churchId, 'usuarios', auth.currentUser.uid);
              await updateDoc(userDocRef, { foto: null }); // Remove o campo foto no Firestore

              setFoto(null); // Limpa a pré-visualização
              Alert.alert('Sucesso', 'Foto de perfil removida!');
            } catch (e) {
              console.error("Erro ao remover foto:", e);
              Alert.alert('Erro', `Não foi possível remover a foto. ${e.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleChooseLogo = async () => {
    if (!isEditing || !userProfile?.isLider || !userProfile?.igrejaId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    let selectedUri = result?.assets && result.assets.length > 0 ? result.assets[0].uri : result.uri;
    if (!selectedUri) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
      return;
    }
    setLoading(true);
    try {
      const storage = getStorage();
      const fileName = `igrejas/${userProfile.igrejaId}/logo.jpg`;
      const storageRef = ref(storage, fileName);
      const response = await fetch(selectedUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const newLogoURL = await getDownloadURL(storageRef);
      setNovaLogoIgreja(newLogoURL);
      Alert.alert('Sucesso', 'Logo enviada! Clique em Salvar para aplicar.');
    } catch (e) {
      console.error('Erro real ao enviar logo:', e);
      Alert.alert('Erro', 'Não foi possível enviar a logo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser || !churchId) {
      Alert.alert('Erro', 'Usuário não autenticado ou ID da igreja ausente.');
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, 'igrejas', churchId, 'usuarios', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        nome: nome,
        sobrenome: sobrenome,
        telefone: telefone,
        instruments: selectedInstruments,
      });
      if (novaLogoIgreja && isLider) {

        await updateDoc(doc(db, 'igrejas', churchId), { logo: novaLogoIgreja });
        setLogo(novaLogoIgreja);
        setNovaLogoIgreja(null);
      }
      setIsEditing(false);
      Alert.alert('Sucesso', 'Seu perfil foi atualizado!');
    } catch (e) {
      Alert.alert('Erro', `Não foi possível salvar seu perfil. ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleInstrument = (instrument) => {
    setSelectedInstruments(prev => {
      if (prev.includes(instrument)) {
        return prev.filter(item => item !== instrument);
      } else {
        return [...prev, instrument];
      }
    });
  };

  const getInitials = (firstName = '', lastName = '') => {
    return `${firstName.charAt(0)?.toUpperCase() || ''}${lastName.charAt(0)?.toUpperCase() || ''}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003D29" />
        <Text style={styles.loadingText}>Carregando seu perfil...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Não foi possível carregar o perfil do usuário.</Text>
        <Button onPress={() => navigation.goBack()} iconLeft="arrow-back" style={styles.button}>
          Voltar
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileImageContainer}>
        <Avatar 
          foto={foto}
          nome={nome}
          sobrenome={sobrenome}
          size={120}
        />
        {isEditing && (
          <View style={styles.photoActionButtons}>
            <TouchableOpacity style={styles.changePhotoButton} onPress={handleChoosePhoto}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.changePhotoText}>Alterar Foto</Text>
            </TouchableOpacity>
            {foto && (
              <TouchableOpacity style={styles.removePhotoButton} onPress={handleRemovePhoto}>
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.removePhotoText}>Remover Foto</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nome:</Text>
        <Input
          style={isEditing ? styles.inputEditable : styles.inputDisplay}
          value={nome}
          onChangeText={setNome}
          editable={isEditing}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sobrenome:</Text>
        <Input
          style={isEditing ? styles.inputEditable : styles.inputDisplay}
          value={sobrenome}
          onChangeText={setSobrenome}
          editable={isEditing}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email:</Text>
        <Input
          style={styles.inputDisplay}
          value={email}
          editable={false} // Email não editável diretamente
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Telefone:</Text>
        <Input
          style={isEditing ? styles.inputEditable : styles.inputDisplay}
          value={telefone}
          onChangeText={setTelefone}
          editable={isEditing}
          placeholder="Digite seu telefone"
          keyboardType="phone-pad"
        />
      </View>

      {isEditing && (
        <View style={styles.instrumentSelectionContainer}>
          <Text style={styles.label}>Meus Instrumentos/Papéis:</Text>
          <View style={styles.instrumentGrid}>
            {instrumentOptionsList.map((instrument) => (
              <TouchableOpacity
                key={instrument}
                style={[
                  styles.instrumentBadge,
                  selectedInstruments.includes(instrument) && styles.instrumentBadgeSelected,
                ]}
                onPress={() => toggleInstrument(instrument)}
              >
                <Text style={[
                  styles.instrumentBadgeText,
                  selectedInstruments.includes(instrument) && styles.instrumentBadgeTextSelected,
                ]}>
                  {instrument}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isLider && (
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          {(novaLogoIgreja || logo) ? (
            <Image source={{ uri: novaLogoIgreja || logo }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 8 }} />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 18 }}>{nomeIgreja || 'Sua Igreja'}</Text>
            </View>
          )}
          {isEditing && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={handleChooseLogo}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.changePhotoText}>Alterar Imagem da Igreja</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!isEditing ? (
        <Button style={styles.editButton} onPress={() => setIsEditing(true)} iconRight="create-outline">
          Editar Perfil
        </Button>
      ) : (
        <View style={styles.actionButtons}>
          <Button style={styles.saveButton} onPress={handleSaveProfile} iconRight="checkmark-outline">
            Salvar
          </Button>
          <Button style={styles.cancelButton} onPress={() => {
            setIsEditing(false);
            fetchUserProfile(); // Recarrega os dados originais para descartar edições
          }} iconRight="close-outline">
            Cancelar
          </Button>
        </View>
      )}
    </ScrollView>
  );
}