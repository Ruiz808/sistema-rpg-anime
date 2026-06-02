const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'public', 'pwa-192x192.png'),
    webPreferences: {
      // Quando carregamos da internet, a segurança tem de ser alta:
      nodeIntegration: false, 
      contextIsolation: true
    }
  });

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