import state from '../store/state.js';

class MessageHandler {
  constructor() {
    // Set para rastrear IDs de mensagens recentes (deduplicação)
    this.processedMessageIds = new Set();
    this.processedMessageIdsLimit = 100;
  }
  
  handle(msg) {
    // Extrair informações da mensagem
    const from = msg.getAttribute('from');
    const type = msg.getAttribute('type');
    const msgId = msg.getAttribute('id');
    
    // Verificar se é uma mensagem de chat
    if (type === 'chat') {
      const bodyElement = msg.querySelector('body');
      
      // Processar conteúdo da mensagem
      if (bodyElement) {
        const body = bodyElement.textContent;
        
        // Evitar duplicação - verificar ID
        if (msgId && this.processedMessageIds.has(msgId)) {
          return true;
        }
        
        // Registrar ID para deduplicação
        if (msgId) {
          this.processedMessageIds.add(msgId);
          
          // Limitar o tamanho do Set
          if (this.processedMessageIds.size > this.processedMessageIdsLimit) {
            const oldestId = this.processedMessageIds.values().next().value;
            this.processedMessageIds.delete(oldestId);
          }
        }
        
        // Processar a mensagem
        this.processMessage(from, body);
      }
      
      // Processar estados de chat
      if (msg.querySelector('composing')) {
        // Implementar lógica de "digitando..." se necessário
      }
    }
    
    // Manter o handler registrado
    return true;
  }
  
  processMessage(from, body) {
    // Remover parte do recurso (resource) do JID
    const senderJid = from.split('/')[0];
    
    // Adicionar a mensagem à conversa
    this.addMessageToConversation(senderJid, 'received', body);
    
    // Incrementar contador de mensagens não lidas se não for o contato atual
    if (state.currentContact !== senderJid) {
      if (!state.unreadMessages[senderJid]) {
        state.unreadMessages[senderJid] = 0;
      }
      state.unreadMessages[senderJid]++;
      
      // Atualizar a lista de contatos para mostrar o contador
      this.updateContactList();
    }
    
    // Atualizar visualização de mensagens se for o contato atual
    this.updateMessageView(senderJid);
  }
  
  updateContactList() {
    import('../modules/contacts.js').then(module => {
      const contacts = module.default;
      if (typeof contacts.updateContactList === 'function') {
        contacts.updateContactList();
      }
    });
  }
  
  addMessageToConversation(jid, type, content, timestamp = new Date(), messageType = 'text', msgId = null) {
    // Criar objeto de mensagem
    const message = {
      type: type, // 'sent', 'received' ou 'system'
      content: content,
      timestamp: timestamp,
      messageType: messageType,
      id: msgId || 'local_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000)
    };
    
    // Inicializar conversa se não existir
    if (!state.conversations[jid]) {
      state.conversations[jid] = [];
    }
    
    // Verificar se já existe uma mensagem com o mesmo ID
    const existingMsgIndex = state.conversations[jid].findIndex(m => m.id === message.id);
    if (existingMsgIndex >= 0) {
      return message;
    }
    
    // Adicionar mensagem à conversa
    state.conversations[jid].push(message);
    
    // Salvar conversas no localStorage
    try {
      localStorage.setItem('xmpp_conversations', JSON.stringify(state.conversations));
    } catch (e) {
      console.error("Erro ao salvar conversas:", e);
    }
    
    return message;
  }
  
  updateMessageView(jid) {
    // Se o JID for o contato atual, atualizar visualização de mensagens
    if (state.currentContact === jid) {
      const chatMessages = document.getElementById('chat-messages');
      if (!chatMessages) return;
      
      // Obter mensagens da conversa
      const conversation = state.conversations[jid] || [];
      
      // Limpar contador de mensagens não lidas
      state.unreadMessages[jid] = 0;
      
      // Renderizar mensagens
      this.renderMessages(conversation, chatMessages);
      
      // Rolar para a última mensagem
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  renderMessages(conversation, container) {
    // Limpar container
    container.innerHTML = '';
    
    // Agrupar mensagens por data
    let lastDate = null;
    
    conversation.forEach((message) => {
      // Verificar se é um novo dia para inserir separador
      const messageDate = new Date(message.timestamp);
      const messageDay = messageDate.toLocaleDateString();
      
      if (lastDate !== messageDay) {
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'system-message';
        dateSeparator.textContent = messageDay;
        container.appendChild(dateSeparator);
        lastDate = messageDay;
      }
      
      // Criar elemento de mensagem
      const messageElement = document.createElement('div');
      messageElement.className = `message ${message.type}`;
      
      // Formatar horário
      const timeStr = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (message.messageType === 'text') {
        // Mensagem de texto normal
        messageElement.innerHTML = `
          <div class="message-bubble">${this.formatMessageContent(message.content)}</div>
          <div class="message-time">${timeStr}</div>
        `;
      } else if (message.messageType === 'system') {
        // Mensagem do sistema
        messageElement.className = 'system-message';
        messageElement.textContent = message.content;
      } else if (message.messageType === 'file') {
        // Mensagem de arquivo (implementar se necessário)
        const fileName = message.content.name || 'arquivo';
        const fileSize = this.formatFileSize(message.content.size);
        
        messageElement.innerHTML = `
          <div class="message-bubble file-message">
            <div style="display: flex; align-items: center;">
              <i class="bi bi-file-earmark file-icon"></i>
              <div class="file-info">
                <div class="file-name">${fileName}</div>
                <div class="file-size">${fileSize}</div>
                <div class="file-download" data-url="${message.content.url}" data-filename="${fileName}">
                  <i class="bi bi-download"></i> Baixar
                </div>
              </div>
            </div>
          </div>
          <div class="message-time">${timeStr}</div>
        `;
      }
      
      container.appendChild(messageElement);
    });
  }
  
  formatMessageContent(content) {
    // Escape HTML para prevenir XSS
    let escaped = this.escapeHtml(content);
    
    // Converter URLs para links clicáveis
    escaped = escaped.replace(
      /((https?:\/\/|www\.)[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Adicionar quebras de linha
    escaped = escaped.replace(/\n/g, '<br>');
    
    return escaped;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  }
}

export default new MessageHandler();