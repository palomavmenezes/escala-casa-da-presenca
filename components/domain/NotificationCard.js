import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import theme from '../../components/theme';
import { getTempoRelativo } from '../../utils/escala';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function NotificationCard({ notification, allUsers = [], onAprovar, onRejeitar, onPress, onMarkAsRead }) {
  const { criadoPor, message, timestamp, type, igrejaId, senderName, senderPhoto, senderSobrenome, read } = notification;
  const [userData, setUserData] = useState({ nome: '', sobrenome: '', foto: null });
  const [actionTaken, setActionTaken] = useState(null); // 'approved' | 'rejected' | null

  // Função para buscar usuário por ID (como em EscalaDetalhes)
  const getUserById = (id) => {
    return allUsers.find(user => user.id === id);
  };

  // Verificar se é uma notificação de solicitação de cadastro
  const isMemberRequest = type === 'novo_membro' || type === 'member_approval';

  // Verificar se deve ser clicável
  const isClickable = !isMemberRequest && onPress;

  // Função para lidar com clique no card
  const handleCardPress = async () => {
    // Marcar como lido se não estiver lida
    if (!read && onMarkAsRead) {
      await onMarkAsRead(notification);
    }
    
    // Executar ação de navegação se existir
    if (onPress) {
      onPress(notification);
    }
  };

  // Funções para lidar com aprovação/rejeição
  const handleApprove = async () => {
    if (onAprovar) {
      await onAprovar();
      setActionTaken('approved');
    }
  };

  const handleReject = async () => {
    if (onRejeitar) {
      await onRejeitar();
      setActionTaken('rejected');
    }
  };

  // Atualizar dados do usuário quando allUsers ou criadoPor mudar
  useEffect(() => {
    if (criadoPor && allUsers.length > 0) {
      const user = getUserById(criadoPor);
      if (user) {
        setUserData({
          nome: user.nome || '',
          sobrenome: user.sobrenome || '',
          foto: user.foto || null
        });
      } else {
        // Fallback para dados salvos na notificação
        setUserData({
          nome: senderName || '',
          sobrenome: senderSobrenome || '',
          foto: senderPhoto || null
        });
      }
    } else if (senderName) {
      // Usar dados salvos na notificação se não conseguimos buscar
      setUserData({
        nome: senderName || '',
        sobrenome: senderSobrenome || '',
        foto: senderPhoto || null
      });
    } else if (message) {
      // Fallback para notificações antigas: extrair nome da mensagem
      let extractedName = '';
      let extractedSobrenome = '';
      
      if (type === 'novo_membro' || type === 'member_approval') {
        const match = message.match(/^([^s]+)\s+solicitou/);
        if (match) {
          const nomeCompleto = match[1].trim();
          const partes = nomeCompleto.split(' ');
          extractedName = partes[0] || '';
          extractedSobrenome = partes.slice(1).join(' ') || '';
        }
      } else if (type === 'mencao_comentario') {
        const match = message.match(/^([^s]+)\s+mencionou/);
        if (match) {
          const nomeCompleto = match[1].trim();
          const partes = nomeCompleto.split(' ');
          extractedName = partes[0] || '';
          extractedSobrenome = partes.slice(1).join(' ') || '';
        }
      }
      
      setUserData({
        nome: extractedName,
        sobrenome: extractedSobrenome,
        foto: null
      });
    }
  }, [criadoPor, allUsers, senderName, senderPhoto, senderSobrenome, message, type]);

  // Mensagem: nome em negrito, mensagem em cinza, tudo na mesma linha
  function renderMensagem() {
    const senderName = userData.nome || '';
    if (type === 'novo_membro' || type === 'member_approval') {
      const [pre, pos] = (message || '').split('para o grupo');
      return (
        <>
          <Text style={{ fontWeight: 'bold', color: '#232D3F' }}>{senderName}</Text>
          <Text style={{ color: '#232D3F' }}> {pre}</Text>
        </>
      );
    }
    if (type === 'mencao_comentario') {
      const partes = message || '';
      return (
        <>
          <Text style={{ fontWeight: 'bold', color: '#232D3F' }}>{senderName}</Text>
          <Text style={{ color: '#A0A0A0' }}> {partes}</Text>
        </>
      );
    }
    return (
      <>
        <Text style={{ fontWeight: 'bold', color: '#232D3F' }}>{senderName}</Text>
        <Text style={{ color: '#A0A0A0' }}> {message}</Text>
      </>
    );
  }

  return (
    <View style={{ 
      marginBottom: 5, 
      borderBottomWidth: 1, 
      borderBottomColor: '#f2f1f1', 
      paddingBottom: 15,
      borderLeftWidth: read === false ? 2 : 0,
      borderLeftColor: read === false ? theme.colors.secondary : 'transparent'
    }}>
      {isClickable ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCardPress}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 10, paddingTop: 10 }}>
            <Avatar nome={userData.nome} sobrenome={userData.sobrenome} foto={userData.foto} size={60} style={{ borderWidth: 2, borderColor: theme.colors.secondary, marginRight: 12 }} />
            {/* Mensagem e tempo */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 15, lineHeight: 22, flexShrink: 1, flexWrap: 'wrap' }}>
                  {renderMensagem()}
                </Text>
              </View>
              <Text style={{ color: '#A0A0A0', fontSize: 13, marginTop: 2, marginLeft: 6, minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
                {getTempoRelativo(timestamp)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 10, paddingTop: 10 }}>
          <Avatar nome={userData.nome} sobrenome={userData.sobrenome} foto={userData.foto} size={60} style={{ borderWidth: 2, borderColor: theme.colors.secondary, marginRight: 12 }} />
          {/* Mensagem e tempo */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 15, lineHeight: 22, flexShrink: 1, flexWrap: 'wrap' }}>
                {renderMensagem()}
              </Text>
            </View>
            <Text style={{ color: '#A0A0A0', fontSize: 13, marginTop: 2, marginLeft: 6, minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
              {getTempoRelativo(timestamp)}
            </Text>
          </View>
        </View>
      )}

      {/* Botões para solicitações de entrada */}
      {isMemberRequest && !actionTaken && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 5, paddingHorizontal: 14 }}>
          <Button
            style={{ flex: 1, borderRadius: 16}}
            onPress={handleApprove}
          >
            ACEITAR
          </Button>
          <Button
            style={{ flex: 1, borderRadius: 16 }}
            variant="secondary"
            onPress={handleReject}
          >
            REJEITAR
          </Button>
        </View>
      )}

      {/* Mensagem após ação */}
      {actionTaken && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <Text style={{ 
            color: actionTaken === 'approved' ? theme.colors.primary : theme.colors.danger, 
            fontSize: 14, 
            fontWeight: 'bold',
            textAlign: 'left'
          }}>
            {actionTaken === 'approved' ? 'Membro aceito' : 'Membro rejeitado'}
          </Text>
        </View>
      )}
    </View>
  );
} 