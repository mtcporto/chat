import state from '../store/state.js';

// Classe para manipulação da interface de usuário
class UI {
  updateStatus(status, text) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    if (statusDot) statusDot.className = 'status-dot ' + status;
    if (statusText) statusText.textContent = text;
  }
  
  showMainPanel() {
    document.getElementById('login-panel').classList.add('hidden');
    document.getElementById('main-panel').classList.remove('hidden');
    
    // Configurar informações do usuário
    if (state.connection) {
      const jid = state.connection.jid;
      const userJid = jid.split('/')[0];
      const initial = userJid.split('@')[0].charAt(0).toUpperCase();
      
      document.getElementById('user-avatar').textContent = initial;
      document.getElementById('user-jid').textContent = userJid;
    }
  }
  
  showLoginPanel() {
    document.getElementById('main-panel').classList.add('hidden');
    document.getElementById('login-panel').classList.remove('hidden');
  }
  
  showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatContainer = document.getElementById('chat-container');
    
    if (chatContainer) {
      chatContainer.style.display = 'none';
      chatContainer.classList.add('hidden');
    }
    
    if (welcomeScreen) {
      welcomeScreen.style.display = 'flex';
    }
    
    state.currentContact = null;
  }
  
  // ... outros métodos da UI
  
  updateContactList() {
    const contactList = document.getElementById('contact-list');
    if (!contactList) return;
    
    contactList.innerHTML = '';
    
    // Ordenar contatos: online primeiro, depois por nome
    const sortedContacts = Object.keys(state.contacts).sort((a, b) => {
      // Ordenar primeiro por status (online primeiro)
      if (state.contacts[a].status === 'online' && state.contacts[b].status !== 'online') return -1;
      if (state.contacts[a].status !== 'online' && state.contacts[b].status === 'online') return 1;
      
      // Depois por nome
      return state.contacts[a].name.localeCompare(state.contacts[b].name);
    });
    
    // Se não há contatos, mostrar mensagem
    if (sortedContacts.length === 0) {
      contactList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Nenhum contato. Use o botão abaixo para adicionar.</div>';
      return;
    }
    
    // Renderizar cada contato
    sortedContacts.forEach(jid => {
      const contact = state.contacts[jid];
      const contactItem = this.renderContactItem(jid, contact);
      contactList.appendChild(contactItem);
    });
  }
  
  // Renderizar um item de contato
  renderContactItem(jid, contact) {
    // ... implementação
  }
  
  // ... mais métodos

  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 600;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (e) {
      console.error("Erro ao tocar som de notificação:", e);
    }
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('visible');
  }
  
  filterContacts(query) {
    // Implementar filtro de contatos
    console.log("Filtrando contatos com query:", query);
  }
}

export default new UI();