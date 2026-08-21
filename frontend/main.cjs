const { app, BrowserWindow } = require('electron'); // Import Electron modules
const { spawn, exec } = require('child_process'); // Import process managers
const path = require('path'); // Import path utility

require('dotenv').config(); // Load environment variables
const cpuoptimization = path.join(__dirname,'electron','limitations','cpu_limitations.cjs'); // Set CPU config
const ramoptimization = path.join(__dirname,'electron','limitations','ram_limitation.cjs'); // Set RAM config
const lmstudio = path.join(__dirname,'electron','manegers','lm_studio_controller.cjs'); // Set LM controller

const {cpu_optimization} = require(cpuoptimization); // Load CPU optimizer
const {ram_optimization} = require(ramoptimization); // Load RAM optimizer

const {lm_studio} = require(lmstudio); // Load LM controller

let main_window = null; // Init main window
let backendProcess = null; // Init backend process

cpu_optimization(); // Apply CPU limits
ram_optimization(); // Apply RAM limits

app.disableHardwareAcceleration(); // Disable hardware accel

lm_studio(); // Start LM controller

function startBackend() { // Backend startup function
  const isDev = !app.isPackaged; // Check dev mode
  
  const isWin = process.platform === 'win32'; // Check OS platform
  
  const executableName = isWin ? 'backend.exe' : 'backend'; // Determine executable name

  const backendPath = isDev 
    ? path.join(__dirname, 'backend-dist', executableName) 
    : path.join(process.resourcesPath, 'backend', executableName); // Resolve backend path

  try { // Start try block
    console.log("Backend başlatılıyor:", backendPath); // Log backend startup
    backendProcess = spawn(backendPath, [], { detached: false }); // Spawn backend process

    backendProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`)); // Listen standard output
    backendProcess.stderr.on('data', (data) => console.error(`Backend Hata: ${data}`)); // Listen standard error
  } catch (error) { // Catch startup error
    console.error("Backend başlatılamadı:", error); // Log startup error
  }
}

function create_window() { // Window creation function
  main_window = new BrowserWindow({ // Init browser window
    width: 1200, // Set window width
    height: 800, // Set window height
    webPreferences: { // Configure web preferences
      preload: path.join(__dirname, 'preload.cjs'), // Set preload script
      contextIsolation: true, // Enable context isolation
      nodeIntegration: false, // Disable node integration
      sandbox: true, // Enable sandbox mode
      webSecurity: true,  // Enable web security
      enableRemoteModule: false, // Disable remote module
      spellcheck: false, // Disable spell check
      backgroundThrottling: true // Enable background throttle
    }
  });

  main_window.webContents.on('will-navigate', (event, url) => { // Handle navigation event
    if (!url.startsWith(process.env.VITE_FRONTEND_LINK)){ // Validate target URL
      event.preventDefault(); // Prevent invalid navigation
    }
  });

  main_window.webContents.setWindowOpenHandler (() => { // Handle new windows
     return {action:'deny'}; // Deny window opening
  });

  if (!app.isPackaged) { // Check package status
    main_window.loadURL(process.env.VITE_FRONTEND_LINK); // Load dev server
  } else { // Handle production mode
    main_window.loadFile(path.join(__dirname, 'dist', 'index.html')); // Load production build
  }

  main_window.on('closed', () => { // Handle window close
    main_window = null; // Reset window reference
  });
}

app.whenReady().then(() => { // Handle app ready
  startBackend(); // Start python backend
  create_window(); // Create main window

  app.on('activate', () => { // Handle app activation
    if (BrowserWindow.getAllWindows().length === 0) create_window(); // Recreate window conditionally
  });
});

app.on('before-quit', () => { // Handle before quit
  BrowserWindow.getAllWindows().forEach(window => { // Iterate all windows
    window.destroy(); // Destroy window instance
  })
});

app.on('will-quit', () => { // Handle app quit
  
  if (backendProcess) { // Check backend process
    console.log("Arka plandaki Python backend kapatılıyor..."); // Log backend shutdown
    
    if (process.platform === 'win32') { // Check Windows OS
      exec(`taskkill /pid ${backendProcess.pid} /T /F`, (err) => { // Force kill Windows
         if(err) console.error("Windows backend kapatma hatası:", err); // Log kill error
      });
    } else { // Handle non-Windows
      backendProcess.kill('SIGKILL'); // Force kill Unix
    }
  }
  
  app.exit(0); // Exit app cleanly
});

app.on('window-all-closed', () => { // Handle all closed
  if (process.platform !== 'darwin') app.quit(); // Quit app non-macOS
});