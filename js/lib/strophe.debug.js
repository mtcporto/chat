// Este arquivo deve ser carregado após o strophe.min.js para adicionar logs de diagnóstico

(function() {
  console.log("Inicializando diagnóstico do Strophe");
  
  // Verificar se o Strophe existe
  if (typeof Strophe === 'undefined') {
    console.error("ERRO CRÍTICO: Strophe não foi carregado!");
    return;
  }
  
  console.log("Strophe encontrado, versão:", Strophe.VERSION);
  
  // Adicionar logger para conexões Strophe
  const originalConnection = Strophe.Connection;
  Strophe.Connection = function(service) {
    console.log("Nova conexão Strophe criada para:", service);
    const connection = new originalConnection(service);
    
    // Monitorar método connect
    const originalConnect = connection.connect;
    connection.connect = function(jid, pass, callback) {
      console.log("Strophe.connect chamado para:", jid);
      return originalConnect.call(this, jid, pass, function(status) {
        console.log("Status de conexão mudou para:", status);
        if (callback) callback(status);
      });
    };
    
    return connection;
  };
  
  // Verificar se estamos em um ambiente que suporta WebSocket
  if (window.WebSocket) {
    console.log("WebSocket disponível no navegador");
  } else {
    console.warn("WebSocket NÃO disponível! Usando fallback para BOSH");
  }
  
  // Registrar quando a página está pronta
  window.addEventListener('load', function() {
    console.log("Página completamente carregada, Strophe deve estar pronto");
  });
})();