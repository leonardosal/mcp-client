import fetch from 'node-fetch';
import { MCPConnection } from './MCPConnection.js';

export class HttpConnection extends MCPConnection {
  constructor(server, client) {
    super(server, client);
    this.baseUrl = server.url;
  }

  async connect() {
    console.log(`Testando conexão HTTP com ${this.server.name}...`);
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        console.log(`✅ Servidor HTTP ${this.server.name} acessível`);
      } else {
        console.log(`⚠️ Servidor HTTP ${this.server.name} respondeu com status ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️ Servidor HTTP ${this.server.name} pode não estar disponível: ${error.message}`);
    }
  }

  async _sendMessage(message) {
    try {
      const response = await fetch(`${this.baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Erro na requisição HTTP para ${this.server.name}: ${error.message}`);
    }
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
      message.method = method;
      delete message.id; // Notifications não têm ID
      try {
        await this._sendMessage(message);
        return { result: true };
      } catch (error) {
        throw error;
      }
    }

    try {
      const response = await this._sendMessage(message);
      if (response.error) {
        throw new Error(response.error.message || 'Erro na requisição');
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  isConnected() {
    return true; // HTTP é stateless, sempre "conectado" se o servidor estiver rodando
  }

  close() {
    // Nada para fechar em HTTP
  }
}