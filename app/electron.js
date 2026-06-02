import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true, // Esconde a barra de ferramentas para parecer um jogo nativo
    icon: path.join(__dirname, 'public', 'pwa-512x512.png'), // O seu ícone perfeito!
    webPreferences: {
      nodeIntegration: true
    }
  });

  // O Electron vai ler diretamente a pasta 'dist' que o Vite gera
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // No Windows, quando o jogador fecha a janela, o processo morre completamente
  if (process.platform !== 'darwin') app.quit();
});