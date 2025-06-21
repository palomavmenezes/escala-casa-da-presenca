// components/Menu/Menu.styles.js
import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  // Container principal que cobre toda a tela quando o menu está aberto
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Camada escura transparente
    justifyContent: 'flex-start', // Alinha o menu no início (esquerda)
    alignItems: 'flex-start', // Alinha o menu no topo
  },
  // O container visível do menu que desliza
  menuContainer: {
    width: '80%', // Largura do menu (80% da tela)
    maxWidth: 300, // Largura máxima para telas maiores
    backgroundColor: '#fff',
    height: '100%', // Ocupa a altura total da tela
    paddingHorizontal: 20,
    elevation: 10, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  // Área segura para o conteúdo dentro do menu (evita notch/barras de status)
  safeAreaContent: {
    flex: 1, // Permite que o conteúdo interno ocupe o espaço
  },
  // Botão de fechar (X)
  closeButtonContainer: {
    alignSelf: 'flex-end', // Alinha o botão X à direita dentro de seu container
    padding: 10, // Área clicável maior
    marginTop: Platform.OS === 'ios' ? 10 : 0, // Ajuste para iOS status bar
    marginBottom: 10,
  },
  // Container do perfil do usuário (foto, nome, badge)
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DDF7EE', // Cor de fundo para avatar sem foto
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A3A3A',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileRoleBadge: {
    backgroundColor: '#6ACF9E',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start', // Alinha o badge com o texto
  },
  profileRoleText: {
    fontSize: 12,
    color: '#003D29',
    fontWeight: 'bold',
  },
  // Logo da Igreja
  churchLogoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  churchLogo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  // Itens do menu (links de navegação)
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  // Badge de notificação (círculo vermelho com número)
  notificationBadge: {
    backgroundColor: '#FF5C5C', // Vermelho para notificações
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto', // Alinha à direita
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Botão Sair
  logoutButton: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#dc3545', // Vermelho para "Sair"
    marginLeft: 15,
    fontWeight: '500',
  },
  // Mensagens de erro/carregamento no menu
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default styles;