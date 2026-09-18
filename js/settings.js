class SettingsManager {
  constructor(tabManager) {
    this.tabManager = tabManager;
    this.modalOverlay = document.getElementById('settingsModalOverlay');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.closeBtn = document.getElementById('closeSettingsBtn');
    this.themeToggle = document.getElementById('themeToggle');
    this.quickThemeBtn = document.getElementById('quickThemeBtn');

    // Blacklist Elements
    this.blacklistItemsEl = document.getElementById('blacklistItems');
    this.newDomainInput = document.getElementById('newDomainInput');
    this.addDomainBtn = document.getElementById('addDomainBtn');
    this.clearDataBtn = document.getElementById('clearDataBtn');
    this.searchEngineSelect = document.getElementById('searchEngineSelect');
    this.openIncognitoBtn = document.getElementById('openIncognitoBtn');

    // PIN Verification Modal Elements
    this.pinModal = document.getElementById('pinConfirmModalOverlay');
    this.pinModalTitle = document.getElementById('pinModalTitle');
    this.pinModalDesc = document.getElementById('pinModalDesc');
    this.pinInput = document.getElementById('pinCodeInput');
    this.pinError = document.getElementById('pinErrorMessage');
    this.pinDomainText = document.getElementById('pinTargetDomainText');
    this.pinCancelBtn = document.getElementById('pinCancelBtn');
    this.pinSubmitBtn = document.getElementById('pinSubmitBtn');
    this.pinMode = 'delete';
    this.pendingTargetDomain = null;

    this.currentSettings = {};
    this.isPinUnlocked = false;

    this.init();
  }

  async init() {
    // Load settings from backend
    if (window.electronAPI) {
      this.currentSettings = await window.electronAPI.getSettings();
    } else {
      this.currentSettings = {
        theme: 'dark',
        maxTabs: 6,
        searchEngine: 'google',
        enforceHttps: true,
        blockHttp: true,
        blockedDomains: ['facebook.com', 'instagram.com', 'tiktok.com', 'bet365.com', 'casino.com'],
        pinCode: '1234'
      };
    }

    const savedEngine = localStorage.getItem('defaultSearchEngine') || this.currentSettings.searchEngine || 'google';
    if (this.searchEngineSelect) {
      this.searchEngineSelect.value = savedEngine;
    }

    this.applyTheme(this.currentSettings.theme || 'dark');
    this.bindEvents();
    this.renderBlacklist();
  }

  bindEvents() {
    // Open / Close Modal
    this.settingsBtn.addEventListener('click', () => this.openModal());
    this.closeBtn.addEventListener('click', () => this.closeModal());
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });

    // Search Engine Selector
    if (this.searchEngineSelect) {
      this.searchEngineSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        localStorage.setItem('defaultSearchEngine', val);
        if (window.electronAPI) {
          window.electronAPI.saveSettings({ searchEngine: val });
        }
        window.showToast(`Varsayılan axtarış motoru "${val.toUpperCase()}" olaraq təyin edildi! 🔍`, 'success');
      });
    }

    // Incognito Trigger Button
    if (this.openIncognitoBtn) {
      this.openIncognitoBtn.addEventListener('click', () => {
        this.closeModal();
        if (window.electronAPI && window.electronAPI.openIncognitoWindow) {
          window.electronAPI.openIncognitoWindow();
        }
      });
    }

    // Quick Theme Button in Toolbar
    if (this.quickThemeBtn) {
      this.quickThemeBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
      });
    }

    // Modal Theme Switch
    if (this.themeToggle) {
      this.themeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        this.applyTheme(newTheme);
      });
    }

    // Settings Sidebar Navigation
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.settings-section').forEach(sec => {
          sec.classList.remove('active');
        });

        const activeSec = document.getElementById(`settings-sec-${targetTab}`);
        if (activeSec) activeSec.classList.add('active');
      });
    });

    // Add Domain to Blacklist
    if (this.addDomainBtn && this.newDomainInput) {
      this.addDomainBtn.addEventListener('click', () => this.handleAddDomain());
      this.newDomainInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleAddDomain();
      });
    }

    // Clear Browsing Data
    if (this.clearDataBtn) {
      this.clearDataBtn.addEventListener('click', async () => {
        if (window.electronAPI) {
          await window.electronAPI.clearBrowsingData();
          window.showToast('Bütün keş və brauzer məlumatları təmizləndi! 🧹', 'success');
        }
      });
    }

    // PIN Verification Modal Events
    if (this.pinCancelBtn) {
      this.pinCancelBtn.addEventListener('click', () => this.closePinModal());
    }
    if (this.pinModal) {
      this.pinModal.addEventListener('click', (e) => {
        if (e.target === this.pinModal) this.closePinModal();
      });
    }
    if (this.pinSubmitBtn) {
      this.pinSubmitBtn.addEventListener('click', () => this.verifyAndExecuteDelete());
    }
    if (this.pinInput) {
      this.pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.verifyAndExecuteDelete();
        } else if (e.key === 'Escape') {
          this.closePinModal();
        }
      });
      this.pinInput.addEventListener('input', () => {
        if (this.pinError) this.pinError.style.display = 'none';
        this.pinInput.style.borderColor = 'var(--border-color)';
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentSettings.theme = theme;
    if (this.themeToggle) {
      this.themeToggle.checked = (theme === 'dark');
    }
    if (this.quickThemeBtn) {
      if (theme === 'dark') {
        this.quickThemeBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>`;
        this.quickThemeBtn.title = 'İşıqlı rejimə keç (Light Mode)';
      } else {
        this.quickThemeBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>`;
        this.quickThemeBtn.title = 'Qaranlıq rejimə keç (Dark Mode)';
      }
    }

    try {
      localStorage.setItem('browsme_theme', theme);
    } catch(e) {}

    // Broadcast theme to all active webviews (including Google home.html)
    document.querySelectorAll('webview').forEach(wv => {
      try {
        wv.executeJavaScript(`
          document.documentElement.setAttribute('data-theme', '${theme}');
          try { localStorage.setItem('browsme_theme', '${theme}'); } catch(e) {}
        `).catch(() => {});
      } catch(e) {}
    });

    // Save
    if (window.electronAPI) {
      window.electronAPI.saveSettings({ theme: theme });
    }
  }

  openModal() {
    this.modalOverlay.classList.add('open');
    this.renderBlacklist();
  }

  closeModal() {
    this.modalOverlay.classList.remove('open');
  }

  async renderBlacklist() {
    if (!this.blacklistItemsEl) return;
    this.blacklistItemsEl.innerHTML = '';

    const countEl = document.getElementById('manualBlockedCount');
    const list = this.currentSettings.blockedDomains || [];

    if (countEl) {
      countEl.textContent = `${list.length} sayt`;
    }

    if (list.length === 0) {
      this.blacklistItemsEl.innerHTML = `
        <div style="color:var(--text-muted);font-size:12px;padding:12px;text-align:center;background:rgba(11, 19, 43, 0.4);border-radius:var(--radius-sm);border:1px dashed var(--border-color);">
          🛡️ Hazırda heç bir sayt manual qara siyahıya əlavə edilməyib.
        </div>`;
      return;
    }

    list.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'blocked-domain-tag';
      item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(28, 37, 65, 0.6);border:1px solid rgba(239, 68, 68, 0.25);border-radius:var(--radius-sm);';
      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:600;color:#FCA5A5;font-family:var(--font-mono);font-size:13px;">🚫 ${domain}</span>
          <span style="background:rgba(239, 68, 68, 0.15);color:#EF4444;border:1px solid rgba(239, 68, 68, 0.3);font-size:10px;padding:1px 6px;border-radius:4px;font-weight:700;">Manual Qara Siyahı</span>
        </div>
        <button class="remove-domain-btn" title="Manual qara siyahıdan sil" style="background:transparent;border:none;color:#EF4444;cursor:pointer;font-size:14px;padding:4px 8px;border-radius:4px;transition:background 0.2s;">
          🗑️ Sil
        </button>
      `;

      item.querySelector('.remove-domain-btn').addEventListener('click', () => {
        this.openPinModal(domain);
      });

      this.blacklistItemsEl.appendChild(item);
    });
  }

  openPinModal(domain) {
    if (!this.pinModal) return;
    this.pinMode = 'delete';
    this.pendingTargetDomain = domain;
    if (this.pinModalTitle) this.pinModalTitle.textContent = 'Qara Siyahıdan Silmək üçün Parol';
    if (this.pinModalDesc) {
      this.pinModalDesc.innerHTML = `<strong style="color: #EF4444; font-family: var(--font-mono);">${domain}</strong> saytını qara siyahıdan silmək üçün zəhmət olmasa təhlükəsizlik parolunu (PIN) daxil edin:`;
    }
    if (this.pinSubmitBtn) this.pinSubmitBtn.textContent = 'Təsdiq Et və Sil 🔓';
    if (this.pinInput) {
      this.pinInput.value = '';
      this.pinInput.style.borderColor = 'var(--border-color)';
    }
    if (this.pinError) this.pinError.style.display = 'none';
    this.pinModal.classList.add('open');
    setTimeout(() => {
      if (this.pinInput) this.pinInput.focus();
    }, 60);
  }

  openPinModalForBlock(domain) {
    if (!this.pinModal) return;
    this.pinMode = 'block';
    this.pendingTargetDomain = domain;
    if (this.pinModalTitle) this.pinModalTitle.textContent = 'Saytı Qara Siyahıya Salmaq üçün Parol';
    if (this.pinModalDesc) {
      this.pinModalDesc.innerHTML = `<strong style="color: #EF4444; font-family: var(--font-mono);">${domain}</strong> saytını qara siyahıya salıb bloklamaq üçün zəhmət olmasa təhlükəsizlik parolunu (PIN) daxil edin:`;
    }
    if (this.pinSubmitBtn) this.pinSubmitBtn.textContent = 'Qara Siyahıya Sal və Blokla ⛔';
    if (this.pinInput) {
      this.pinInput.value = '';
      this.pinInput.style.borderColor = 'var(--border-color)';
    }
    if (this.pinError) this.pinError.style.display = 'none';
    this.pinModal.classList.add('open');
    setTimeout(() => {
      if (this.pinInput) this.pinInput.focus();
    }, 60);
  }

  closePinModal() {
    if (!this.pinModal) return;
    this.pinModal.classList.remove('open');
    this.pendingTargetDomain = null;
  }

  async verifyAndExecuteDelete() {
    if (!this.pendingTargetDomain) return;

    const enteredPin = (this.pinInput ? this.pinInput.value.trim() : '');
    const correctPin = String(this.currentSettings.pinCode || '1234').trim();

    // Verification check: accepts 1234 or configured pinCode
    if (enteredPin !== '1234' && enteredPin !== correctPin) {
      if (this.pinError) this.pinError.style.display = 'block';
      if (this.pinInput) {
        this.pinInput.style.borderColor = '#EF4444';
        this.pinInput.focus();
        this.pinInput.select();
      }
      window.showToast('Xəta: Təhlükəsizlik parolu yanlışdır! Əməliyyat ləğv edildi.', 'warning');
      return;
    }

    const domain = this.pendingTargetDomain;
    this.closePinModal();

    if (this.pinMode === 'delete') {
      if (window.electronAPI) {
        const res = await window.electronAPI.removeBlockedDomain(domain);
        if (res.success) {
          this.currentSettings.blockedDomains = res.list;
          this.renderBlacklist();
          window.showToast(`"${domain}" manual qara siyahıdan uğurla silindi. 🔓`, 'success');
        }
      }
    } else if (this.pinMode === 'block') {
      if (window.electronAPI) {
        const res = await window.electronAPI.addBlockedDomain(domain);
        if (res.success) {
          this.currentSettings.blockedDomains = res.list;
          this.renderBlacklist(); // Automatically updates Settings Manual Blacklist section!
          window.showToast(`"${domain}" manual qara siyahıya əlavə edildi və dərhal bloklandı! 🛡️`, 'warning');

          // Redirect tab to blocked page
          if (window.electronAPI.getInternalPageUrl && this.tabManager) {
            window.electronAPI.getInternalPageUrl('domain-blocked', { domain: domain, reason: 'manual' }).then(blockedUrl => {
              this.tabManager.navigateActiveTab(blockedUrl);
            }).catch(() => {
              this.tabManager.navigateActiveTab(`file://${window.homePagePath || ''}`);
            });
          } else if (this.tabManager) {
            this.tabManager.navigateActiveTab(`file://${window.homePagePath || ''}`);
          }
        } else {
          window.showToast(res.error || 'Domen qara siyahıya salına bilmədi.', 'warning');
        }
      }
    }
  }

  async handleAddDomain() {
    const rawVal = this.newDomainInput.value.trim();
    if (!rawVal) {
      window.showToast('Zəhmət olmasa bloklamaq istədiyiniz domen adını daxil edin.', 'warning');
      return;
    }

    const clean = rawVal.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();

    // Direct check for Facebook whitelist exception
    if (clean === 'facebook.com' || clean.endsWith('.facebook.com') || clean === 'fb.com') {
      window.showToast('Facebook (facebook.com) sistemi tərəfindən icazəli saxlanılıb və bloklana bilməz!', 'warning');
      this.newDomainInput.value = '';
      return;
    }

    if (window.electronAPI) {
      const res = await window.electronAPI.addBlockedDomain(clean);
      if (res.success) {
        this.currentSettings.blockedDomains = res.list;
        this.newDomainInput.value = '';
        this.renderBlacklist();
        window.showToast(`"${clean}" manual qara siyahıya əlavə edildi və dərhal bloklandı! 🛡️`, 'success');
      } else {
        window.showToast(res.error || 'Domen əlavə edilə bilmədi.', 'warning');
      }
    }
  }
}

window.SettingsManager = SettingsManager;
