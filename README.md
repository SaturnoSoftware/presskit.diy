# presskit.diy

[![npm version](https://badgen.net/npm/v/presskit-diy?cache=600)](https://npmjs.org/package/presskit-diy)
[![npm downloads](https://badgen.net/npm/dm/presskit-diy?cache=600)](https://npmjs.org/package/presskit-diy)
[![License: MIT](https://badgen.net/badge/license/MIT/blue)](./LICENSE)
[![Code Style: Standard](https://badgen.net/badge/code%20style/standard/f2a)](http://standardjs.com/)
[![Tests: CI verified](https://badgen.net/badge/tests/CI%20verified/green)](./tests)

**Generate beautiful press kits in minutes.** Static HTML, zero server required.

presskit.diy is a modern Node.js CLI tool for creating professional press kits. It supports both XML (for backward compatibility with the original presskit) and JSON/JSONC (for modern projects). Deploy anywhere—it's just static files.

Maintained by [Saturno.Software](https://saturno.software/), based on the legendary [presskit.html](https://github.com/pixelnest/presskit.html) by Pixelnest Studio.

---

## Quick Start

### For CLI Users
```bash
npm install -g presskit-diy

# Create a new project
presskit-diy new company mycompany
cd mycompany/

# Build your press kit
presskit-diy build

# Open build/index.html in your browser
```

### For Library Users
```bash
npm install presskit-diy
```

```javascript
const { runBuildCommand } = require('presskit-diy');

runBuildCommand({
  entryPoint: './data',
  output: './build',
  watch: false
});
```

---

## Features

- **Dual Format Support** — Write in XML (legacy) or JSON/JSONC (modern)
- **Image Optimization** — Auto-generated thumbnails, ZIP archives
- **Watch Mode** — Live reload with BrowserSync
- **Markdown Support** — Rich text fields in JSON files
- **Product Relations** — DLC, sequel, and expansion links
- **Customizable** — Use your own CSS, override templates
- **Cross-Platform** — macOS, Linux, Windows support
- **Secure** — 100% static HTML, no server required
- **Scaffolding** — Generate templates instantly
- **⚡ Zero Dependencies** — Deploy anywhere (just HTML/CSS/JS)

---

## Installation

### Global (CLI Tool)
```bash
npm install -g presskit-diy
presskit-diy --help
```

### Local (As a Library)
```bash
npm install presskit-diy
```

### Requirements
- Node.js 14+ ([Download](https://nodejs.org/))

---

## Verification And Saturno Build Contract

`presskit.diy` now keeps one Saturno-standard build/package surface alongside the existing npm commands.

Current repo-level entrypoints:

```powershell
pwsh -File Scripts/build.ps1 -ProjectRoot .
pwsh -File Scripts/package.ps1 -ProjectRoot . -BuildNumber 0
```

What they do:

- `Scripts/build.ps1` runs the canonical verification path: `npm test -- --runInBand` and `npm run build`
- `Scripts/package.ps1` stages the npm tarball produced by `npm pack`
- canonical Saturno outputs live under `__BUILD/<release-name>/` and `__DIST/<release-name>/`

The existing npm commands remain the underlying repo commands:

```bash
npm test -- --runInBand
npm run build
npm pack --dry-run
```

---

## Common Tasks

### Create a New Press Kit from Template
```bash
presskit-diy new company mycompany
presskit-diy new product myproduct

# Then edit the generated files
cd mycompany/
# Edit data.json, description.md, and images/
```

### Build from Existing Data
```bash
# Build from XML (legacy format)
presskit-diy build

# Build from JSON (modern format)
# (automatic if data.json exists)

# Output: ./build/index.html
```

### Enable Watch Mode (Auto-rebuild on changes)
```bash
presskit-diy build --watch

# Optional: use dev mode (also watches CSS/templates)
presskit-diy build --watch --dev
```

### Use Custom CSS
```bash
presskit-diy build --css ./my-custom-theme.css
```

### Other Options
```bash
# Specify input and output directories
presskit-diy build ./data --output ./public

# Pretty URLs (remove .html extensions)
presskit-diy build --pretty-links

# Ignore missing images (don't warn)
presskit-diy build --ignore-missing-images

# Disable thumbnail generation (faster builds)
presskit-diy build --ignore-thumbnails

# See all options
presskit-diy --help
```

---

## Data Formats

### JSON Format (Recommended for New Projects)
```bash
presskit-diy new company mycompany
cd mycompany/
```

Your project structure:
```
mycompany/
├── data.json           # Your company/product data
├── description.md      # Markdown description
└── images/
    ├── logo.png
    ├── screenshot1.png
    └── ...
```

**data.json example:**
```json
{
  "type": "company",
  "title": "My Company",
  "website": "https://example.com",
  "description": "We make awesome stuff.",
  "socials": [
    { "name": "Twitter", "url": "https://twitter.com/..." }
  ],
  "features": [
    { "title": "Feature 1", "description": "Does something cool" }
  ]
}
```

### XML Format (Legacy, Still Supported)
```xml
<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>My Company</title>
  <website>https://example.com</website>
  <description>We make awesome stuff.</description>
  <social>
    <name>Twitter</name>
    <url>https://twitter.com/...</url>
  </social>
</company>
```

---

## Documentation

### Full Guides
- **[Data Format Reference](./docs/data-format.md)** — Complete field documentation
- **[Migration Guide](./docs/migration-guide.md)** — Upgrading from presskit()
- **[Image Guidelines](./docs/images.md)** — Logo sizes, categories, etc.
- **[Examples](./docs/examples.md)** — Real-world data.json samples

### Architecture
- Technical architecture details available in the repository source code

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- Testing requirements
- Pull request process

---

## License

MIT — See [LICENSE](./LICENSE) for details.

Maintained by [Saturno.Software](https://saturno.software/)  
Based on [presskit.html](https://github.com/pixelnest/presskit.html) by Pixelnest Studio  
Inspired by the original [presskit()](http://dopresskit.com/) by Rami Ismail

---

## FAQ

**Q: Can I use presskit.diy with my existing presskit() data?**  
A: Yes! Your `data.xml` and `images/` folder will work. See the [Migration Guide](./docs/migration-guide.md).

**Q: Do I need a web server?**  
A: No. It generates static HTML files. Upload them anywhere (GitHub Pages, Netlify, your own host).

**Q: Can I customize the design?**  
A: Yes. Provide your own CSS file with `--css` option. Or extend the templates.

**Q: Does it support JSON and XML at the same time?**  
A: No, but you can have one per directory. If both exist, JSON takes priority.

**Q: How do I deploy my press kit?**  
A: Upload the `build/` folder to any web host. It's just static files.

**Q: Is there a GUI/web interface?**  
A: Not yet. presskit.diy is command-line based. CLI simplifies deployment.

---

## Links

- [GitHub Repository](https://github.com/saturnosoftware/presskit.diy)
- [npm Package](https://npmjs.org/package/presskit-diy)
- [Saturno.Software](https://saturno.software/)
- [Original presskit()](http://dopresskit.com/)
- [presskit.html](https://github.com/pixelnest/presskit.html)

---

**Made with ❤️ by Saturno.Software**
