document.addEventListener('DOMContentLoaded', async () => {
  // 1. Toast Notification System
  const toastContainer = document.getElementById('toastContainer');
  window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'warning' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️');
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // 2. Resolve Internal Pages Path
  const urlParams = new URLSearchParams(window.location.search);
  const isIncognito = urlParams.get('mode') === 'incognito';

  if (window.electronAPI) {
    const homeUrl = await window.electronAPI.getInternalPageUrl('home');
    window.homePagePath = homeUrl.replace(/^file:\/\//, '');

    const incognitoUrl = await window.electronAPI.getInternalPageUrl('incognito');
    window.incognitoPagePath = incognitoUrl.replace(/^file:\/\//, '');
  }

  if (isIncognito) {
    document.body.classList.add('incognito-mode');
    document.title = 'BrowsMe (Gizli Rejim)';
    const brandSpan = document.querySelector('.browser-brand span');
    if (brandSpan) brandSpan.textContent = 'BrowsMe (Gizli)';
  }

  // 3. Instantiate Subsystems
  const security = new SecurityEngine();
  const tabManager = new TabManager({ maxTabs: 6 });
  const settings = new SettingsManager(tabManager);

  window.tabManager = tabManager;
  window.securityEngine = security;
  window.settingsManager = settings;

  // Initialize Code Studio
  if (!window.codeStudio && typeof CodeStudio === 'function') {
    window.codeStudio = new CodeStudio();
  }

  if (window.electronAPI && window.electronAPI.onOpenNewTab) {
    window.electronAPI.onOpenNewTab((url) => {
      tabManager.createTab(url, 'Yüklənir...');
    });
  }

  // 4. UI Elements
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const homeBtn = document.getElementById('homeBtn');
  const omniboxInput = document.getElementById('omniboxInput');
  const clearUrlBtn = document.getElementById('clearUrlBtn');
  const starBtn = document.getElementById('starBtn');
  const zoomLevelEl = document.getElementById('zoomLevel');

  // Window Controls
  const minBtn = document.getElementById('minBtn');
  const maxBtn = document.getElementById('maxBtn');
  const closeBtn = document.getElementById('closeBtn');

  if (window.electronAPI) {
    minBtn.addEventListener('click', () => window.electronAPI.minimizeWindow());
    maxBtn.addEventListener('click', () => window.electronAPI.maximizeWindow());
    closeBtn.addEventListener('click', () => window.electronAPI.closeWindow());
  }

  // 5. Connect Tab Changes to Navigation UI
  tabManager.onTabChange((activeTab) => {
    if (!activeTab) return;

    // Update Navigation Buttons State
    backBtn.disabled = !activeTab.canGoBack;
    forwardBtn.disabled = !activeTab.canGoForward;

    // Update Omnibox URL
    let displayUrl = activeTab.url || '';
    if (displayUrl.includes('home.html')) {
      displayUrl = '';
      omniboxInput.placeholder = 'Axtarış edin və ya tədris resursunun ünvanını daxil edin...';
    } else {
      omniboxInput.placeholder = 'URL və ya axtarış...';
    }
    omniboxInput.value = displayUrl;

    // Update Reload / Stop Icon
    if (activeTab.isLoading) {
      reloadBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;
      reloadBtn.title = 'Dayandır';
    } else {
      reloadBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>`;
      reloadBtn.title = 'Yenilə (Ctrl+R)';
    }

    // Update Security Badge
    security.updateSecurityDisplay(activeTab);
  });

  // 6. Navigation Controls Events
  backBtn.addEventListener('click', () => {
    const activeTab = tabManager.getActiveTab();
    if (activeTab && activeTab.webviewEl && activeTab.canGoBack) {
      activeTab.webviewEl.goBack();
    }
  });

  forwardBtn.addEventListener('click', () => {
    const activeTab = tabManager.getActiveTab();
    if (activeTab && activeTab.webviewEl && activeTab.canGoForward) {
      activeTab.webviewEl.goForward();
    }
  });

  reloadBtn.addEventListener('click', () => {
    const activeTab = tabManager.getActiveTab();
    if (activeTab && activeTab.webviewEl) {
      if (activeTab.isLoading) {
        activeTab.webviewEl.stop();
      } else {
        activeTab.webviewEl.reload();
      }
    }
  });

  homeBtn.addEventListener('click', () => {
    const homeUrl = `file://${window.homePagePath || ''}`;
    tabManager.navigateActiveTab(homeUrl);
  });

  // 7. Omnibox (Address Bar) Handling
  omniboxInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const targetUrl = security.processUrlInput(omniboxInput.value);
      if (targetUrl) {
        tabManager.navigateActiveTab(targetUrl);
        omniboxInput.blur();
      }
    }
  });

  omniboxInput.addEventListener('focus', () => {
    omniboxInput.select();
  });

  clearUrlBtn.addEventListener('click', () => {
    omniboxInput.value = '';
    omniboxInput.focus();
  });

  starBtn.addEventListener('click', () => {
    starBtn.classList.toggle('starred');
    const isStarred = starBtn.classList.contains('starred');
    window.showToast(isStarred ? 'Səhifə seçilmişlərə əlavə edildi! ★' : 'Səhifə seçilmişlərdən çıxarıldı.', 'info');
  });

  // 8. Bookmarks Toolbar Clicks
  const bookmarkLinks = document.querySelectorAll('.bookmark-item');
  bookmarkLinks.forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const targetUrl = b.getAttribute('data-url');
      if (targetUrl) {
        tabManager.navigateActiveTab(targetUrl);
      }
    });
  });

  // 9. Keyboard Shortcuts
  let currentZoom = 100;
  window.addEventListener('keydown', (e) => {
    // Ctrl + Shift + N : Open Incognito Window
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      if (window.electronAPI && window.electronAPI.openIncognitoWindow) {
        window.electronAPI.openIncognitoWindow();
      }
    }
    // Ctrl + T : New Tab
    else if (e.ctrlKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      const startUrl = isIncognito ? `file://${window.incognitoPagePath || ''}` : null;
      tabManager.createTab(startUrl, isIncognito ? 'Gizli Vərəq' : 'Yeni Vərəq');
    }
    // Ctrl + W : Close Current Tab
    else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      const active = tabManager.getActiveTab();
      if (active) tabManager.closeTab(active.id);
    }
    // Ctrl + R / F5 : Reload
    else if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
      e.preventDefault();
      const active = tabManager.getActiveTab();
      if (active && active.webviewEl) active.webviewEl.reload();
    }
    // Ctrl + L : Focus Omnibox
    else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      omniboxInput.focus();
    }
    // Ctrl + 1..6 : Jump to tab
    else if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      if (tabManager.tabs[idx]) {
        tabManager.switchTab(tabManager.tabs[idx].id);
      }
    }
    // Zoom in (Ctrl + Plus)
    else if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      currentZoom = Math.min(200, currentZoom + 10);
      const active = tabManager.getActiveTab();
      if (active && active.webviewEl) active.webviewEl.setZoomFactor(currentZoom / 100);
      if (zoomLevelEl) zoomLevelEl.textContent = `${currentZoom}%`;
    }
    // Zoom out (Ctrl + Minus)
    else if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      currentZoom = Math.max(50, currentZoom - 10);
      const active = tabManager.getActiveTab();
      if (active && active.webviewEl) active.webviewEl.setZoomFactor(currentZoom / 100);
      if (zoomLevelEl) zoomLevelEl.textContent = `${currentZoom}%`;
    }
    // Reset Zoom (Ctrl + 0)
    else if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      currentZoom = 100;
      const active = tabManager.getActiveTab();
      if (active && active.webviewEl) active.webviewEl.setZoomFactor(1.0);
      if (zoomLevelEl) zoomLevelEl.textContent = '100%';
    }
  });

  // 10. Open Initial Tab
  const initialUrl = isIncognito ? `file://${window.incognitoPagePath || ''}` : null;
  const initialTitle = isIncognito ? 'Gizli Rejim' : 'BrowsMe';
  tabManager.createTab(initialUrl, initialTitle);
});
