// جسر نافذة «الاتصال بجهاز المكتب الرئيسي»
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mqJoin', {
  scan: () => ipcRenderer.invoke('mq:joinScan'),
  test: u => ipcRenderer.invoke('mq:joinTest', String(u || '')),
  save: u => ipcRenderer.invoke('mq:joinSave', String(u || '')),
  asNew: () => ipcRenderer.invoke('mq:joinNew'),
});
