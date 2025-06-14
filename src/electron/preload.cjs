const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  processRequest: (userInput) => ipcRenderer.invoke('mcp-process-request', userInput),
  getTools: () => ipcRenderer.invoke('mcp-get-tools'),
  getStatus: () => ipcRenderer.invoke('mcp-get-status'),
  getHistoryStats: () => ipcRenderer.invoke('mcp-get-history-stats'),
  clearHistory: () => ipcRenderer.invoke('mcp-clear-history'),
  reinitialize: () => ipcRenderer.invoke('mcp-reinitialize'),
  
  onMCPStatusChanged: (callback) => {
    ipcRenderer.on('mcp-status-changed', (event, data) => callback(data));
  },
  
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('mcp-status-changed');
  }
});