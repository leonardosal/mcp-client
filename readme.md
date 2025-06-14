# Cliente MCP Completo

Um cliente MCP (Model Context Protocol) completo em Node.js com suporte a **WebSocket**, **STDIO** e **HTTP Stream**. Conecta com múltiplos servidores e processa pedidos usando **OpenAI GPT-4o-mini** ou **Google Gemini**.

## Provedores de IA Suportados

### 🤖 OpenAI GPT-4o-mini
- Modelo rápido e eficiente
- Boa capacidade de raciocínio
- Contexto de 128K tokens

### 🧠 Google Gemini 1.5 Flash  
- Modelo multimodal do Google
- Contexto de 1M tokens
- Gratuito com limites generosos

## Tipos de Conexão Suportados

### 🌐 WebSocket
- Conexão bidirecional em tempo real
- Ideal para servidores que precisam enviar notificações

### 📟 STDIO
- Executa servidores MCP como processos locais
- Comunicação via entrada/saída padrão
- Ideal para ferramentas locais e scripts

### 🌍 HTTP Stream
- Requisições REST stateless
- Compatível com APIs REST tradicionais
- Ideal para serviços web e microserviços

## 📁 Estrutura do Projeto

```
mcp-client/
├── index.js                          # Ponto de entrada
├── package.json                      # Dependências e scripts
├── .env                              # Chaves de API
├── servers.json                      # Configuração dos servidores
└── src/                              # Código fonte modular
    ├── MCPClient.js                  # Lógica principal do cliente
    ├── TerminalInterface.js          # Interface de linha de comando
    └── connections/                  # Módulos de conexão
        ├── MCPConnection.js          # Classe base
        ├── WebSocketConnection.js    # WebSocket
        ├── StdioConnection.js        # STDIO 
        └── HttpConnection.js         # HTTP
```

O projeto foi completamente modularizado para melhor organização e manutenabilidade. Veja `ESTRUTURA_DO_PROJETO.md` para detalhes da arquitetura.

## Instalação

1. Clone ou baixe os arquivos
2. Instale as dependências:
```bash
npm install
```

3. Configure suas chaves de API no arquivo `.env`:
```bash
OPENAI_API_KEY=sua_chave_openai_aqui
GEMINI_API_KEY=sua_chave_gemini_aqui
AI_PROVIDER=openai
# AI_PROVIDER options: openai, gemini
```

4. Configure os servidores MCP no arquivo `servers.json`:
```json
{
  "servers": [
    {
      "name": "Playwright Server",
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-playwright"],
      "enabled": true
    }
  ]
}
```

## Uso

Execute o cliente:
```bash
npm start
```

### Comandos especiais:
- `status` - Mostra o status de todas as conexões
- `tools` - Lista todas as ferramentas disponíveis nos servidores
- `provider` - Mostra informações do provedor de IA atual
- `quit` - Encerra o cliente

## Configuração dos Provedores de IA

### OpenAI
1. Obtenha sua chave em: https://platform.openai.com/api-keys
2. Configure no `.env`: `OPENAI_API_KEY=sk-...`
3. Configure: `AI_PROVIDER=openai`

### Google Gemini
1. Obtenha sua chave em: https://makersuite.google.com/app/apikey
2. Configure no `.env`: `GEMINI_API_KEY=AIza...`
3. Configure: `AI_PROVIDER=gemini`

## Configuração dos Servidores

### WebSocket
```json
{
  "name": "meu-websocket",
  "type": "websocket", 
  "url": "ws://localhost:8080/mcp",
  "enabled": true
}
```

### STDIO  
```json
{
  "name": "meu-stdio",
  "type": "stdio",
  "command": "python3",
  "args": ["mcp_server.py"],
  "cwd": "/path/to/server",
  "enabled": true
}
```

### HTTP
```json
{
  "name": "meu-http",
  "type": "http",
  "url": "http://api.exemplo.com/mcp", 
  "enabled": true
}
```

## Funcionalidades

- ✅ **Multi-protocolo**: WebSocket, STDIO e HTTP
- ✅ **Multi-IA**: OpenAI GPT e Google Gemini
- ✅ **Execução automática** de múltiplas ferramentas
- ✅ **Otimização de tokens** para tarefas complexas
- ✅ **Configuração flexível** via JSON
- ✅ **Interface de linha de comando** interativa
- ✅ **Tratamento de erros** robusto
- ✅ **Encerramento gracioso** com limpeza de recursos
- ✅ **Status das conexões** em tempo real
- ✅ **Suporte a variáveis de ambiente**

## Exemplo de Uso

```
🚀 Iniciando cliente MCP...
🤖 Provedor de IA: GEMINI (gemini-1.5-flash)
Carregados 1 servidores ativos
Iniciando servidor STDIO Playwright Server...
✅ Processo STDIO Playwright Server iniciado
✅ Servidor Playwright Server inicializado com sucesso

✅ Cliente MCP iniciado com sucesso!
🤖 IA: GEMINI (gemini-1.5-flash)
Tipos de conexão suportados: WebSocket, STDIO, HTTP
Digite seus pedidos ou comandos especiais:

Comandos: "status", "tools", "provider", "quit"

> acesse o google e tire uma screenshot
🔄 Iteração 1...
🔧 goto: Navegando para o Google
✅ goto executada

🔄 Iteração 2...  
🔧 screenshot: Capturando tela da página
✅ screenshot executada

✅ Tarefa concluída!
✅ Concluído: Acessei o Google e capturei uma screenshot da página

📋 Ferramentas usadas: goto, screenshot
🎯 Pedido: acesse o google e tire uma screenshot
```