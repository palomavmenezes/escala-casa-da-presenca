// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './contexts/UserContext';

// Importando Cadastros
import CadastroLider from './screens/Cadastro/CadastroLider';
import CadastroMembro from './screens/Cadastro/CadastroMembro';

// Importando telas de login e home
import Login from './screens/Auth/Login';
import Home from './screens/Home';
import Notificacoes from './screens/Notificacoes/Notificacoes';

// Importando a tela de Perfil
import MinhaConta from './screens/MinhaConta/MinhaConta';

// Importando a tela de Adicionar Músicas
import AdicionarMusica from './screens/Musicas/AdicionarMusica';
import EditarMusica from './screens/Musicas/EditarMusica';
import Musicas from './screens/Musicas/Musicas';
import Detalhes from './screens/Musicas/Detalhes';
import Musicos from './screens/Musicos/Musicos';

// Importando as telas de Escalas
import Escalas from './screens/Escalas/Escalas'
import CriarEscalas from './screens/Escalas/CriarEscalas';
import EscalaDetalhes from './screens/Escalas/EscalaDetalhes';
import EditarEscalas from './screens/Escalas/EditarEscala';

// Importando a tela de Pagamento
import Pagamento from './screens/Pagamentos/Pagamento';

// Importando a nova tela CalendarioResponsaveis
import CalendarioResponsaveis from './screens/CalendarioResponsaveis';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            {/* Antes do login */}
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="CadastroLider" component={CadastroLider} options={{ title: 'Cadastro de Grupo e Líder' }} />
            <Stack.Screen name="CadastroMembro" component={CadastroMembro} options={{ title: 'Cadastro de Membro' }} />
            <Stack.Screen name="Pagamento" component={Pagamento} options={{ title: 'Detalhes de Pagamento' }} />

            {/* Após login */}
            <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
            <Stack.Screen name="Escalas" component={Escalas} />
            <Stack.Screen name="CriarEscalas" component={CriarEscalas} options={{ title: 'Criar Repertório' }} />
            <Stack.Screen name="Musicas" component={Musicas} />
            <Stack.Screen name="Musicos" component={Musicos} />
            <Stack.Screen name="EditarMusica" component={EditarMusica} />
            <Stack.Screen name="AdicionarMusica" component={AdicionarMusica} />
            <Stack.Screen name="MusicaDetalhes" component={Detalhes} options={{ title: 'Detalhes da Música'  }} />
            <Stack.Screen name="EscalaDetalhes" component={EscalaDetalhes} options={{ title: 'Detalhes da Escala' }} />
            <Stack.Screen name="Notificacoes" component={Notificacoes} options={{ title: 'Notificações' }} />

            {/* Tela de Perfil */}
            <Stack.Screen name="MinhaConta" component={MinhaConta} options={{ title: 'Minha Conta' }} />
            
            {/* Perfil e Membros */}
            <Stack.Screen name="Membros" component={CadastroMembro} />

            {/* Nova tela CalendarioResponsaveis */}
            <Stack.Screen name="CalendarioResponsaveis" component={CalendarioResponsaveis} options={{ title: 'Calendário de Responsáveis' }} />

            {/* Nova tela EditarEscala */}
            <Stack.Screen name="EditarEscala" component={EditarEscalas} options={{ title: 'Editar Escala' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </UserProvider>
  );
}
