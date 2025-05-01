import state from '../store/state.js';
import messageHandler from '../handlers/message-handler.js';

class Messages {
  constructor() {
    this.lastSendTime = 0;
    this.debounceTime = 300; // Reduzindo para 300ms
  }

  sendMessage() {
    // Verificar debounce para evitar envios duplicados
    const now = Date.now();
    if (now - this.lastSendTime < this.debounceTime) {
      console.log("Envio bloqueado: muito rápido");
      return;
    }
    this.lastSendTime = now;
    
    // Verificar se há um contato selecionado
    if (!state.currentContact) {
      console.warn("Nenhum contato selecionado");
      return;
    }
    
    // Obter mensagem do input
    const messageInput = document.getElementById('msg');
    if (!messageInput) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    // Gerar ID único para a mensagem
    const msgId = 'msg_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
    
    // Criar mensagem XMPP
    const msg = $msg({
      to: state.currentContact,
      type: 'chat',
      id: msgId
    })
    .c('body').t(messageText).up()
    .c('active', {xmlns: 'http://jabber.org/protocol/chatstates'});
    
    // Enviar mensagem
    try {
      state.connection.send(msg);
      
      // Adicionar o ID à lista de mensagens processadas para evitar eco
      if (messageHandler.processedMessageIds) {
        messageHandler.processedMessageIds.add(msgId);
      }
      
      // Adicionar mensagem à conversa local
      messageHandler.addMessageToConversation(
        state.currentContact, 
        'sent', 
        messageText, 
        new Date(),
        'text',
        msgId
      );
      
      // Atualizar a visualização das mensagens
      messageHandler.updateMessageView(state.currentContact);
      
      // Limpar input
      messageInput.value = '';
      messageInput.focus();
    } catch (e) {
      console.error("Erro ao enviar mensagem:", e);
    }
  }
  
  sendTypingNotification() {
    // Limpar timer existente
    clearTimeout(state.typingTimer);
    
    // Enviar notificação apenas se houver um contato selecionado
    if (state.currentContact) {
      // Criar mensagem de status typing
      const msg = $msg({
        to: state.currentContact,
        type: 'chat'
      }).c('composing', {xmlns: 'http://jabber.org/protocol/chatstates'});
      
      // Enviar notificação
      state.connection.send(msg);
      
      // Configurar timer para enviar notificação de pausa
      state.typingTimer = setTimeout(() => {
        const pausedMsg = $msg({
          to: state.currentContact,
          type: 'chat'
        }).c('paused', {xmlns: 'http://jabber.org/protocol/chatstates'});
        
        state.connection.send(pausedMsg);
      }, 5000);
    }
  }
  
  // Método auxiliar para atualizar a lista de contatos
  updateContactList() {
    import('../modules/contacts.js').then(module => {
      const contacts = module.default;
      if (typeof contacts.updateContactList === 'function') {
        contacts.updateContactList();
      }
    });
  }
}

export default new Messages();