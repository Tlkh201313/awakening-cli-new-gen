<p align="center">
  <a href="https://github.com/Tlkh201313/awakening-cli-new-gen">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Awakened logo">
    </picture>
  </a>
</p>
<p align="center">Otwartoźródłowy agent kodujący AI.</p>
<p align="center">
  <a href="https://github.com/Tlkh201313/awakening-cli-new-gen"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/awakened-ai"><img alt="npm" src="https://img.shields.io/npm/v/awakened-ai?style=flat-square" /></a>
  <a href="https://github.com/Tlkh201313/awakening-cli-new-gen/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/Tlkh201313/awakening-cli-new-gen/publish.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![Awakened Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/Tlkh201313/awakening-cli-new-gen)

---

### Instalacja

```bash
# YOLO
curl -fsSL https://github.com/Tlkh201313/awakening-cli-new-gen#installation | bash

# Menedżery pakietów
npm i -g awakened-ai@latest        # albo bun/pnpm/yarn
scoop install awakened             # Windows
choco install awakened             # Windows
brew install Tlkh201313/awakening-cli-new-gen (build from source) # macOS i Linux (polecane, zawsze aktualne)
brew install awakened              # macOS i Linux (oficjalna formuła brew, rzadziej aktualizowana)
sudo pacman -S awakened            # Arch Linux (Stable)
paru -S awakened-bin               # Arch Linux (Latest from AUR)
mise use -g awakened               # dowolny system
nix run nixpkgs#awakened           # lub github:Tlkh201313/awakening-cli-new-gen dla najnowszej gałęzi dev
```

> [!TIP]
> Przed instalacją usuń wersje starsze niż 0.1.x.

### Aplikacja desktopowa (BETA)

Awakened jest także dostępny jako aplikacja desktopowa. Pobierz ją bezpośrednio ze strony [releases](https://github.com/Tlkh201313/awakening-cli-new-gen/releases) lub z [awakened.ai/download](https://github.com/Tlkh201313/awakening-cli-new-gen/releases).

| Platforma             | Pobieranie                         |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `awakened-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `awakened-desktop-mac-x64.dmg`     |
| Windows               | `awakened-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm` lub AppImage        |

```bash
# macOS (Homebrew)
brew install --cask awakened-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/awakened-desktop
```

#### Katalog instalacji

Skrypt instalacyjny stosuje następujący priorytet wyboru ścieżki instalacji:

1. `$AWAKENED_INSTALL_DIR` - Własny katalog instalacji
2. `$XDG_BIN_DIR` - Ścieżka zgodna ze specyfikacją XDG Base Directory
3. `$HOME/bin` - Standardowy katalog binarny użytkownika (jeśli istnieje lub można go utworzyć)
4. `$HOME/.awakened/bin` - Domyślny fallback

```bash
# Przykłady
AWAKENED_INSTALL_DIR=/usr/local/bin curl -fsSL https://github.com/Tlkh201313/awakening-cli-new-gen#installation | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://github.com/Tlkh201313/awakening-cli-new-gen#installation | bash
```

### Agents

Awakened zawiera dwóch wbudowanych agentów, między którymi możesz przełączać się klawiszem `Tab`.

- **build** - Domyślny agent z pełnym dostępem do pracy developerskiej
- **plan** - Agent tylko do odczytu do analizy i eksploracji kodu
  - Domyślnie odmawia edycji plików
  - Pyta o zgodę przed uruchomieniem komend bash
  - Idealny do poznawania nieznanych baz kodu lub planowania zmian

Dodatkowo jest subagent **general** do złożonych wyszukiwań i wieloetapowych zadań.
Jest używany wewnętrznie i można go wywołać w wiadomościach przez `@general`.

Dowiedz się więcej o [agents](https://github.com/Tlkh201313/awakening-cli-new-gen#documentation/agents).

### Dokumentacja

Więcej informacji o konfiguracji Awakened znajdziesz w [**dokumentacji**](https://github.com/Tlkh201313/awakening-cli-new-gen#documentation).

### Współtworzenie

Jeśli chcesz współtworzyć Awakened, przeczytaj [contributing docs](./CONTRIBUTING.md) przed wysłaniem pull requesta.

### Budowanie na Awakened

Jeśli pracujesz nad projektem związanym z Awakened i używasz "awakened" jako części nazwy (na przykład "awakened-dashboard" lub "awakened-mobile"), dodaj proszę notatkę do swojego README, aby wyjaśnić, że projekt nie jest tworzony przez zespół Awakened i nie jest z nami w żaden sposób powiązany.

---

**Dołącz do naszej społeczności** [Discord](https://github.com/Tlkh201313/awakening-cli-new-gen) | [X.com](https://github.com/Tlkh201313/awakening-cli-new-gen)
