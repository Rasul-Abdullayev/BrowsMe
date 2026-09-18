/**
 * codeStudio.js - BrowsMe Educational Code Studio
 * Python & JavaScript Code Editor, Integrated Terminal, File Explorer Tree, and ZIP Exporter
 * Designed for young developers & students (ages 12-17)
 */

class CodeStudio {
  constructor() {
    this.sidebar = document.getElementById('codeStudioSidebar');
    this.toggleBtn = document.getElementById('codeStudioBtn');
    this.closeBtn = document.getElementById('closeStudioBtn');
    this.resizer = document.getElementById('studioResizer');

    // Environment Switcher (Python vs Node.js)
    this.envPythonBtn = document.getElementById('envPythonBtn');
    this.envNodeBtn = document.getElementById('envNodeBtn');
    this.explorerTitle = document.getElementById('explorerTitle');
    this.sampleCodeSelect = document.getElementById('sampleCodeSelect');
    this.currentEnv = 'python'; // 'python' or 'node'

    // Explorer elements
    this.fileTreeContainer = document.getElementById('fileTreeContainer');
    this.newFileBtn = document.getElementById('newFileBtn');
    this.newFolderBtn = document.getElementById('newFolderBtn');
    this.clearCacheBtn = document.getElementById('clearCacheBtn');

    // Editor elements
    this.tabsContainer = document.getElementById('editorTabsContainer');
    this.previewBtn = document.getElementById('previewCodeBtn');
    this.runBtn = document.getElementById('runCodeBtn');
    this.stopBtn = document.getElementById('stopCodeBtn');
    this.gutter = document.getElementById('editorGutter');
    this.textarea = document.getElementById('codeTextarea');
    this.syntaxLayer = document.getElementById('syntaxHighlightLayer');
    this.syntaxCode = document.getElementById('syntaxHighlightCode');

    // Terminal elements
    this.terminal = document.getElementById('studioTerminal');
    this.terminalResizer = document.getElementById('terminalResizer');
    this.terminalStatus = document.getElementById('terminalStatusBadge');
    this.terminalTimer = document.getElementById('terminalTimerBadge');
    this.terminalViewport = document.getElementById('terminalViewport');
    this.terminalContent = document.getElementById('terminalContent');
    this.clearTermBtn = document.getElementById('clearTerminalBtn');
    this.copyTermBtn = document.getElementById('copyTerminalBtn');
    this.stdinForm = document.getElementById('terminalStdinForm');
    this.stdinInput = document.getElementById('terminalStdinInput');

    // ZIP Export & Project Import
    this.exportZipBtn = document.getElementById('exportZipBtn');
    this.importProjectBtn = document.getElementById('importProjectBtn');
    this.importModal = document.getElementById('studioImportModal');
    this.closeImportModalBtn = document.getElementById('closeImportModalBtn');
    this.cancelImportBtn = document.getElementById('cancelImportBtn');
    this.importFolderOptBtn = document.getElementById('importFolderOptBtn');
    this.importFilesOptBtn = document.getElementById('importFilesOptBtn');
    this.importZipOptBtn = document.getElementById('importZipOptBtn');
    this.importReplaceCheckbox = document.getElementById('importReplaceCheckbox');

    this.pyRuntimeBadge = document.getElementById('pyRuntimeBadge');
    this.pyRuntimeText = document.getElementById('pyRuntimeText');
    this.nodeRuntimeBadge = document.getElementById('nodeRuntimeBadge');
    this.nodeRuntimeText = document.getElementById('nodeRuntimeText');

    // Runtime Modal
    this.runtimeModal = document.getElementById('runtimeAlertModal');
    this.closeRuntimeModalBtn = document.getElementById('closeRuntimeModalBtn');
    this.autoInstallRuntimeBtn = document.getElementById('autoInstallRuntimeBtn');
    this.runtimeStatusList = document.getElementById('runtimeStatusList');
    this.runtimeHelperNote = document.getElementById('runtimeHelperNote');

    // Custom Input Modal (replaces prompt)
    this.inputModal = document.getElementById('studioInputModal');
    this.inputModalIcon = document.getElementById('studioModalIcon');
    this.inputModalTitle = document.getElementById('studioModalTitle');
    this.inputModalSubtitle = document.getElementById('studioModalSubtitle');
    this.inputModalName = document.getElementById('studioInputName');
    this.inputModalError = document.getElementById('studioInputError');
    this.inputModalCancelBtn = document.getElementById('studioInputCancelBtn');
    this.inputModalSubmitBtn = document.getElementById('studioInputSubmitBtn');
    this.studioExtPills = document.getElementById('studioExtPills');
    this.inputFolderWrapper = document.getElementById('studioFolderSelectWrapper');
    this.inputFolderSelect = document.getElementById('studioInputFolderSelect');

    // Custom Confirm Modal (replaces confirm)
    this.confirmModal = document.getElementById('studioConfirmModal');
    this.confirmModalTitle = document.getElementById('studioConfirmTitle');
    this.confirmModalMessage = document.getElementById('studioConfirmMessage');
    this.confirmModalCancelBtn = document.getElementById('studioConfirmCancelBtn');
    this.confirmModalSubmitBtn = document.getElementById('studioConfirmSubmitBtn');

    // State
    this.isOpen = false;
    this.files = [];
    this.activeFileId = null;
    this.openTabs = []; // list of file IDs
    this.expandedFolders = new Set();
    this.isRunning = false;
    this.timerInterval = null;
    this.startTime = 0;
    this.runtimes = { python: null, node: null };
    this.modalCallback = null;
    this.inlineRenameId = null;
    this._confirmModalOpenTime = 0;
    this._inputModalOpenTime = 0;

    this.init();
  }

  init() {
    this.log('info', 'CodeStudio initializing...');
    this.loadFiles();
    this.setupEventListeners();
    this.setupEditorGutter();
    this.setupResizers();
    this.setupModals();
    this.checkSystemRuntimes();
    this.log('info', 'CodeStudio initialized successfully');
  }

  log(level, msg, data = null) {
    const prefix = `[CodeStudio] ${msg}`;
    if (level === 'error') console.error(prefix, data || '');
    else if (level === 'warn') console.warn(prefix, data || '');
    else console.log(prefix, data || '');

    if (window.electronAPI && typeof window.electronAPI.logDebug === 'function') {
      try {
        window.electronAPI.logDebug('CODE_STUDIO', level.toUpperCase(), msg, data);
      } catch (e) {}
    }
  }

  getFileExt(filename) {
    if (!filename || typeof filename !== 'string') return '';
    const idx = filename.lastIndexOf('.');
    return idx !== -1 ? filename.slice(idx).toLowerCase() : '';
  }

  // =========================================================
  // 1. FILE SYSTEM & STATE
  // =========================================================
  // =========================================================
  // 1. FILE SYSTEM & STATE
  // =========================================================
  getDefaultFiles() {
    return [
      {
        id: 'file_eded_tapma',
        name: 'eded_tapma.py',
        path: 'eded_tapma.py',
        folder: '/',
        env: 'python',
        type: 'file',
        ext: '.py',
        content: `# 🎮 Ağlımdakı Ədədi Tap - Desktop Oyunu (Python Tkinter GUI)
# 1-100 arasında gizli ədədi tapmaq üçün 3 seçimdən birini klikləyin!
import tkinter as tk
import random

class EdedTapmaOyunu:
    def __init__(self, master):
        self.master = master
        self.master.title("🧠 Ağlımdakı Ədədi Tap (1 - 100)")
        self.master.geometry("460x420")
        self.master.resizable(False, False)
        self.master.configure(bg="#0B132B")

        self.xal = 0
        self.raund = 1
        self.gizli_eded = 0
        self.secimler = []

        # Başlıq
        self.lbl_basliq = tk.Label(
            master, 
            text="🧠 Ağlımdakı Ədədi Tap", 
            font=("Segoe UI", 16, "bold"), 
            fg="#38BDF8", 
            bg="#0B132B"
        )
        self.lbl_basliq.pack(pady=(18, 4))

        self.lbl_izah = tk.Label(
            master, 
            text="Kompüter 1 ilə 100 arasında bir ədəd tutdu.\\nDoğru ədədi tapmaq üçün 3 seçimdən birini klikləyin:", 
            font=("Segoe UI", 10), 
            fg="#94A3B8", 
            bg="#0B132B"
        )
        self.lbl_izah.pack(pady=4)

        # Xal və Raund
        self.lbl_status = tk.Label(
            master, 
            text="🏆 Xal: 0  |  🎯 Raund: 1", 
            font=("Segoe UI", 12, "bold"), 
            fg="#F472B6", 
            bg="#0B132B"
        )
        self.lbl_status.pack(pady=8)

        # Nəticə Mesajı
        self.lbl_mesaj = tk.Label(
            master, 
            text="Seçiminizi edin 👇", 
            font=("Segoe UI", 11, "bold"), 
            fg="#FBBF24", 
            bg="#0B132B"
        )
        self.lbl_mesaj.pack(pady=10)

        # Seçim Düymələri üçün Frame
        self.btn_frame = tk.Frame(master, bg="#0B132B")
        self.btn_frame.pack(pady=12)

        self.duymeler = []
        for i in range(3):
            btn = tk.Button(
                self.btn_frame, 
                text="", 
                font=("Segoe UI", 14, "bold"), 
                width=8, 
                height=2,
                bg="#1E293B", 
                fg="#FFFFFF", 
                activebackground="#3B82F6",
                activeforeground="#FFFFFF",
                relief="flat",
                cursor="hand2",
                command=lambda idx=i: self.yoxla(idx)
            )
            btn.grid(row=0, column=i, padx=10)
            self.duymeler.append(btn)

        # Yenidən Başla Düyməsi
        self.btn_yenile = tk.Button(
            master, 
            text="🔄 Oyunu Yenidən Başlat", 
            font=("Segoe UI", 10, "bold"), 
            bg="#334155", 
            fg="#FFFFFF", 
            activebackground="#475569", 
            relief="flat",
            cursor="hand2",
            padx=14, 
            pady=6,
            command=self.yeni_oyun
        )
        self.btn_yenile.pack(pady=(18, 10))

        self.yeni_raund()

    def yeni_raund(self):
        self.gizli_eded = random.randint(1, 100)
        
        # 2 fərqli səhv ədəd seçirik
        sehv_ededler = set()
        while len(sehv_ededler) < 2:
            s = random.randint(1, 100)
            if s != self.gizli_eded:
                sehv_ededler.add(s)
        
        self.secimler = list(sehv_ededler) + [self.gizli_eded]
        random.shuffle(self.secimler)

        for i in range(3):
            self.duymeler[i].config(
                text=str(self.secimler[i]), 
                bg="#1E293B", 
                fg="#FFFFFF", 
                state="normal"
            )
        self.lbl_mesaj.config(text="Hansı ədədi tutmuşam? Seçin 👇", fg="#38BDF8")

    def yoxla(self, idx):
        secilmis = self.secimler[idx]
        for btn in self.duymeler:
            btn.config(state="disabled")

        if secilmis == self.gizli_eded:
            self.xal += 10
            self.duymeler[idx].config(bg="#10B981")
            self.lbl_mesaj.config(text=f"🎉 ƏHSƏN! Düzgün tapdınız: {self.gizli_eded} (+10 Xal)", fg="#10B981")
            print(f"[Raund {self.raund}] Doğru tapıldı: {self.gizli_eded} | Ümumi Xal: {self.xal}")
        else:
            self.duymeler[idx].config(bg="#EF4444")
            # Doğru olan düyməni yaşıl göstər
            for j, val in enumerate(self.secimler):
                if val == self.gizli_eded:
                    self.duymeler[j].config(bg="#10B981")
            self.lbl_mesaj.config(text=f"❌ Səhvdir! Ağlımdakı ədəd: {self.gizli_eded} idi.", fg="#EF4444")
            print(f"[Raund {self.raund}] Səhv təxmin: {secilmis} | Doğru cavab: {self.gizli_eded}")

        self.raund += 1
        self.lbl_status.config(text=f"🏆 Xal: {self.xal}  |  🎯 Raund: {self.raund}")
        self.master.after(1400, self.yeni_raund)

    def yeni_oyun(self):
        self.xal = 0
        self.raund = 1
        self.lbl_status.config(text="🏆 Xal: 0  |  🎯 Raund: 1")
        self.yeni_raund()
        print("🔄 Oyun sıfırlandı və yenidən başladıldı.")

if __name__ == "__main__":
    print("🚀 'Ağlımdakı Ədədi Tap' oyunu başladıldı...")
    kok = tk.Tk()
    oyun = EdedTapmaOyunu(kok)
    kok.mainloop()
    print(f"🏁 Oyun başa çatdı. Yekun xalınız: {oyun.xal}")
`
      },
      {
        id: 'file_saygac_taymer',
        name: 'saygac_taymer.js',
        path: 'saygac_taymer.js',
        folder: '/',
        env: 'node',
        type: 'file',
        ext: '.js',
        content: `// ⏱️ BrowsMe Real-Vaxt Taymeri (00:00:00)
// 00:00:00-dan başlayır və tətbiq/brauzer açıq olduğu müddətcə davam edir.
console.log("==================================================");
console.log("⏱️  BROWSME DƏQİQ TAYMERİ İŞƏ SALINDI");
console.log("⏱️  00:00:00-dan başlayaraq fasiləsiz davam edir...");
console.log("==================================================");

let totalSeconds = 0;

function formatTime(totalSec) {
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSec % 60).padStart(2, '0');
  return \`\${hours}:\${minutes}:\${seconds}\`;
}

// İlkin başlanğıc vaxtı
console.log(\`⏱️ Cari Vaxt: \${formatTime(totalSeconds)} [BAŞLANĞIC]\`);

// Hər saniyə artan sonsuz taymer dövrü
const timerInterval = setInterval(() => {
  totalSeconds++;
  const timeStr = formatTime(totalSeconds);
  console.log(\`⏱️ Taymer: \${timeStr}\`);
}, 1000);
`
      },
      {
        id: 'file_py_style_qss',
        name: 'style.qss',
        path: 'style.qss',
        folder: '/',
        env: 'python',
        type: 'file',
        ext: '.qss',
        content: `/* 🎨 Python Desktop GUI Dizayn Stili (PyQt / PySide / Tkinter QSS) */
QWidget {
    background-color: #0F172A;
    color: #F8FAFC;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
}

QPushButton {
    background-color: #3B82F6;
    color: #FFFFFF;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-weight: bold;
}

QPushButton:hover {
    background-color: #2563EB;
}

QPushButton:pressed {
    background-color: #1D4ED8;
}

QLabel {
    color: #38BDF8;
    font-size: 14px;
    font-weight: bold;
}

QLineEdit {
    background-color: #1E293B;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #FFFFFF;
    padding: 6px 10px;
}
`
      }
    ];
  }

  loadFiles() {
    try {
      const stored = localStorage.getItem('browsme_code_studio_files_v6');
      const isInit = localStorage.getItem('browsme_studio_initialized_v3');
      if (stored !== null) {
        this.files = JSON.parse(stored);
      } else if (!isInit) {
        this.files = this.getDefaultFiles();
        localStorage.setItem('browsme_studio_initialized_v3', 'true');
        this.saveFiles();
      } else {
        this.files = [];
      }
    } catch (e) {
      console.warn('Files load error:', e);
      this.files = [];
    }

    if (!Array.isArray(this.files)) {
      this.files = [];
    }

    // Default active file
    const envFile = this.files.find(f => f.type === 'file' && f.env === this.currentEnv) || this.files[0];
    if (envFile) {
      this.openTabs = [envFile.id];
      this.activeFileId = envFile.id;
    } else {
      this.openTabs = [];
      this.activeFileId = null;
    }

    this.renderExplorerTree();
    this.renderTabs();
    this.loadActiveFileContent();
  }

  saveFiles() {
    try {
      localStorage.setItem('browsme_code_studio_files_v6', JSON.stringify(this.files));
      localStorage.setItem('browsme_studio_initialized_v3', 'true');
    } catch (e) {
      console.error('Failed to persist files:', e);
    }
  }

  async clearAllCache() {
    this.log('info', 'clearAllCache initiated by user');
    try {
      localStorage.removeItem('browsme_code_studio_files_v6');
      localStorage.removeItem('browsme_code_studio_files_v5');
      localStorage.removeItem('browsme_code_studio_files_v4');
      localStorage.removeItem('browsme_code_studio_files_v3');
      localStorage.removeItem('browsme_code_studio_files_v2');
      localStorage.removeItem('browsme_code_studio_files_v1');
    } catch (e) {}

    // Call Python deleter.py on temp code runner directory
    if (window.electronAPI && typeof window.electronAPI.pyFileDelete === 'function') {
      try {
        const res = await window.electronAPI.pyFileDelete({ target: 'temp_all' });
        this.log('info', 'deleter.py cache wipe result', res);
      } catch (e) {}
    }

    // Clear Electron browsing data
    if (window.electronAPI && typeof window.electronAPI.clearBrowsingData === 'function') {
      try {
        await window.electronAPI.clearBrowsingData();
      } catch (e) {}
    }

    this.files = this.getDefaultFiles();
    this.saveFiles();
    this.openTabs = [];
    const envFile = this.files.find(f => f.type === 'file' && f.env === this.currentEnv) || this.files[0];
    if (envFile) {
      this.openTabs = [envFile.id];
      this.activeFileId = envFile.id;
    }

    this.renderExplorerTree();
    this.renderTabs();
    this.loadActiveFileContent();
    this.showToast('🧹 Bütün keş təmizləndi və ilkin fayllar bərpa olundu!');
    this.log('info', 'clearAllCache finished successfully');
  }

  getActiveFile() {
    return this.files.find(f => f.id === this.activeFileId);
  }

  getFileIcon(name, isFolder) {
    if (isFolder) return '📁';
    const ext = this.getFileExt(name);
    switch (ext) {
      case '.py': return '🐍';
      case '.qss': return '🎨';
      case '.js':
      case '.mjs': return '⚡';
      case '.json': return '📋';
      case '.txt':
      case '.md': return '📝';
      case '.html':
      case '.htm': return '🌐';
      case '.css': return '🎨';
      case '.sql': return '🗄️';
      case '.csv': return '📊';
      default: return '📄';
    }
  }

  // =========================================================
  // 2. ENVIRONMENT SWITCHER (PYTHON VS NODE.JS)
  // =========================================================
  setEnvironment(env) {
    if (this.currentEnv === env) return;
    this.saveCurrentEditorContent();
    this.currentEnv = env;

    if (env === 'python') {
      this.envPythonBtn.classList.add('active');
      this.envNodeBtn.classList.remove('active');
      this.explorerTitle.textContent = 'PYTHON 3 FAYLLARI';
      if (this.langTag) this.langTag.textContent = '🐍 Python 3';
    } else {
      this.envNodeBtn.classList.add('active');
      this.envPythonBtn.classList.remove('active');
      this.explorerTitle.textContent = 'NODE.JS & VEB FAYLLARI';
      if (this.langTag) this.langTag.textContent = '⚡ Node.js';
    }

    // Switch active file to the first file in the new environment
    const matchingFile = this.files.find(f => f.type === 'file' && f.env === env);
    if (matchingFile) {
      if (!this.openTabs.includes(matchingFile.id)) {
        this.openTabs.push(matchingFile.id);
      }
      this.activeFileId = matchingFile.id;
    }

    this.renderExplorerTree();
    this.renderTabs();
    this.loadActiveFileContent();
  }

  // =========================================================
  // 3. FILE EXPLORER TREE RENDERING WITH FOLDER HIERARCHY
  // =========================================================
  renderExplorerTree() {
    if (!this.fileTreeContainer) return;
    this.fileTreeContainer.innerHTML = '';
    
    // Add drop handler for root
    this.fileTreeContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    this.fileTreeContainer.addEventListener('drop', (e) => {
      // If we drop directly on the container, but not on a specific element inside it
      if (e.target === this.fileTreeContainer) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId) {
          const draggedFile = this.files.find(f => f.id === draggedId);
          if (draggedFile && draggedFile.folder !== '/') {
            draggedFile.folder = '/';
            draggedFile.path = draggedFile.name;
            this.saveFiles();
            this.renderExplorerTree();
          }
        }
      }
    });

    // Filter files for current environment (or shared)
    const envFiles = this.files.filter(f => !f.env || f.env === this.currentEnv);

    // Group items: root items, and items inside folders
    const rootItems = envFiles.filter(f => !f.folder || f.folder === '/');
    const folderMap = new Map();

    envFiles.forEach(f => {
      if (f.folder && f.folder !== '/') {
        if (!folderMap.has(f.folder)) folderMap.set(f.folder, []);
        folderMap.get(f.folder).push(f);
      }
    });

    // Render helper
    // Render helper
    const renderNode = (item, depth = 0) => {
      const isFolder = item.type === 'folder';
      const el = document.createElement('div');
      el.className = isFolder ? `tree-folder ${this.selectedFolder === item.name ? 'selected-folder' : ''}` : `tree-file ${item.id === this.activeFileId ? 'active' : ''}`;
      el.dataset.id = item.id;
      el.style.paddingLeft = `${depth * 14 + 10}px`;
      
      // DRAG AND DROP LOGIC
      el.draggable = true;
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
        el.style.opacity = '0.5';
      });
      el.addEventListener('dragend', () => {
        el.style.opacity = '1';
      });

      if (isFolder) {
        el.addEventListener('dragover', (e) => {
          e.preventDefault(); // allow drop
          e.dataTransfer.dropEffect = 'move';
          el.style.background = 'rgba(59, 130, 246, 0.2)';
        });
        el.addEventListener('dragleave', (e) => {
          el.style.background = '';
        });
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          el.style.background = '';
          const draggedId = e.dataTransfer.getData('text/plain');
          if (draggedId && draggedId !== item.id) {
            const draggedFile = this.files.find(f => f.id === draggedId);
            if (draggedFile && draggedFile.folder !== item.name) {
              // Prevent dropping a folder into itself or its own subfolder (simple check)
              if (draggedFile.type === 'folder' && item.name.startsWith(draggedFile.name)) return;
              
              draggedFile.folder = item.name;
              draggedFile.path = `${item.name}/${draggedFile.name}`;
              this.saveFiles();
              this.expandedFolders.add(item.name);
              this.renderExplorerTree();
            }
          }
        });
      } else {
        // Drop on a file -> move to root if dragged item is in a folder, or do nothing?
        // Let's implement dropping on root or dropping on another file to move to that file's folder.
        el.addEventListener('dragover', (e) => e.preventDefault());
        el.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const draggedId = e.dataTransfer.getData('text/plain');
          if (draggedId && draggedId !== item.id) {
            const draggedFile = this.files.find(f => f.id === draggedId);
            if (draggedFile && draggedFile.folder !== item.folder) {
              draggedFile.folder = item.folder;
              draggedFile.path = item.folder === '/' ? draggedFile.name : `${item.folder}/${draggedFile.name}`;
              this.saveFiles();
              this.renderExplorerTree();
            }
          }
        });
      }

      const label = document.createElement('div');
      label.className = 'tree-label';
      const icon = document.createElement('span');
      icon.className = 'tree-icon';
      icon.textContent = this.getFileIcon(item.name, isFolder);
      label.appendChild(icon);

      if (this.inlineRenameId === item.id) {
        // Inline rename input mode
        const renameInput = document.createElement('input');
        renameInput.type = 'text';
        renameInput.className = 'inline-rename-input';
        renameInput.value = item.name;
        renameInput.draggable = false;
        renameInput.style.flex = '1';
        renameInput.style.background = 'rgba(11, 15, 29, 0.98)';
        renameInput.style.border = '1px solid #3B82F6';
        renameInput.style.color = '#FFFFFF';
        renameInput.style.padding = '2px 6px';
        renameInput.style.fontSize = '12px';
        renameInput.style.borderRadius = '3px';
        renameInput.style.outline = 'none';

        renameInput.onmousedown = (e) => e.stopPropagation();
        renameInput.onpointerdown = (e) => e.stopPropagation();
        renameInput.onclick = (e) => e.stopPropagation();

        let isHandled = false;
        const commit = () => {
          if (isHandled) return;
          isHandled = true;
          const val = renameInput.value.trim();
          this.inlineRenameId = null;
          this.processRename(item.id, val);
        };

        const cancel = () => {
          if (isHandled) return;
          isHandled = true;
          this.inlineRenameId = null;
          this.renderExplorerTree();
        };

        renameInput.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        };

        renameInput.onblur = () => {
          setTimeout(() => {
            if (!isHandled) commit();
          }, 100);
        };

        label.appendChild(renameInput);
        setTimeout(() => {
          renameInput.focus();
          const dotIdx = item.name.lastIndexOf('.');
          if (dotIdx > 0 && !isFolder) {
            renameInput.setSelectionRange(0, dotIdx);
          } else {
            renameInput.select();
          }
        }, 50);
      } else {
        const name = document.createElement('span');
        name.textContent = item.name;
        label.appendChild(name);
      }

      el.appendChild(label);

      // Action buttons
      const actions = document.createElement('div');
      actions.className = 'tree-actions';
      actions.draggable = false;
      actions.onmousedown = (e) => e.stopPropagation();
      actions.onpointerdown = (e) => e.stopPropagation();
      actions.onclick = (e) => e.stopPropagation();

      if (isFolder) {
        // Quick add file inside folder
        const addFileBtn = document.createElement('button');
        addFileBtn.className = 'tree-action-btn add-btn';
        addFileBtn.title = `"${item.name}" qovluğunda yeni fayl yarat`;
        addFileBtn.textContent = '+📄';
        addFileBtn.draggable = false;
        addFileBtn.onmousedown = (e) => e.stopPropagation();
        addFileBtn.onpointerdown = (e) => e.stopPropagation();
        addFileBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectedFolder = item.name;
          this.createNewFile(item.name);
        };

        // Quick add subfolder inside folder
        const addFolderBtn = document.createElement('button');
        addFolderBtn.className = 'tree-action-btn add-btn';
        addFolderBtn.title = `"${item.name}" qovluğunda alt-qovluq yarat`;
        addFolderBtn.textContent = '+📁';
        addFolderBtn.draggable = false;
        addFolderBtn.onmousedown = (e) => e.stopPropagation();
        addFolderBtn.onpointerdown = (e) => e.stopPropagation();
        addFolderBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectedFolder = item.name;
          this.createNewFolder(item.name);
        };

        actions.appendChild(addFileBtn);
        actions.appendChild(addFolderBtn);
      }

      const renameBtn = document.createElement('button');
      renameBtn.className = 'tree-action-btn edit-btn';
      renameBtn.title = 'Adı dəyiş';
      renameBtn.textContent = '✏️';
      renameBtn.draggable = false;
      renameBtn.onmousedown = (e) => e.stopPropagation();
      renameBtn.onpointerdown = (e) => e.stopPropagation();
      renameBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.startInlineRename(item.id);
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'tree-action-btn del-btn';
      deleteBtn.title = 'Sil';
      deleteBtn.textContent = '🗑️';
      deleteBtn.draggable = false;
      deleteBtn.onmousedown = (e) => e.stopPropagation();
      deleteBtn.onpointerdown = (e) => e.stopPropagation();
      deleteBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.log('info', 'Trash can delete clicked -> executing deletion', { itemId: item.id, name: item.name });
        this.processDelete(item.id);
      };

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);
      el.appendChild(actions);

      if (isFolder) {
        el.onclick = () => {
          this.selectedFolder = item.name;
          if (this.expandedFolders.has(item.name)) {
            this.expandedFolders.delete(item.name);
          } else {
            this.expandedFolders.add(item.name);
          }
          this.renderExplorerTree();
        };
      } else {
        el.onclick = () => this.selectFile(item.id);
      }

      this.fileTreeContainer.appendChild(el);

      // If folder and expanded, render its children
      if (isFolder && this.expandedFolders.has(item.name)) {
        const children = folderMap.get(item.name) || [];
        children.forEach(child => renderNode(child, depth + 1));
        
        if (this.inlineCreateState && this.inlineCreateState.parent === item.name) {
          renderInlineInput(depth + 1);
        }
      }
    };

    const renderInlineInput = (depth, targetContainer = null) => {
      const container = targetContainer || this.fileTreeContainer;
      const el = document.createElement('div');
      el.className = 'tree-file inline-create';
      el.style.paddingLeft = `${depth * 14 + 10}px`;
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.marginTop = '2px';
      
      const icon = document.createElement('span');
      icon.className = 'tree-icon';
      icon.textContent = (this.inlineCreateState && this.inlineCreateState.type === 'folder') ? '📁' : '📄';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'inline-file-input';
      input.placeholder = (this.inlineCreateState && this.inlineCreateState.type === 'folder') ? 'qovluq_adi' : 'fayl_adi.ext';
      input.style.flex = '1';
      input.style.background = 'rgba(11, 15, 29, 0.98)';
      input.style.border = '1px solid #3B82F6';
      input.style.color = '#FFF';
      input.style.outline = 'none';
      input.style.padding = '2px 6px';
      input.style.borderRadius = '3px';
      input.style.marginLeft = '4px';
      input.style.fontSize = '12px';
      
      el.appendChild(icon);
      el.appendChild(input);
      container.appendChild(el);
      
      let finished = false;
      const finish = (val) => {
        if (finished) return;
        finished = true;
        if (!this.inlineCreateState) return;
        const type = this.inlineCreateState.type;
        const parent = this.inlineCreateState.parent;
        this.inlineCreateState = null;
        
        if (val) {
          if (type === 'file') this.processNewFile(val, parent);
          else this.processNewFolder(val, parent);
        } else {
          this.renderExplorerTree();
        }
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finish(input.value.trim());
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finish(null);
        }
      });

      setTimeout(() => {
        input.focus();
        setTimeout(() => {
          input.addEventListener('blur', () => {
            finish(input.value.trim());
          });
        }, 120);
      }, 50);
    };

    // Sort folders first, then files
    const sorted = [...rootItems].sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      if (a.type === b.type) return aName.localeCompare(bName);
      return a.type === 'folder' ? -1 : 1;
    });

    sorted.forEach(item => renderNode(item, 0));
    
    if (this.inlineCreateState && (this.inlineCreateState.parent === '/' || !this.files.some(f => f.name === this.inlineCreateState.parent))) {
      renderInlineInput(0, this.fileTreeContainer);
    }
  }

  selectFile(fileId) {
    try {
      this.log('info', 'selectFile called', { fileId });
      this.saveCurrentEditorContent();
      this.activeFileId = fileId;
      if (!this.openTabs.includes(fileId)) {
        this.openTabs.push(fileId);
      }

      this.renderExplorerTree();
      this.renderTabs();
      this.loadActiveFileContent();
    } catch (err) {
      this.log('error', 'selectFile failed', { err: err.stack || err.message });
    }
  }

  saveCurrentEditorContent() {
    if (!this.activeFileId || !this.textarea) return;
    const file = this.getActiveFile();
    if (file && file.type === 'file') {
      file.content = this.textarea.value;
      this.saveFiles();
    }
  }

  loadActiveFileContent() {
    try {
      const file = this.getActiveFile();
      if (!file || file.type !== 'file') {
        if (this.textarea) this.textarea.value = '';
        if (this.syntaxCode) this.syntaxCode.innerHTML = '';
        if (this.langTag) this.langTag.textContent = 'Mətn';
        this.updateGutter();
        return;
      }

      if (!this.textarea) return;
      this.textarea.value = file.content || '';
      const ext = this.getFileExt(file.name);
      let lang = 'text';
      if (ext === '.py') lang = 'python';
      else if (ext === '.js' || ext === '.mjs') lang = 'javascript';
      else if (ext === '.html' || ext === '.htm') lang = 'html';
      else if (ext === '.css' || ext === '.qss') lang = 'css';
      else if (ext === '.json') lang = 'json';

      if (this.langTag) {
        if (ext === '.py') this.langTag.textContent = '🐍 Python 3';
        else if (ext === '.qss') this.langTag.textContent = '🎨 Qt QSS Stil';
        else if (ext === '.js' || ext === '.mjs') this.langTag.textContent = '⚡ JavaScript';
        else if (ext === '.html' || ext === '.htm') this.langTag.textContent = '🌐 HTML5';
        else if (ext === '.css') this.langTag.textContent = '🎨 CSS3';
        else if (ext === '.json') this.langTag.textContent = '📦 JSON';
        else if (ext) this.langTag.textContent = '📄 ' + ext.replace('.', '').toUpperCase();
        else this.langTag.textContent = '📄 Mətn';
      }

      this.updateSyntaxHighlight();
      this.updateGutter();
      this.log('info', 'loadActiveFileContent loaded', { name: file.name, ext, lang, length: (file.content || '').length });
    } catch (err) {
      this.log('error', 'loadActiveFileContent failed', { err: err.stack || err.message });
    }
  }

  // =========================================================
  // 4. SYNTAX HIGHLIGHTING (PYTHON, JAVASCRIPT, HTML, CSS/QSS, JSON)
  // =========================================================
  highlightSyntax(rawCode, lang) {
    if (!rawCode) return '';
    const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let tokenRegex;
    if (lang === 'python') {
      tokenRegex = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b(?:def|class|if|elif|else|while|for|in|return|import|from|as|try|except|finally|raise|with|pass|break|continue|lambda|yield|global|nonlocal|assert|and|or|not|is)\b)|(\b(?:print|input|len|range|type|int|float|str|list|dict|set|tuple|sum|max|min|abs|round|enumerate|zip|open|True|False|None)\b)|([a-zA-Z_]\w*(?=\s*\())/g;
    } else if (lang === 'javascript') {
      tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|(\b(?:function|const|let|var|if|else|switch|case|default|for|while|do|return|class|extends|new|this|super|import|export|from|as|try|catch|finally|throw|async|await|typeof|instanceof|void|delete|in|of)\b)|(\b(?:console|Math|JSON|Promise|Array|Object|String|Number|Boolean|Date|RegExp|Map|Set|parseInt|parseFloat|setTimeout|setInterval|clearTimeout|true|false|null|undefined|NaN)\b)|([a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())/g;
    } else if (lang === 'html') {
      tokenRegex = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z0-9\-]+|\/?>)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|([a-zA-Z0-9\-]+(?=\=))|(&[a-zA-Z0-9#]+;)/g;
    } else if (lang === 'css') {
      tokenRegex = /(\/\*[\s\S]*?\*\/)|([.#]?[a-zA-Z0-9_\-\:\[\]\*]+(?=\s*\{))|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|url\([^)]*\))|(\b(?:important|block|flex|grid|none|inline|relative|absolute|fixed|bold|center|left|right|pointer|solid|dashed|auto|inherit|transparent)\b)|([a-zA-Z\-]+(?=\s*\:))|(#[a-fA-F0-9]{3,8}|\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|pt|s|ms)?\b)/g;
    } else if (lang === 'json') {
      tokenRegex = /("(?:\\.|[^"\\])*"(?=\s*\:))|("(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b(?:true|false|null)\b)/g;
    } else {
      return escapeHtml(rawCode);
    }

    try {
      let lastIndex = 0;
      let html = '';
      let m;
      let loopCount = 0;
      const maxLoops = 25000;

      while ((m = tokenRegex.exec(rawCode)) !== null) {
        if (++loopCount > maxLoops) {
          this.log('warn', 'Syntax highlight loop limit hit');
          break;
        }
        if (m.index > lastIndex) {
          html += escapeHtml(rawCode.slice(lastIndex, m.index));
        }
        const [match, p1, p2, p3, p4, p5, p6] = m;
        const escaped = escapeHtml(match);

        if (lang === 'python' || lang === 'javascript') {
          if (p1) html += '<span class="tok-comment">' + escaped + '</span>';
          else if (p2) html += '<span class="tok-string">' + escaped + '</span>';
          else if (p3) html += '<span class="tok-number">' + escaped + '</span>';
          else if (p4) html += '<span class="tok-keyword">' + escaped + '</span>';
          else if (p5) html += '<span class="tok-builtin">' + escaped + '</span>';
          else if (p6) html += '<span class="tok-func">' + escaped + '</span>';
          else html += escaped;
        } else if (lang === 'html') {
          if (p1) html += '<span class="tok-comment">' + escaped + '</span>';
          else if (p2) html += '<span class="tok-keyword">' + escaped + '</span>';
          else if (p3) html += '<span class="tok-string">' + escaped + '</span>';
          else if (p4) html += '<span class="tok-builtin">' + escaped + '</span>';
          else if (p5) html += '<span class="tok-number">' + escaped + '</span>';
          else html += escaped;
        } else if (lang === 'css') {
          if (p1) html += '<span class="tok-comment">' + escaped + '</span>';
          else if (p2) html += '<span class="tok-keyword">' + escaped + '</span>';
          else if (p3) html += '<span class="tok-string">' + escaped + '</span>';
          else if (p4) html += '<span class="tok-func">' + escaped + '</span>';
          else if (p5) html += '<span class="tok-builtin">' + escaped + '</span>';
          else if (p6) html += '<span class="tok-number">' + escaped + '</span>';
          else html += escaped;
        } else if (lang === 'json') {
          if (p1) html += '<span class="tok-builtin">' + escaped + '</span>';
          else if (p2) html += '<span class="tok-string">' + escaped + '</span>';
          else if (p3) html += '<span class="tok-number">' + escaped + '</span>';
          else if (p4) html += '<span class="tok-keyword">' + escaped + '</span>';
          else html += escaped;
        }

        if (tokenRegex.lastIndex <= lastIndex) {
          tokenRegex.lastIndex = m.index + 1;
        }
        lastIndex = tokenRegex.lastIndex;
      }
      if (lastIndex < rawCode.length) {
        html += escapeHtml(rawCode.slice(lastIndex));
      }
      if (rawCode.endsWith('\n')) {
        html += ' ';
      }
      return html;
    } catch (err) {
      this.log('error', 'highlightSyntax error', { err: err.message });
      return escapeHtml(rawCode);
    }
  }

  updateSyntaxHighlight() {
    if (!this.syntaxCode || !this.textarea) return;
    const file = this.getActiveFile();
    const ext = file ? this.getFileExt(file.name) : '';
    let lang = 'text';
    if (ext === '.py') lang = 'python';
    else if (ext === '.js' || ext === '.mjs') lang = 'javascript';
    else if (ext === '.html' || ext === '.htm') lang = 'html';
    else if (ext === '.css' || ext === '.qss') lang = 'css';
    else if (ext === '.json') lang = 'json';

    this.syntaxCode.innerHTML = this.highlightSyntax(this.textarea.value, lang);
  }

  // =========================================================
  // 5. CUSTOM MODALS (REPLACING BROKEN WINDOW.PROMPT / CONFIRM)
  // =========================================================
  setupModals() {
    // Input modal cancel
    if (this.inputModalCancelBtn) {
      this.inputModalCancelBtn.onclick = () => this.hideInputModal();
    }

    if (this.inputModal) {
      this.inputModal.addEventListener('click', (e) => {
        if (e.target === this.inputModal) this.hideInputModal();
      });
    }

    // Input modal submit on enter
    if (this.inputModalName) {
      this.inputModalName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitInputModal();
        } else if (e.key === 'Escape') {
          this.hideInputModal();
        }
      });
    }

    if (this.inputModalSubmitBtn) {
      this.inputModalSubmitBtn.onclick = () => this.submitInputModal();
    }

    // Confirm modal cancel
    if (this.confirmModalCancelBtn) {
      this.confirmModalCancelBtn.onclick = () => this.hideConfirmModal();
    }

    if (this.confirmModal) {
      this.confirmModal.addEventListener('click', (e) => {
        if (e.target === this.confirmModal && Date.now() - (this._confirmModalOpenTime || 0) > 200) {
          this.hideConfirmModal();
        }
      });
    }

    if (this.confirmModalSubmitBtn) {
      this.confirmModalSubmitBtn.onclick = () => {
        if (typeof this.modalCallback === 'function') {
          this.modalCallback();
        }
        this.hideConfirmModal();
      };
    }
  }

  hideInputModal() {
    if (this.inputModal) {
      this.inputModal.classList.remove('open');
      this.inputModal.style.display = 'none';
    }
    this.modalCallback = null;
  }

  hideConfirmModal() {
    if (this.confirmModal) {
      this.confirmModal.classList.remove('open');
      this.confirmModal.style.display = 'none';
    }
    this.modalCallback = null;
  }

  showInputModal({ icon, title, subtitle, placeholder, defaultValue, defaultFolder, showFolderSelect, extPresets, onConfirm }) {
    if (!this.inputModal) return;
    this._inputModalOpenTime = Date.now();
    if (this.inputModalIcon) this.inputModalIcon.textContent = icon || '📄';
    if (this.inputModalTitle) this.inputModalTitle.textContent = title;
    if (this.inputModalSubtitle) this.inputModalSubtitle.textContent = subtitle;
    if (this.inputModalName) {
      this.inputModalName.placeholder = placeholder || '';
      this.inputModalName.value = defaultValue || '';
    }
    if (this.inputModalError) {
      this.inputModalError.style.display = 'none';
      this.inputModalError.textContent = '';
    }

    // Populate quick extension pills
    if (this.studioExtPills) {
      this.studioExtPills.innerHTML = '';
      if (Array.isArray(extPresets) && extPresets.length > 0) {
        extPresets.forEach(preset => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'ext-pill';
          pill.innerHTML = `${preset.icon} <span>${preset.ext}</span>`;
          pill.title = preset.desc || preset.ext;
          pill.onclick = (e) => {
            e.preventDefault();
            this.studioExtPills.querySelectorAll('.ext-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            let curVal = this.inputModalName.value.trim();
            if (!curVal) {
              this.inputModalName.value = 'yeni_fayl' + preset.ext;
            } else if (curVal.includes('.')) {
              this.inputModalName.value = curVal.slice(0, curVal.lastIndexOf('.')) + preset.ext;
            } else {
              this.inputModalName.value = curVal + preset.ext;
            }
            this.inputModalName.focus();
          };
          this.studioExtPills.appendChild(pill);
        });
        this.studioExtPills.style.display = 'flex';
      } else {
        this.studioExtPills.style.display = 'none';
      }
    }

    // Populate folders
    if (showFolderSelect && this.inputFolderWrapper && this.inputFolderSelect) {
      this.inputFolderWrapper.style.display = 'block';
      this.inputFolderSelect.innerHTML = '<option value="/">Kök Qovluq (/)</option>';
      const envFolders = this.files.filter(f => f.type === 'folder' && (!f.env || f.env === this.currentEnv));
      envFolders.forEach(folder => {
        const opt = document.createElement('option');
        opt.value = folder.name;
        opt.textContent = `📁 ${folder.name}`;
        if (defaultFolder && defaultFolder === folder.name) {
          opt.selected = true;
        }
        this.inputFolderSelect.appendChild(opt);
      });
    } else if (this.inputFolderWrapper) {
      this.inputFolderWrapper.style.display = 'none';
    }

    this.modalCallback = onConfirm;
    this.inputModal.classList.add('open');
    this.inputModal.style.display = 'flex';
    setTimeout(() => {
      if (this.inputModalName) {
        this.inputModalName.focus();
        this.inputModalName.select();
      }
    }, 60);
  }

  submitInputModal() {
    const val = this.inputModalName.value.trim();
    if (!val) {
      this.inputModalError.textContent = 'Zəhmət olmasa bir ad daxil edin.';
      this.inputModalError.style.display = 'block';
      return;
    }

    const folder = (this.inputFolderSelect && this.inputFolderSelect.value) ? this.inputFolderSelect.value : '/';
    if (typeof this.modalCallback === 'function') {
      const res = this.modalCallback(val, folder);
      if (res && res.error) {
        this.inputModalError.textContent = res.error;
        this.inputModalError.style.display = 'block';
        return;
      }
    }

    this.hideInputModal();
  }

  createNewFile(defaultFolder = null) {
    const initialFolder = defaultFolder || this.selectedFolder || '/';
    this.inlineCreateState = { type: 'file', parent: initialFolder };
    if (initialFolder !== '/') this.expandedFolders.add(initialFolder);
    this.renderExplorerTree();
  }

  processNewFile(fileName, folder) {
    try {
      this.log('info', 'processNewFile called', { fileName, folder, currentEnv: this.currentEnv });
      const isPy = this.currentEnv === 'python';
      const defExt = isPy ? '.py' : '.js';
      let clean = (fileName || '').trim();
      if (!clean) {
        this.renderExplorerTree();
        return;
      }
      if (!clean.includes('.')) clean += defExt;

      const path = folder === '/' ? clean : `${folder}/${clean}`;
      if (this.files.some(f => f.path.toLowerCase() === path.toLowerCase())) {
        this.showToast('Bu adda fayl artıq mövcuddur!');
        this.renderExplorerTree();
        return;
      }

      const ext = this.getFileExt(clean);
      let content = '';

      if (ext === '.py') {
        content = `# 🐍 ${clean} (Python)\ndef main():\n    print("Salam, Python dünyası! 🚀")\n\nif __name__ == "__main__":\n    main()\n`;
      } else if (ext === '.qss') {
        content = `/* 🎨 ${clean} - Python Desktop GUI Stili (PyQt / PySide / Tkinter) */\nQWidget {\n    background-color: #0F172A;\n    color: #FFFFFF;\n    font-family: 'Segoe UI', Arial, sans-serif;\n    font-size: 13px;\n}\n\nQPushButton {\n    background-color: #2563EB;\n    color: #FFFFFF;\n    border-radius: 6px;\n    padding: 8px 16px;\n    font-weight: bold;\n}\n\nQPushButton:hover {\n    background-color: #1D4ED8;\n}\n\nQLineEdit {\n    background-color: #1E293B;\n    color: #FFFFFF;\n    border: 1px solid #334155;\n    border-radius: 6px;\n    padding: 6px 10px;\n}\n\nQLabel {\n    color: #E2E8F0;\n}\n`;
      } else if (ext === '.html' || ext === '.htm') {
        content = `<!DOCTYPE html>\n<html lang="az">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>BrowsMe Veb Layihə</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div style="text-align: center; padding: 40px; font-family: sans-serif;">\n    <h1>Salam, BrowsMe Veb Dünyası! ⚡</h1>\n    <p>HTML, CSS və JavaScript ilə interaktiv tətbiq.</p>\n    <button id="actionBtn" style="padding: 10px 20px; font-size: 14px; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer;">Məni Sıx 🚀</button>\n  </div>\n  <script src="app.js"></script>\n</body>\n</html>\n`;
      } else if (ext === '.css') {
        content = `/* 🎨 ${clean} - Veb Səhifə Stili */\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: 'Segoe UI', system-ui, sans-serif;\n  background-color: #0B1120;\n  color: #F8FAFC;\n}\n\nh1 {\n  color: #38BDF8;\n  margin-bottom: 12px;\n}\n`;
      } else if (ext === '.js' || ext === '.mjs') {
        content = `// ⚡ ${clean} - JavaScript Tətbiqi\nconsole.log("BrowsMe JavaScript layihəsi aktivdir! ⚡");\n\ndocument.addEventListener("DOMContentLoaded", () => {\n  const btn = document.getElementById("actionBtn");\n  if (btn) {\n    btn.addEventListener("click", () => {\n      alert("JavaScript klik hadisəsi uğurla işlədi! 🎉");\n    });\n  }\n});\n`;
      } else if (ext === '.json') {
        content = `{\n  "layihe": "BrowsMe Layihəsi",\n  "versiya": "1.0.0",\n  "muhit": "${this.currentEnv}"\n}\n`;
      } else if (ext === '.txt' || ext === '.md') {
        content = `# ${clean}\nBrowsMe Code Studio ilə yaradıldı.\n`;
      } else {
        content = `# ${clean}\n`;
      }

      const newFile = {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: clean,
        path: path,
        folder: folder,
        env: this.currentEnv,
        type: 'file',
        ext: ext,
        content: content
      };

      this.files.push(newFile);
      if (folder !== '/') {
        this.expandedFolders.add(folder);
      }
      this.saveFiles();
      this.selectFile(newFile.id);
      this.showToast(`✔ "${clean}" faylı yaradıldı!`);
      this.log('info', 'File successfully created and selected', { path: newFile.path, id: newFile.id });
    } catch (err) {
      this.log('error', 'processNewFile exception', { err: err.stack || err.message });
      this.renderExplorerTree();
    }
  }

  createNewFolder(defaultParent = null) {
    const initialFolder = defaultParent || this.selectedFolder || '/';
    this.inlineCreateState = { type: 'folder', parent: initialFolder };
    if (initialFolder !== '/') this.expandedFolders.add(initialFolder);
    this.renderExplorerTree();
  }

  processNewFolder(folderName, parentFolder) {
    const clean = folderName.trim().replace(/[\\/]/g, '');
    if (!clean) return;

    const parent = parentFolder || '/';
    const path = parent === '/' ? clean : `${parent}/${clean}`;
    if (this.files.some(f => f.type === 'folder' && f.path.toLowerCase() === path.toLowerCase())) {
      this.showToast('Bu adda qovluq artıq mövcuddur!');
      return;
    }

    const newFolder = {
      id: 'folder_' + Date.now(),
      name: clean,
      path: path,
      folder: parent,
      env: this.currentEnv,
      type: 'folder'
    };

    this.files.push(newFolder);
    this.expandedFolders.add(clean);
    if (parent !== '/') {
      this.expandedFolders.add(parent);
    }
    this.saveFiles();
    this.renderExplorerTree();
    this.showToast(`✔ "${clean}" qovluğu yaradıldı!`);
  }

  startInlineRename(itemId) {
    this.inlineRenameId = itemId;
    this.renderExplorerTree();
  }

  processRename(itemId, newName) {
    const item = this.files.find(f => f.id === itemId);
    if (!item) return;
    const clean = (newName || '').trim();
    if (!clean || clean === item.name) {
      this.renderExplorerTree();
      return;
    }

    const targetFolder = item.folder || '/';
    const targetPath = targetFolder === '/' ? clean : `${targetFolder}/${clean}`;
    if (this.files.some(f => f.id !== itemId && f.path.toLowerCase() === targetPath.toLowerCase())) {
      this.showToast('Bu adda fayl və ya qovluq artıq mövcuddur!');
      this.renderExplorerTree();
      return;
    }

    const oldName = item.name;
    const isFolder = item.type === 'folder';

    item.name = clean;
    item.path = targetPath;
    if (!isFolder) {
      item.ext = clean.includes('.') ? clean.slice(clean.lastIndexOf('.')).toLowerCase() : '';
    } else {
      this.files.forEach(f => {
        if (f.folder === oldName) {
          f.folder = clean;
          f.path = `${clean}/${f.name}`;
        }
      });
      if (this.expandedFolders.has(oldName)) {
        this.expandedFolders.delete(oldName);
        this.expandedFolders.add(clean);
      }
      if (this.selectedFolder === oldName) {
        this.selectedFolder = clean;
      }
    }

    this.saveFiles();
    this.renderExplorerTree();
    this.renderTabs();
    this.loadActiveFileContent();
    this.showToast(`✔ Ad "${clean}" olaraq dəyişdirildi.`);
  }

  openRenameModal(itemId) {
    this.startInlineRename(itemId);
  }

  openDeleteModal(itemId) {
    const item = this.files.find(f => f.id === itemId);
    if (!item) {
      this.log('warn', 'openDeleteModal: Item not found', { itemId });
      return;
    }

    this.log('info', 'openDeleteModal opening confirmation modal', { id: item.id, name: item.name, type: item.type });
    this._confirmModalOpenTime = Date.now();
    if (this.confirmModalTitle) {
      this.confirmModalTitle.textContent = item.type === 'folder' ? 'Qovluğu Silmək İstəyirsiniz?' : 'Faylı Silmək İstəyirsiniz?';
    }
    if (this.confirmModalMessage) {
      this.confirmModalMessage.innerHTML = `<strong>"${item.name}"</strong> ${item.type === 'folder' ? 'qovluğu və daxilindəki bütün fayllar' : 'faylı'} layihədən və diskdən tam silinəcək.`;
    }

    this.modalCallback = () => {
      this.processDelete(itemId);
    };

    if (this.confirmModalSubmitBtn) {
      this.confirmModalSubmitBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.log('info', 'studioConfirmSubmitBtn clicked (confirmed delete)', { itemId });
        this.hideConfirmModal();
        this.processDelete(itemId);
      };
    }

    if (this.confirmModal) {
      this.confirmModal.classList.add('open');
      this.confirmModal.style.display = 'flex';
    }
  }

  async processDelete(itemId) {
    const item = this.files.find(f => f.id === itemId);
    if (!item) {
      this.log('warn', 'processDelete: item no longer in files', { itemId });
      return;
    }

    const itemName = item.name;
    const itemPath = item.path || item.name;
    const isFolder = item.type === 'folder';

    this.log('info', 'processDelete executing deletion', { itemId, itemName, itemPath, isFolder });

    // 1. Call Python deleter.py via Electron IPC
    if (window.electronAPI && typeof window.electronAPI.pyFileDelete === 'function') {
      try {
        const pyResult = await window.electronAPI.pyFileDelete({ target: itemPath });
        this.log('info', 'Python deleter.py response', pyResult);
      } catch (err) {
        this.log('warn', 'Python deleter.py error', { err: err.message });
      }
    }

    // 2. Remove from files array in memory
    if (isFolder) {
      this.files = this.files.filter(f => f.id !== itemId && f.folder !== itemName);
      this.expandedFolders.delete(itemName);
      if (this.selectedFolder === itemName) this.selectedFolder = null;
    } else {
      this.files = this.files.filter(f => f.id !== itemId);
      this.openTabs = this.openTabs.filter(id => id !== itemId);
    }

    if (this.activeFileId === itemId) {
      const remaining = this.files.filter(f => f.type === 'file' && (!f.env || f.env === this.currentEnv));
      this.activeFileId = remaining.length > 0 ? remaining[0].id : null;
      if (this.activeFileId && !this.openTabs.includes(this.activeFileId)) {
        this.openTabs.push(this.activeFileId);
      }
    }

    this.saveFiles();
    this.renderExplorerTree();
    this.renderTabs();
    this.loadActiveFileContent();
    this.showToast(`🗑️ "${itemName}" uğurla silindi.`);
    this.log('info', 'processDelete completed successfully', { itemName, remainingFiles: this.files.length });
  }

  // =========================================================
  // 6. 12-17 YAŞ ÜÇÜN NÜMUNƏ KOD ŞABLONLARI
  // =========================================================
  loadSampleTemplate(sampleKey) {
    const templates = {
      py_guess: {
        name: 'eded_tapma.py',
        env: 'python',
        content: `# 🎮 Ağlımdakı Ədədi Tap - Desktop Oyunu (Python Tkinter GUI)
# 1-100 arasında gizli ədədi tapmaq üçün 3 seçimdən birini klikləyin!
import tkinter as tk
import random

class EdedTapmaOyunu:
    def __init__(self, master):
        self.master = master
        self.master.title("🧠 Ağlımdakı Ədədi Tap (1 - 100)")
        self.master.geometry("460x420")
        self.master.resizable(False, False)
        self.master.configure(bg="#0B132B")

        self.xal = 0
        self.raund = 1
        self.gizli_eded = 0
        self.secimler = []

        # Başlıq
        self.lbl_basliq = tk.Label(
            master, 
            text="🧠 Ağlımdakı Ədədi Tap", 
            font=("Segoe UI", 16, "bold"), 
            fg="#38BDF8", 
            bg="#0B132B"
        )
        self.lbl_basliq.pack(pady=(18, 4))

        self.lbl_izah = tk.Label(
            master, 
            text="Kompüter 1 ilə 100 arasında bir ədəd tutdu.\\nDoğru ədədi tapmaq üçün 3 seçimdən birini klikləyin:", 
            font=("Segoe UI", 10), 
            fg="#94A3B8", 
            bg="#0B132B"
        )
        self.lbl_izah.pack(pady=4)

        # Xal və Raund
        self.lbl_status = tk.Label(
            master, 
            text="🏆 Xal: 0  |  🎯 Raund: 1", 
            font=("Segoe UI", 12, "bold"), 
            fg="#F472B6", 
            bg="#0B132B"
        )
        self.lbl_status.pack(pady=8)

        # Nəticə Mesajı
        self.lbl_mesaj = tk.Label(
            master, 
            text="Seçiminizi edin 👇", 
            font=("Segoe UI", 11, "bold"), 
            fg="#FBBF24", 
            bg="#0B132B"
        )
        self.lbl_mesaj.pack(pady=10)

        # Seçim Düymələri üçün Frame
        self.btn_frame = tk.Frame(master, bg="#0B132B")
        self.btn_frame.pack(pady=12)

        self.duymeler = []
        for i in range(3):
            btn = tk.Button(
                self.btn_frame, 
                text="", 
                font=("Segoe UI", 14, "bold"), 
                width=8, 
                height=2,
                bg="#1E293B", 
                fg="#FFFFFF", 
                activebackground="#3B82F6",
                activeforeground="#FFFFFF",
                relief="flat",
                cursor="hand2",
                command=lambda idx=i: self.yoxla(idx)
            )
            btn.grid(row=0, column=i, padx=10)
            self.duymeler.append(btn)

        # Yenidən Başla Düyməsi
        self.btn_yenile = tk.Button(
            master, 
            text="🔄 Oyunu Yenidən Başlat", 
            font=("Segoe UI", 10, "bold"), 
            bg="#334155", 
            fg="#FFFFFF", 
            activebackground="#475569", 
            relief="flat",
            cursor="hand2",
            padx=14, 
            pady=6,
            command=self.yeni_oyun
        )
        self.btn_yenile.pack(pady=(18, 10))

        self.yeni_raund()

    def yeni_raund(self):
        self.gizli_eded = random.randint(1, 100)
        
        # 2 fərqli səhv ədəd seçirik
        sehv_ededler = set()
        while len(sehv_ededler) < 2:
            s = random.randint(1, 100)
            if s != self.gizli_eded:
                sehv_ededler.add(s)
        
        self.secimler = list(sehv_ededler) + [self.gizli_eded]
        random.shuffle(self.secimler)

        for i in range(3):
            self.duymeler[i].config(
                text=str(self.secimler[i]), 
                bg="#1E293B", 
                fg="#FFFFFF", 
                state="normal"
            )
        self.lbl_mesaj.config(text="Hansı ədədi tutmuşam? Seçin 👇", fg="#38BDF8")

    def yoxla(self, idx):
        secilmis = self.secimler[idx]
        for btn in self.duymeler:
            btn.config(state="disabled")

        if secilmis == self.gizli_eded:
            self.xal += 10
            self.duymeler[idx].config(bg="#10B981")
            self.lbl_mesaj.config(text=f"🎉 ƏHSƏN! Düzgün tapdınız: {self.gizli_eded} (+10 Xal)", fg="#10B981")
            print(f"[Raund {self.raund}] Doğru tapıldı: {self.gizli_eded} | Ümumi Xal: {self.xal}")
        else:
            self.duymeler[idx].config(bg="#EF4444")
            # Doğru olan düyməni yaşıl göstər
            for j, val in enumerate(self.secimler):
                if val == self.gizli_eded:
                    self.duymeler[j].config(bg="#10B981")
            self.lbl_mesaj.config(text=f"❌ Səhvdir! Ağlımdakı ədəd: {self.gizli_eded} idi.", fg="#EF4444")
            print(f"[Raund {self.raund}] Səhv təxmin: {secilmis} | Doğru cavab: {self.gizli_eded}")

        self.raund += 1
        self.lbl_status.config(text=f"🏆 Xal: {self.xal}  |  🎯 Raund: {self.raund}")
        self.master.after(1400, self.yeni_raund)

    def yeni_oyun(self):
        self.xal = 0
        self.raund = 1
        self.lbl_status.config(text="🏆 Xal: 0  |  🎯 Raund: 1")
        self.yeni_raund()
        print("🔄 Oyun sıfırlandı və yenidən başladıldı.")

if __name__ == "__main__":
    print("🚀 'Ağlımdakı Ədədi Tap' oyunu başladıldı...")
    kok = tk.Tk()
    oyun = EdedTapmaOyunu(kok)
    kok.mainloop()
    print(f"🏁 Oyun başa çatdı. Yekun xalınız: {oyun.xal}")
`
      },
      js_timer: {
        name: 'saygac_taymer.js',
        env: 'node',
        content: `// ⏱️ BrowsMe Real-Vaxt Taymeri (00:00:00)
// 00:00:00-dan başlayır və tətbiq/brauzer açıq olduğu müddətcə davam edir.
console.log("==================================================");
console.log("⏱️  BROWSME DƏQİQ TAYMERİ İŞƏ SALINDI");
console.log("⏱️  00:00:00-dan başlayaraq fasiləsiz davam edir...");
console.log("==================================================");

let totalSeconds = 0;

function formatTime(totalSec) {
  const hours = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSec % 60).padStart(2, '0');
  return \`\${hours}:\${minutes}:\${seconds}\`;
}

// İlkin başlanğıc vaxtı
console.log(\`⏱️ Cari Vaxt: \${formatTime(totalSeconds)} [BAŞLANĞIC]\`);

// Hər saniyə artan sonsuz taymer dövrü
const timerInterval = setInterval(() => {
  totalSeconds++;
  const timeStr = formatTime(totalSeconds);
  console.log(\`⏱️ Taymer: \${timeStr}\`);
}, 1000);
`
      }
    };

    const tmpl = templates[sampleKey];
    if (!tmpl) return;

    this.setEnvironment(tmpl.env);

    // Create a new file for this sample or overwrite
    const existing = this.files.find(f => f.name === tmpl.name);
    if (existing) {
      existing.content = tmpl.content;
      this.selectFile(existing.id);
      this.showToast(`"${tmpl.name}" şablonu yükləndi!`);
    } else {
      const newFile = {
        id: 'file_' + Date.now(),
        name: tmpl.name,
        path: tmpl.name,
        folder: '/',
        env: tmpl.env,
        type: 'file',
        ext: tmpl.name.slice(tmpl.name.lastIndexOf('.')),
        content: tmpl.content
      };
      this.files.push(newFile);
      this.saveFiles();
      this.selectFile(newFile.id);
      this.showToast(`✔ "${tmpl.name}" layihəyə əlavə edildi!`);
    }
  }

  // =========================================================
  // 7. EDITOR TABS RENDERING
  // =========================================================
  renderTabs() {
    if (!this.tabsContainer) return;
    this.tabsContainer.innerHTML = '';

    this.openTabs.forEach(tabId => {
      const file = this.files.find(f => f.id === tabId);
      if (!file) return;

      const tab = document.createElement('div');
      tab.className = `editor-tab ${file.id === this.activeFileId ? 'active' : ''}`;
      tab.dataset.id = file.id;

      const icon = document.createElement('span');
      icon.textContent = this.getFileIcon(file.name, false);

      const title = document.createElement('span');
      title.textContent = file.name;

      const close = document.createElement('span');
      close.className = 'editor-tab-close';
      close.textContent = '✕';
      close.title = 'Vərəqi bağla';
      close.onclick = (e) => {
        e.stopPropagation();
        this.closeTab(file.id);
      };

      tab.appendChild(icon);
      tab.appendChild(title);
      tab.appendChild(close);

      tab.onclick = () => this.selectFile(file.id);
      this.tabsContainer.appendChild(tab);
    });
  }

  closeTab(fileId) {
    this.openTabs = this.openTabs.filter(id => id !== fileId);
    if (this.activeFileId === fileId) {
      this.activeFileId = this.openTabs[this.openTabs.length - 1] || null;
    }
    this.renderTabs();
    this.renderExplorerTree();
    this.loadActiveFileContent();
  }

  // =========================================================
  // 8. EDITOR GUTTER & TEXTAREA BEHAVIOR
  // =========================================================
  setupEditorGutter() {
    if (!this.textarea || !this.gutter) return;

    this.textarea.addEventListener('input', () => {
      this.saveCurrentEditorContent();
      this.updateSyntaxHighlight();
      this.updateGutter();
    });

    this.textarea.addEventListener('scroll', () => {
      this.gutter.scrollTop = this.textarea.scrollTop;
      if (this.syntaxLayer) {
        this.syntaxLayer.scrollTop = this.textarea.scrollTop;
        this.syntaxLayer.scrollLeft = this.textarea.scrollLeft;
      }
    });

    // Handle Tab key indentation & bracket auto-completion
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;

        // 4 spaces indentation
        const tabSpaces = '    ';
        this.textarea.value = val.substring(0, start) + tabSpaces + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + tabSpaces.length;
        this.saveCurrentEditorContent();
        this.updateSyntaxHighlight();
        this.updateGutter();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.runCode();
      } else if (['(', '[', '{', '"', "'"].includes(e.key)) {
        const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
        const closeChar = pairs[e.key];
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;

        e.preventDefault();
        this.textarea.value = val.substring(0, start) + e.key + closeChar + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
        this.saveCurrentEditorContent();
        this.updateSyntaxHighlight();
      }
    });

    this.updateGutter();
    this.updateSyntaxHighlight();
  }

  updateGutter() {
    if (!this.textarea || !this.gutter) return;
    const lines = this.textarea.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) {
      html += `<div>${i}</div>`;
    }
    this.gutter.innerHTML = html;
  }

  // =========================================================
  // 8.5 WEB APP & GAME LIVE PREVIEW
  // =========================================================
  async openWebPreview() {
    this.saveCurrentEditorContent();
    const activeFile = this.getActiveFile();

    let entryFile = 'index.html';
    const htmlFiles = this.files.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.html'));
    if (activeFile && activeFile.name.toLowerCase().endsWith('.html')) {
      entryFile = activeFile.path || activeFile.name;
    } else if (htmlFiles.length > 0) {
      entryFile = htmlFiles[0].path || htmlFiles[0].name;
    }

    const projectFiles = this.files
      .filter(f => f.type === 'file')
      .map(f => ({ name: f.path || f.name, content: f.content || '' }));

    if (!projectFiles.some(f => f.name.toLowerCase().endsWith('.html'))) {
      const activeCode = activeFile ? activeFile.content : '';
      projectFiles.push({
        name: 'index.html',
        content: `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>BrowsMe Live App</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0F172A; color: #FFF; padding: 24px; }
    pre { background: #020617; padding: 16px; border-radius: 8px; border: 1px solid #334155; font-size: 14px; color: #38BDF8; }
  </style>
</head>
<body>
  <h2>🚀 BrowsMe Canlı Tətbiq Önizləməsi</h2>
  <pre id="logOutput">Konsol çıxışı yüklənir...</pre>
  <script>
    const logEl = document.getElementById('logOutput');
    logEl.textContent = '';
    const origLog = console.log;
    console.log = (...args) => {
      origLog(...args);
      logEl.textContent += args.join(' ') + '\\n';
    };
  </script>
  <script src="${activeFile && activeFile.name.endsWith('.js') ? activeFile.name : 'app.js'}"></script>
</body>
</html>`
      });
      entryFile = 'index.html';
    }

    try {
      this.showToast('⏳ Veb tətbiq hazırlanır...');
      const res = await window.electronAPI.prepareWebPreview({
        files: projectFiles,
        entryFile: entryFile
      });

      if (res && res.success && res.url) {
        if (window.tabManager && typeof window.tabManager.createTab === 'function') {
          window.tabManager.createTab(res.url, true);
          this.showToast('🌐 Veb tətbiq yeni brauzer vərəqində açıldı!');
        } else {
          window.open(res.url, '_blank');
        }
      } else {
        this.showToast('⚠️ Preview xətası: ' + (res?.error || 'Açıla bilmədi'));
      }
    } catch (e) {
      this.showToast('⚠️ Preview xətası: ' + e.message);
    }
  }

  // =========================================================
  // 9. TERMINAL & CODE EXECUTION
  // =========================================================
  async runCode() {
    if (this.isRunning) return;

    this.saveCurrentEditorContent();
    const activeFile = this.getActiveFile();
    if (!activeFile || activeFile.type !== 'file') {
      this.showToast('⚠️ İcra üçün heç bir fayl seçilməyib.');
      return;
    }

    let targetFile = activeFile;
    const ext = this.getFileExt(activeFile.name);
    if (ext !== '.py' && ext !== '.js' && ext !== '.mjs') {
      if (ext === '.html' || ext === '.htm') {
        this.openWebPreview();
        return;
      }
      // If editing a helper/styling/data file like .qss, .css, .json, .txt, .csv, find main executable
      const runnable = this.files.find(f => f.type === 'file' && f.env === this.currentEnv && (f.name.endsWith('.py') || f.name.endsWith('.js')));
      if (runnable) {
        targetFile = runnable;
        this.appendTerminalOutput(`\nℹ️ ("${activeFile.name}" icra faylı deyil. Layihənin əsas icra faylı "${runnable.name}" işə salınır...)\n`, 'term-info');
      } else {
        const langTarget = this.currentEnv === 'python' ? 'Python (.py)' : 'JavaScript (.js)';
        this.appendTerminalOutput(`\n⚠️ "${activeFile.name}" birbaşa icra edilən fayl deyil.\nİşə salmaq üçün zəhmət olmasa ${langTarget} faylı seçin və ya layihəyə əlavə edin.\n`, 'term-stderr');
        return;
      }
    }

    const runExt = this.getFileExt(targetFile.name);
    const runtimeName = runExt === '.py' ? 'python' : 'node';
    if (this.runtimes[runtimeName] && !this.runtimes[runtimeName].installed) {
      this.showRuntimeModal(runtimeName);
      return;
    }

    this.isRunning = true;
    this.runBtn.disabled = true;
    this.stopBtn.disabled = false;
    this.terminalStatus.className = 'terminal-status-badge running';
    this.terminalStatus.textContent = 'İcra olunur...';

    const now = new Date().toLocaleTimeString();
    const cmdStr = runExt === '.py' ? `python -u "${targetFile.path || targetFile.name}"` : `node "${targetFile.path || targetFile.name}"`;
    this.appendTerminalOutput(`\n[${now}] ▶ ${cmdStr}\n----------------------------------------\n`, 'term-info');

    this.startTime = Date.now();
    this.terminalTimer.textContent = '0.00s';
    this.timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
      this.terminalTimer.textContent = `${elapsed}s`;
    }, 100);

    // Prepare files with directory structure
    const projectFiles = this.files
      .filter(f => f.type === 'file')
      .map(f => ({ name: f.path || f.name, content: f.content || '' }));

    this.log('info', 'Executing project code', { entry: targetFile.path || targetFile.name, cmdStr, totalFiles: projectFiles.length });

    try {
      const result = await window.electronAPI.runCode({
        entryFile: targetFile.path || targetFile.name,
        files: projectFiles
      });

      if (!result.success) {
        this.log('error', 'runCode backend returned failure', { error: result.error });
        this.appendTerminalOutput(`\n❌ Başlatma xətası: ${result.error}\n`, 'term-stderr');
        this.finishExecution(-1);
      }
    } catch (err) {
      this.log('error', 'runCode threw error', { err: err.stack || err.message });
      this.appendTerminalOutput(`\nXəta baş verdi: ${err.message}\n`, 'term-stderr');
      this.finishExecution(-1);
    }
  }

  stopCode() {
    if (!this.isRunning) return;
    window.electronAPI.stopCode();
    this.appendTerminalOutput('\n⏹ [İstifadəçi tərəfindən dayandırıldı]\n', 'term-stderr');
    this.finishExecution(130);
  }

  finishExecution(exitCode, durationMs) {
    this.isRunning = false;
    this.runBtn.disabled = false;
    this.stopBtn.disabled = true;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const elapsed = durationMs ? (durationMs / 1000).toFixed(2) : ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.terminalTimer.textContent = `${elapsed}s`;

    if (exitCode === 0) {
      this.terminalStatus.className = 'terminal-status-badge success';
      this.terminalStatus.textContent = 'Bitdi (0)';
      this.appendTerminalOutput(`\n✔ Proses uğurla başa çatdı (kod 0) [${elapsed}s]\n`, 'term-success');
    } else {
      this.terminalStatus.className = 'terminal-status-badge error';
      this.terminalStatus.textContent = `Xəta (${exitCode})`;
      this.appendTerminalOutput(`\n✖ Proses dayandı (kod ${exitCode}) [${elapsed}s]\n`, 'term-exit-error');
    }
  }

  appendTerminalOutput(text, className = 'term-stdout') {
    if (!this.terminalContent) return;
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    this.terminalContent.appendChild(span);
    this.terminalViewport.scrollTop = this.terminalViewport.scrollHeight;
  }

  clearTerminal() {
    if (!this.terminalContent) return;
    this.terminalContent.innerHTML = '<span class="term-dim">Terminal təmizləndi. Hazırdır.</span>\n';
    this.terminalStatus.className = 'terminal-status-badge idle';
    this.terminalStatus.textContent = 'Gözləmədə';
    this.terminalTimer.textContent = '0.00s';
  }

  copyTerminal() {
    if (!this.terminalContent) return;
    const text = this.terminalContent.innerText;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 Terminal çıxışı kopyalandı!');
    });
  }

  sendTerminalStdin(e) {
    if (e) e.preventDefault();
    const val = this.stdinInput.value;
    if (!val) return;

    this.appendTerminalOutput(val + '\n', 'term-info');
    window.electronAPI.sendStdin(val);
    this.stdinInput.value = '';
  }

  // =========================================================
  // 10. ZIP EXPORT
  // =========================================================
  async exportProjectZip() {
    this.saveCurrentEditorContent();
    const projectFiles = this.files
      .filter(f => f.type === 'file')
      .map(f => ({ name: f.path || f.name, content: f.content || '' }));

    if (projectFiles.length === 0) {
      this.showToast('Layihədə ixrac ediləcək fayl yoxdur.');
      return;
    }

    try {
      const res = await window.electronAPI.exportProjectZip(projectFiles);
      if (res.success) {
        this.showToast(`📦 Layihə ZIP olaraq saxlanıldı: ${res.filePath}`);
      }
    } catch (err) {
      alert('ZIP ixrac xətası: ' + err.message);
    }
  }

  // =========================================================
  // 10.1 PROJECT IMPORT (FOLDER & ZIP)
  // =========================================================
  openImportModal() {
    if (!this.importModal) return;
    this.importModal.classList.add('open');
    this.importModal.style.display = 'flex';
  }

  closeImportModal() {
    if (!this.importModal) return;
    this.importModal.classList.remove('open');
    this.importModal.style.display = 'none';
  }

  async importFromFolder() {
    this.closeImportModal();
    if (!window.electronAPI || !window.electronAPI.importProjectFolder) {
      this.showToast('Bu əməliyyat üçün masaüstü tətbiq mühiti lazımdır.');
      return;
    }

    try {
      const res = await window.electronAPI.importProjectFolder();
      if (res && res.success && Array.isArray(res.files)) {
        this.applyImportedFiles(res.files, res.folderName || 'Layihə Qovluğu');
      } else if (res && !res.canceled && res.error) {
        this.showToast('İdxal xətası: ' + res.error);
      }
    } catch (e) {
      this.showToast('Qovluq idxal edilərkən xəta baş verdi: ' + e.message);
    }
  }

  async importFromZip() {
    this.closeImportModal();
    if (!window.electronAPI || !window.electronAPI.importProjectZip) {
      this.showToast('Bu əməliyyat üçün masaüstü tətbiq mühiti lazımdır.');
      return;
    }

    try {
      const res = await window.electronAPI.importProjectZip();
      if (res && res.success && Array.isArray(res.files)) {
        this.applyImportedFiles(res.files, res.fileName || 'ZIP Arxiv');
      } else if (res && !res.canceled && res.error) {
        this.showToast('İdxal xətası: ' + res.error);
      }
    } catch (e) {
      this.showToast('ZIP idxal edilərkən xəta baş verdi: ' + e.message);
    }
  }

  async importFromFiles() {
    this.closeImportModal();
    if (!window.electronAPI || !window.electronAPI.importProjectFiles) {
      this.showToast('Bu əməliyyat üçün masaüstü tətbiq mühiti lazımdır.');
      return;
    }

    try {
      const res = await window.electronAPI.importProjectFiles();
      if (res && res.success && Array.isArray(res.files)) {
        this.applyImportedFiles(res.files, `${res.count} fayl`);
      } else if (res && !res.canceled && res.error) {
        this.showToast('İdxal xətası: ' + res.error);
      }
    } catch (e) {
      this.showToast('Fayllar idxal edilərkən xəta baş verdi: ' + e.message);
    }
  }

  applyImportedFiles(newFiles, sourceName) {
    if (!newFiles || newFiles.length === 0) {
      this.showToast('İdxal edilən layihədə heç bir kod faylı tapılmadı.');
      return;
    }

    const shouldReplace = this.importReplaceCheckbox ? this.importReplaceCheckbox.checked : true;

    // Detect primary environment based on file extensions
    let pyCount = 0;
    let nodeCount = 0;
    newFiles.forEach(f => {
      const ext = this.getFileExt(f.name);
      if (ext === '.py' || ext === '.qss') pyCount++;
      if (ext === '.js' || ext === '.mjs' || ext === '.html' || ext === '.css' || ext === '.json') nodeCount++;
    });

    const targetEnv = pyCount >= nodeCount ? 'python' : 'node';

    // Ensure all new files have correct environment tag
    const normalized = newFiles.map(f => {
      const ext = this.getFileExt(f.name);
      return {
        ...f,
        env: (ext === '.py' || ext === '.qss') ? 'python' : (ext === '.js' || ext === '.mjs' || ext === '.html' || ext === '.css' || ext === '.json' ? 'node' : targetEnv)
      };
    });

    if (shouldReplace) {
      // Replace files belonging to this target environment
      this.files = this.files.filter(f => f.env !== targetEnv);
      this.files = [...this.files, ...normalized];
      this.openTabs = [];
    } else {
      // Merge: overwrite existing matching paths, append others
      normalized.forEach(nf => {
        const idx = this.files.findIndex(f => f.path.toLowerCase() === nf.path.toLowerCase() && f.env === nf.env);
        if (idx >= 0) {
          this.files[idx] = nf;
        } else {
          this.files.push(nf);
        }
      });
    }

    // Switch environment
    this.currentEnv = targetEnv;
    if (this.envPythonBtn && this.envNodeBtn) {
      this.envPythonBtn.classList.toggle('active', targetEnv === 'python');
      this.envNodeBtn.classList.toggle('active', targetEnv === 'node');
    }
    if (this.explorerTitle) {
      this.explorerTitle.textContent = targetEnv === 'python' ? 'PYTHON 3 FAYLLARI' : 'NODE.JS & VEB FAYLLARI';
    }

    // Expand all folders
    normalized.forEach(f => {
      if (f.type === 'folder') {
        this.expandedFolders.add(f.name);
      } else if (f.folder && f.folder !== '/') {
        this.expandedFolders.add(f.folder);
      }
    });

    // Select primary entry file
    const envFiles = this.files.filter(f => f.type === 'file' && f.env === targetEnv);
    let candidate = envFiles.find(f => /^(main|app|index|run|game)\./i.test(f.name));
    if (!candidate && envFiles.length > 0) candidate = envFiles[0];

    if (candidate) {
      this.selectFile(candidate.id);
    } else {
      this.renderExplorerTree();
      this.renderTabs();
    }

    this.saveFiles();
    this.showToast(`🎉 "${sourceName}" layihəsindən ${newFiles.length} fayl uğurla idxal edildi!`);
  }

  // =========================================================
  // 11. RUNTIME CHECK & ENFORCEMENT
  // =========================================================
  async checkSystemRuntimes() {
    try {
      const res = await window.electronAPI.checkRuntimes();
      this.runtimes = res;

      // Update Python chip if present in DOM
      if (this.pyRuntimeBadge && this.pyRuntimeText) {
        if (res.python && res.python.installed) {
          this.pyRuntimeBadge.className = 'runtime-pill ready';
          const dot = this.pyRuntimeBadge.querySelector('.pill-dot');
          if (dot) dot.className = 'pill-dot ready';
          this.pyRuntimeText.textContent = `🐍 ${res.python.version.split(' ')[0]} ${res.python.version.split(' ')[1] || ''}`;
        } else {
          this.pyRuntimeBadge.className = 'runtime-pill missing';
          const dot = this.pyRuntimeBadge.querySelector('.pill-dot');
          if (dot) dot.className = 'pill-dot missing';
          this.pyRuntimeText.textContent = '🐍 Python: Quraşdırılmayıb!';
        }
        this.pyRuntimeBadge.onclick = () => this.showRuntimeModal('python');
      }

      // Update Node chip if present in DOM
      if (this.nodeRuntimeBadge && this.nodeRuntimeText) {
        if (res.node && res.node.installed) {
          this.nodeRuntimeBadge.className = 'runtime-pill ready';
          const dot = this.nodeRuntimeBadge.querySelector('.pill-dot');
          if (dot) dot.className = 'pill-dot ready';
          this.nodeRuntimeText.textContent = `⚡ Node: ${res.node.version}`;
        } else {
          this.nodeRuntimeBadge.className = 'runtime-pill missing';
          const dot = this.nodeRuntimeBadge.querySelector('.pill-dot');
          if (dot) dot.className = 'pill-dot missing';
          this.nodeRuntimeText.textContent = '⚡ Node: Quraşdırılmayıb!';
        }
        this.nodeRuntimeBadge.onclick = () => this.showRuntimeModal('node');
      }

      if ((!res.python || !res.python.installed) || (!res.node || !res.node.installed)) {
        setTimeout(() => {
          this.showRuntimeModal();
        }, 800);
      }
    } catch (err) {
      console.warn('Check runtimes error:', err);
    }
  }

  showRuntimeModal(focusedRuntime) {
    if (!this.runtimeModal) return;
    this.runtimeStatusList.innerHTML = '';

    const createRow = (name, icon, statusObj, target, directUrl) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.padding = '12px 14px';
      row.style.background = 'rgba(11, 19, 43, 0.85)';
      row.style.borderRadius = 'var(--radius-sm)';
      row.style.border = '1px solid var(--border-color)';

      const isOk = statusObj && statusObj.installed;
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 22px;">${icon}</span>
          <div>
            <div style="font-weight: 700; color: #FFFFFF; font-size: 13px;">${name}</div>
            <div style="font-size: 11px; color: ${isOk ? '#10B981' : '#EF4444'}; font-family: var(--font-mono); margin-top: 2px;">
              ${isOk ? `✔ Aktivdir (${statusObj.version})` : '✖ Kompüterdə aşkar edilmədi'}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          ${isOk 
            ? '<span style="color: #10B981; font-weight: 700; font-size: 12px; padding: 4px 8px; background: rgba(16, 185, 129, 0.12); border-radius: 4px;">Hazırdır ✅</span>' 
            : `<button class="primary-btn install-single-btn" data-target="${target}" style="padding: 5px 12px; font-size: 11px; background: #3B82F6; border: none; border-radius: 4px; color: white; cursor: pointer; font-weight: 700;">⚡ Quraşdır</button>
               <a href="${directUrl}" target="_blank" style="padding: 5px 10px; font-size: 11px; background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); text-decoration: none;">Sayt 🌐</a>`
          }
        </div>
      `;

      const btn = row.querySelector('.install-single-btn');
      if (btn) {
        btn.onclick = () => this.installRuntimeDirect(target);
      }

      return row;
    };

    this.runtimeStatusList.appendChild(createRow('Python 3 Proqramlaşdırma Mühiti', '🐍', this.runtimes.python, 'python', 'https://www.python.org/downloads/'));
    this.runtimeStatusList.appendChild(createRow('Node.js JavaScript Mühiti', '⚡', this.runtimes.node, 'node', 'https://nodejs.org/'));

    const pyOk = this.runtimes.python && this.runtimes.python.installed;
    const nodeOk = this.runtimes.node && this.runtimes.node.installed;

    if (pyOk && nodeOk) {
      this.runtimeHelperNote.innerHTML = `🎉 <strong>Təbriklər!</strong> Həm Python, həm də Node.js mühitləri kompüterinizdə quraşdırılıb və Code Studio istifadəyə tam hazırdır.`;
      this.autoInstallRuntimeBtn.style.display = 'none';
    } else {
      this.runtimeHelperNote.innerHTML = `⚠️ BrowsMe Code Studio-da kodları icra etmək üçün tələb olunan proqram mühiti tapılmadı. <strong>"⚡ Winget ilə Quraşdır"</strong> düyməsinə basaraq avtomatik yükləyə bilərsiniz.`;
      this.autoInstallRuntimeBtn.style.display = 'inline-block';
    }

    this.runtimeModal.style.display = 'flex';
  }

  async installRuntimeDirect(runtimeType) {
    const name = runtimeType === 'python' ? 'Python' : 'Node.js';
    this.runtimeHelperNote.innerHTML = `⏳ <strong>${name}</strong> winget vasitəsilə avtomatik quraşdırılır... Zəhmət olmasa bir neçə saniyə gözləyin.<br><small style="font-family: var(--font-mono); color: #60A5FA;">Status: Paket axtarılır və quraşdırılır...</small>`;
    this.autoInstallRuntimeBtn.disabled = true;

    try {
      const res = await window.electronAPI.installRuntime(runtimeType);
      if (res.success) {
        this.runtimeHelperNote.innerHTML = `✅ <strong>${res.name}</strong> uğurla kompüterinizə quraşdırıldı!`;
        this.showToast(`✅ ${res.name} uğurla quraşdırıldı!`);
        await this.checkSystemRuntimes();
        this.showRuntimeModal();
      } else {
        this.runtimeHelperNote.innerHTML = `❌ Winget avtomatik icazə ala bilmədi və ya tapılmadı. Zəhmət olmasa rəsmi saytdan endirib quraşdırın.`;
      }
    } catch (e) {
      this.runtimeHelperNote.textContent = 'Quraşdırma xətası: ' + e.message;
    } finally {
      this.autoInstallRuntimeBtn.disabled = false;
    }
  }

  // =========================================================
  // 12. SIDEBAR CONTROLS & RESIZING
  // =========================================================
  open() {
    this.isOpen = true;
    const splitLayout = document.getElementById('appSplitLayout');
    if (splitLayout) splitLayout.classList.add('studio-open');
    if (this.sidebar) {
      this.sidebar.classList.add('open');
      const savedWidth = localStorage.getItem('browsme_studio_width');
      if (savedWidth) {
        const w = Math.min(Math.max(parseInt(savedWidth, 10), 320), window.innerWidth * 0.75);
        this.sidebar.style.width = `${w}px`;
        this.sidebar.style.flex = `0 0 ${w}px`;
      }
    }
    if (this.toggleBtn) this.toggleBtn.classList.add('active');
    const floatingTab = document.getElementById('floatingStudioTab');
    if (floatingTab) floatingTab.classList.add('active');
    setTimeout(() => {
      this.textarea?.focus();
      this.updateSyntaxHighlight();
    }, 100);
  }

  close() {
    this.isOpen = false;
    const splitLayout = document.getElementById('appSplitLayout');
    if (splitLayout) splitLayout.classList.remove('studio-open');
    if (this.sidebar) this.sidebar.classList.remove('open');
    if (this.toggleBtn) this.toggleBtn.classList.remove('active');
    const floatingTab = document.getElementById('floatingStudioTab');
    if (floatingTab) floatingTab.classList.remove('active');
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  setupEventListeners() {
    // Toggle button in toolbar
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Floating right edge tab
    const floatingTab = document.getElementById('floatingStudioTab');
    if (floatingTab) {
      floatingTab.addEventListener('click', () => this.toggle());
    }

    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Environment Switcher Buttons
    if (this.envPythonBtn) {
      this.envPythonBtn.addEventListener('click', () => this.setEnvironment('python'));
    }
    if (this.envNodeBtn) {
      this.envNodeBtn.addEventListener('click', () => this.setEnvironment('node'));
    }

    // Explorer buttons
    if (this.newFileBtn) this.newFileBtn.addEventListener('click', () => this.createNewFile());
    if (this.newFolderBtn) this.newFolderBtn.addEventListener('click', () => this.createNewFolder());
    if (this.clearCacheBtn) this.clearCacheBtn.addEventListener('click', () => this.clearAllCache());

    // Execution & Preview buttons
    if (this.previewBtn) this.previewBtn.addEventListener('click', () => this.openWebPreview());
    if (this.runBtn) this.runBtn.addEventListener('click', () => this.runCode());
    if (this.stopBtn) this.stopBtn.addEventListener('click', () => this.stopCode());

    // Terminal buttons
    if (this.clearTermBtn) this.clearTermBtn.addEventListener('click', () => this.clearTerminal());
    if (this.copyTermBtn) this.copyTermBtn.addEventListener('click', () => this.copyTerminal());
    if (this.stdinForm) this.stdinForm.addEventListener('submit', (e) => this.sendTerminalStdin(e));

    // ZIP Export button
    if (this.exportZipBtn) this.exportZipBtn.addEventListener('click', () => this.exportProjectZip());

    // Project Import button & modal
    if (this.importProjectBtn) {
      this.importProjectBtn.addEventListener('click', () => this.openImportModal());
    }
    if (this.closeImportModalBtn) {
      this.closeImportModalBtn.addEventListener('click', () => this.closeImportModal());
    }
    if (this.cancelImportBtn) {
      this.cancelImportBtn.addEventListener('click', () => this.closeImportModal());
    }
    if (this.importFolderOptBtn) {
      this.importFolderOptBtn.addEventListener('click', () => this.importFromFolder());
    }
    if (this.importFilesOptBtn) {
      this.importFilesOptBtn.addEventListener('click', () => this.importFromFiles());
    }
    if (this.importZipOptBtn) {
      this.importZipOptBtn.addEventListener('click', () => this.importFromZip());
    }
    if (this.importModal) {
      this.importModal.addEventListener('click', (e) => {
        if (e.target === this.importModal) this.closeImportModal();
      });
    }

    // Modal buttons
    if (this.closeRuntimeModalBtn) {
      this.closeRuntimeModalBtn.addEventListener('click', () => {
        this.runtimeModal.classList.remove('open');
        this.runtimeModal.style.display = 'none';
      });
    }
    if (this.autoInstallRuntimeBtn) {
      this.autoInstallRuntimeBtn.addEventListener('click', async () => {
        await this.installRuntimeDirect('python');
        await this.installRuntimeDirect('node');
      });
    }

    // Code output listener from Electron IPC
    if (window.electronAPI && window.electronAPI.onCodeOutput) {
      window.electronAPI.onCodeOutput((data) => {
        if (!data) return;
        if (data.type === 'stdout') {
          this.appendTerminalOutput(data.text, 'term-stdout');
        } else if (data.type === 'stderr') {
          this.appendTerminalOutput(data.text, 'term-stderr');
        } else if (data.type === 'error') {
          this.appendTerminalOutput('\n' + data.error + '\n', 'term-stderr');
        } else if (data.type === 'exit') {
          this.finishExecution(data.code, data.durationMs);
        }
      });
    }

    // Auto-update runtimes badges when background install finishes
    if (window.electronAPI && typeof window.electronAPI.onRuntimesUpdated === 'function') {
      window.electronAPI.onRuntimesUpdated(async () => {
        await this.checkSystemRuntimes();
      });
    }

    // Keyboard shortcut to toggle studio (Ctrl + ` or Ctrl + Shift + C)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === '`') || (e.ctrlKey && e.shiftKey && (e.key === 'c' || e.key === 'C'))) {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        if (this.inputModal && (this.inputModal.classList.contains('open') || this.inputModal.style.display !== 'none')) {
          this.hideInputModal();
        } else if (this.confirmModal && (this.confirmModal.classList.contains('open') || this.confirmModal.style.display !== 'none')) {
          this.hideConfirmModal();
        } else if (this.importModal && (this.importModal.classList.contains('open') || this.importModal.style.display !== 'none')) {
          this.closeImportModal();
        } else if (this.runtimeModal && (this.runtimeModal.classList.contains('open') || this.runtimeModal.style.display !== 'none')) {
          this.runtimeModal.classList.remove('open');
          this.runtimeModal.style.display = 'none';
        } else {
          this.close();
        }
      }
    });
  }

  setupResizers() {
    // 1. Horizontal Sidebar Width Resizer
    if (this.resizer && this.sidebar) {
      let isResizing = false;

      this.resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        this.resizer.classList.add('resizing');
        document.body.classList.add('is-resizing');
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 320), window.innerWidth * 0.75);
        this.sidebar.style.width = `${newWidth}px`;
        this.sidebar.style.flex = `0 0 ${newWidth}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false;
          this.resizer.classList.remove('resizing');
          document.body.classList.remove('is-resizing');
          try {
            localStorage.setItem('browsme_studio_width', this.sidebar.offsetWidth);
          } catch (e) {}
        }
      });
    }

    // 2. Vertical Terminal Height Resizer
    if (this.terminalResizer && this.terminal) {
      let isResizingTerm = false;
      let startY = 0;
      let startHeight = 0;

      this.terminalResizer.addEventListener('mousedown', (e) => {
        isResizingTerm = true;
        startY = e.clientY;
        startHeight = this.terminal.offsetHeight;
        this.terminalResizer.classList.add('resizing');
        document.body.classList.add('is-resizing');
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizingTerm) return;
        const deltaY = startY - e.clientY;
        const newHeight = Math.min(Math.max(startHeight + deltaY, 90), this.sidebar.offsetHeight * 0.75);
        this.terminal.style.height = `${newHeight}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isResizingTerm) {
          isResizingTerm = false;
          this.terminalResizer.classList.remove('resizing');
          document.body.classList.remove('is-resizing');
        }
      });
    }
  }

  showToast(msg) {
    if (window.showToast) {
      window.showToast(msg);
    } else {
      const container = document.getElementById('toastContainer');
      if (container) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
      }
    }
  }
}

window.CodeStudio = CodeStudio;

// Global error handlers to write directly to debug.log
window.addEventListener('error', (e) => {
  const errStr = `[Window Error] ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`;
  console.error(errStr, e.error);
  if (window.electronAPI && typeof window.electronAPI.logDebug === 'function') {
    window.electronAPI.logDebug('RENDERER_ERROR', 'ERROR', errStr, { stack: e.error ? e.error.stack : '' });
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const errStr = `[Unhandled Promise Rejection] ${e.reason ? (e.reason.stack || e.reason) : 'Unknown reason'}`;
  console.error(errStr);
  if (window.electronAPI && typeof window.electronAPI.logDebug === 'function') {
    window.electronAPI.logDebug('RENDERER_ERROR', 'ERROR', errStr);
  }
});

function initCodeStudio() {
  if (!window.codeStudio) {
    try {
      window.codeStudio = new CodeStudio();
      console.log('BrowsMe Code Studio initialized successfully.');
    } catch (err) {
      console.error('Code Studio init error:', err);
      if (window.electronAPI && typeof window.electronAPI.logDebug === 'function') {
        window.electronAPI.logDebug('CODE_STUDIO', 'FATAL', 'Init error: ' + (err.stack || err.message));
      }
    }
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initCodeStudio);
} else {
  initCodeStudio();
}
