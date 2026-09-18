const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Settings & Configuration
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),

  // Security & Blocklist
  getBlocklist: () => ipcRenderer.invoke('get-blocklist'),
  getSecurityRules: () => ipcRenderer.invoke('get-security-rules'),
  isEducationalDomain: (domain) => ipcRenderer.invoke('is-educational-domain', domain),
  addBlockedDomain: (domain) => ipcRenderer.invoke('add-blocked-domain', domain),
  removeBlockedDomain: (domain) => ipcRenderer.invoke('remove-blocked-domain', domain),
  checkUrlSecurity: (url) => ipcRenderer.invoke('check-url-security', url),

  // Clear data
  clearBrowsingData: () => ipcRenderer.invoke('clear-browsing-data'),

  // Open Developer Tools for active tab
  openDevTools: () => ipcRenderer.send('open-devtools'),

  // Open Incognito Window
  openIncognitoWindow: () => ipcRenderer.send('open-incognito-window'),

  // Listen to context menu open new tab
  onOpenNewTab: (callback) => ipcRenderer.on('open-new-tab-from-context', (event, url) => callback(url)),

  // Internal page URLs
  getInternalPageUrl: (pageName, params) => ipcRenderer.invoke('get-internal-page-url', pageName, params),

  // Code Studio (Python & JavaScript Execution, Files, Terminal, ZIP)
  checkRuntimes: () => ipcRenderer.invoke('check-runtimes'),
  installRuntime: (runtime) => ipcRenderer.invoke('install-runtime', runtime),
  onRuntimeInstallProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('runtime-install-progress', handler);
    return () => ipcRenderer.removeListener('runtime-install-progress', handler);
  },
  onRuntimesUpdated: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('runtimes-updated', handler);
    return () => ipcRenderer.removeListener('runtimes-updated', handler);
  },
  runCode: (payload) => ipcRenderer.invoke('run-code', payload),
  sendStdin: (input) => ipcRenderer.send('send-stdin', input),
  stopCode: () => ipcRenderer.send('stop-code'),
  onCodeOutput: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('code-output', handler);
    return () => ipcRenderer.removeListener('code-output', handler);
  },
  exportProjectZip: (files) => ipcRenderer.invoke('export-project-zip', files),
  importProjectFolder: () => ipcRenderer.invoke('studio-import-folder'),
  importProjectFiles: () => ipcRenderer.invoke('studio-import-files'),
  importProjectZip: () => ipcRenderer.invoke('studio-import-zip'),
  prepareWebPreview: (payload) => ipcRenderer.invoke('prepare-web-preview', payload),
  pyFileEdit: (payload) => ipcRenderer.invoke('py-file-edit', payload),
  pyFileDelete: (payload) => ipcRenderer.invoke('py-file-delete', payload),
  logDebug: (scope, level, msg, data) => ipcRenderer.send('studio-debug-log', { scope, level, msg, data })
});
