// جسر صغير بين لوحة المكتب وتطبيق سطح المكتب: اختيار مجلد، وفتح مجلد، ومعلومات النسخة — لا شيء آخر
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('mqDesktop', {
  pickFolder: title => ipcRenderer.invoke('mq:pickFolder', String(title || '')),
  openPath: p => ipcRenderer.invoke('mq:openPath', String(p || '')),
  info: () => ipcRenderer.invoke('mq:info'),
  update: action => ipcRenderer.invoke('mq:update', String(action || 'status')),
});
