import state from '../store/state.js';

class Conversations {
  loadConversations() {
    console.log("Carregando conversas");
    
    // Tentar carregar do localStorage
    try {
      const savedConversations = localStorage.getItem('xmpp_conversations');
      if (savedConversations) {
        state.conversations = JSON.parse(savedConversations);
        console.log("Conversas carregadas do localStorage");
      }
    } catch (e) {
      console.error("Erro ao carregar conversas:", e);
    }
  }
  
  saveConversation(jid, message) {
    // Inicializar array se não existir
    if (!state.conversations[jid]) {
      state.conversations[jid] = [];
    }
    
    // Adicionar mensagem
    state.conversations[jid].push(message);
    
    // Limitar o histórico para não crescer muito
    if (state.conversations[jid].length > 100) {
      state.conversations[jid] = state.conversations[jid].slice(-100);
    }
    
    // Salvar no localStorage
    try {
      localStorage.setItem('xmpp_conversations', JSON.stringify(state.conversations));
    } catch (e) {
      console.error("Erro ao salvar conversas:", e);
    }
  }
  
  getConversation(jid) {
    return state.conversations[jid] || [];
  }
}

export default new Conversations();