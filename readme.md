# XMPP Chat

## Descrição do Projeto
O XMPP Chat é uma aplicação web para comunicação instantânea utilizando o protocolo XMPP (Extensible Messaging and Presence Protocol). Essa interface moderna e responsiva permite aos usuários se conectarem a servidores XMPP, gerenciarem contatos e trocarem mensagens em tempo real através de um navegador web.

## Tecnologias Utilizadas

### Frontend
- **HTML5** - Estruturação da interface
- **CSS3** - Estilização responsiva e adaptativa para dispositivos móveis e desktop
- **JavaScript (ES6+)** - Programação client-side com módulos JS
- **Bootstrap Icons** - Biblioteca de ícones

### Integração XMPP
- **Strophe.js** - Biblioteca JavaScript para comunicação com servidores XMPP
- **BOSH/WebSocket** - Protocolos para comunicação HTTP persistente

### Recursos e Funcionalidades
- **Autenticação XMPP** - Login com credenciais de servidores XMPP
- **Gerenciamento de Contatos** - Adicionar, visualizar e gerenciar lista de contatos
- **Troca de Mensagens** - Mensagens de texto em tempo real
- **Indicadores de Presença** - Status online/offline dos contatos
- **Armazenamento Local** - Persistência de conversas e configurações via localStorage
- **Interface Responsiva** - Layout adaptado para dispositivos móveis e desktop

## Arquitetura

O projeto segue uma arquitetura modular em JavaScript com separação de responsabilidades:

- **Módulos**
  - `connection.js` - Gerenciamento de conexão XMPP
  - `contacts.js` - Gerenciamento de contatos e roster
  - `messages.js` - Envio e processamento de mensagens
  - `ui.js` - Manipulação da interface do usuário

- **Handlers**
  - `message-handler.js` - Processamento de mensagens recebidas
  - `presence-handler.js` - Processamento de atualizações de presença
  - `iq-handler.js` - Processamento de requisições IQ (Info/Query)

- **Store**
  - `state.js` - Gerenciamento do estado global da aplicação

## Características Técnicas

- **Design Responsivo** - Interface adaptativa usando CSS Flexbox e Media Queries
- **Tratamento de Eventos** - Sistema de eventos para interações do usuário
- **Deduplicação de Mensagens** - Mecanismo para prevenir mensagens duplicadas
- **Keep-Alive** - Sistema para manter conexões XMPP ativas
- **Auto-Reconexão** - Capacidade de reconectar automaticamente quando há perda de conexão

## Como Usar

1. Acesse a aplicação através de um navegador web
2. Insira suas credenciais XMPP (JID e senha)
3. Após conectar, você verá sua lista de contatos
4. Adicione novos contatos ou inicie conversas com contatos existentes
5. As conversas e configurações são salvas localmente no navegador

## Requisitos do Sistema

- Navegador web moderno com suporte a:
  - JavaScript ES6+
  - CSS3
  - localStorage
  - WebSockets (preferencial) ou BOSH

## Compatibilidade
A aplicação é compatível com servidores XMPP que suportam:
- autenticação PLAIN
- BOSH ou WebSocket como métodos de conexão
- XEP-0199 (XMPP Ping)
- XEP-0085 (Chat State Notifications)

---

Desenvolvido como projeto educacional para demonstrar a implementação de clientes XMPP utilizando tecnologias web modernas.