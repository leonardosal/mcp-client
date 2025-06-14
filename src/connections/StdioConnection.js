import { spawn } from 'child_process';
import { MCPConnection } from './MCPConnection.js';

export class StdioConnection extends MCPConnection {
  constructor(server, client) {
    super(server, client);
    this.process = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`Iniciando servidor STDIO ${this.server.name}...`);
      
      this.process = spawn(this.server.command, this.server.args || [], {
        cwd: this.server.cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.on('error', (error) => {
        console.error(`❌ Erro ao iniciar processo STDIO ${this.server.name}:`, error.message);
        reject(error);
      });

      // Buffer para armazenar dados parciais
      let buffer = '';

      this.process.stdout.on('data', (data) => {
        buffer += data.toString();
        
        // Processar múltiplas mensagens JSON separadas por quebras de linha
        const lines = buffer.split('\n');
        
        // Manter a última linha incompleta no buffer
        buffer = lines.pop() || '';
        
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            try {
              // Tentar parsear cada linha como JSON separado
              const message = JSON.parse(trimmedLine);
              this._handleMessage(message);
            } catch (error) {
              // Se falhar, pode ser parte de uma mensagem JSON maior
              // Tentar extrair JSONs válidos da linha
              this._tryParsePartialJson(trimmedLine);
            }
          }
        });
      });

      this.process.stderr.on('data', (data) => {
        const errorMsg = data.toString().trim();
        if (errorMsg && !errorMsg.includes('Warning') && !errorMsg.includes('DeprecationWarning')) {
          console.error(`STDERR ${this.server.name}:`, errorMsg);
        }
      });

      this.process.on('close', (code) => {
        console.log(`🔌 Processo STDIO ${this.server.name} finalizado com código ${code}`);
      });

      // Aguardar um pouco para o processo inicializar
      setTimeout(() => {
        console.log(`✅ Processo STDIO ${this.server.name} iniciado`);
        resolve();
      }, 1000);
    });
  }

  _tryParsePartialJson(line) {
    // Tentar encontrar JSONs válidos em uma linha que pode conter múltiplos JSONs
    let startIndex = 0;
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escaped = true;
        continue;
      }
      
      if (char === '"' && !escaped) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            startIndex = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            // Encontrou um JSON completo
            const jsonStr = line.substring(startIndex, i + 1);
            try {
              const message = JSON.parse(jsonStr);
              this._handleMessage(message);
            } catch (error) {
              console.error(`Erro ao parsear JSON extraído de ${this.server.name}:`, error.message);
              console.error(`JSON problemático:`, jsonStr.substring(0, 100) + '...');
            }
          }
        }
      }
    }
  }

  _sendMessage(message) {
    if (this.process && !this.process.killed) {
      // Para notifications, remover o ID
      if (message.method && message.method.startsWith('notifications/')) {
        const notification = { ...message };
        delete notification.id;
        this.process.stdin.write(JSON.stringify(notification) + '\n');
      } else {
        this.process.stdin.write(JSON.stringify(message) + '\n');
      }
    } else {
      throw new Error(`Processo STDIO para ${this.server.name} não está ativo`);
    }
  }

  isConnected() {
    return this.process && !this.process.killed;
  }

  close() {
    if (this.process && !this.process.killed) {
      this.process.kill();
    }
  }
}