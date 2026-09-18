class TabManager {
  constructor(options = {}) {
    this.maxTabs = options.maxTabs || 6;
    this.tabs = [];
    this.activeTabId = null;
    this.tabCounterEl = document.getElementById('tabCounter');
    this.tabsContainerEl = document.getElementById('tabsContainer');
    this.viewsContainerEl = document.getElementById('viewsContainer');
    this.newTabBtn = document.getElementById('newTabBtn');

    this.onTabChangeCallbacks = [];
    this.onSecurityStatusCallbacks = [];

    this.init();
  }

  init() {
    this.newTabBtn.addEventListener('click', () => {
      this.createTab();
    });

    this.updateTabCounter();
  }

  onTabChange(callback) {
    this.onTabChangeCallbacks.push(callback);
  }

  onSecurityChange(callback) {
    this.onSecurityStatusCallbacks.push(callback);
  }

  notifyTabChange(tab) {
    this.onTabChangeCallbacks.forEach(cb => cb(tab));
  }

  notifySecurityChange(status) {
    this.onSecurityStatusCallbacks.forEach(cb => cb(status));
  }

  updateTabCounter() {
    const count = this.tabs.length;
    this.tabCounterEl.textContent = `${count}/${this.maxTabs}`;

    if (count >= this.maxTabs) {
      this.tabCounterEl.classList.add('limit-reached');
      this.newTabBtn.disabled = true;
      this.newTabBtn.title = `Maksimum ${this.maxTabs} vərəq aça bilərsiniz!`;
    } else {
      this.tabCounterEl.classList.remove('limit-reached');
      this.newTabBtn.disabled = false;
      this.newTabBtn.title = 'Yeni Vərəq (Ctrl+T)';
    }
  }

  createTab(url = null, title = 'Yeni Vərəq') {
    if (this.tabs.length >= this.maxTabs) {
      window.showToast(`Maksimum ${this.maxTabs} vərəq aça bilərsiniz. Yeni vərəq üçün mövcudlardan birini bağlayın!`, 'warning');
      return null;
    }

    const tabId = 'tab_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    let homeUrl = url || `file://${window.homePagePath || ''}`;
    if (homeUrl.includes('home.html') && !homeUrl.includes('theme=')) {
      homeUrl += (homeUrl.includes('?') ? '&' : '?') + `theme=${currentTheme}`;
    }

    // 1. Create Tab DOM Element
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.id = `tab-el-${tabId}`;
    tabEl.innerHTML = `
      <div class="tab-favicon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </div>
      <div class="tab-loading-spinner"></div>
      <span class="tab-title">${title}</span>
      <button class="tab-close-btn" title="Vərəqi bağla (Ctrl+W)">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    // 2. Create Webview Wrapper & Webview Element
    const wrapperEl = document.createElement('div');
    wrapperEl.className = 'webview-wrapper';
    wrapperEl.id = `view-wrapper-${tabId}`;

    const webviewEl = document.createElement('webview');
    webviewEl.id = `webview-${tabId}`;
    webviewEl.setAttribute('src', homeUrl);
    webviewEl.setAttribute('allowpopups', 'true');
    webviewEl.setAttribute('webpreferences', 'contextIsolation=true');

    wrapperEl.appendChild(webviewEl);

    // 3. Tab State Object
    const tabObj = {
      id: tabId,
      url: homeUrl,
      title: title,
      tabEl: tabEl,
      wrapperEl: wrapperEl,
      webviewEl: webviewEl,
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      isSecure: true
    };

    this.tabs.push(tabObj);
    this.tabsContainerEl.appendChild(tabEl);
    this.viewsContainerEl.appendChild(wrapperEl);

    // 4. Setup Webview Events
    this.setupWebviewEvents(tabObj);

    // 5. Setup Tab Click & Close
    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close-btn')) {
        this.switchTab(tabId);
      }
    });

    tabEl.querySelector('.tab-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });

    this.updateTabCounter();
    this.switchTab(tabId);

    return tabObj;
  }

  setupWebviewEvents(tab) {
    const wv = tab.webviewEl;
    const tabEl = tab.tabEl;

    wv.addEventListener('dom-ready', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      wv.executeJavaScript(`
        document.documentElement.setAttribute('data-theme', '${currentTheme}');
        try { localStorage.setItem('browsme_theme', '${currentTheme}'); } catch(e) {}
      `).catch(() => {});
    });

    wv.addEventListener('did-start-loading', () => {
      tab.isLoading = true;
      tabEl.classList.add('loading');
      if (tab.id === this.activeTabId) {
        this.notifyTabChange(tab);
      }
    });

    wv.addEventListener('did-stop-loading', () => {
      tab.isLoading = false;
      tabEl.classList.remove('loading');
      tab.canGoBack = wv.canGoBack();
      tab.canGoForward = wv.canGoForward();
      if (tab.id === this.activeTabId) {
        this.notifyTabChange(tab);
      }
    });

    wv.addEventListener('page-title-updated', (e) => {
      let title = e.title;
      if (!title || title.trim() === '') title = 'Yeni Vərəq';
      tab.title = title;
      tabEl.querySelector('.tab-title').textContent = title;
      tabEl.querySelector('.tab-title').title = title;
    });

    wv.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        const faviconUrl = e.favicons[0];
        const faviconEl = tabEl.querySelector('.tab-favicon');
        faviconEl.innerHTML = `<img src="${faviconUrl}" style="width:14px;height:14px;border-radius:2px;" onerror="this.parentElement.innerHTML='🌐'">`;
      }
    });

    wv.addEventListener('did-navigate', (e) => {
      tab.url = e.url;
      tab.canGoBack = wv.canGoBack();
      tab.canGoForward = wv.canGoForward();
      
      // Check HTTPS or Internal
      this.evaluateSecurity(tab, e.url);

      if (tab.id === this.activeTabId) {
        this.notifyTabChange(tab);
      }
    });

    wv.addEventListener('did-navigate-in-page', (e) => {
      tab.url = e.url;
      if (tab.id === this.activeTabId) {
        this.notifyTabChange(tab);
      }
    });

    wv.addEventListener('new-window', (e) => {
      // Open in a new tab inside our browser (if under 6 tabs limit)
      if (this.tabs.length < this.maxTabs) {
        this.createTab(e.url, 'Yüklənir...');
      } else {
        wv.loadURL(e.url);
      }
    });

    wv.addEventListener('did-fail-load', (e) => {
      // -3 is ERR_ABORTED (normal during navigation redirects)
      if (e.errorCode === -3) return;
      if (e.isMainFrame) {
        tab.isLoading = false;
        tabEl.classList.remove('loading');
        window.showToast(`Səhifə yüklənə bilmədi (${e.errorDescription || e.errorCode}). İnternet bağlantısını yoxlayın.`, 'warning');
      }
    });
  }

  evaluateSecurity(tab, url) {
    if (url.startsWith('file://')) {
      if (url.includes('http-blocked.html')) {
        tab.isSecure = false;
        tab.securityType = 'http-blocked';
      } else if (url.includes('domain-blocked.html')) {
        tab.isSecure = false;
        tab.securityType = 'domain-blocked';
      } else {
        tab.isSecure = true;
        tab.securityType = 'internal';
      }
    } else if (url.startsWith('https://')) {
      tab.isSecure = true;
      tab.securityType = 'secure';
    } else if (url.startsWith('http://')) {
      tab.isSecure = false;
      tab.securityType = 'insecure';
    }
  }

  switchTab(tabId) {
    const targetTab = this.tabs.find(t => t.id === tabId);
    if (!targetTab) return;

    this.activeTabId = tabId;

    this.tabs.forEach(t => {
      if (t.id === tabId) {
        t.tabEl.classList.add('active');
        t.wrapperEl.classList.add('active');
      } else {
        t.tabEl.classList.remove('active');
        t.wrapperEl.classList.remove('active');
      }
    });

    targetTab.tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    this.notifyTabChange(targetTab);
  }

  closeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const tab = this.tabs[index];

    // Remove DOM elements
    tab.tabEl.remove();
    tab.wrapperEl.remove();

    // Remove from array
    this.tabs.splice(index, 1);

    // If active tab was closed, select another
    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        const nextIndex = Math.min(index, this.tabs.length - 1);
        this.switchTab(this.tabs[nextIndex].id);
      } else {
        // If all tabs closed, create a fresh one
        this.createTab();
      }
    }

    this.updateTabCounter();
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  navigateActiveTab(url) {
    const activeTab = this.getActiveTab();
    if (activeTab && activeTab.webviewEl) {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      let finalUrl = url;
      if (finalUrl.includes('home.html') && !finalUrl.includes('theme=')) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + `theme=${currentTheme}`;
      }
      activeTab.webviewEl.loadURL(finalUrl);
    }
  }
}

window.TabManager = TabManager;
