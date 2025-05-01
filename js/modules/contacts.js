import state from '../store/state.js';
import ui from './ui.js';
import iqHandler from '../handlers/iq-handler.js';

class Contacts {
  constructor() {
    // Inicialização, se necessária
  }

  requestRoster() {
    const iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
    
    state.connection.sendIQ(iq, function(response) {
      const items = response.getElementsByTagName('item');
      
      for (let i = 0; i < items.length; i++) {
        const jid = items[i].getAttribute('jid');
        const name = items[i].getAttribute('name') || jid.split('@')[0];
        const subscription = items[i].getAttribute('subscription');
        
        // Adicionar contato à lista
        state.contacts[jid] = {
          name: name,
          status: 'offline',
          subscription: subscription
        };
        
        // Inicializar conversa vazia
        if (!state.conversations[jid]) {
          state.conversations[jid] = [];
        }
        
        // Inicializar contador de mensagens
        if (!state.unreadMessages[jid]) {
          state.unreadMessages[jid] = 0;
        }
      }
      
      // Atualizar a lista de contatos na UI
      this.updateContactList();
      
      // Enviar solicitação de presença para todos os contatos
      state.connection.send($pres().tree());
    }.bind(this));
  }
  
  updateContactList() {
    console.log("Atualizando lista de contatos...");
    const contactList = document.getElementById('contact-list');
    if (!contactList) {
      console.error("Elemento contact-list não encontrado");
      return;
    }
    
    // Limpar lista
    contactList.innerHTML = '';
    
    // Verificar se há contatos
    const contactJIDs = Object.keys(state.contacts);
    console.log(`Renderizando ${contactJIDs.length} contatos`);
    
    if (contactJIDs.length === 0) {
      // Mostrar mensagem de nenhum contato
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-list-message';
      emptyMessage.textContent = 'Nenhum contato. Clique em "Adicionar" para começar.';
      contactList.appendChild(emptyMessage);
      return;
    }
    
    // Ordenar contatos por nome
    const sortedJIDs = contactJIDs.sort((a, b) => {
      const nameA = state.contacts[a].name || a;
      const nameB = state.contacts[b].name || b;
      return nameA.localeCompare(nameB);
    });
    
    // Renderizar cada contato
    sortedJIDs.forEach(jid => {
      this.renderContactItem(contactList, jid);
    });
  }
  
  renderContactItem(container, jid) {
    console.log(`Renderizando contato: ${jid}`);
    const contact = state.contacts[jid];
    if (!contact) {
      console.error(`Dados de contato não encontrados para ${jid}`);
      return;
    }
    
    // Criar elemento de contato
    const contactElement = document.createElement('div');
    contactElement.className = 'contact-item';
    if (state.currentContact === jid) {
      contactElement.classList.add('active');
    }
    contactElement.setAttribute('data-jid', jid);
    
    // Primeira letra para avatar
    const firstLetter = (contact.name || jid.split('@')[0])[0].toUpperCase();
    
    // Determinar classe de status
    const statusClass = contact.status === 'online' ? 'online' : 'offline';
    
    // Construir HTML do contato
    contactElement.innerHTML = `
      <div class="avatar">
        ${firstLetter}
        <div class="contact-status ${statusClass}"></div>
      </div>
      <div class="contact-info">
        <div class="contact-name">${contact.name || jid.split('@')[0]}</div>
        <div class="contact-presence">${contact.status === 'online' ? 'Online' : 'Offline'}</div>
      </div>
      ${state.unreadMessages[jid] ? `<div class="badge">${state.unreadMessages[jid]}</div>` : ''}
    `;
    
    // Adicionar evento de clique
    contactElement.addEventListener('click', () => this.selectContact(jid));
    
    // Adicionar à lista
    container.appendChild(contactElement);
  }
  
  selectContact(jid) {
    console.log("Contato selecionado:", jid);
    
    // Marcar como selecionado
    state.currentContact = jid;
    
    // Remover destaque de todos os contatos
    document.querySelectorAll('.contact-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Adicionar destaque ao contato selecionado
    const contactElement = document.querySelector(`.contact-item[data-jid="${jid}"]`);
    if (contactElement) {
      contactElement.classList.add('active');
    }
    
    // Mostrar container de chat
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    
    // Atualizar informações do contato no cabeçalho
    const recipientName = document.getElementById('recipient-name');
    const recipientPresence = document.getElementById('recipient-presence');
    const recipientAvatar = document.getElementById('recipient-avatar');
    
    if (recipientName && recipientPresence && recipientAvatar) {
      const contact = state.contacts[jid];
      recipientName.textContent = contact.name || jid.split('@')[0];
      recipientPresence.textContent = contact.status === 'online' ? 'Online' : 'Offline';
      recipientAvatar.textContent = (contact.name || jid.split('@')[0])[0].toUpperCase();
    }
    
    // Carregar mensagens
    this.loadMessages(jid);
    
    // Limpar contador de mensagens não lidas
    state.unreadMessages[jid] = 0;
    this.updateContactList();
    
    // Focar no campo de mensagem
    document.getElementById('msg').disabled = false;
    document.getElementById('msg').focus();
    document.getElementById('send-btn').disabled = false;
  }
  
  loadMessages(jid) {
    // Importar módulo messageHandler para carregar mensagens
    import('../handlers/message-handler.js').then(module => {
      const messageHandler = module.default;
      messageHandler.updateMessageView(jid);
    });
  }
  
  addContact() {
    console.log("Método addContact chamado");
    const jid = document.getElementById('new-contact').value.trim();
    
    // Validação básica
    if (!jid) {
      alert('Por favor, informe o JID do contato.');
      return;
    }
    
    if (!jid.includes('@')) {
      alert('JID deve estar no formato usuario@dominio');
      return;
    }
    
    // Verificar se o contato já existe
    if (state.contacts[jid]) {
      alert('Este contato já está na sua lista.');
      document.getElementById('add-contact-modal').style.display = 'none';
      return;
    }
    
    console.log("Adicionando contato:", jid);
    
    // Enviar solicitação de presença (subscribe)
    const presence = $pres({
      to: jid, 
      type: 'subscribe'
    });
    state.connection.send(presence);
    
    // Adicionar contato ao roster via IQ
    const iq = $iq({
      type: 'set'
    }).c('query', {
      xmlns: 'jabber:iq:roster'
    }).c('item', {
      jid: jid
    });
    
    state.connection.sendIQ(
      iq,
      (responseIQ) => {
        // Sucesso
        console.log("Contato adicionado com sucesso:", responseIQ);
        alert('Solicitação de contato enviada para ' + jid);
        
        // Adicionar contato à lista local
        state.contacts[jid] = {
          name: jid.split('@')[0],
          subscription: 'none',
          status: 'offline'
        };
        
        // Salvar no localStorage manualmente 
        try {
          localStorage.setItem('xmpp_contacts', JSON.stringify(state.contacts));
          console.log("Contatos salvos no localStorage");
        } catch (e) {
          console.error("Erro ao salvar contatos:", e);
        }
        
        // Atualizar UI imediatamente
        this.updateContactList();
        
        // Fechar modal
        document.getElementById('add-contact-modal').style.display = 'none';
        document.getElementById('new-contact').value = '';
      },
      (errorIQ) => {
        // Erro
        console.error("Erro ao adicionar contato:", errorIQ);
        alert('Erro ao adicionar contato. Tente novamente.');
      }
    );
  }
  
  removeContact(jid) {
    console.log("Removendo contato:", jid);
    // Implementação real vai aqui
  }
  
  renewSubscription(jid) {
    console.log("Renovando inscrição para:", jid);
    // Implementação real vai aqui
  }
  
  toggleContactMenu(jid) {
    console.log("Abrindo menu para contato:", jid);
    // Implementação real vai aqui
  }

  // Método para debug
  logContactsState() {
    console.log("=== Estado atual de contatos ===");
    console.log("Contatos no state:", state.contacts);
    console.log("Número de contatos:", Object.keys(state.contacts).length);
    
    // Verificar localStorage
    try {
      const savedContacts = localStorage.getItem('xmpp_contacts');
      if (savedContacts) {
        const parsed = JSON.parse(savedContacts);
        console.log("Contatos no localStorage:", parsed);
        console.log("Número de contatos no localStorage:", Object.keys(parsed).length);
      } else {
        console.log("Nenhum contato encontrado no localStorage");
      }
    } catch (e) {
      console.error("Erro ao ler contatos do localStorage:", e);
    }
    
    // Verificar DOM
    const contactList = document.getElementById('contact-list');
    if (contactList) {
      const contactElements = contactList.querySelectorAll('.contact-item');
      console.log("Número de elementos de contato na DOM:", contactElements.length);
    } else {
      console.error("Elemento contact-list não encontrado");
    }
    
    console.log("===================================");
  }
}

export default new Contacts();