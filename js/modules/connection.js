import state from '../store/state.js';
import ui from './ui.js';
import contacts from './contacts.js';
import messageHandler from '../handlers/message-handler.js';
import presenceHandler from '../handlers/presence-handler.js';
import iqHandler from '../handlers/iq-handler.js';

class Connection {
  connect() {
    console.log("Método de conexão chamado");
    const jid = document.getElementById('jid').value.trim();
    const pass = document.getElementById('pass').value;
    
    // Validação básica
    if (!jid || !pass) {
      alert('Por favor, preencha JID e senha.');
      return;
    }
    
    if (!jid.includes('@')) {
      alert('JID deve estar no formato usuario@dominio');
      return;
    }
    
    // Salvar credenciais se necessário
    if (document.getElementById('remember-me').checked) {
      localStorage.setItem('xmpp_jid', jid);
      localStorage.setItem('xmpp_pass', pass);
      localStorage.setItem('xmpp_remember', 'true');
    }
    
    // Atualizar interface
    document.getElementById('connect-btn').disabled = true;
    document.getElementById('connect-btn').innerHTML = '<i class="bi bi-hourglass"></i> Conectando...';
    ui.updateStatus('connecting', 'Conectando...');
    
    // Limpar qualquer conexão existente
    if (state.connection) {
      try {
        state.connection.disconnect();
        state.connection = null;
      } catch (e) {
        console.warn("Erro ao limpar conexão anterior:", e);
      }
    }
    
    // Criar nova conexão após pequeno delay
    setTimeout(() => {
      console.log("Tentando conectar via WebSocket...");
      try {
        state.connection = new Strophe.Connection("https://conversejs.org/http-bind/");
        state.connection.connect(jid, pass, (status) => this.handleConnectionStatus(status));
      } catch (e) {
        console.error("Erro ao conectar via WebSocket:", e);
        
        try {
          console.log("Tentando conexão alternativa via BOSH...");
          state.connection = new Strophe.Connection("https://xmpp.jp/http-bind/");
          state.connection.connect(jid, pass, (status) => this.handleConnectionStatus(status));
        } catch (e2) {
          console.error("Falha em ambos métodos de conexão:", e2);
          this.handleConnectionFailure();
        }
      }
    }, 100);
  }
  
  handleConnectionFailure() {
    ui.updateStatus('disconnected', 'Falha na conexão');
    document.getElementById('connect-btn').disabled = false;
    document.getElementById('connect-btn').innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Conectar';
  }
  
  handleConnectionStatus(status) {
    console.log("Status da conexão:", status);
    
    switch(status) {
      case Strophe.Status.CONNECTING:
        ui.updateStatus('connecting', 'Conectando...');
        break;
        
      case Strophe.Status.CONNFAIL:
        ui.updateStatus('error', 'Falha na conexão');
        document.getElementById('connect-btn').disabled = false;
        document.getElementById('connect-btn').innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Conectar';
        break;
        
      case Strophe.Status.AUTHENTICATING:
        ui.updateStatus('authenticating', 'Autenticando...');
        break;
        
      case Strophe.Status.AUTHFAIL:
        ui.updateStatus('error', 'Falha na autenticação');
        document.getElementById('connect-btn').disabled = false;
        document.getElementById('connect-btn').innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Conectar';
        alert('Falha na autenticação. Verifique seu JID e senha.');
        break;
        
      case Strophe.Status.CONNECTED:
        ui.updateStatus('connected', 'Conectado');
        console.log("Conectado como:", state.connection.jid);
        
        // Carregar contatos e configurar handlers
        this.loadContactsFromStorage();
        this.setupHandlers();
        
        // Enviar presença inicial e mostrar interface principal
        state.connection.send($pres());
        ui.showMainPanel();
        
        // Solicitar roster e carregar conversas
        this.requestRoster();
        this.loadConversations();
        
        // Iniciar mecanismo de keep-alive
        this.startKeepAlive();
        break;
        
      case Strophe.Status.DISCONNECTED:
        ui.updateStatus('disconnected', 'Desconectado');
        ui.showLoginPanel();
        
        // Limpar timers e handlers
        this.clearConnectionState();
        break;
        
      case Strophe.Status.DISCONNECTING:
        ui.updateStatus('disconnecting', 'Desconectando...');
        break;
        
      default:
        console.log("Status de conexão desconhecido:", status);
    }
  }
  
  setupHandlers() {
    // Remover handlers anteriores se existirem
    if (state.messageHandlerId) state.connection.deleteHandler(state.messageHandlerId);
    if (state.presenceHandlerId) state.connection.deleteHandler(state.presenceHandlerId);
    if (state.iqHandlerId) state.connection.deleteHandler(state.iqHandlerId);
    
    // Registrar novos handlers
    state.messageHandlerId = state.connection.addHandler(
      messageHandler.handle.bind(messageHandler),
      null, 'message', null
    );
    
    state.presenceHandlerId = state.connection.addHandler(
      presenceHandler.handle.bind(presenceHandler),
      null, 'presence'
    );
    
    state.iqHandlerId = state.connection.addHandler(
      iqHandler.handle.bind(iqHandler),
      null, 'iq'
    );
  }
  
  clearConnectionState() {
    // Limpar timers
    if (state.keepAliveTimer) {
      clearInterval(state.keepAliveTimer);
      state.keepAliveTimer = null;
    }
    
    if (state.typingTimer) {
      clearTimeout(state.typingTimer);
      state.typingTimer = null;
    }
    
    // Limpar dados
    state.contacts = {};
    state.conversations = {};
    state.unreadMessages = {};
    state.currentContact = null;
    
    // Limpar a interface
    document.querySelectorAll('.contact-list, .chat-messages').forEach(el => {
      if (el) el.innerHTML = '';
    });
  }
  
  disconnect(clearStorage = false) {
    console.log("Desconectando...");
    
    if (clearStorage) {
      localStorage.removeItem('xmpp_jid');
      localStorage.removeItem('xmpp_pass');
      localStorage.removeItem('xmpp_remember');
    }
    
    if (state.connection && state.connection.connected) {
      state.connection.disconnect();
    } else {
      ui.updateStatus('disconnected', 'Desconectado');
      ui.showLoginPanel();
    }
    
    this.clearConnectionState();
  }
  
  tryAutoLogin() {
    const savedJid = localStorage.getItem('xmpp_jid');
    const savedPass = localStorage.getItem('xmpp_pass');
    const remember = localStorage.getItem('xmpp_remember');
    
    if (remember === 'true' && savedJid && savedPass) {
      document.getElementById('jid').value = savedJid;
      document.getElementById('pass').value = savedPass;
      document.getElementById('remember-me').checked = true;
      
      // Conectar automaticamente
      setTimeout(() => this.connect(), 500);
    }
  }
  
  requestRoster() {
    console.log("Solicitando roster");
    const iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
    state.connection.sendIQ(iq);
  }
  
  loadContactsFromStorage() {
    try {
      const savedContacts = localStorage.getItem('xmpp_contacts');
      if (savedContacts) {
        state.contacts = JSON.parse(savedContacts);
        console.log("Contatos carregados do localStorage:", Object.keys(state.contacts).length);
        
        // Importante: Atualizar a lista de contatos na UI após carregar
        setTimeout(() => {
          import('./contacts.js').then(module => {
            const contacts = module.default;
            if (typeof contacts.updateContactList === 'function') {
              contacts.updateContactList();
            }
          });
        }, 100);
      } else {
        console.log("Nenhum contato encontrado no localStorage");
      }
    } catch (e) {
      console.error("Erro ao carregar contatos:", e);
    }
  }
  
  loadConversations() {
    console.log("Carregando conversas");
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
  
  startKeepAlive() {
    console.log("Iniciando mecanismo de keep-alive");
    
    // Limpar temporizador existente
    if (state.keepAliveTimer) {
      clearInterval(state.keepAliveTimer);
    }
    
    // Enviar presença inicial imediatamente para garantir status online
    state.connection.send($pres());
    
    // Obter lista de contatos para enviar presença diretamente
    const contactJids = Object.keys(state.contacts);
    
    // Criar temporizador para enviar pings periódicos
    state.keepAliveTimer = setInterval(() => {
      if (state.connection && state.connection.connected) {
        console.log("Enviando ping para manter conexão...");
        
        // Enviar presença geral
        state.connection.send($pres());
        
        // Enviar presença direta para cada contato (ajuda na consistência do status)
        contactJids.forEach(jid => {
          const directPresence = $pres({to: jid});
          state.connection.send(directPresence);
        });
        
        // Usar ping XEP-0199
        const pingIq = $iq({
          type: 'get',
          to: state.connection.domain,
          id: 'ping' + Math.floor(Math.random() * 10000)
        }).c('ping', {xmlns: 'urn:xmpp:ping'});
        
        state.connection.sendIQ(pingIq, null, () => {
          console.log("Ping falhou - tentando reconectar");
          if (state.connection.connected) {
            // Tentativa de reconexão amigável
            this.reconnect();
          }
        }, 5000);
      } else {
        clearInterval(state.keepAliveTimer);
      }
    }, 30000); // 30 segundos
    
    // Adicionando listener para eventos de visibilidade de página
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log("Página visível - atualizando status");
        
        // Se estiver conectado, enviar presença para atualizar status
        if (state.connection && state.connection.connected) {
          state.connection.send($pres());
          
          // Também solicitar roster novamente para atualizar status de contatos
          this.requestRoster();
        } else if (!state.connection || !state.connection.connected) {
          console.log("Não conectado ao retornar à página - tentando reconectar");
          this.reconnect();
        }
      }
    });
  }
  
  reconnect() {
    console.log("Tentando reconexão suave...");
    
    // Tentar usar credenciais existentes
    const jid = localStorage.getItem('xmpp_jid');
    const password = localStorage.getItem('xmpp_pass');
    
    if (jid && password) {
      // Se a conexão ainda existir, desconecte primeiro
      if (state.connection) {
        try {
          state.connection.disconnect();
        } catch (e) {
          console.warn("Erro ao desconectar durante reconexão:", e);
        }
      }
      
      // Pequeno delay antes de tentar reconectar
      setTimeout(() => {
        // Criar nova conexão
        state.connection = new Strophe.Connection("https://conversejs.org/http-bind/");
        state.connection.connect(jid, password, (status) => this.handleConnectionStatus(status));
      }, 1000);
    } else {
      console.warn("Impossível reconectar: credenciais não disponíveis");
      ui.updateStatus('disconnected', 'Desconectado');
    }
  }
}

export default new Connection();