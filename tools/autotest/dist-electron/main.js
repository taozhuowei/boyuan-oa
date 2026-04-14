import { ipcMain, app, Menu, BrowserWindow, screen, WebContentsView, dialog } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { fork } from "child_process";
import fs from "fs";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
let mainWindow = null;
let browserView = null;
let runnerProcess = null;
let cdpPort = 9222;
function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  mainWindow = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  browserView = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  browserView.webContents.debugger.attach("1.3");
  browserView.webContents.openDevTools({ mode: "bottom" });
  if (mainWindow) {
    mainWindow.contentView.addChildView(browserView);
    const bounds = mainWindow.getBounds();
    updateLayout(bounds.width, bounds.height);
    mainWindow.on("resize", () => {
      if (mainWindow) {
        const [width, height] = mainWindow.getSize();
        updateLayout(width, height);
      }
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(join(__dirname$1, "../dist/index.html"));
    }
  }
}
function updateLayout(width, height) {
  if (!browserView || !mainWindow) return;
  const topOffset = 80;
  const leftCol = 260;
  const rightCol = 320;
  browserView.setBounds({
    x: leftCol,
    y: topOffset,
    width: width - leftCol - rightCol,
    height: height - topOffset
  });
  mainWindow.webContents.executeJavaScript(`
    document.documentElement.style.setProperty('--browser-width', '${width - leftCol - rightCol}px')
  `);
}
function scanDir(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = [];
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        result.push({
          name: entry.name,
          path: fullPath,
          type: "dir",
          children: scanDir(fullPath)
        });
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        result.push({
          name: entry.name,
          path: fullPath,
          type: "file"
        });
      }
    }
    return result.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "dir" ? -1 : 1;
    });
  } catch {
    return [];
  }
}
ipcMain.handle("scan-dir", async (_, dirPath) => {
  try {
    const tree = scanDir(dirPath);
    return { success: true, tree };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});
ipcMain.handle("scan-cases", async (_, dirPaths) => {
  try {
    const runnerPath = join(__dirname$1, "../runner/index.ts");
    const allCases = [];
    for (const casesDir of dirPaths) {
      const cases = await new Promise((resolveP, rejectP) => {
        const child = fork(runnerPath, ["--scan-only", "--cases-dir", casesDir], {
          execArgv: ["--import", "tsx"],
          stdio: ["pipe", "pipe", "pipe", "ipc"]
        });
        const timer = setTimeout(() => {
          child.kill("SIGTERM");
          rejectP(new Error("Scan timeout"));
        }, 3e4);
        child.on("message", (msg) => {
          if ((msg == null ? void 0 : msg.type) === "cases-scanned") {
            clearTimeout(timer);
            resolveP(msg.cases);
            child.kill();
          } else if ((msg == null ? void 0 : msg.type) === "cases-scan-error") {
            clearTimeout(timer);
            rejectP(new Error(msg.error));
            child.kill();
          }
        });
        child.on("error", (e) => {
          clearTimeout(timer);
          rejectP(e);
        });
      });
      allCases.push(...cases);
    }
    return { success: true, cases: allCases };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});
ipcMain.handle("browser-back", async () => {
  if (browserView) {
    browserView.webContents.goBack();
  }
});
ipcMain.handle("browser-forward", async () => {
  if (browserView) {
    browserView.webContents.goForward();
  }
});
ipcMain.handle("browser-reload", async () => {
  if (browserView) {
    browserView.webContents.reload();
  }
});
ipcMain.handle("browser-navigate", async (_, url) => {
  if (browserView) {
    await browserView.webContents.loadURL(url);
  }
});
ipcMain.handle("devtools-toggle", async () => {
  if (!browserView) return;
  if (browserView.webContents.isDevToolsOpened()) {
    browserView.webContents.closeDevTools();
  } else {
    browserView.webContents.openDevTools({ mode: "bottom" });
  }
});
ipcMain.handle("start-runner", async (_, casesDir, baseUrl) => {
  try {
    if (runnerProcess) {
      stopRunnerProcess();
    }
    if (!browserView) {
      return { success: false, error: "BrowserView not initialized" };
    }
    const debuggerInfo = browserView.webContents.debugger;
    const port = await new Promise((resolve) => {
      browserView.webContents.debugger.sendCommand("Runtime.evaluate", {
        expression: "window.location.href"
      }).catch(() => {
      });
      setTimeout(() => resolve(cdpPort), 100);
    });
    const cdpEndpoint = `ws://127.0.0.1:${port}/devtools/page/${browserView.webContents.id}`;
    const configPath = join(casesDir, "..", "autotest.config.json");
    startRunnerProcess(casesDir, configPath, cdpEndpoint);
    return { success: true, cdpEndpoint };
  } catch (err) {
    console.error("[start-runner error]", err);
    return { success: false, error: String(err) };
  }
});
ipcMain.handle("stop-runner", async () => {
  stopRunnerProcess();
  return { success: true };
});
ipcMain.handle("navigate-browser", async (_, url) => {
  if (browserView) {
    await browserView.webContents.loadURL(url);
  }
});
ipcMain.handle("load-config", async (_, configPath) => {
  try {
    const configText = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configText);
    const casesDir = join(dirname(configPath), config.cases_dir || "./cases");
    const runnerPath = join(__dirname$1, "../runner/index.ts");
    const cases = await new Promise((resolveP, rejectP) => {
      const child = fork(runnerPath, ["--scan-only", "--cases-dir", casesDir], {
        execArgv: ["--import", "tsx"],
        stdio: ["pipe", "pipe", "pipe", "ipc"]
      });
      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        rejectP(new Error("Scan timeout"));
      }, 3e4);
      child.on("message", (msg) => {
        if ((msg == null ? void 0 : msg.type) === "cases-scanned") {
          clearTimeout(timer);
          resolveP(msg.cases);
          child.kill();
        } else if ((msg == null ? void 0 : msg.type) === "cases-scan-error") {
          clearTimeout(timer);
          rejectP(new Error(msg.error));
          child.kill();
        }
      });
      child.on("error", (e) => {
        clearTimeout(timer);
        rejectP(e);
      });
    });
    return { success: true, config: { ...config, _configPath: configPath, _casesDir: casesDir }, cases };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});
ipcMain.handle("open-file-dialog", async () => {
  if (!mainWindow) return { success: false, error: "Main window not available" };
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "Config Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  if (filePaths && filePaths.length > 0) {
    return { success: true, filePath: filePaths[0] };
  }
  return { success: false, cancelled: true };
});
ipcMain.handle("save-report-dialog", async (_, reportData) => {
  if (!mainWindow) return { success: false, error: "Main window not available" };
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: "report.html",
    filters: [
      { name: "HTML Report", extensions: ["html"] },
      { name: "JSON Report", extensions: ["json"] }
    ]
  });
  if (filePath) {
    try {
      fs.writeFileSync(filePath, reportData);
      return { success: true, filePath };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
  return { success: false, cancelled: true };
});
ipcMain.handle("send-control", async (_, message) => {
  if (runnerProcess) {
    runnerProcess.send({ type: "control", data: message });
    return { success: true };
  }
  return { success: false, error: "Runner not running" };
});
function setupConsoleForwarding() {
  if (!browserView) return;
  browserView.webContents.on("console-message", (_, level, message) => {
    if (mainWindow) {
      mainWindow.webContents.send("browser-console", {
        level: ["verbose", "info", "warning", "error"][level] || "log",
        message,
        timestamp: Date.now()
      });
    }
  });
}
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  setupConsoleForwarding();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
function forwardToUI(channel, data) {
  if (mainWindow) {
    mainWindow.webContents.send(channel, data);
  }
}
function startRunnerProcess(casesDir, configPath, cdpEndpoint) {
  const runnerPath = join(__dirname$1, "../runner/index.ts");
  runnerProcess = fork(runnerPath, [
    "--cases-dir",
    casesDir,
    "--config",
    configPath,
    "--cdp-endpoint",
    cdpEndpoint,
    "--mode",
    "case-confirm"
  ], {
    execArgv: ["--loader", "tsx/esm"],
    stdio: ["pipe", "pipe", "pipe", "ipc"]
  });
  runnerProcess.on("message", (msg) => {
    if (msg.type === "runner-event") {
      forwardToUI("runner-event", msg.data);
    }
  });
  runnerProcess.on("error", (err) => {
    console.error("[Runner Process Error]", err);
    forwardToUI("runner-error", { error: err.message });
  });
  runnerProcess.on("exit", (code) => {
    console.log(`[Runner Process] Exited with code ${code}`);
    forwardToUI("runner-exit", { code });
    runnerProcess = null;
  });
}
function stopRunnerProcess() {
  if (runnerProcess) {
    runnerProcess.send({ type: "control", data: { type: "stop" } });
    setTimeout(() => {
      if (runnerProcess) {
        runnerProcess.kill("SIGTERM");
      }
    }, 5e3);
  }
}
export {
  browserView,
  forwardToUI,
  mainWindow
};
