import connection from './modules/connection.js';
import messages from './modules/messages.js';
import contacts from './modules/contacts.js';
import ui from './modules/ui.js';

// Detectar plataforma
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
console.log("Plataforma detectada:", isMobile ? "Mobile" : "Desktop");

// Adicione esta classe ao body para permitir CSS específico
document.body.classList.add(isMobile ? 'mobile' : 'desktop');

// Criar objeto global XMPPChat para acessar funções no escopo global
window.XMPPChat = {
  connect: connection.connect.bind(connection),
  disconnect: connection.disconnect.bind(connection),
  sendMessage: messages.sendMessage.bind(messages),
  addContact: contacts.addContact.bind(contacts)
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log("Aplicação XMPP Chat inicializada");
  
  // Verificar disponibilidade do Strophe
  if (typeof Strophe === 'undefined') {
    console.error("Erro: Strophe não está carregado!");
    showErrorMessage("Biblioteca XMPP não carregada. Recarregue a página.");
    return;
  }
  
  // Configurar handlers de eventos
  setupEventListeners();
  
  // Tentar auto-login
  connection.tryAutoLogin();
});

// Configurar todos os event listeners
function setupEventListeners() {
  console.log("Configurando event listeners");
  
  setupLoginEvents();
  setupContactEvents();
  setupMessageEvents();
  setupModalEvents();
  
  // Adicionar verificação de contatos após timeout para garantir que tudo carregou
  setTimeout(() => {
    import('./modules/contacts.js').then(module => {
      const contacts = module.default;
      contacts.logContactsState();
    });
  }, 2000);
}

// Eventos relacionados ao login
function setupLoginEvents() {
  // Botão de conectar
  const connectButton = document.getElementById('connect-btn');
  if (connectButton) {
    // Remover event listeners existentes para evitar duplicação
    const newConnectButton = connectButton.cloneNode(true);
    connectButton.parentNode.replaceChild(newConnectButton, connectButton);
    
    // Adicionar novo event listener
    newConnectButton.addEventListener('click', function(e) {
      e.preventDefault();
      connection.connect();
    });
  }
}

// Eventos relacionados aos contatos
function setupContactEvents() {
  // Botão de desconectar
  const disconnectButton = document.getElementById('disconnect-btn');
  if (disconnectButton) {
    const newDisconnectButton = disconnectButton.cloneNode(true);
    disconnectButton.parentNode.replaceChild(newDisconnectButton, disconnectButton);
    
    newDisconnectButton.addEventListener('click', function() {
      connection.disconnect(false);
    });
  }
  
  // Toggle da sidebar (para dispositivos móveis e desktop)
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  if (toggleSidebarBtn) {
    // Remover eventos existentes para evitar duplicação
    const newToggleSidebarBtn = toggleSidebarBtn.cloneNode(true);
    toggleSidebarBtn.parentNode.replaceChild(newToggleSidebarBtn, toggleSidebarBtn);
    
    // Implementar toggle que funciona em todos os dispositivos
    newToggleSidebarBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation(); // Importante para impedir propagação
      
      console.log("Toggle sidebar clicado");
      
      const sidebar = document.querySelector('.sidebar');
      const mainPanel = document.querySelector('.main-panel');
      
      if (sidebar) {
        sidebar.classList.toggle('visible');
        console.log("Toggle da classe visible na sidebar");
        
        // Ajustar classe para responsividade
        if (mainPanel) {
          mainPanel.classList.toggle('sidebar-collapsed');
        }
      }
    });
    
    // Adicionar também evento touchstart para dispositivos móveis
    newToggleSidebarBtn.addEventListener('touchstart', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("Touch em toggle sidebar detectado");
      
      // Simular click para garantir consistência
      this.click();
    }, { passive: false });
  }
  
  // Garantir que sidebar fecha quando um contato é clicado (em dispositivos móveis)
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector('.sidebar');
      const toggleBtn = document.getElementById('toggle-sidebar');
      
      // Se clicou em um contato (ou dentro da área de contatos)
      if (e.target.closest('.contact-item')) {
        if (sidebar && sidebar.classList.contains('visible')) {
          sidebar.classList.remove('visible');
          
          // Ajustar classe para responsividade
          const mainPanel = document.querySelector('.main-panel');
          if (mainPanel) {
            mainPanel.classList.add('sidebar-collapsed');
          }
          
          console.log("Sidebar fechada após seleção de contato");
        }
      }
    }
  });
}

// Eventos relacionados às mensagens
function setupMessageEvents() {
  // Botão de enviar mensagem
  const sendButton = document.getElementById('send-btn');
  if (sendButton) {
    const newSendButton = sendButton.cloneNode(true);
    sendButton.parentNode.replaceChild(newSendButton, sendButton);
    
    newSendButton.addEventListener('click', function(e) {
      e.preventDefault();
      messages.sendMessage();
    });
  }
  
  // Campo de mensagem (para Enter)
  const msgInput = document.getElementById('msg');
  if (msgInput) {
    const newMsgInput = msgInput.cloneNode(true);
    msgInput.parentNode.replaceChild(newMsgInput, msgInput);
    
    // Event listener para Enter
    newMsgInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        messages.sendMessage();
      }
    });
    
    // Event listener para digitação
    newMsgInput.addEventListener('input', function() {
      messages.sendTypingNotification();
    });
  }
}

// Eventos relacionados aos modais
function setupModalEvents() {
  const addContactBtn = document.getElementById('add-contact-btn');
  const closeContactModal = document.getElementById('close-contact-modal');
  const cancelAddContact = document.getElementById('cancel-add-contact');
  const confirmAddContact = document.getElementById('confirm-add-contact');
  const addContactModal = document.getElementById('add-contact-modal');
  
  // Debug do modal
  console.log("Setup modal:", {
    addContactBtn,
    closeContactModal,
    cancelAddContact,
    confirmAddContact,
    addContactModal
  });
  
  // Botão de adicionar contato
  if (addContactBtn) {
    addContactBtn.addEventListener('click', function() {
      if (addContactModal) {
        addContactModal.style.display = 'block';
      }
    });
  }
  
  // Fechar modal pelo X
  if (closeContactModal) {
    closeContactModal.addEventListener('click', function() {
      if (addContactModal) addContactModal.style.display = 'none';
    });
  }
  
  // Cancelar adição de contato
  if (cancelAddContact) {
    cancelAddContact.addEventListener('click', function() {
      if (addContactModal) addContactModal.style.display = 'none';
    });
  }
  
  // Confirmar adição de contato
  if (confirmAddContact) {
    confirmAddContact.addEventListener('click', function() {
      contacts.addContact();
    });
  }
  
  // Fechar o modal quando clicar fora
  window.addEventListener('click', function(event) {
    if (event.target === addContactModal) {
      addContactModal.style.display = 'none';
    }
  });
}

// Função para exibir mensagem de erro
function showErrorMessage(message) {
  const mainContainer = document.querySelector('.container');
  if (mainContainer) {
    const errorAlert = document.createElement('div');
    errorAlert.style.backgroundColor = '#ffdddd';
    errorAlert.style.color = '#990000';
    errorAlert.style.padding = '10px';
    errorAlert.style.margin = '10px 0';
    errorAlert.style.borderRadius = '4px';
    errorAlert.innerHTML = message;
    mainContainer.prepend(errorAlert);
  }
}

// Adicione esta função no final do arquivo

// Função para diagnosticar se há eventos duplicados
function checkDuplicateEvents() {
  const elements = ['toggle-sidebar', 'connect-btn', 'send-btn', 'disconnect-btn'];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      // Contador de eventos
      let clickCount = 0;
      
      // Adicionar evento temporário para diagnóstico
      const origClick = element.click;
      element.click = function() {
        clickCount++;
        console.log(`Elemento ${id} clicado ${clickCount} vezes`);
        origClick.apply(this, arguments);
      };
      
      console.log(`Diagnóstico de evento configurado para: ${id}`);
    }
  });
}

// Chamar após um tempo para permitir que a página seja carregada
setTimeout(checkDuplicateEvents, 3000);