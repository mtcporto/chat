export default {
  // Conexão
  connection: null,
  keepAliveTimer: null,
  messageHandlerId: null,
  presenceHandlerId: null,
  iqHandlerId: null,
  
  // Dados
  contacts: {},          // Armazena contatos e seus status
  conversations: {},     // Armazena histórico de conversas
  unreadMessages: {},    // Contador de mensagens não lidas
  
  // Estado da UI
  currentContact: null,
  typingTimer: null,
  forceCommunication: false
};