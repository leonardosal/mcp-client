export class MCPConnection {
  constructor(server, client) {
    this.server = server;
    this.client = client;
    this.requestId = 1;
    this.pendingRequests = new Map();
  }

  async send(method, params = {}) {
    const id = this.requestId++;
    const message = {
      jsonrpc: '2.0',
      id: id,
      method: method,
      params: params
    };

    // Para notifications (como initialized), não esperamos resposta
    if (method.startsWith('notifications/')) {
      this._sendMessage(message);
      return { result: true };
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Timeout na requisição'));
      }, 10000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this._sendMessage(message);
    });
  }

  _handleMessage(message) {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      
      // Filtrar mensagens de debug/log que não são relevantes
      if (data.method === 'notifications/message' || 
          (data.params && data.params.level && ['debug', 'info'].includes(data.params.level))) {
        return; // Ignorar mensagens de log
      }
      
      if (data.id && this.pendingRequests.has(data.id)) {
        const { resolve, reject, timeout } = this.pendingRequests.get(data.id);
        clearTimeout(timeout);
        this.pendingRequests.delete(data.id);
        
        if (data.error) {
          reject(new Error(JSON.stringify(data.error)));
        } else {
          resolve(data);
        }
      } else if (data.method && !data.id) {
        // É uma notification do servidor - apenas log se não for mensagem de debug
        console.log(`📢 Notification de ${this.server.name}:`, data.method);
      } else if (data.result || data.error) {
        // Resposta sem ID pendente - pode ser válida, apenas log
        console.log(`📨 Resposta de ${this.server.name}:`, data.method || 'response');
      }
    } catch (error) {
      console.error(`Erro ao processar mensagem de ${this.server.name}:`, error.message);
      
      // Log apenas os primeiros 200 caracteres da mensagem problemática
      const msgPreview = typeof message === 'string' ? 
        message.substring(0, 200) + (message.length > 200 ? '...' : '') : 
        JSON.stringify(message).substring(0, 200);
      console.error(`Mensagem problemática (preview):`, msgPreview);
    }
  }

  async initialize() {
    try {
      console.log(`🔄 Inicializando ${this.server.name}...`);
      
      const response = await this.send('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {},
          tools: {
            listChanged: true
          },
          resources: {
            subscribe: true,
            listChanged: true
          },
          prompts: {
            listChanged: true
          },
          logging: {}
        },
        clientInfo: {
          name: 'simple-mcp-client',
          version: '1.0.0'
        }
      });
      console.log(`✅ ${this.server.name} inicializado com sucesso`);
    
      
      // Enviar initialized notification após receber resposta
      if (response.result) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequena pausa
        await this.send('notifications/initialized');
        console.log(`✅ Servidor ${this.server.name} inicializado com sucesso`);
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Erro ao inicializar ${this.server.name}:`, error.message);
      throw error;
    }
  }

  // Métodos abstratos que devem ser implementados pelas subclasses
  async connect() {
    throw new Error('Método connect deve ser implementado pela subclasse');
  }

  _sendMessage(message) {
    throw new Error('Método _sendMessage deve ser implementado pela subclasse');
  }

  isConnected() {
    throw new Error('Método isConnected deve ser implementado pela subclasse');
  }

  close() {
    throw new Error('Método close deve ser implementado pela subclasse');
  }
}