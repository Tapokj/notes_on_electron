const { app, BrowserWindow, Menu, dialog } = require('electron');

const fs = require('fs');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900, 
    height: 680, 
    webPreferences: {
      nodeIntegration: true
    },
    // titleBarStyle: 'hidden'
  },);
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    // mainWindow.webContents.openDevTools();
  }

  const isMac = process.flatform === 'darwin' ? true : false;

  const template = [
      {
          label : 'File',
          submenu : [
              {
                 label : "Open File",
                 accelerator : 'Ctrl+O', 
                 click () {
                   openFile()
                 }
                },
              {
                label : "Open Folder",
                accelerator: 'Ctrl+F',
                click(){
                  openFolder()
                }
              },
              {
                label : "Save File",
                accelerator: 'Ctrl+S',
                click(){
                  mainWindow.webContents.send('save-file');
                }
              }
          ]
      },
    // { role: 'appMenu' }
    ...(process.platform === 'darwin' ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click () { require('electron').shell.openExternalSync('https://electronjs.org') }
        }
      ]
    },
    {
      label : 'Developer',
      submenu : [
        { 
          label : 'Toggle Developer Tools',
          accelerator : process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+U',
          click() {
            mainWindow.webContents.toggleDevTools()
          } 
        }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => mainWindow = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function openFile(){
  // Open file loogin for markdown
  const files = dialog.showOpenDialog(mainWindow, {
    properties : ['openFile'],
    filters : [{
      name : 'Markdown', extensions : ['md', 'txt', 'markdown']
    }]
  })
  // if files not found
  if (!files) return 
  
  const file = files[0];
  const fileContent = fs.readFileSync(file).toString();

  // Send filecontent to renderer
  mainWindow.webContents.send('new-file', fileContent);
}

// Open directory
function openFolder(){
  
  const directory = dialog.showOpenDialog(mainWindow, {
    properties : ['openDirectory'],
  })
  // if directory not found
  if (!directory) return;
  
  const dir = directory[0];
  mainWindow.webContents.send('new-dir', dir);
}