<div align="center">

# 🌐 BrowsMe (EduBrowser)

[![Release](https://img.shields.io/badge/Release-v1.1.1-blue.svg?style=flat-square)](https://github.com)
[![Electron](https://img.shields.io/badge/Electron-34.0.0-47848F.svg?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB.svg?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-339933.svg?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20x64-0078D6.svg?style=flat-square&logo=windows)](https://www.microsoft.com/windows)

**Modern, Təhlükəsiz Təhsil Brauzeri və Daxili Python / Node.js Kodlaşdırma Studiyası**  
*Modern, Safe Educational Browser & Integrated Python / Node.js Code Studio*

[📥 Yükləmələr / Downloads](#-downloads--yükləmələr) • [✨ Xüsusiyyətlər / Features](#-features--xüsusiyyətlər) • [🤝 Əməkdaşlıq / Contributions](#-open-for-contributions--inkişafa-açıqdır) • [🛠️ Qurulum / Getting Started](#-getting-started--qurulum)

</div>

---

## 🇦🇿 Azərbaycan Dilində

### 📖 Layihə Haqqında
**BrowsMe**, məktəblilər, yeniyetmələr (12-17 yaş) və təhsil müəssisələri üçün hazırlanmış müasir, yüksək təhlükəsizlikli masaüstü təhsil brauzeridir. Brauzer istifadəçilərə təhlükəsiz internet mühiti təqdim etməklə yanaşı, daxilində real vaxt rejimində **Python 3** və **Node.js / JavaScript** kodları yazmaq və icra etmək üçün güclü **Code Studio** mühitini təmin edir.

### 🌟 Əsas Xüsusiyyətlər
* 🛡️ **Ağıllı Təhlükəsizlik & Valideyn Nəzarəti:**
  * HTTP protokollu təhlükəli saytların qarşısının avtomatik alınması (HTTPS Enforce).
  * Zərərli, yaşa uyğun olmayan (böyüklər üçün, qumar və s.) domenlərin və axtarış sorğularının dərhal bloklanması.
  * Təhsil portalları (məsələn: `edu.az`, `wikipedia.org`, `khanacademy.org`) üçün etibarlı ağ siyahı.
  * Valideyn/İnzibatçı menyusu üçün PİN kod qorunması *(İlkin PİN: `1234`)*.
* 💻 **İnteqrasiya Olunmuş Code Studio (Kod Redaktoru & Terminal):**
  * **Python 3:** GUI (Tkinter) və konsol skriptlərinin birbaşa icrası (məsələn: 1-100 aralığında 3 seçimli *Ağlımdakı Ədədi Tap* oyunu).
  * **Node.js / JavaScript:** Real vaxt fasiləsiz *00:00:00 Taymer* və skript icrası.
  * Daxili fayl meneceri, canlı terminal və keş təmizləmə alətləri.
* ⚡ **Dinamik Arxa Plan Quraşdırıcısı:**
  * Kompüterdə Python və ya Node.js yoxdursa, quraşdırma zamanı arxa planda avtomatik və səssiz şəkildə endirilir və sistem mühitinə (PATH) əlavə edilir.
* 🎨 **Müasir 60/30/10 Dizayn Palitrası:**
  * Qaranlıq (Dark) və İşıqlı (Light) rejim, şüşəvari (Glassmorphism) interfeys, 6 vərəqə qədər sürətli tab meneceri, autentik Google axtarış səhifəsi.

---

## 🇬🇧 In English

### 📖 About The Project
**BrowsMe** is a next-generation desktop educational web browser tailored for students, teenagers (ages 12-17), and academic institutions. Combining robust content filtering and safety shields with an integrated full-featured **Python 3 & Node.js Code Studio**, BrowsMe allows learners to safely explore the web while practicing programming in real-time.

### 🌟 Key Features
* 🛡️ **Child Safety & Parental Control Shield:**
  * Strict HTTP blocking and automatic HTTPS enforcement.
  * Real-time domain and search keyword filtering against adult content, gambling, and malicious sources.
  * Protected educational whitelist (`edu.az`, `wikipedia.org`, `khanacademy.org`, etc.).
  * PIN-protected security settings *(Default Master PIN: `1234`)*.
* 💻 **Embedded Code Studio & Interactive Terminal:**
  * **Python 3 Engine:** Native support for Tkinter GUI applications and standard CLI scripts (featuring the built-in *Guess The Number* 3-choice game).
  * **Node.js & Web Engine:** Interactive execution of scripts including real-time continuous timers and web utilities.
  * Built-in file explorer, tabbed editor, interactive stdin, and terminal output.
* ⚡ **Zero-Config Background Runtime Installer:**
  * Automatically detects and silently installs Python LTS & Node.js LTS in the background if they are missing on the target Windows system.
* 🎨 **Premium Aesthetic UI:**
  * Designed with harmonious 60/30/10 color rules, dark/light theme switching, multi-tab browsing (up to 6 tabs), and custom permission controls.

---

## 📥 Downloads & Yükləmələr

Son **v1.1.1** buraxılış fayllarını aşağıdakı cədvəldən endirə bilərsiniz / *Download the latest v1.1.1 release packages:*

| Fayl / File | Növ / Type | Ölçü / Size | Təsvir / Description |
|---|---|---|---|
| 📦 **[BrowsMe Setup 1.1.1.exe](./dist/BrowsMe%20Setup%201.1.1.exe)** | Windows Setup (NSIS) | ~82.6 MB | **Tövsiyə olunan / Recommended.** Python və Node.js çatışmadıqda arxa planda avtomatik yükləyir. |
| 🏢 **[BrowsMe 1.1.1.msi](./dist/BrowsMe%201.1.1.msi)** | Windows Installer (MSI) | ~82.7 MB | Müəssisə və məktəb şəbəkələri üçün rəsmi MSI paketi. |
| 🚀 **[BrowsMe-Portable-1.1.1.exe](./dist/BrowsMe-Portable-1.1.1.exe)** | Portable EXE | ~82.3 MB | Quraşdırma tələb etməyən portativ rejim (Python/Node hazır olan sistemlər üçün). |

---

## 🤝 Open for Contributions / İnkişafa Açıqdır

> [!TIP]
> 💡 **Bu layihə açıq mənbəlidir və birgə inkişafa tam açıqdır!**  
> Yeni funksiyalar əlavə etmək, dizaynı təkmilləşdirmək, təhlükəsizlik filtrlərini zənginləşdirmək və ya təhsil modullarını genişləndirmək üçün hər kəsin töhfələri (Pull Request, Issue, rəy və təkliflər) böyük məmnuniyyətlə qəbul edilir!

> [!NOTE]
> 💡 **Contributions are warmly welcomed!**  
> We believe in community-driven open-source education. If you want to propose new features, improve security heuristics, design new templates for Code Studio, or submit bug fixes, feel free to open an **Issue** or submit a **Pull Request**.

### 🌟 Necə töhfə verə bilərsiniz? / How to contribute:
1. Layihəni **Fork** edin (*Fork the repository*).
2. Yeni bir feature branch yaradın (`git checkout -b feature/YeniXususiyyet`).
3. Dəyişikliklərinizi commit edin (`git commit -m 'feat: Add amazing feature'`).
4. Branch-i push edin (`git push origin feature/YeniXususiyyet`).
5. **Pull Request** açın!

---

## 🛠️ Getting Started / Qurulum

### Tələblər / Prerequisites
* **Node.js** (v18.0 və ya daha yeni)
* **Python** (3.10 və ya daha yeni - könüllü, skriptləri icra etmək üçün)
* **Git**

### Quraşdırma Addımları / Installation Steps

```bash
# 1. Repozitoriyanı klonlayın / Clone repo
git clone https://github.com/your-username/browsme-edubrowser.git
cd browsme-edubrowser

# 2. Asılılıqları quraşdırın / Install dependencies
npm install

# 3. İnkişaf rejimində işə salın / Run in dev mode
npm start

# 4. Distributivləri paketləyin (MSI, EXE, Portable) / Build distributions
npm run dist
```

---

## 📜 Lisenziya / License

Bu layihə **MIT Lisenziyası** altında yayımlanır. Ətraflı məlumat üçün `LICENSE` faylına baxa bilərsiniz.  
*This project is licensed under the MIT License.*

---

<div align="center">
  <sub>BrowsMe Team ilə sevgi və təhlükəsizliklə hazırlandı ❤️🎓</sub>
</div>
