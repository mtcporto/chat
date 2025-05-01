// Revise o arquivo para garantir que não haja duplicação na exposição dos métodos

// Importar módulos
import connection from './modules/connection.js';
import messages from './modules/messages.js';
import contacts from './modules/contacts.js';
import ui from './modules/ui.js';

// Objeto que expõe funções para o escopo global
const XMPPChat = {
  // Funções de conexão
  connect: connection.connect.bind(connection),
  disconnect: connection.disconnect.bind(connection),
  
  // Funções de mensagens
  sendMessage: messages.sendMessage.bind(messages),
  sendTypingNotification: messages.sendTypingNotification.bind(messages),
  
  // Funções de contatos
  addContact: contacts.addContact.bind(contacts),
  
  // Funções de UI
  updateContactList: contacts.updateContactList.bind(contacts),
};

// Expor o objeto para uso global
window.XMPPChat = XMPPChat;

export default XMPPChat;