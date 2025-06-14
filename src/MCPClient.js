import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import { StdioConnection } from './connections/StdioConnection.js';
import { HttpConnection } from './connections/HttpConnection.js';

dotenv.config();

export class MCPClient {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'gpt-4.1-mini';
    this.servers = [];
    this.connections = new Map();
    
    // Array para guardar mensagens da conversa
    this.conversationHistory = [
      {
        role: 'system',
        content: 'Você é um assistente eficiente. Use as ferramentas disponíveis conforme necessário para completar as tarefas do usuário. Execute quantas ferramentas precisar até ter todos os dados necessários para responder completamente.'
      }
    ];
    
    console.log(`🤖 Usando OpenAI: ${this.model}`);
  }

  async initialize() {
    console.log('🚀 Iniciando cliente MCP simplificado...');
    
    await this.loadServersConfig();
    await this.connectToServers();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n✅ Cliente MCP iniciado!');
    console.log('📚 Histórico de conversa ativado');
  }

  async loadServersConfig() {
    try {
      const configData = await fs.readFile('servers.json', 'utf8');
      const config = JSON.parse(configData);
      this.servers = config.servers.filter(server => server.enabled);
      console.log(`Carregados ${this.servers.length} servidores`);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error.message);
      throw error;
    }
  }

  _createConnection(server) {
    switch (server.type) {
      case 'stdio':
        return new StdioConnection(server, this);
      case 'http':
        return new HttpConnection(server, this);
      default:
        throw new Error(`Tipo de servidor não suportado: ${server.type}`);
    }
  }

  async connectToServers() {
    for (const server of this.servers) {
      try {
        
        const connection = this._createConnection(server);
        await connection.connect();

        await connection.initialize();
        this.connections.set(server.name, connection);
      } catch (error) {
        console.error(`Erro ao conectar com ${server.name}:`, error.message);
      }
    }
  }

  async getAvailableTools() {
    const tools = [];
    for (const [serverName, connection] of this.connections) {
      if (connection.isConnected()) {
        try {
          const response = await connection.send('tools/list');
          const serverTools = response.result?.tools || [];
          tools.push(...serverTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            server: serverName,
            schema: tool.inputSchema
          })));
        } catch (error) {
          console.error(`Erro ao obter ferramentas de ${serverName}:`, error.message);
        }
      }
    }
    return tools;
  }

  convertToolsToOpenAIFormat(mcpTools) {
    return mcpTools.map(tool => ({
      type: "function",
      function: {
        name: `${tool.server}__${tool.name}`,
        description: tool.description || `Execute ${tool.name} no servidor ${tool.server}`,
        parameters: tool.schema || {
          type: "object",
          properties: {},
          required: []
        }
      }
    }));
  }

  parseToolCall(toolCall) {
    // Extrair servidor e nome da ferramenta do nome da função
    const functionName = toolCall.function.name;
    const [server, toolName] = functionName.split('__');
    
    let arguments_obj = {};
    try {
      arguments_obj = JSON.parse(toolCall.function.arguments);
    } catch (error) {
      console.error('Erro ao parsear argumentos da ferramenta:', error.message);
    }

    return {
      server,
      toolName,
      arguments: arguments_obj,
      callId: toolCall.id
    };
  }

  async sendToServer(serverName, method, params = {}) {
    const connection = this.connections.get(serverName);
    if (!connection || !connection.isConnected()) {
      throw new Error(`Servidor ${serverName} não está conectado`);
    }
    console.log(`🔗 Enviando para ${serverName}: ${method} com parâmetros`, params);
    return await connection.send(method, params);
  }

  async processUserRequest(userInput) {
    console.log('\n🤖 Processando pedido...');
    
    const mcpTools = await this.getAvailableTools();
    if (mcpTools.length === 0) {
      return 'Nenhuma ferramenta disponível.';
    }

    // Converter ferramentas para formato OpenAI
    const openAITools = this.convertToolsToOpenAIFormat(mcpTools);
    console.log(`🔧 ${openAITools.length} ferramentas disponíveis`);

    // Adicionar pergunta do usuário ao histórico
    this.conversationHistory.push({
      role: 'user',
      content: userInput
    });

    console.log(`📚 Histórico da conversa: ${this.conversationHistory.length} mensagens`);

    let iteration = 0;

    // Loop até o modelo dar uma resposta final (sem tool calls)
    while (true) {
      iteration++;
      console.log(`\n🔄 Iteração ${iteration}...`);
      
      try {
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: this.conversationHistory,
          tools: openAITools,
          tool_choice: 'auto',
          max_tokens: 1000,
          temperature: 0.1
        });

        const message = response.choices[0].message;
        this.conversationHistory.push(message);

        // Se não tem tool calls, é a resposta final
        if (!message.tool_calls || message.tool_calls.length === 0) {
          console.log('✅ Resposta final gerada');
          console.log(`📚 Histórico atualizado: ${this.conversationHistory.length} mensagens`);
          return message.content;
        }

        // Executar todas as ferramentas solicitadas
        console.log(`🔧 Executando ${message.tool_calls.length} ferramenta(s)...`);

        for (const toolCall of message.tool_calls) {
          const { server, toolName, arguments: toolArgs, callId } = this.parseToolCall(toolCall);
          
          console.log(`🔧 Executando: ${toolName} no servidor ${server}`);

          let toolResult;
          try {
            const result = await this.sendToServer(server, 'tools/call', {
              name: toolName,
              arguments: toolArgs
            });

            console.log(`✅ ${toolName} executada com sucesso`);
            toolResult = JSON.stringify(result.result);

          } catch (error) {
            console.error(`❌ Erro ao executar ${toolName}:`, error.message);
            toolResult = `Erro: ${error.message}`;
          }

          // Adicionar resultado da ferramenta ao histórico
          this.conversationHistory.push({
            role: 'tool',
            tool_call_id: callId,
            content: toolResult
          });
        }

      } catch (error) {
        console.error('❌ Erro na execução:', error.message);
        
        // Adicionar erro ao histórico
        this.conversationHistory.push({
          role: 'assistant',
          content: `Erro ao processar pedido: ${error.message}`
        });
        
        return `Erro ao processar pedido: ${error.message}`;
      }
    }
  }

  async getConnectionsStatus() {
    const status = [];
    for (const [name, connection] of this.connections) {
      status.push({
        name,
        type: 'stdio',
        status: connection.isConnected() ? '✅ Conectado' : '❌ Desconectado'
      });
    }
    return status;
  }

  getProviderInfo() {
    return {
      provider: 'OPENAI',
      model: this.model,
      keyConfigured: process.env.OPENAI_API_KEY ? '✅' : '❌'
    };
  }

  clearConversationHistory() {
    this.conversationHistory = [
      {
        role: 'system',
        content: 'Você é um assistente eficiente. Use as ferramentas disponíveis conforme necessário para completar as tarefas do usuário. Execute quantas ferramentas precisar até ter todos os dados necessários para responder completamente.'
      }
    ];
    console.log('🗑️ Histórico da conversa limpo');
  }

  getConversationStats() {
    const stats = {
      total: this.conversationHistory.length,
      system: this.conversationHistory.filter(m => m.role === 'system').length,
      user: this.conversationHistory.filter(m => m.role === 'user').length,
      assistant: this.conversationHistory.filter(m => m.role === 'assistant').length,
      tool: this.conversationHistory.filter(m => m.role === 'tool').length
    };
    return stats;
  }

  async cleanup() {
    console.log('🧹 Limpando conexões...');
    for (const [name, connection] of this.connections) {
      try {
        connection.close();
      } catch (error) {
        console.error(`Erro ao fechar ${name}:`, error.message);
      }
    }
    this.connections.clear();
  }
}