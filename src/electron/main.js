import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MCPClient } from '../MCPClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ElectronMCPApp {
  constructor() {
    this.mainWindow = null;
    this.mcpClient = null;
    this.isInitialized = false;
  }

  async createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: false,
        preload: join(__dirname, 'preload.cjs')
      },
      show: false
    });

    try {
      await this.mainWindow.loadFile(join(__dirname, 'renderer.html'));
      
      this.mainWindow.once('ready-to-show', () => {
        this.mainWindow.show();
      });

      // Força mostrar a janela após um tempo se não mostrar automaticamente
      setTimeout(() => {
        if (this.mainWindow && !this.mainWindow.isVisible()) {
          this.mainWindow.show();
        }
      }, 2000);

      if (process.env.NODE_ENV === 'development') {
        this.mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    } catch (error) {
      console.error('Erro ao carregar o arquivo HTML:', error);
      console.log('Tentando carregar de:', join(__dirname, 'renderer.html'));
      
      // Força mostrar a janela mesmo com erro
      this.mainWindow.show();
    }
  }

  async initializeMCP() {
    try {
      this.mcpClient = new MCPClient();
      await this.mcpClient.initialize();
      this.isInitialized = true;
      
      this.mainWindow?.webContents.send('mcp-status-changed', {
        status: 'ready',
        message: 'MCP Client inicializado com sucesso'
      });
    } catch (error) {
      this.mainWindow?.webContents.send('mcp-status-changed', {
        status: 'error',
        message: `Erro ao inicializar: ${error.message}`
      });
    }
  }

  setupIPCHandlers() {
    ipcMain.handle('mcp-process-request', async (event, userInput) => {
      if (!this.isInitialized || !this.mcpClient) {
        throw new Error('MCP Client não está inicializado');
      }
      try {
        const response = await this.mcpClient.processUserRequest(userInput);
        return { success: true, data: response };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('mcp-get-tools', async () => {
      if (!this.isInitialized || !this.mcpClient) {
        return { success: false, error: 'MCP Client não está inicializado' };
      }
      try {
        const tools = await this.mcpClient.getAvailableTools();
        return { success: true, data: tools };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('mcp-get-status', async () => {
      if (!this.isInitialized || !this.mcpClient) {
        return { success: false, error: 'MCP Client não está inicializado' };
      }
      try {
        const status = await this.mcpClient.getConnectionsStatus();
        const providerInfo = this.mcpClient.getProviderInfo();
        return { success: true, data: { connections: status, provider: providerInfo } };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('mcp-get-history-stats', async () => {
      if (!this.isInitialized || !this.mcpClient) {
        return { success: false, error: 'MCP Client não está inicializado' };
      }
      try {
        const stats = this.mcpClient.getConversationStats();
        return { success: true, data: stats };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('mcp-clear-history', async () => {
      if (!this.isInitialized || !this.mcpClient) {
        return { success: false, error: 'MCP Client não está inicializado' };
      }
      try {
        this.mcpClient.clearConversationHistory();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('mcp-reinitialize', async () => {
      try {
        if (this.mcpClient) {
          await this.mcpClient.cleanup();
        }
        await this.initializeMCP();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  async cleanup() {
    if (this.mcpClient) {
      await this.mcpClient.cleanup();
    }
  }
}

const mcpApp = new ElectronMCPApp();

app.whenReady().then(async () => {
  console.log('App ready, inicializando...');
  mcpApp.setupIPCHandlers();
  console.log('IPC handlers configurados');
  await mcpApp.createWindow();
  console.log('Janela criada');
  mcpApp.initializeMCP().catch(console.error);
});

app.on('window-all-closed', async () => {
  await mcpApp.cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await mcpApp.createWindow();
  }
});

app.on('before-quit', async () => {
  await mcpApp.cleanup();
});