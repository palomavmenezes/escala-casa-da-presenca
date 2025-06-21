// screens/Notificacoes/Notificacoes.styles.js
import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003D29',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#003D29',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardUnread: {
    borderLeftWidth: 5,
    borderLeftColor: '#003D29',
  },
  notificationMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  notificationMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Alinha botões à direita
    marginTop: 10,
    gap: 10, // Espaçamento entre os botões
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  approveButton: {
    backgroundColor: '#28a745', // Verde
  },
  denyButton: {
    backgroundColor: '#dc3545', // Vermelho
  },
  viewButton: {
    backgroundColor: '#007bff', // Azul
  },
  markAsReadButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-end', // Alinha à direita
  },
  markAsReadText: {
    fontSize: 12,
    color: '#555',
  },
});

export default styles;