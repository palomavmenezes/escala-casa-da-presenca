// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importando Cadastros
import CadastroLider from './screens/Cadastro/CadastroLider';
import CadastroMembro from './screens/Cadastro/CadastroMembro';

// Importando telas de login e home
import Login from './screens/Auth/Login';
import Home from './screens/Home';
import Perfil from './screens/Perfil';
import Notificacoes from './screens/Notificacoes/Notificacoes';

// Importando a tela de Adicionar Músicas
import AdicionarMusica from './screens/Musicas/AdicionarMusica';
import EditarMusica from './screens/Musicas/EditarMusica';
import Musicas from './screens/Musicas/Musicas';
import Detalhes from './screens/Musicas/Detalhes';

// Importando as telas de Escalas
import Escalas from './screens/Escalas/Escalas'
import CriarEscalas from './screens/Escalas/CriarEscalas';
import EscalaDetalhes from './screens/Escalas/EscalaDetalhes';

// Importando a tela de Pagamento
import Pagamento from './screens/Pagamentos/Pagamento'; 
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Antes do login */}
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="CadastroLider" component={CadastroLider} options={{ title: 'Cadastro de Líder' }} />
          <Stack.Screen name="CadastroMembro" component={CadastroMembro} options={{ title: 'Cadastro de Membro' }} />
          <Stack.Screen name="Pagamento" component={Pagamento} options={{ title: 'Detalhes de Pagamento' }} />

          {/* Após login */}
          <Stack.Screen name="Home" component={Home} options={{ title: 'Bem-vindo' }} />
          <Stack.Screen name="Escalas" component={Escalas} />
          <Stack.Screen name="CriarEscalas" component={CriarEscalas} />
          <Stack.Screen name="Musicas" component={Musicas} />
          <Stack.Screen name="EditarMusica" component={EditarMusica} />
          <Stack.Screen name="AdicionarMusica" component={AdicionarMusica} />
          <Stack.Screen name="MusicaDetalhes" component={Detalhes} options={{ headerShown: false }} />
          <Stack.Screen name="EscalaDetalhes" component={EscalaDetalhes} options={{ title: 'Detalhes da Escala' }} />
          <Stack.Screen name="Notificacoes" component={Notificacoes} options={{ title: 'Notificações' }} />
          
          {/* Perfil e Membros */}
          <Stack.Screen name="Perfil" component={Perfil} />
          <Stack.Screen name="Membros" component={CadastroMembro} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
