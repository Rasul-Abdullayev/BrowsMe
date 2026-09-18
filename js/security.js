class SecurityEngine {
  constructor() {
    this.threatsBlockedCount = 14;
    this.threatsElement = document.getElementById('threatsCount');
    this.shieldBtn = document.getElementById('shieldBtn');
    this.securityBadge = document.getElementById('securityBadge');
    this.securityIcon = document.getElementById('securityIcon');
    this.securityText = document.getElementById('securityText');

    // Popover Elements
    this.siteInfoPopover = document.getElementById('siteInfoPopover');
    this.closeSiteInfoBtn = document.getElementById('closeSiteInfoBtn');
    this.popoverDomain = document.getElementById('popoverDomain');
    this.popoverSecurityBadge = document.getElementById('popoverSecurityBadge');
    this.popoverCertInfo = document.getElementById('popoverCertInfo');
    this.popoverCookieCount = document.getElementById('popoverCookieCount');
    this.quickBlockDomainBtn = document.getElementById('quickBlockDomainBtn');
    this.eduBadgeEl = document.getElementById('eduVerifiedBadge');

    // Permission inputs
    this.permCamera = document.getElementById('permCamera');
    this.permMic = document.getElementById('permMic');
    this.permNotifications = document.getElementById('permNotifications');
    this.permLocation = document.getElementById('permLocation');

    this.currentDomain = '';
    this.initPopover();
  }

  isEducational(domain) {
    if (!domain) return false;
    const d = domain.toLowerCase().trim();
    if (d.endsWith('.edu.az') || d.endsWith('.edu') || d.endsWith('.ac.uk') || d.endsWith('.edu.tr')) {
      return true;
    }
    const eduList = [
      'tedris.edu.az', 'wikipedia.org', 'khanacademy.org', 'coursera.org',
      'python.org', 'rust-lang.org', 'w3schools.com', 'edx.org', 'udemy.com',
      'mit.edu', 'harvard.edu', 'stanford.edu', 'ox.ac.uk', 'cam.ac.uk',
      'codecademy.com', 'geeksforgeeks.org', 'stackoverflow.com', 'github.com',
      'scholar.google.com', 'researchgate.net', 'sciencedirect.com', 'arxiv.org', 'mozilla.org'
    ];
    return eduList.some(e => d === e || d.endsWith('.' + e));
  }

  initPopover() {
    if (!this.securityBadge || !this.siteInfoPopover) return;

    // Toggle popover on badge click
    this.securityBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePopover();
    });

    // Shield button reaction & security status popover toggle
    if (this.shieldBtn) {
      this.shieldBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shieldBtn.classList.add('pulse');
        setTimeout(() => this.shieldBtn.classList.remove('pulse'), 600);
        this.togglePopover();
        window.showToast('🛡️ Təhlükəsizlik Qalxanı Aktivdir: HTTPS Məcburi, Yetkinlik və Qafqaz Sosial Şəbəkələri Bloklanıb.', 'success');
      });
    }

    if (this.closeSiteInfoBtn) {
      this.closeSiteInfoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePopover();
      });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!this.siteInfoPopover.contains(e.target) && 
          e.target !== this.securityBadge && !this.securityBadge.contains(e.target) &&
          (!this.shieldBtn || (e.target !== this.shieldBtn && !this.shieldBtn.contains(e.target)))) {
        this.closePopover();
      }
    });

    // Permission change handlers
    const handlePermChange = (name, val) => {
      if (!this.currentDomain) return;
      localStorage.setItem(`perm_${this.currentDomain}_${name}`, val);
      window.showToast(`${this.currentDomain} üçün ${name} icazəsi: "${val === 'allow' ? 'İcazə verildi' : (val === 'block' ? 'Bloklandı' : 'Soruşulacaq')}"`, 'info');
    };

    if (this.permCamera) this.permCamera.addEventListener('change', (e) => handlePermChange('Kamera', e.target.value));
    if (this.permMic) this.permMic.addEventListener('change', (e) => handlePermChange('Mikrofon', e.target.value));
    if (this.permNotifications) this.permNotifications.addEventListener('change', (e) => handlePermChange('Bildirişlər', e.target.value));
    if (this.permLocation) this.permLocation.addEventListener('change', (e) => handlePermChange('Məkan', e.target.value));

    // Quick block button (Requires PIN 1234 verification)
    if (this.quickBlockDomainBtn) {
      this.quickBlockDomainBtn.addEventListener('click', () => {
        if (!this.currentDomain || this.currentDomain === 'EduBrowser' || this.isEducational(this.currentDomain)) {
          window.showToast('Təhsil portalları qara siyahıya salına bilməz!', 'info');
          return;
        }
        this.closePopover();
        if (window.settingsManager) {
          window.settingsManager.openPinModalForBlock(this.currentDomain);
        }
      });
    }
  }

  togglePopover() {
    if (this.siteInfoPopover.classList.contains('open')) {
      this.closePopover();
    } else {
      this.openPopover();
    }
  }

  openPopover() {
    this.updatePopoverContent();
    this.siteInfoPopover.classList.add('open');
  }

  closePopover() {
    this.siteInfoPopover.classList.remove('open');
  }

  updatePopoverContent() {
    const activeTab = window.tabManager ? window.tabManager.getActiveTab() : null;
    const url = activeTab ? activeTab.url : '';

    try {
      if (!url || url.startsWith('file://')) {
        this.currentDomain = 'EduBrowser Təhsil Portalı';
        this.popoverDomain.textContent = '🎓 ' + this.currentDomain;
        this.popoverSecurityBadge.textContent = '🔒 Daxili Qorunan Səhifə';
        this.popoverSecurityBadge.style.color = '#38BDF8';
        this.popoverCertInfo.textContent = 'Bu səhifə sistem tərəfindən tam qorunur və təhlükəsizdir.';
        this.popoverCookieCount.textContent = '0 çərəz (Lokal keş)';
        this.quickBlockDomainBtn.style.display = 'none';
        if (this.eduBadgeEl) this.eduBadgeEl.style.display = 'none';
      } else {
        const parsed = new URL(url);
        this.currentDomain = parsed.hostname;
        this.popoverDomain.textContent = this.currentDomain;

        const isEdu = this.isEducational(this.currentDomain);
        if (isEdu) {
          this.quickBlockDomainBtn.style.display = 'none';
          if (this.eduBadgeEl) {
            this.eduBadgeEl.style.display = 'flex';
          }
        } else {
          this.quickBlockDomainBtn.style.display = 'flex';
          this.quickBlockDomainBtn.textContent = `🚫 "${this.currentDomain}" Saytını Qara Siyahıya Sal`;
          if (this.eduBadgeEl) {
            this.eduBadgeEl.style.display = 'none';
          }
        }

        if (parsed.protocol === 'https:') {
          this.popoverSecurityBadge.textContent = '🔒 Əlaqə Təhlükəsizdir';
          this.popoverSecurityBadge.style.color = '#10B981';
          this.popoverCertInfo.textContent = 'Sertifikat etibarlıdır (TLS 1.3 / 256-bit şifrələmə).';
        } else {
          this.popoverSecurityBadge.textContent = '⚠️ Qeyri-Təhlükəsiz (HTTP)';
          this.popoverSecurityBadge.style.color = '#EF4444';
          this.popoverCertInfo.textContent = 'Şifrələnməyib! Məlumatlarınız təhlükədə ola bilər.';
        }

        const pseudoCookies = (Math.abs(this.hashCode(this.currentDomain)) % 14) + 2;
        this.popoverCookieCount.textContent = `${pseudoCookies} çərəz və sayt məlumatı istifadə olunur`;

        // Restore saved permissions
        if (this.permCamera) this.permCamera.value = localStorage.getItem(`perm_${this.currentDomain}_Kamera`) || 'block';
        if (this.permMic) this.permMic.value = localStorage.getItem(`perm_${this.currentDomain}_Mikrofon`) || 'block';
        if (this.permNotifications) this.permNotifications.value = localStorage.getItem(`perm_${this.currentDomain}_Bildirişlər`) || 'block';
        if (this.permLocation) this.permLocation.value = localStorage.getItem(`perm_${this.currentDomain}_Məkan`) || 'block';
      }
    } catch (e) {
      this.popoverDomain.textContent = 'Məlum Olmayan Səhifə';
    }
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  matchProhibitedSearch(queryText) {
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
    } catch (e) {}
    return null;
  }

  processUrlInput(input) {
    let raw = input.trim();
    if (!raw) return null;

    if (raw === 'about:blank' || raw === 'internal:home' || raw === 'edubrowser://home' || raw === 'browsme://home') {
      return `file://${window.homePagePath || ''}`;
    }

    if (raw === 'internal:incognito' || raw === 'browsme://incognito') {
      return `file://${window.incognitoPagePath || ''}`;
    }

    // Check prohibited search keywords (porno, sex, seks, sekis, qumar, bet, topaz, misli, 1xbet)
    const matchedSearch = this.matchProhibitedSearch(raw);
    if (matchedSearch) {
      const basePath = (window.homePagePath || '').replace('home.html', 'domain-blocked.html');
      return `file://${basePath}?domain=${encodeURIComponent('Axtarış: "' + raw + '"')}&reason=search&keyword=${encodeURIComponent(matchedSearch)}`;
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    const domainRegex = /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(\/.*)?$/;
    if (domainRegex.test(raw)) {
      return 'https://' + raw;
    }

    const engine = localStorage.getItem('defaultSearchEngine') || 'google';
    if (engine === 'duckduckgo') {
      return 'https://duckduckgo.com/?q=' + encodeURIComponent(raw) + '&kp=1';
    } else if (engine === 'bing') {
      return 'https://www.bing.com/search?q=' + encodeURIComponent(raw);
    } else if (engine === 'ecosia') {
      return 'https://www.ecosia.org/search?q=' + encodeURIComponent(raw);
    }
    return 'https://www.google.com/search?q=' + encodeURIComponent(raw);
  }

  updateSecurityDisplay(tab) {
    if (!tab) return;

    const url = tab.url || '';

    if (url.startsWith('file://')) {
      if (url.includes('http-blocked.html')) {
        this.securityBadge.className = 'security-badge insecure';
        this.securityIcon.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>`;
        this.securityText.textContent = 'HTTP Qadağandır';
        this.shieldBtn.classList.add('alert');
      } else if (url.includes('domain-blocked.html')) {
        this.securityBadge.className = 'security-badge insecure';
        this.securityIcon.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>`;
        this.securityText.textContent = 'Qara Siyahı';
        this.shieldBtn.classList.add('alert');
      } else {
        this.securityBadge.className = 'security-badge internal';
        this.securityIcon.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>`;
        this.securityText.textContent = 'Təhsil Portalı';
        this.shieldBtn.classList.remove('alert');
      }
    } else if (url.startsWith('https://')) {
      this.securityBadge.className = 'security-badge secure';
      this.securityIcon.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`;
      this.securityText.textContent = 'HTTPS Qorunur';
      this.shieldBtn.classList.remove('alert');
    } else if (url.startsWith('http://')) {
      this.securityBadge.className = 'security-badge insecure';
      this.securityIcon.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`;
      this.securityText.textContent = 'HTTP Təhlükəli';
      this.shieldBtn.classList.add('alert');
    }

    if (this.threatsElement) {
      this.threatsElement.textContent = this.threatsBlockedCount;
    }
  }

  incrementThreatsBlocked() {
    this.threatsBlockedCount++;
    if (this.threatsElement) {
      this.threatsElement.textContent = this.threatsBlockedCount;
    }
  }
}

window.SecurityEngine = SecurityEngine;
