const { app, BrowserWindow, ipcMain, session, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const os = require('os');

// Disable HTTP and code caching during development/runtime to ensure fresh files
app.commandLine.appendSwitch('disable-http-cache');
const { spawn, exec } = require('child_process');
const { createZipBuffer, readZipBuffer } = require('./js/zipHelper');

const DEBUG_LOG_PATH = path.join(__dirname, 'debug.log');

function writeToDebugLog(scope, level, message, meta) {
  const timestamp = new Date().toISOString();
  let line = `[${timestamp}] [${scope}] [${level}] ${message}`;
  if (meta !== undefined && meta !== null) {
    try {
      line += ' ' + (typeof meta === 'object' ? JSON.stringify(meta) : String(meta));
    } catch (e) {
      line += ' [Unstringifiable Meta]';
    }
  }
  line += '\n';
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, line, 'utf8');
  } catch (err) {
    console.error('Failed to write to debug log:', err);
  }
}

// Log startup
writeToDebugLog('MAIN', 'INFO', '=== BrowsMe Process Started ===');

process.on('uncaughtException', (err) => {
  writeToDebugLog('MAIN', 'FATAL', `Uncaught Exception: ${err ? (err.stack || err.message) : 'Unknown'}`);
});

process.on('unhandledRejection', (reason) => {
  writeToDebugLog('MAIN', 'FATAL', `Unhandled Rejection: ${reason ? (reason.stack || reason) : 'Unknown'}`);
});

let mainWindow = null;
let currentCodeProcess = null;
let currentCodeTempDir = null;
const settingsFilePath = path.join(app.getPath('userData'), 'edubrowser-settings.json');

// Facebook Whitelist (Strictly unblocked across the browser)
const FACEBOOK_WHITELIST = [
  'facebook.com',
  'fb.com',
  'messenger.com',
  'fbcdn.net',
  'facebook.net'
];

// 1. Adult / Pornography Category (Strict universal block)
const ADULT_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'xhamster.com',
  'youporn.com', 'chaturbate.com', 'onlyfans.com', 'stripchat.com', 'cam4.com',
  'livejasmin.com', 'spankbang.com', 'beeg.com', 'brazzers.com', 'bangbros.com',
  'tube8.com', 'fuq.com', 'porn.com', 'tnaflix.com', 'nuvid.com',
  'eporner.com', 'thumbzilla.com', 'heavy-r.com', 'hqporner.com', 'daftsex.com',
  'rule34.xxx', 'nhentai.net', 'gelbooru.com', 'erome.com', 'manyvids.com',
  'fapello.com', 'coomer.party', 'kemono.party', 'fansly.com', 'bonga.com',
  'bongacams.com', 'camsoda.com', 'imlive.com', 'jasmin.com', 'sex.com',
  'playboy.com', 'penthouse.com', 'hustler.com', 'adultfriendfinder.com',
  'youjizz.com', 'sunporno.com', 'porntrex.com', 'porndoe.com', 'mypornvid.fun'
];

// Regex detection for explicit adult/porn keywords in domain labels
const ADULT_KEYWORD_REGEX = /(?:^|[.-])(xxx|porn|porno|adult|hentai|nsfw|erotic|erotik|fetish|camgirl|stripchat|brazzers|bangbros|spankbang|beeg|youjizz|redtube|xvideos|xnxx)(?:[.-]|$)/i;

// 2. Caucasus Popular Social Media (Except Facebook which is strictly allowed)
const CAUCASUS_SOCIAL_DOMAINS = [
  'instagram.com',
  'threads.net',
  'tiktok.com',
  'vk.com',
  'vkontakte.ru',
  'ok.ru',
  'odnoklassniki.ru',
  'twitter.com',
  'x.com',
  't.co',
  'telegram.org',
  't.me',
  'snapchat.com',
  'pinterest.com',
  'reddit.com',
  'linkedin.com',
  'discord.com',
  'wechat.com',
  'tumblr.com',
  'ask.fm'
];

// 3. Official Educational Domains (Strictly whitelisted and protected from blocking)
const EDUCATIONAL_DOMAINS = [
  'tedris.edu.az',
  'edu.az',
  'wikipedia.org',
  'khanacademy.org',
  'coursera.org',
  'python.org',
  'rust-lang.org',
  'w3schools.com',
  'edx.org',
  'udemy.com',
  'mit.edu',
  'harvard.edu',
  'stanford.edu',
  'ox.ac.uk',
  'cam.ac.uk',
  'codecademy.com',
  'geeksforgeeks.org',
  'stackoverflow.com',
  'github.com',
  'scholar.google.com',
  'researchgate.net',
  'sciencedirect.com',
  'arxiv.org',
  'mozilla.org'
];

function isEducationalDomain(domainOrUrl) {
  try {
    let hostname = String(domainOrUrl || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!hostname) return false;
    if (hostname.endsWith('.edu.az') || hostname.endsWith('.edu') || hostname.endsWith('.ac.uk') || hostname.endsWith('.edu.tr')) {
      return true;
    }
    for (const edu of EDUCATIONAL_DOMAINS) {
      if (hostname === edu || hostname.endsWith('.' + edu)) {
        return true;
      }
    }
  } catch (e) { }
  return false;
}

// Default Educational Browser Settings (User configurable manual blocklist)
const defaultSettings = {
  theme: 'dark',
  maxTabs: 6,
  enforceHttps: true,
  blockHttp: true,
  enableAdBlock: true,
  safeSearch: true,
  homePage: 'internal:home',
  searchEngine: 'google',
  pinCode: '1234',
  blockedDomains: [
    'twitch.tv',
    'bet365.com',
    '1xbet.com',
    'casino.com',
    'poker.com',
    'roblox.com',
    'steamcommunity.com'
  ],
  bookmarks: [
    { title: 'Tədris Portalı', url: 'https://tedris.edu.az', icon: '🎓' },
    { title: 'Vikipediya', url: 'https://az.wikipedia.org', icon: '📚' },
    { title: 'Khan Academy', url: 'https://www.khanacademy.org', icon: '🧠' },
    { title: 'Coursera', url: 'https://www.coursera.org', icon: '🏛️' },
    { title: 'Python Sənədləri', url: 'https://docs.python.org/3/', icon: '🐍' },
    { title: 'Rust Kitabı', url: 'https://doc.rust-lang.org/book/', icon: '🦀' }
  ]
};

function cleanManualBlocklist(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(d => {
    const clean = String(d).trim().toLowerCase();
    // Never allow Facebook in manual blocklist
    if (FACEBOOK_WHITELIST.some(fb => clean === fb || clean.endsWith('.' + fb))) {
      return false;
    }
    // Clean built-in auto-blocked social and adult domains from manual list
    if (CAUCASUS_SOCIAL_DOMAINS.includes(clean) || ADULT_DOMAINS.includes(clean)) {
      return false;
    }
    // Never allow educational domains in manual blocklist
    if (isEducationalDomain(clean)) {
      return false;
    }
    return true;
  });
}

function loadSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, 'utf8');
      const loaded = JSON.parse(data);
      const merged = { ...defaultSettings, ...loaded };
      // Purge Facebook and built-in domains from manual blacklist
      merged.blockedDomains = cleanManualBlocklist(merged.blockedDomains || defaultSettings.blockedDomains);
      return merged;
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
  return { ...defaultSettings };
}

function saveSettings(settings) {
  try {
    if (settings && Array.isArray(settings.blockedDomains)) {
      settings.blockedDomains = cleanManualBlocklist(settings.blockedDomains);
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Settings save error:', err);
    return false;
  }
}

let currentSettings = loadSettings();

function getSenderWindow(event) {
  if (event && event.sender) {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) return win;
  }
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) return focused;
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  return null;
}

function getAppIconPath() {
  const icoPath = path.join(__dirname, 'assets', 'icon.ico');
  const svgPath = path.join(__dirname, 'assets', 'icon.svg');
  if (fs.existsSync(icoPath)) return icoPath;
  if (fs.existsSync(svgPath)) return svgPath;
  return undefined;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Custom modern titlebar with tabs
    backgroundColor: '#0B132B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: getAppIconPath()
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('console-message', (event, ...args) => {
    let lvl = 0, msg = '', line = 0;
    if (typeof args[0] === 'object' && args[0] !== null) {
      lvl = args[0].level ?? 0;
      msg = args[0].message ?? '';
      line = args[0].lineNumber ?? 0;
    } else {
      lvl = args[0] ?? 0;
      msg = args[1] ?? '';
      line = args[2] ?? 0;
    }
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const lvlName = levelNames[lvl] || 'LOG';
    writeToDebugLog('RENDERER', lvlName, `(L${line}) ${msg}`);
    console.log(`[Renderer L${line}]:`, msg);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    writeToDebugLog('MAIN', 'CRASH', `Renderer process gone! Reason: ${details.reason}, exitCode: ${details.exitCode}`);
  });

  mainWindow.webContents.on('unresponsive', () => {
    writeToDebugLog('MAIN', 'WARN', 'Renderer window has become unresponsive!');
  });

  mainWindow.on('closed', () => {
    writeToDebugLog('MAIN', 'INFO', 'Main window closed');
    mainWindow = null;
  });
}

function createIncognitoWindow() {
  const incognitoPartition = 'incognito_' + Date.now();
  const incognitoSession = session.fromPartition(incognitoPartition);
  setupSecurityFilter(incognitoSession);

  const incognitoWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#070C18',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      partition: incognitoPartition
    },
    icon: getAppIconPath()
  });

  Menu.setApplicationMenu(null);
  incognitoWindow.loadFile(path.join(__dirname, 'index.html'), { query: { mode: 'incognito' } });
}

function checkDomainBlockStatus(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Strict Facebook Whitelist Check (Never block FB!)
    for (const fb of FACEBOOK_WHITELIST) {
      if (hostname === fb || hostname.endsWith('.' + fb)) {
        return null;
      }
    }

    // 2. Adult / Pornography Category (Strict universal block)
    for (const adult of ADULT_DOMAINS) {
      if (hostname === adult || hostname.endsWith('.' + adult)) {
        return { domain: adult, reason: 'porn', category: 'Yetkinlik / Pornografiya' };
      }
    }
    if (ADULT_KEYWORD_REGEX.test(hostname)) {
      return { domain: hostname, reason: 'porn', category: 'Yetkinlik / Pornografiya' };
    }

    // 3. Caucasus Social Media (Except Facebook)
    for (const social of CAUCASUS_SOCIAL_DOMAINS) {
      if (hostname === social || hostname.endsWith('.' + social)) {
        return { domain: social, reason: 'social', category: 'Sosial Media (Qafqaz)' };
      }
    }

    // 4. User Manual Blacklist (from settings)
    const userBlocked = currentSettings.blockedDomains || [];
    for (const blocked of userBlocked) {
      const cleanBlocked = blocked.trim().toLowerCase();
      if (!cleanBlocked) continue;
      if (FACEBOOK_WHITELIST.some(fb => cleanBlocked === fb || cleanBlocked.endsWith('.' + fb))) {
        continue;
      }
      if (hostname === cleanBlocked || hostname.endsWith('.' + cleanBlocked)) {
        return { domain: cleanBlocked, reason: 'manual', category: 'Manual Qara Siyahı' };
      }
    }
  } catch (e) {
    // invalid url
  }
  return null;
}

function isDomainBlocked(urlStr) {
  const status = checkDomainBlockStatus(urlStr);
  return status ? status.domain : null;
}

// Prohibited search query detection in search engines (Google, Yandex, Bing, DuckDuckGo, Yahoo, etc.)
function matchProhibitedSearchQuery(queryText) {
  if (!queryText) return null;
  try {
    const decoded = decodeURIComponent(queryText).toLowerCase();
    const clean = decoded.replace(/[+._\-,/]/g, ' ');
    const words = clean.split(/\s+/);

    for (const w of words) {
      if (['porno', 'porn', 'sex', 'seks', 'sekis', 'qumar', 'topaz', 'misli', '1xbet', 'bet'].includes(w)) {
        return w;
      }
      if (w.startsWith('1xb') || w.endsWith('xbet') || /^bet\d+/.test(w) || /\d+bet/.test(w) || w === 'betting') {
        return w;
      }
    }

    const patterns = [
      /\b(?:porno|porn|seks|sex|sekis|qumar|topaz|misli|1xbet)\b/i,
      /\b(?:bet365|mostbet|melbet|parimatch|pinup|poker|kazino|casino)\b/i,
      /\bbet\s+(?:oyun|sayt|giris|canli|bukmeker)/i
    ];

    for (const pat of patterns) {
      const match = decoded.match(pat);
      if (match) return match[0];
    }
  } catch (e) { }
  return null;
}

function extractSearchQueryFromUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const searchParams = parsed.searchParams;

    if (searchParams.has('q')) return searchParams.get('q');
    if (searchParams.has('text')) return searchParams.get('text');
    if (searchParams.has('p')) return searchParams.get('p');
    if (searchParams.has('query')) return searchParams.get('query');
    if (searchParams.has('search')) return searchParams.get('search');
    if (searchParams.has('search_query')) return searchParams.get('search_query');
  } catch (e) { }
  return null;
}

function checkProhibitedSearchInUrl(urlStr) {
  const query = extractSearchQueryFromUrl(urlStr);
  if (!query) return null;
  const matchedKeyword = matchProhibitedSearchQuery(query);
  if (matchedKeyword) {
    return {
      query: query,
      keyword: matchedKeyword
    };
  }
  return null;
}

function setupSecurityFilter(targetSession = session.defaultSession) {
  if (!targetSession) return;

  targetSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    const url = details.url;

    // Ignore file:// and devtools requests
    if (url.startsWith('file://') || url.startsWith('devtools://') || url.startsWith('chrome-extension://')) {
      return callback({});
    }

    // Check HTTP enforcement
    if (currentSettings.blockHttp && url.startsWith('http://') && !url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
      // If the main frame is trying to load unencrypted HTTP, redirect to HTTP Blocked screen
      if (details.resourceType === 'main_frame') {
        const redirectUrl = `file://${path.join(__dirname, 'pages', 'http-blocked.html').replace(/\\/g, '/')}?target=${encodeURIComponent(url)}`;
        return callback({ redirectURL: redirectUrl });
      }
    }

    // 1. Check Prohibited Search Engine Queries (porno, sex, seks, sekis, qumar, bet, topaz, misli, 1xbet)
    const searchBlock = checkProhibitedSearchInUrl(url);
    if (searchBlock) {
      if (details.resourceType === 'main_frame') {
        const redirectUrl = `file://${path.join(__dirname, 'pages', 'domain-blocked.html').replace(/\\/g, '/')}?target=${encodeURIComponent(url)}&domain=${encodeURIComponent('Axtarış: "' + searchBlock.query + '"')}&reason=search&keyword=${encodeURIComponent(searchBlock.keyword)}`;
        return callback({ redirectURL: redirectUrl });
      } else {
        return callback({ cancel: true });
      }
    }

    // 2. Check Category-based & Manual Domain Blacklist
    const blockInfo = checkDomainBlockStatus(url);
    if (blockInfo) {
      if (details.resourceType === 'main_frame') {
        const redirectUrl = `file://${path.join(__dirname, 'pages', 'domain-blocked.html').replace(/\\/g, '/')}?target=${encodeURIComponent(url)}&domain=${encodeURIComponent(blockInfo.domain)}&reason=${encodeURIComponent(blockInfo.reason)}`;
        return callback({ redirectURL: redirectUrl });
      } else {
        // Block subresources (ads/trackers from blocked domains)
        return callback({ cancel: true });
      }
    }

    callback({});
  });
}

// Global context menu for webviews and windows
app.on('web-contents-created', (event, contents) => {
  contents.on('context-menu', (e, params) => {
    e.preventDefault();
    const targetWindow = BrowserWindow.fromWebContents(contents) || BrowserWindow.getFocusedWindow() || mainWindow;
    if (!targetWindow || targetWindow.isDestroyed()) return;

    const menuTemplate = [];

    // If clicked on an image
    if (params.mediaType === 'image' && params.srcURL) {
      menuTemplate.push(
        {
          label: '🖼️ Şəkli fərqli yadda saxla... (Save Image As)',
          click: () => {
            if (!contents.isDestroyed()) contents.downloadURL(params.srcURL);
          }
        },
        {
          label: '📋 Şəkli kopyala (Copy Image)',
          click: () => {
            if (!contents.isDestroyed()) contents.copyImageAt(params.x, params.y);
          }
        },
        {
          label: '🔗 Şəklin ünvanını kopyala (Copy Image Link)',
          click: () => {
            const { clipboard } = require('electron');
            clipboard.writeText(params.srcURL);
          }
        },
        {
          label: '📑 Şəkli yeni vərəqdə aç (Open Image in New Tab)',
          click: () => {
            if (targetWindow && !targetWindow.isDestroyed()) {
              targetWindow.webContents.send('open-new-tab-from-context', params.srcURL);
            }
          }
        },
        { type: 'separator' }
      );
    }

    // If clicked on a link
    if (params.linkURL) {
      menuTemplate.push(
        {
          label: '📑 Keçidi yeni vərəqdə aç (Open Link in New Tab)',
          click: () => {
            if (targetWindow && !targetWindow.isDestroyed()) {
              targetWindow.webContents.send('open-new-tab-from-context', params.linkURL);
            }
          }
        },
        {
          label: '🔗 Keçid ünvanını kopyala (Copy Link Address)',
          click: () => {
            const { clipboard } = require('electron');
            clipboard.writeText(params.linkURL);
          }
        },
        { type: 'separator' }
      );
    }

    // If text selected
    if (params.selectionText && params.selectionText.trim() !== '') {
      const query = params.selectionText.trim();
      const shortQuery = query.length > 25 ? query.substring(0, 25) + '...' : query;
      menuTemplate.push(
        { role: 'copy', label: '📋 Kopyala (Copy)' },
        {
          label: `🔍 Təhlükəsiz Google Axtarışı: "${shortQuery}"`,
          click: () => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            if (targetWindow && !targetWindow.isDestroyed()) {
              targetWindow.webContents.send('open-new-tab-from-context', searchUrl);
            }
          }
        },
        { type: 'separator' }
      );
    } else if (params.isEditable) {
      menuTemplate.push(
        { role: 'undo', label: 'Geri al (Undo)' },
        { role: 'redo', label: 'Təkrarla (Redo)' },
        { type: 'separator' },
        { role: 'cut', label: 'Kəs (Cut)' },
        { role: 'copy', label: 'Kopyala (Copy)' },
        { role: 'paste', label: 'Yapışdır (Paste)' },
        { role: 'selectAll', label: 'Hamısını seç (Select All)' },
        { type: 'separator' }
      );
    }

    // Navigation & Page controls
    const canGoBack = (contents.navigationHistory && typeof contents.navigationHistory.canGoBack === 'function')
      ? contents.navigationHistory.canGoBack()
      : (typeof contents.canGoBack === 'function' ? contents.canGoBack() : false);
    const canGoForward = (contents.navigationHistory && typeof contents.navigationHistory.canGoForward === 'function')
      ? contents.navigationHistory.canGoForward()
      : (typeof contents.canGoForward === 'function' ? contents.canGoForward() : false);

    menuTemplate.push(
      {
        label: '⬅️ Geri (Back)',
        enabled: canGoBack,
        click: () => {
          if (contents.isDestroyed()) return;
          if (contents.navigationHistory && typeof contents.navigationHistory.goBack === 'function') {
            contents.navigationHistory.goBack();
          } else if (typeof contents.goBack === 'function') {
            contents.goBack();
          }
        }
      },
      {
        label: '➡️ İrəli (Forward)',
        enabled: canGoForward,
        click: () => {
          if (contents.isDestroyed()) return;
          if (contents.navigationHistory && typeof contents.navigationHistory.goForward === 'function') {
            contents.navigationHistory.goForward();
          } else if (typeof contents.goForward === 'function') {
            contents.goForward();
          }
        }
      },
      {
        label: '🔄 Yenilə (Reload)',
        click: () => {
          if (!contents.isDestroyed()) contents.reload();
        }
      },
      { type: 'separator' },
      {
        label: '🕶️ Yeni Gizli Pəncərə (Ctrl+Shift+N)',
        click: () => createIncognitoWindow()
      },
      { type: 'separator' },
      {
        label: '🖨️ Çap et (Print)',
        click: () => {
          if (!contents.isDestroyed()) contents.print();
        }
      },
      {
        label: '📄 Səhifənin mənbə koduna bax (View Source)',
        click: () => {
          if (!contents.isDestroyed()) {
            const currentUrl = contents.getURL();
            if (currentUrl && targetWindow && !targetWindow.isDestroyed()) {
              const viewSourceUrl = `view-source:${currentUrl}`;
              targetWindow.webContents.send('open-new-tab-from-context', viewSourceUrl);
            }
          }
        }
      },
      { type: 'separator' },
      {
        label: '🛠️ Elementi yoxla (Inspect Element)',
        click: () => {
          if (!contents.isDestroyed()) {
            contents.inspectElement(params.x, params.y);
          }
        }
      }
    );

    const menu = Menu.buildFromTemplate(menuTemplate);
    if (targetWindow && !targetWindow.isDestroyed()) {
      menu.popup({ window: targetWindow, x: params.x, y: params.y });
    }
  });
});

// IPC Handlers - safely bound to sender window
ipcMain.on('window-minimize', (event) => {
  const win = getSenderWindow(event);
  if (win && !win.isDestroyed()) {
    win.minimize();
  }
});

ipcMain.on('window-maximize', (event) => {
  const win = getSenderWindow(event);
  if (win && !win.isDestroyed()) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = getSenderWindow(event);
  if (win && !win.isDestroyed()) {
    win.close();
  }
});

ipcMain.handle('window-is-maximized', (event) => {
  const win = getSenderWindow(event);
  return win && !win.isDestroyed() ? win.isMaximized() : false;
});

ipcMain.on('open-incognito-window', () => {
  createIncognitoWindow();
});

ipcMain.handle('get-settings', () => {
  return currentSettings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  currentSettings = { ...currentSettings, ...newSettings };
  const ok = saveSettings(currentSettings);
  return ok;
});

ipcMain.handle('reset-settings', () => {
  currentSettings = { ...defaultSettings };
  saveSettings(currentSettings);
  return currentSettings;
});

ipcMain.handle('get-blocklist', () => {
  return currentSettings.blockedDomains || [];
});

ipcMain.handle('get-security-rules', () => {
  return {
    adultFilterActive: true,
    socialFilterActive: true,
    facebookWhitelisted: true,
    manualBlockedDomains: currentSettings.blockedDomains || [],
    caucasusSocialCount: CAUCASUS_SOCIAL_DOMAINS.length,
    adultDomainsCount: ADULT_DOMAINS.length
  };
});

ipcMain.handle('add-blocked-domain', (event, domain) => {
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!clean) {
    return { success: false, error: 'Zəhmət olmasa düzgün domen adı daxil edin.' };
  }

  // 1. Check Facebook Whitelist
  if (FACEBOOK_WHITELIST.some(fb => clean === fb || clean.endsWith('.' + fb))) {
    return {
      success: false,
      error: 'Facebook sistemi tərəfindən icazəli saxlanılıb və bloklana bilməz.'
    };
  }

  // 2. Check if already covered by built-in adult/pornography filter
  if (ADULT_DOMAINS.includes(clean) || ADULT_KEYWORD_REGEX.test(clean)) {
    return {
      success: false,
      error: 'Bu veb-sayt artıq sistemin Yetkinlik / Pornografiya filtri tərəfindən tam qadağan edilib.'
    };
  }

  // 3. Check if already covered by Caucasus social media filter
  if (CAUCASUS_SOCIAL_DOMAINS.includes(clean)) {
    return {
      success: false,
      error: 'Bu sosial şəbəkə artıq Qafqaz regionu sosial media filtri ilə avtomatik bloklanıb.'
    };
  }

  // 4. Check Educational Whitelist (Never block educational websites)
  if (isEducationalDomain(clean)) {
    return {
      success: false,
      error: 'Bu veb-sayt rəsmi Təhsil kateqoriyasına aiddir və qara siyahıya salına bilməz.'
    };
  }

  if (currentSettings.blockedDomains.includes(clean)) {
    return { success: false, error: 'Bu domen artıq manual qara siyahınızda mövcuddur.' };
  }

  currentSettings.blockedDomains.push(clean);
  saveSettings(currentSettings);
  return { success: true, list: currentSettings.blockedDomains };
});

ipcMain.handle('is-educational-domain', (event, domain) => {
  return isEducationalDomain(domain);
});

ipcMain.handle('remove-blocked-domain', (event, domain) => {
  currentSettings.blockedDomains = currentSettings.blockedDomains.filter(d => d !== domain);
  saveSettings(currentSettings);
  return { success: true, list: currentSettings.blockedDomains };
});

ipcMain.handle('check-url-security', (event, url) => {
  try {
    const parsed = new URL(url);
    const isHttp = parsed.protocol === 'http:';
    const blockInfo = checkDomainBlockStatus(url);
    return {
      isValid: true,
      protocol: parsed.protocol,
      isHttps: parsed.protocol === 'https:',
      isHttp: isHttp,
      isBlocked: !!blockInfo,
      blockedDomain: blockInfo ? blockInfo.domain : null,
      blockReason: blockInfo ? blockInfo.reason : null,
      blockCategory: blockInfo ? blockInfo.category : null
    };
  } catch (e) {
    return { isValid: false };
  }
});

ipcMain.handle('clear-browsing-data', async () => {
  const ses = session.defaultSession;
  await ses.clearCache();
  await ses.clearStorageData({
    storages: ['cookies', 'localstorage', 'indexdb', 'websql', 'serviceworkers', 'cachestorage']
  });
  return true;
});

ipcMain.on('open-devtools', (event) => {
  const win = getSenderWindow(event);
  if (win && !win.isDestroyed()) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
});

ipcMain.handle('get-internal-page-url', (event, pageName, params = {}) => {
  const pagePath = path.join(__dirname, 'pages', `${pageName}.html`).replace(/\\/g, '/');
  let url = `file://${pagePath}`;
  const query = new URLSearchParams(params).toString();
  if (query) url += `?${query}`;
  return url;
});

// =========================================================
// CODE STUDIO IPC HANDLERS (Python & JavaScript Execution, ZIP, Runtimes)
// =========================================================

// Helper to download a file with redirect handling
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const getWithRedirect = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return getWithRedirect(response.headers.location);
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`Server status ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };
    getWithRedirect(url);
  });
}

// Helper to locate working Python runner (command or direct exe)
async function findPythonRunner() {
  // 1. Check python command
  const hasPython = await new Promise((resolve) => {
    exec('python -c "import sys; print(\'Python \' + sys.version.split()[0])"', { timeout: 3000 }, (err, stdout) => {
      resolve(!err && stdout && stdout.includes('Python 3.'));
    });
  });
  if (hasPython) {
    return { cmd: 'python', prefixArgs: [] };
  }

  // 2. Check py -3 launcher
  const hasPy = await new Promise((resolve) => {
    exec('py -3 -c "import sys; print(\'Python \' + sys.version.split()[0])"', { timeout: 3000 }, (err, stdout) => {
      resolve(!err && stdout && stdout.includes('Python 3.'));
    });
  });
  if (hasPy) {
    return { cmd: 'py', prefixArgs: ['-3'] };
  }

  // 3. Check common disk paths
  const sysDrive = process.env.SystemDrive || 'C:';
  const localApp = process.env.LOCALAPPDATA || '';
  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidateDirs = [
    path.join(progFiles, 'Python313', 'python.exe'),
    path.join(progFiles, 'Python312', 'python.exe'),
    path.join(progFiles, 'Python311', 'python.exe'),
    path.join(progFiles, 'Python310', 'python.exe'),
    path.join(sysDrive, 'Python313', 'python.exe'),
    path.join(sysDrive, 'Python312', 'python.exe'),
    path.join(sysDrive, 'Python311', 'python.exe'),
    path.join(sysDrive, 'Python310', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python313', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(localApp, 'Programs', 'Python', 'Python310', 'python.exe')
  ];

  for (const cPath of candidateDirs) {
    if (fs.existsSync(cPath)) {
      return { cmd: cPath, prefixArgs: [] };
    }
  }

  return { cmd: 'python', prefixArgs: [] };
}

// Helper to locate working Node.js runner (command or direct exe)
async function findNodeRunner() {
  const hasNode = await new Promise((resolve) => {
    exec('node -v', { timeout: 3000 }, (err, stdout) => {
      resolve(!err && stdout && /^v\d+/.test(stdout.trim()));
    });
  });
  if (hasNode) {
    return { cmd: 'node', prefixArgs: [] };
  }

  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localApp = process.env.LOCALAPPDATA || '';

  const candidateDirs = [
    path.join(progFiles, 'nodejs', 'node.exe'),
    path.join(progFilesX86, 'nodejs', 'node.exe'),
    path.join(localApp, 'Programs', 'nodejs', 'node.exe')
  ];

  for (const cPath of candidateDirs) {
    if (fs.existsSync(cPath)) {
      return { cmd: cPath, prefixArgs: [] };
    }
  }

  return { cmd: 'node', prefixArgs: [] };
}

// Robust check for runtimes (rejects WindowsApps 0.0.0.0 fake stub)
function checkSystemRuntimes() {
  return new Promise(async (resolve) => {
    const isPyValid = (str) => str.includes('Python 3.') && !str.toLowerCase().includes('not found');
    const isNodeValid = (str) => /^v\d+/.test(str);

    const checkCmd = (cmd, fallbackCmd, validateFn) => new Promise((res) => {
      exec(cmd, { timeout: 4000 }, (error, stdout, stderr) => {
        const out = (stdout || stderr || '').trim();
        if (!error && (!validateFn || validateFn(out))) {
          return res({ installed: true, version: out.split('\n')[0].replace(/\r/, '') });
        }
        if (fallbackCmd) {
          exec(fallbackCmd, { timeout: 4000 }, (err2, out2, errOut2) => {
            const outFallback = (out2 || errOut2 || '').trim();
            if (!err2 && (!validateFn || validateFn(outFallback))) {
              res({ installed: true, version: outFallback.split('\n')[0].replace(/\r/, '') });
            } else {
              res({ installed: false, version: null });
            }
          });
        } else {
          res({ installed: false, version: null });
        }
      });
    });

    let [python, node] = await Promise.all([
      checkCmd('python -c "import sys; print(\'Python \' + sys.version.split()[0])"', 'py -3 -c "import sys; print(\'Python \' + sys.version.split()[0])"', isPyValid),
      checkCmd('node -v', null, isNodeValid)
    ]);

    // Fallback check direct disk paths if not found in current process PATH
    if (!python.installed) {
      const pyRunner = await findPythonRunner();
      if (pyRunner.cmd !== 'python' && fs.existsSync(pyRunner.cmd)) {
        python = { installed: true, version: 'Python 3.x' };
      }
    }
    if (!node.installed) {
      const nodeRunner = await findNodeRunner();
      if (nodeRunner.cmd !== 'node' && fs.existsSync(nodeRunner.cmd)) {
        node = { installed: true, version: 'Node.js LTS' };
      }
    }

    resolve({ python, node });
  });
}

// Dynamically install Python (Winget first, then official python.org fallback)
async function installPythonDynamic(onProgress) {
  if (onProgress) onProgress('Python mühiti axtarılır və quraşdırılır...');
  
  // 1. Cəhd: Winget
  const wingetOk = await new Promise((resolve) => {
    const cmd = 'winget install Python.Python.3.12 --silent --accept-source-agreements --accept-package-agreements';
    exec(cmd, { timeout: 180000 }, (err) => resolve(!err));
  });

  if (wingetOk) {
    const status = await checkSystemRuntimes();
    if (status.python.installed) return { success: true, name: 'Python' };
  }

  // 2. Cəhd: Rəsmi saytdan birbaşa yükləmə və səssiz quraşdırma
  try {
    if (onProgress) onProgress('Python.org rəsmi serverindən dinamik yüklənir...');
    const tempExe = path.join(os.tmpdir(), 'python-3.12.9-amd64.exe');
    await downloadFile('https://www.python.org/ftp/python/3.12.9/python-3.12.9-amd64.exe', tempExe);
    
    if (onProgress) onProgress('Python səssiz quraşdırılır...');
    await new Promise((resolve) => {
      exec(`"${tempExe}" /quiet InstallAllUsers=0 PrependPath=1 Include_test=0`, { timeout: 180000 }, () => {
        fs.unlink(tempExe, () => {});
        resolve();
      });
    });

    const status = await checkSystemRuntimes();
    return { success: status.python.installed, name: 'Python' };
  } catch (e) {
    return { success: false, error: e.message, name: 'Python' };
  }
}

// Dynamically install Node.js (Winget first, then official nodejs.org fallback)
async function installNodeDynamic(onProgress) {
  if (onProgress) onProgress('Node.js mühiti axtarılır və quraşdırılır...');
  
  // 1. Cəhd: Winget
  const wingetOk = await new Promise((resolve) => {
    const cmd = 'winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements';
    exec(cmd, { timeout: 180000 }, (err) => resolve(!err));
  });

  if (wingetOk) {
    const status = await checkSystemRuntimes();
    if (status.node.installed) return { success: true, name: 'Node.js' };
  }

  // 2. Cəhd: Rəsmi saytdan birbaşa MSI yükləmə və səssiz quraşdırma
  try {
    if (onProgress) onProgress('Nodejs.org rəsmi serverindən dinamik yüklənir...');
    const tempMsi = path.join(os.tmpdir(), 'node-lts-x64.msi');
    await downloadFile('https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi', tempMsi);
    
    if (onProgress) onProgress('Node.js səssiz quraşdırılır...');
    await new Promise((resolve) => {
      exec(`msiexec.exe /i "${tempMsi}" /qn /norestart`, { timeout: 180000 }, () => {
        fs.unlink(tempMsi, () => {});
        resolve();
      });
    });

    const status = await checkSystemRuntimes();
    return { success: status.node.installed, name: 'Node.js' };
  } catch (e) {
    return { success: false, error: e.message, name: 'Node.js' };
  }
}


// Check if Python and Node.js are available on the computer
ipcMain.handle('check-runtimes', async () => {
  return await checkSystemRuntimes();
});

// Install missing runtime via dynamic installer
ipcMain.handle('install-runtime', async (event, runtimeType) => {
  const win = getSenderWindow(event);
  const notify = (text) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('runtime-install-progress', { runtime: runtimeType, text });
    }
  };

  if (runtimeType === 'python') {
    return await installPythonDynamic(notify);
  } else {
    return await installNodeDynamic(notify);
  }
});

// Execute code in Python or Node.js environment
ipcMain.handle('run-code', async (event, payload) => {
  const { entryFile = 'main.py', files = [] } = payload;
  const win = getSenderWindow(event);

  // Stop previous running process if any
  if (currentCodeProcess) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${currentCodeProcess.pid} /T /F`);
      } else {
        currentCodeProcess.kill('SIGKILL');
      }
    } catch (e) { }
    currentCodeProcess = null;
  }

  const runnerId = 'run_' + Date.now();
  const tempDir = path.join(app.getPath('temp'), 'browsme_code_runner', runnerId);
  currentCodeTempDir = tempDir;

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    // Write all project files into temp workspace directory
    for (const f of files) {
      const relPath = (f.name || f.path || 'file.txt').replace(/\\/g, '/').replace(/^\/+/, '');
      const filePath = path.join(tempDir, relPath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, f.content || '', 'utf8');
    }

    let cleanEntry = (entryFile || 'main.py').replace(/\\/g, '/').replace(/^\/+/, '');
    let ext = path.extname(cleanEntry).toLowerCase();

    if (ext !== '.py' && ext !== '.js' && ext !== '.mjs' && ext !== '.cjs') {
      const py = files.find(f => (f.name || f.path || '').endsWith('.py'));
      const js = files.find(f => (f.name || f.path || '').endsWith('.js'));
      if (py) {
        cleanEntry = (py.name || py.path).replace(/\\/g, '/').replace(/^\/+/, '');
        ext = '.py';
      } else if (js) {
        cleanEntry = (js.name || js.path).replace(/\\/g, '/').replace(/^\/+/, '');
        ext = '.js';
      } else {
        return {
          success: false,
          error: `"${cleanEntry}" birbaşa icra edilən fayl deyil. Layihədə .py və ya .js faylı mövcud olmalıdır.`
        };
      }
    }

    let cmd = 'python';
    let cmdArgs = ['-u', cleanEntry];

    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
      const nodeRunner = await findNodeRunner();
      cmd = nodeRunner.cmd;
      cmdArgs = [...nodeRunner.prefixArgs, cleanEntry];
    } else if (ext === '.py') {
      const pyRunner = await findPythonRunner();
      cmd = pyRunner.cmd;
      cmdArgs = [...pyRunner.prefixArgs, '-u', cleanEntry];
    }

    const startTime = Date.now();
    const proc = spawn(cmd, cmdArgs, {
      cwd: tempDir,
      shell: false,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
        FORCE_COLOR: '1'
      }
    });
    currentCodeProcess = proc;

    proc.stdout.on('data', (chunk) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('code-output', { type: 'stdout', text: chunk.toString('utf8') });
      }
    });

    proc.stderr.on('data', (chunk) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('code-output', { type: 'stderr', text: chunk.toString('utf8') });
      }
    });

    proc.on('error', (err) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('code-output', {
          type: 'error',
          error: `İcra xətası: ${err.message}. Zəhmət olmasa ${cmd === 'python' || cmd === 'py' ? 'Python' : 'Node.js'} proqramının kompüterdə quraşdırıldığından əmin olun.`
        });
      }
      currentCodeProcess = null;
    });

    proc.on('close', (code, signal) => {
      const durationMs = Date.now() - startTime;
      if (win && !win.isDestroyed()) {
        win.webContents.send('code-output', { type: 'exit', code, signal, durationMs });
      }
      currentCodeProcess = null;

      // Clean up temp directory
      setTimeout(() => {
        try {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        } catch (e) { }
      }, 8000);
    });

    return { success: true, pid: proc.pid, entryFile: cleanEntry, cmd };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Prepare live web preview for HTML/JS/CSS web apps & games
ipcMain.handle('prepare-web-preview', async (event, payload) => {
  const { files = [], entryFile = 'index.html' } = payload;
  const previewDir = path.join(app.getPath('temp'), 'browsme_preview');
  try {
    fs.mkdirSync(previewDir, { recursive: true });
    for (const f of files) {
      const relPath = (f.name || f.path || 'index.html').replace(/\\/g, '/').replace(/^\/+/, '');
      const filePath = path.join(previewDir, relPath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, f.content || '', 'utf8');
    }
    const cleanEntry = (entryFile || 'index.html').replace(/\\/g, '/').replace(/^\/+/, '');
    const targetPath = path.join(previewDir, cleanEntry);
    return { success: true, url: `file://${targetPath.replace(/\\/g, '/')}` };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Send stdin input to running process
ipcMain.on('send-stdin', (event, input) => {
  if (currentCodeProcess && currentCodeProcess.stdin && !currentCodeProcess.stdin.destroyed) {
    currentCodeProcess.stdin.write(input + '\n');
  }
});

// Stop running process immediately
ipcMain.on('stop-code', () => {
  if (currentCodeProcess) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${currentCodeProcess.pid} /T /F`);
      } else {
        currentCodeProcess.kill('SIGTERM');
      }
    } catch (e) {
      try { currentCodeProcess.kill(); } catch (err) { }
    }
    currentCodeProcess = null;
  }
});

// Helper to reliably get the sender BrowserWindow
function getSenderWindow(event) {
  if (event && event.sender) {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) return win;
  }
  return mainWindow || BrowserWindow.getFocusedWindow() || null;
}

// Export project files as ZIP archive
ipcMain.handle('export-project-zip', async (event, files) => {
  const win = getSenderWindow(event);
  const saveResult = await dialog.showSaveDialog(win, {
    title: 'Layihəni ZIP Kimi Yadda Saxla',
    defaultPath: `browsme_project_${Date.now()}.zip`,
    filters: [
      { name: 'ZIP Arxiv Faylı (*.zip)', extensions: ['zip'] },
      { name: 'Bütün Fayllar (*.*)', extensions: ['*'] }
    ]
  });

  if (saveResult.canceled || !saveResult.filePath) {
    return { success: false, canceled: true };
  }

  try {
    const zipBuf = createZipBuffer(files || []);
    fs.writeFileSync(saveResult.filePath, zipBuf);
    return { success: true, filePath: saveResult.filePath, size: zipBuf.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Import project from local folder on computer (C: or D: drive)
ipcMain.handle('studio-import-folder', async (event) => {
  const win = getSenderWindow(event);
  const defaultDir = process.platform === 'win32' ? 'C:\\' : app.getPath('home');
  const openResult = await dialog.showOpenDialog(win, {
    title: 'Kompüterdən Layihə Qovluğunu Seçin (C: və ya D: Diski)',
    defaultPath: defaultDir,
    properties: ['openDirectory', 'dontAddToRecent']
  });

  if (openResult.canceled || !openResult.filePaths || openResult.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  const rootDir = openResult.filePaths[0];
  const ignoredFolders = new Set(['node_modules', '.git', '__pycache__', '.venv', 'venv', '.idea', '.vscode', 'dist', 'build', 'bin', 'obj']);
  const ignoredExts = new Set(['.exe', '.dll', '.pyc', '.pyd', '.so', '.dylib', '.zip', '.tar', '.gz', '.7z', '.rar', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.mp3', '.mp4', '.wav', '.bin', '.db', '.sqlite']);

  const extractedFiles = [];
  const foldersCreated = new Set();

  function scanDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(currentDir, ent.name);
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

      if (ent.isDirectory()) {
        if (ignoredFolders.has(ent.name)) continue;
        const parentFolder = path.dirname(relPath).replace(/\\/g, '/');
        extractedFiles.push({
          id: 'folder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: ent.name,
          path: relPath,
          folder: parentFolder === '.' ? '/' : parentFolder,
          type: 'folder'
        });
        foldersCreated.add(relPath);
        scanDir(fullPath);
      } else if (ent.isFile()) {
        const ext = path.extname(ent.name).toLowerCase();
        if (ignoredExts.has(ext)) continue;

        try {
          const stats = fs.statSync(fullPath);
          if (stats.size > 1024 * 1024) continue; // Skip files > 1MB

          const content = fs.readFileSync(fullPath, 'utf8');
          const parentFolder = path.dirname(relPath).replace(/\\/g, '/');
          const env = (ext === '.py' || ext === '.qss') ? 'python' : (ext === '.js' || ext === '.mjs' || ext === '.html' || ext === '.css' || ext === '.json' ? 'node' : 'python');

          extractedFiles.push({
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: ent.name,
            path: relPath,
            folder: parentFolder === '.' ? '/' : parentFolder,
            type: 'file',
            ext: ext,
            env: env,
            content: content
          });
        } catch (readErr) {
          console.warn('Could not read file during import:', fullPath, readErr.message);
        }
      }
    }
  }

  try {
    scanDir(rootDir);
    return {
      success: true,
      files: extractedFiles,
      folderName: path.basename(rootDir),
      folderPath: rootDir
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Import individual code files (.py, .qss, .js, .html, .css, .json, etc.) from C: or D: drive
ipcMain.handle('studio-import-files', async (event) => {
  const win = getSenderWindow(event);
  const defaultDir = process.platform === 'win32' ? 'C:\\' : app.getPath('home');
  const openResult = await dialog.showOpenDialog(win, {
    title: 'Kompüterdən Kod Fayllarını Seçin (C: və ya D: Diski)',
    defaultPath: defaultDir,
    properties: ['openFile', 'multiSelections', 'dontAddToRecent'],
    filters: [
      { name: 'Bütün Proqramlaşdırma Faylları (*.py, *.qss, *.js, *.html, *.css, *.json)', extensions: ['py', 'qss', 'js', 'mjs', 'html', 'htm', 'css', 'json', 'txt', 'md', 'sql', 'csv'] },
      { name: 'Python & GUI Faylları (*.py, *.qss)', extensions: ['py', 'qss'] },
      { name: 'Veb & JavaScript Faylları (*.js, *.html, *.css, *.json)', extensions: ['js', 'mjs', 'html', 'htm', 'css', 'json'] },
      { name: 'Bütün Fayllar (*.*)', extensions: ['*'] }
    ]
  });

  if (openResult.canceled || !openResult.filePaths || openResult.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const importedFiles = [];
    for (const filePath of openResult.filePaths) {
      const stats = fs.statSync(filePath);
      if (stats.size > 1024 * 1024) continue; // Skip large files > 1MB

      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const content = fs.readFileSync(filePath, 'utf8');
      const env = (ext === '.py' || ext === '.qss') ? 'python' : (ext === '.js' || ext === '.mjs' || ext === '.html' || ext === '.css' || ext === '.json' ? 'node' : 'python');

      importedFiles.push({
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: fileName,
        path: fileName,
        folder: '/',
        type: 'file',
        ext: ext,
        env: env,
        content: content
      });
    }

    return {
      success: true,
      files: importedFiles,
      count: importedFiles.length
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Import project from ZIP archive
ipcMain.handle('studio-import-zip', async (event) => {
  const win = getSenderWindow(event);
  const defaultDir = process.platform === 'win32' ? 'C:\\' : app.getPath('home');
  const openResult = await dialog.showOpenDialog(win, {
    title: 'Layihə ZIP Arxivini Seçin (C: və ya D: Diski)',
    defaultPath: defaultDir,
    properties: ['openFile'],
    filters: [
      { name: 'ZIP Faylları (*.zip)', extensions: ['zip'] },
      { name: 'Bütün Fayllar (*.*)', extensions: ['*'] }
    ]
  });

  if (openResult.canceled || !openResult.filePaths || openResult.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  const zipPath = openResult.filePaths[0];
  try {
    const buf = fs.readFileSync(zipPath);
    const rawFiles = readZipBuffer(buf);

    const formatted = rawFiles.map(f => {
      const ext = path.extname(f.name).toLowerCase();
      const parentFolder = path.dirname(f.path).replace(/\\/g, '/');
      const env = (ext === '.py' || ext === '.qss') ? 'python' : (ext === '.js' || ext === '.mjs' || ext === '.html' || ext === '.css' || ext === '.json' ? 'node' : 'python');
      return {
        id: (f.type === 'folder' ? 'folder_' : 'file_') + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: f.name,
        path: f.path,
        folder: parentFolder === '.' ? '/' : parentFolder,
        type: f.type,
        ext: ext,
        env: env,
        content: f.content || ''
      };
    });

    return {
      success: true,
      files: formatted,
      fileName: path.basename(zipPath),
      filePath: zipPath
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC handler for Python editer.py
ipcMain.handle('py-file-edit', async (event, payload = {}) => {
  return new Promise(async (resolve) => {
    const { action, args } = payload;
    const scriptPath = path.join(__dirname, 'editer.py');
    const runner = await findPythonRunner();
    const child = spawn(runner.cmd, [...runner.prefixArgs, scriptPath, action || 'read', ...(args || [])]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => stdout += d.toString());
    child.stderr.on('data', (d) => stderr += d.toString());
    child.on('close', (code) => {
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (e) {
        resolve({ success: code === 0, message: stdout.trim() || stderr.trim() });
      }
    });
    child.on('error', (err) => {
      resolve({ success: false, message: `Python icra xətası: ${err.message}` });
    });
  });
});

// IPC handler for Python deleter.py
ipcMain.handle('py-file-delete', async (event, payload = {}) => {
  return new Promise(async (resolve) => {
    const { target } = payload;
    const scriptPath = path.join(__dirname, 'deleter.py');
    const runner = await findPythonRunner();
    const child = spawn(runner.cmd, [...runner.prefixArgs, scriptPath, 'delete', target || '']);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => stdout += d.toString());
    child.stderr.on('data', (d) => stderr += d.toString());
    child.on('close', (code) => {
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (e) {
        resolve({ success: code === 0, message: stdout.trim() || stderr.trim() });
      }
    });
    child.on('error', (err) => {
      resolve({ success: false, message: `Python icra xətası: ${err.message}` });
    });
  });
});

// IPC listener for detailed debug logs from renderer
ipcMain.on('studio-debug-log', (event, payload = {}) => {
  const { scope = 'STUDIO', level = 'INFO', msg = '', data } = payload;
  writeToDebugLog(scope, level, msg, data);
});

app.whenReady().then(async () => {
  try {
    if (session.defaultSession) {
      await session.defaultSession.clearCache();
    }
  } catch (err) {
    console.warn('Cache clear error:', err);
  }
  setupSecurityFilter(session.defaultSession);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
