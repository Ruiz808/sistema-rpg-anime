const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    // 👇 O feitiço direto e absoluto 👇
    icon: path.join(__dirname, 'logo.ico'), 
    webPreferences: {
      nodeIntegration: true,
      // ...
    }
  });
// 👇 O FEITIÇO ANTI-CACHE (Adicione estas 2 linhas aqui) 👇
  // Limpa os fantasmas do Vite, mas mantém o Login do Firebase intacto!
  win.webContents.session.clearCache();
  win.webContents.session.clearStorageData({ storages: ['serviceworkers'] });
  // 👇 O SEGREDO ESTÁ AQUI 👇
  // Apague o link de exemplo e coloque o link do seu site no ar!
  win.loadURL('https://databaserpg-5595b.web.app');
  win.webContents.openDevTools();
  
  // (Opcional) Se quiser que o fundo fique preto enquanto a internet carrega o jogo:
  win.setBackgroundColor('#000000');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});