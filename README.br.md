<p align="center">
  <a href="https://github.com/Tlkh201313/awakening-cli-new-gen">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Logo do Awakened">
    </picture>
  </a>
</p>
<p align="center">O agente de programação com IA de código aberto.</p>
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

### Instalação

```bash
# YOLO
curl -fsSL https://github.com/Tlkh201313/awakening-cli-new-gen#installation | bash

# Gerenciadores de pacotes
npm i -g awakened-ai@latest        # ou bun/pnpm/yarn
scoop install awakened             # Windows
choco install awakened             # Windows
brew install Tlkh201313/awakening-cli-new-gen (build from source) # macOS e Linux (recomendado, sempre atualizado)
brew install awakened              # macOS e Linux (fórmula oficial do brew, atualiza menos)
sudo pacman -S awakened            # Arch Linux (Stable)
paru -S awakened-bin               # Arch Linux (Latest from AUR)
mise use -g awakened               # qualquer sistema
nix run nixpkgs#awakened           # ou github:Tlkh201313/awakening-cli-new-gen para a branch dev mais recente
```

> [!TIP]
> Remova versões anteriores a 0.1.x antes de instalar.

### App desktop (BETA)

O Awakened também está disponível como aplicativo desktop. Baixe diretamente pela [página de releases](https://github.com/Tlkh201313/awakening-cli-new-gen/releases) ou em [awakened.ai/download](https://github.com/Tlkh201313/awakening-cli-new-gen/releases).

| Plataforma            | Download                           |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `awakened-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `awakened-desktop-mac-x64.dmg`     |
| Windows               | `awakened-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm` ou AppImage         |

```bash
# macOS (Homebrew)
brew install --cask awakened-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/awakened-desktop
```

#### Diretório de instalação

O script de instalação respeita a seguinte ordem de prioridade para o caminho de instalação:

1. `$AWAKENED_INSTALL_DIR` - Diretório de instalação personalizado
2. `$XDG_BIN_DIR` - Caminho compatível com a especificação XDG Base Directory
3. `$HOME/bin` - Diretório binário padrão do usuário (se existir ou puder ser criado)
4. `$HOME/.awakened/bin` - Fallback padrão

```bash
# Exemplos
AWAKENED_INSTALL_DIR=/usr/local/bin curl -fsSL https://github.com/Tlkh201313/awakening-cli-new-gen#installation | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://github.com/Tlkh201313/awakening-cli-new-gen#installation | bash
```

### Agents

O Awakened inclui dois agents integrados, que você pode alternar com a tecla `Tab`.

- **build** - Padrão, agent com acesso total para trabalho de desenvolvimento
- **plan** - Agent somente leitura para análise e exploração de código
  - Nega edições de arquivos por padrão
  - Pede permissão antes de executar comandos bash
  - Ideal para explorar codebases desconhecidas ou planejar mudanças

Também há um subagent **general** para buscas complexas e tarefas em várias etapas.
Ele é usado internamente e pode ser invocado com `@general` nas mensagens.

Saiba mais sobre [agents](https://github.com/Tlkh201313/awakening-cli-new-gen#documentation/agents).

### Documentação

Para mais informações sobre como configurar o Awakened, [**veja nossa documentação**](https://github.com/Tlkh201313/awakening-cli-new-gen#documentation).

### Contribuir

Se você tem interesse em contribuir com o Awakened, leia os [contributing docs](./CONTRIBUTING.md) antes de enviar um pull request.

### Construindo com Awakened

Se você estiver trabalhando em um projeto relacionado ao Awakened e estiver usando "awakened" como parte do nome (por exemplo, "awakened-dashboard" ou "awakened-mobile"), adicione uma nota no README para deixar claro que não foi construído pela equipe do Awakened e não é afiliado a nós de nenhuma forma.

---

**Junte-se à nossa comunidade** [Discord](https://github.com/Tlkh201313/awakening-cli-new-gen) | [X.com](https://github.com/Tlkh201313/awakening-cli-new-gen)
