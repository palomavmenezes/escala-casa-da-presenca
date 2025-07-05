import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; // useRoute para pegar os params
import { Feather } from '@expo/vector-icons'; // Para o ícone de copiar
import Button from '../../components/ui/Button';
import * as Clipboard from 'expo-clipboard'; // Importar Clipboard do Expo

export default function PaymentInfo() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;

  const pixKey = process.env.EXPO_PUBLIC_PIX_KEY || "Coloque a chave EXPO_PUBLIC_PIX_KEY no .env";
  const pixValue = "Uma oferta mensal";

  const pixQrCodeImage = require('../../assets/img/qrcode-pix.png')

  const copyToClipboard = async (text, message) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado!', message);
  };

  const handlePaymentConfirmed = () => {
    Alert.alert(
      'Pagamento Confirmado',
      'Seu pagamento será verificado em breve. Assim que for aprovado, você terá acesso total ao aplicativo. Obrigado!',
      [
        {
          text: 'OK',
          onPress: () => navigation.replace('Login') // Redireciona de volta para a tela de Login
        }
      ]
    );
    // IMPORTANTE: Aqui você NÃO atualiza o Firestore.
    // A atualização de `aprovado` e `modoProAtivo` para `true`
    // será feita **MANUALMENTE** por você/seu administrador
    // após verificar o recebimento do pagamento.
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Ative Sua Conta de Líder</Text>
      <Text style={styles.description}>
        Para ter acesso completo ao aplicativo e gerenciar seu grupo de musica, por favor, realize o pagamento mensal de **R${pixValue}**.
        Sua conta será ativada manualmente após a confirmação do pagamento.
      </Text>

      {/* Opção Pix */}
      <View style={styles.paymentMethodCard}>
        <Text style={styles.cardTitle}>Pague com Pix</Text>
        <Image
          source={pixQrCodeImage}
          style={styles.qrCodeImage}
        />
        <Text style={styles.pixLabel}>Valor</Text>
        <Text style={styles.pixValueText}>{pixValue}</Text>

        <Text style={styles.pixLabel}>Chave Pix:</Text>
        <View style={styles.pixKeyContainer}>
          <Text selectable={true} style={styles.pixKeyText}>{pixKey}</Text>
          <TouchableOpacity onPress={() => copyToClipboard(pixKey, 'Chave Pix copiada!')} style={styles.copyButton}>
            <Feather name="copy" size={20} color="#2e4a3f" />
          </TouchableOpacity>
        </View>
        <Text style={styles.pixInstructions}>
          Utilize o QR Code ou a chave Pix acima no aplicativo do seu banco para transferir o valor.
        </Text>
      </View>

      <Text style={styles.importantNote}>
        **Atenção:** Guarde o comprovante de pagamento. Sua conta será liberada em até 24h úteis após a confirmação do pagamento.
      </Text>

      <Button 
        title="JÁ FIZ O PAGAMENTO" 
        onPress={handlePaymentConfirmed}
        style={{ width: '100%', maxWidth: 400, marginBottom: 15 }}
        iconRight="check"
      />

      <Button 
        title="Voltar para o Login" 
        onPress={() => navigation.replace('Login')}
        variant="secondary"
        style={{ marginTop: 10 }}
        iconLeft="arrow-left"
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2e4a3f',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
    lineHeight: 24,
  },
  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  qrCodeImage: {
    width: 250, // Tamanho ajustado para o QR Code
    height: 250,
    resizeMode: 'contain',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
  },
  pixLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#444',
    alignSelf: 'flex-start',
    width: '100%',
    marginTop: 10,
  },
  pixValueText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e4a3f',
    marginBottom: 15,
    alignSelf: 'flex-start',
    width: '100%',
  },
  pixKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    width: '100%',
  },
  pixKeyText: {
    flex: 1,
    fontSize: 16,
    color: '#2e4a3f',
    fontWeight: 'bold',
  },
  copyButton: {
    marginLeft: 10,
    padding: 5,
  },
  pixInstructions: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  bankDetailLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#444',
    alignSelf: 'flex-start',
    width: '100%',
  },
  bankDetailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#2e4a3f',
    alignSelf: 'flex-start',
    width: '100%',
    paddingLeft: 5,
  },
  importantNote: {
    fontSize: 14,
    color: '#d9534f',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#33b85b',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 15,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToLoginButton: {
    marginTop: 10,
    padding: 10,
  },
  backToLoginText: {
    color: '#2e4a3f',
    fontSize: 16,
    fontWeight: 'bold',
  },
});