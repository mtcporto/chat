import state from '../store/state.js';

class PresenceHandler {
  handle(presence) {
    console.log("Presença recebida:", presence);
    
    const from = presence.getAttribute('from');
    const to = presence.getAttribute('to');
    const type = presence.getAttribute('type');
    
    // Ignorar presença do próprio usuário (evita loops)
    if (from === to || !from.includes('@')) {
      console.log("Ignorando presença do próprio usuário ou presença inválida");
      return true;
    }
    
    // Remover resource do JID (parte após /)
    const bareJid = from.split('/')[0];
    
    // Processar diferentes tipos de presença
    if (type === 'subscribe') {
      // Solicitação de assinatura de presença
      this.handleSubscriptionRequest(bareJid);
    } else if (type === 'subscribed') {
      // Assinatura de presença aceita
      console.log(`${bareJid} aceitou sua solicitação de presença`);
    } else if (type === 'unsubscribe' || type === 'unsubscribed') {
      // Cancelamento de assinatura
      console.log(`${bareJid} cancelou assinatura de presença: ${type}`);
    } else if (type === 'unavailable') {
      // Usuário ficou offline
      this.updateContactStatus(bareJid, 'offline');
    } else {
      // Presença normal (online)
      this.updateContactStatus(bareJid, 'online');
    }
    
    return true;
  }
  
  updateContactStatus(jid, status) {
    console.log(`Atualizando status de ${jid} para ${status}`);
    
    // Verificar se o contato existe
    if (state.contacts[jid]) {
      // Verificar se o status realmente mudou (evita atualizações desnecessárias)
      if (state.contacts[jid].status !== status) {
        state.contacts[jid].status = status;
        
        // Salvar no localStorage para persistência
        try {
          localStorage.setItem('xmpp_contacts', JSON.stringify(state.contacts));
        } catch (e) {
          console.error("Erro ao salvar contatos:", e);
        }
        
        // Atualizar a interface
        this.updateContactList();
        
        // Se for o contato atual, atualizar indicador de status na conversa
        if (state.currentContact === jid) {
          const recipientPresence = document.getElementById('recipient-presence');
          if (recipientPresence) {
            recipientPresence.textContent = status === 'online' ? 'Online' : 'Offline';
          }
        }
      }
    }
  }
  
  handleSubscriptionRequest(jid) {
    console.log(`Solicitação de presença recebida de ${jid}`);
    
    // Aceitar automaticamente solicitações de presença
    // Você pode modificar isso para mostrar um prompt ao usuário
    const acceptPresence = $pres({
      to: jid,
      type: 'subscribed'
    });
    state.connection.send(acceptPresence);
    
    // Solicitar presença de volta (se ainda não for um contato)
    if (!state.contacts[jid]) {
      console.log(`Adicionando ${jid} aos contatos e solicitando presença`);
      
      // Adicionar ao roster
      const iq = $iq({
        type: 'set'
      }).c('query', {
        xmlns: 'jabber:iq:roster'
      }).c('item', {
        jid: jid
      });
      
      state.connection.sendIQ(iq);
      
      // Solicitar presença
      const subscribePres = $pres({
        to: jid,
        type: 'subscribe'
      });
      state.connection.send(subscribePres);
      
      // Adicionar ao estado local
      state.contacts[jid] = {
        name: jid.split('@')[0],
        subscription: 'from', // começando com 'from' até que tenhamos 'both'
        status: 'offline'
      };
      
      // Salvar e atualizar UI
      localStorage.setItem('xmpp_contacts', JSON.stringify(state.contacts));
      this.updateContactList();
    }
  }
  
  updateContactList() {
    import('../modules/contacts.js').then(module => {
      const contacts = module.default;
      if (typeof contacts.updateContactList === 'function') {
        contacts.updateContactList();
      }
    });
  }
}

export default new PresenceHandler();