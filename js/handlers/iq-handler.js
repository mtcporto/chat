import state from '../store/state.js';

class IQHandler {
  handle(iq) {
    console.log("IQ recebido:", iq);
    
    const type = iq.getAttribute('type');
    const id = iq.getAttribute('id');
    
    // Processar diferentes tipos de IQ
    if (type === 'result') {
      // Se for uma resposta de roster
      const queryElement = iq.querySelector('query[xmlns="jabber:iq:roster"]');
      if (queryElement) {
        this.processRosterResult(iq);
        return true;
      }
    } else if (type === 'set') {
      // Se for uma atualização de roster
      const queryElement = iq.querySelector('query[xmlns="jabber:iq:roster"]');
      if (queryElement) {
        this.processRosterUpdate(iq);
        
        // Enviar confirmação
        if (state.connection) {
          const resultIQ = $iq({
            type: 'result',
            id: id
          });
          state.connection.send(resultIQ);
        }
        return true;
      }
    }
    
    // Retornar true para manter o handler
    return true;
  }
  
  processRosterResult(iq) {
    console.log("Processando resultado do roster");
    const items = iq.querySelectorAll('item');
    
    console.log(`Encontrados ${items.length} contatos no roster`);
    
    for (let i = 0; i < items.length; i++) {
      const jid = items[i].getAttribute('jid');
      const name = items[i].getAttribute('name') || jid.split('@')[0];
      const subscription = items[i].getAttribute('subscription');
      
      console.log(`Contato do roster: ${jid}, nome: ${name}, subscription: ${subscription}`);
      
      // Adicionar ou atualizar contato
      state.contacts[jid] = {
        name: name,
        subscription: subscription,
        status: 'offline' // Status padrão até receber presença
      };
    }
    
    // Salvar os contatos no localStorage
    this.saveContactsToStorage();
    
    // Atualizar a lista de contatos na UI
    import('../modules/contacts.js').then(module => {
      const contacts = module.default;
      contacts.updateContactList();
    });
  }
  
  processRosterUpdate(iq) {
    console.log("Processando atualização do roster");
    const items = iq.querySelectorAll('item');
    
    for (let i = 0; i < items.length; i++) {
      const jid = items[i].getAttribute('jid');
      const subscription = items[i].getAttribute('subscription');
      
      if (subscription === 'remove') {
        // Remover contato
        console.log(`Removendo contato: ${jid}`);
        delete state.contacts[jid];
      } else {
        // Atualizar contato
        console.log(`Atualizando contato: ${jid}, subscription: ${subscription}`);
        const name = items[i].getAttribute('name');
        
        if (!state.contacts[jid]) {
          state.contacts[jid] = {
            name: name || jid.split('@')[0],
            subscription: subscription,
            status: 'offline'
          };
        } else {
          if (name) state.contacts[jid].name = name;
          state.contacts[jid].subscription = subscription;
        }
      }
    }
    
    // Salvar os contatos no localStorage
    this.saveContactsToStorage();
    
    // Atualizar a lista de contatos na UI
    import('../modules/contacts.js').then(module => {
      const contacts = module.default;
      contacts.updateContactList();
    });
  }
  
  // Método para salvar contatos no localStorage
  saveContactsToStorage() {
    try {
      localStorage.setItem('xmpp_contacts', JSON.stringify(state.contacts));
      console.log("Contatos salvos no localStorage");
    } catch (e) {
      console.error("Erro ao salvar contatos:", e);
    }
  }
}

export default new IQHandler();