# MCP Client - Cliente Electron para Model Context Protocol

Um cliente desktop moderno construído com Electron para interagir com servidores MCP (Model Context Protocol), oferecendo uma interface gráfica intuitiva para executar ferramentas e comandos através de diferentes tipos de conexões.

## 🚀 Características Principais

### Interface Gráfica Moderna
- **Design Dark Mode**: Interface elegante com tema escuro moderno
- **Chat Interativo**: Conversa em tempo real com histórico persistente
- **Status em Tempo Real**: Indicadores visuais do status de conexão
- **Input Responsivo**: Textarea que se adapta ao conteúdo com suporte a Shift+Enter

### Suporte a Múltiplos Tipos de Servidor
- **HTTP Servers**: Conexão via requisições HTTP/REST
- **STDIO Servers**: Comunicação através de processos filhos
- **Configuração Flexível**: Habilitação/desabilitação individual de servidores

### Integração com IA
- **OpenAI GPT-4**: Processamento inteligente de comandos
- **Execução Automática**: IA decide quais ferramentas usar
- **Histórico Contextual**: Mantém contexto da conversa entre interações

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm** ou **yarn**
- **Chave da API OpenAI** (obrigatório)
- **Python 3.8+** (para servidores STDIO baseados em Python)

## 🛠️ Instalação

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd mcp-client
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 4. Configure os Servidores MCP
Edite o arquivo `servers.json` para configurar seus servidores:
```json
{
  "servers": [
    {
      "name": "flagcard-mcp",
      "type": "http",
      "url": "http://127.0.0.1:3000",
      "enabled": true
    },
    {
      "name": "playwright",
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "enabled": false
    },
    {
      "name": "fetch",
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "enabled": true
    }
  ]
}
```

## 🚀 Execução

### Modo Desenvolvimento
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

### Build para Distribuição
```bash
# Build para todas as plataformas
npm run build

# Build específico por plataforma
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

## 🏗️ Estrutura do Projeto

```
mcp-client/
├── src/
│   ├── electron/
│   │   ├── main.js           # Processo principal do Electron
│   │   ├── preload.cjs       # Script de preload (CommonJS)
│   │   └── renderer.html     # Interface do usuário
│   └── connections/
│       ├── MCPConnection.js  # Classe base para conexões
│       ├── StdioConnection.js # Conexões STDIO
│       └── HttpConnection.js  # Conexões HTTP
├── MCPClient.js              # Cliente principal MCP
├── servers.json              # Configuração de servidores
├── package.json             # Dependências e scripts
└── .env                     # Variáveis de ambiente
```

## ⚙️ Configuração de Servidores

### Servidor HTTP
```json
{
  "name": "meu-servidor-http",
  "type": "http",
  "url": "http://localhost:3000",
  "enabled": true
}
```

### Servidor STDIO
```json
{
  "name": "meu-servidor-stdio",
  "type": "stdio",
  "command": "python",
  "args": ["-m", "meu_servidor"],
  "enabled": true,
  "cwd": "/caminho/opcional"
}
```

### Propriedades de Configuração

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `name` | string | Nome único do servidor |
| `type` | string | Tipo: `"http"` ou `"stdio"` |
| `url` | string | URL base (apenas HTTP) |
| `command` | string | Comando executável (apenas STDIO) |
| `args` | array | Argumentos do comando (apenas STDIO) |
| `cwd` | string | Diretório de trabalho (opcional, STDIO) |
| `enabled` | boolean | Se o servidor está ativo |

## 🔧 Funcionalidades da Interface

### Área de Chat
- **Mensagens do Usuário**: Exibidas à direita em azul
- **Respostas da IA**: Exibidas à esquerda em cinza
- **Mensagens do Sistema**: Centralizadas em formato de notificação
- **Mensagens de Erro**: Destacadas em vermelho

### Barra de Status
- **Indicador de Conexão**: Dot colorido indicando status
  - 🟡 Amarelo: Inicializando
  - 🟢 Verde: Pronto
  - 🔴 Vermelho: Erro
- **Status Textual**: Descrição atual do estado

### Área de Input
- **Textarea Responsiva**: Expande automaticamente com o conteúdo
- **Envio por Enter**: Enter envia, Shift+Enter quebra linha
- **Botão de Envio**: Indica quando está processando

## 🤖 Como Funciona a IA

### Fluxo de Processamento
1. **Recebimento**: Usuário digita uma mensagem
2. **Análise**: IA analisa quais ferramentas são necessárias
3. **Execução**: Ferramentas são chamadas automaticamente
4. **Iteração**: Processo continua até resposta completa
5. **Resposta**: IA fornece resposta final baseada nos resultados

### Histórico Conversacional
- Mantém contexto entre mensagens
- Inclui resultados de ferramentas no histórico
- Permite conversas naturais e contínuas

### Ferramentas Disponíveis
A IA pode utilizar qualquer ferramenta disponível nos servidores conectados:
- Ferramentas de automação web (Playwright)
- Ferramentas de requisições HTTP (Fetch)
- Ferramentas customizadas do seu servidor

## 🔌 Tipos de Conexão

### Conexão HTTP
- **Protocolo**: HTTP/REST
- **Endpoint**: `/mcp` para comandos MCP
- **Health Check**: `/health` para verificação
- **Timeout**: 10 segundos por requisição
- **Stateless**: Cada requisição é independente

### Conexão STDIO
- **Protocolo**: JSON-RPC via stdin/stdout
- **Processo**: Spawn de processo filho
- **Parsing**: Suporte a múltiplas mensagens JSON
- **Buffer**: Tratamento de mensagens parciais
- **Cleanup**: Finalização automática de processos

## 📚 Classes Principais

### MCPClient
Classe principal que gerencia toda a comunicação:
- Inicialização de servidores
- Processamento de requisições do usuário
- Integração com OpenAI
- Gerenciamento de histórico

### MCPConnection (Classe Base)
Interface comum para todos os tipos de conexão:
- Envio de mensagens
- Inicialização do protocolo MCP
- Tratamento de respostas

### StdioConnection
Implementação para servidores STDIO:
- Gerenciamento de processos filhos
- Parsing de JSON em streams
- Tratamento de erros de processo

### HttpConnection
Implementação para servidores HTTP:
- Requisições fetch
- Tratamento de timeouts
- Health checks

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Execução com DevTools
npm start           # Execução normal

# Build
npm run build       # Build multiplataforma
npm run build-win   # Build para Windows
npm run build-mac   # Build para macOS
npm run build-linux # Build para Linux
npm run pack        # Build sem empacotamento
npm run dist        # Alias para build
```

## 🚨 Solução de Problemas

### Servidor não Conecta
1. Verifique se o servidor está rodando
2. Confirme a configuração em `servers.json`
3. Verifique logs no console do Electron

### Erro de API Key
1. Confirme que `.env` existe e está correto
2. Verifique se a chave OpenAI é válida
3. Reinicie a aplicação após mudanças no .env

### Interface não Abre
1. Execute `npm run dev` para ver logs
2. Verifique se todos os arquivos estão no lugar
3. Confirme que `preload.cjs` existe (não `.js`)

### Erro de Dependências
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Compatibilidade

### Electron
- **Versão**: 36.4.0+
- **ES Modules**: Suporte completo
- **Context Isolation**: Habilitado por segurança

### Node.js
- **Versão Mínima**: 18.0.0
- **Modules**: ES6 Import/Export
- **APIs**: Suporte a fetch nativo

### Plataformas
- **Windows**: 64-bit (NSIS installer)
- **macOS**: x64 e ARM64 (DMG)
- **Linux**: x64 (AppImage)

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Nota**: Este projeto requer uma chave válida da API OpenAI para funcionar. Certifique-se de configurar corretamente o arquivo `.env` antes de usar.