# Image Guidelines

Images are a critical part of your press kit. This guide covers requirements, best practices, and optimization tips.

## Image Locations

All images should be placed in the `images/` folder within your press kit directory:

```
mycompany/
└── images/
    ├── header.png
    ├── logo.png
    ├── icon.png
    └── screenshot1.png
```

## Required Images

### For Company Press Kits

| Image | Required | Recommended Size | Description |
|-------|----------|------------------|-------------|
| `header.png` | No | 1280×720px | Banner image at top of page |
| `logo.png` | **Yes** | 256×256px | Company logo (square) |

### For Product Press Kits

| Image | Required | Recommended Size | Description |
|-------|----------|------------------|-------------|
| `header.png` | No | 1280×720px | Game banner/key art |
| `logo.png` | **Yes** | 256×256px | Game logo |
| `icon.png` | No | 256×256px | App/game icon |

## Screenshot Organization

### Flat Structure (Simple)
```
images/
├── screenshot1.png
├── screenshot2.png
└── screenshot3.png
```

### Organized Structure (Recommended)
```
images/
├── screenshots/
│   ├── gameplay1.png
│   ├── gameplay2.png
│   ├── menu.png
│   └── settings.png
├── logo.png
└── header.png
```

Both structures work. The organized structure is better for large press kits with many images.

## Image Specifications

### File Formats

**Supported:**
- PNG (recommended for logos, UI, pixel art)
- JPEG/JPG (recommended for photos, screenshots)
- GIF (supported but not recommended)

**Recommended:**
- Use PNG for images with transparency
- Use JPEG for screenshots and photos (better compression)

### Resolution Guidelines

#### Logo
- **Minimum:** 256×256px
- **Recommended:** 512×512px
- **Maximum:** 1024×1024px
- Should be square
- PNG with transparency preferred

#### Icon
- **Minimum:** 256×256px
- **Recommended:** 512×512px
- Should be square

#### Header
- **Minimum:** 1280×720px (16:9 ratio)
- **Recommended:** 1920×1080px
- **Maximum:** 3840×2160px
- Landscape orientation

#### Screenshots
- **Minimum:** 1280×720px
- **Recommended:** 1920×1080px
- Use native game resolution when possible
- Maintain aspect ratio

### File Size

Keep individual images under:
- **Logos/Icons:** 500KB
- **Screenshots:** 2MB
- **Header:** 2MB

Larger files slow down page loading.

## Automatic Processing

presskit.diy automatically generates:

### Thumbnails
- Created for all images
- Stored in `build/images/` directory
- Used for gallery previews
- Default size: 400px wide (maintains aspect ratio)

To disable thumbnail generation:
```bash
presskit-diy build --ignore-thumbnails
```

### ZIP Archives
- All images are automatically bundled into `images.zip`
- Located in `build/images.zip`
- Allows press to download all assets at once

## Naming Conventions

### Best Practices

**Good names:**
```
logo.png
header.png
gameplay-combat.png
ui-inventory.png
screenshot-01.png
```

**Avoid:**
```
IMG_1234.png
Screen Shot 2023-12-01.png
final_FINAL_v2.png
my game screenshot (1).png
```

**Rules:**
- Use lowercase
- Use hyphens (`-`) instead of spaces or underscores
- Be descriptive but concise
- Use numbers for sequences: `01`, `02`, etc.

### Special Names

These filenames have special meanings:

- `header.png` - Banner image
- `logo.png` - Primary logo
- `icon.png` - App icon

## Image Optimization

### Before Adding Images

1. **Crop appropriately** - remove unnecessary borders
2. **Resize to target resolution** - don't upload 4K screenshots if 1080p is sufficient
3. **Compress** - use tools like:
   - [TinyPNG](https://tinypng.com/) for PNG
   - [JPEGmini](https://www.jpegmini.com/) for JPEG
   - [ImageOptim](https://imageoptim.com/) (Mac)
   - [Squoosh](https://squoosh.app/) (web)

### Quality vs. Size

- Screenshots: JPEG quality 80-90% is usually sufficient
- Logos: PNG with transparency, compress with tools above
- Header: Balance quality and file size

## Display Order

Images are displayed in alphabetical order by filename:

```
images/
├── 01-main-menu.png      # Displays first
├── 02-gameplay.png       # Displays second
├── 03-boss-fight.png     # Displays third
└── 04-ending.png         # Displays last
```

Use numbered prefixes to control display order.

## Image Categories

You can organize images into categories using folders:

```
images/
├── screenshots/
│   ├── combat-01.png
│   ├── combat-02.png
│   └── exploration.png
├── concept-art/
│   ├── character-design.png
│   └── environment.png
├── logo.png
└── header.png
```

Each folder becomes a separate gallery section.

## Common Issues

### Images Not Appearing

**Causes:**
- File not in `images/` folder
- Filename has spaces or special characters
- File extension is uppercase (`.PNG` instead of `.png`)
- File permissions issue

**Solution:**
```bash
# Check if file exists
ls -la images/

# Rename files with spaces
mv "my image.png" "my-image.png"
```

### Images Too Large

**Symptoms:**
- Slow page loading
- Large ZIP download size
- Build process is slow

**Solution:**
```bash
# Resize images (example using ImageMagick)
mogrify -resize 1920x1080 images/*.png

# Or use presskit.diy's built-in processing
presskit-diy build
```

### Missing Thumbnails

**Cause:** Sharp library not installed properly

**Solution:**
```bash
npm rebuild sharp
```

Or disable thumbnails:
```bash
presskit-diy build --ignore-thumbnails
```

## Checklist

Before publishing your press kit:

- [ ] Logo is square and high-resolution
- [ ] All images are properly named (lowercase, no spaces)
- [ ] Screenshots show your best content
- [ ] File sizes are optimized
- [ ] Images are in the correct folder
- [ ] Build and preview locally
- [ ] Test ZIP download

## Examples

### Minimal Product Press Kit
```
game/
├── data.json
├── description.md
└── images/
    ├── logo.png          (512×512px, 200KB)
    ├── header.png        (1920×1080px, 800KB)
    ├── screenshot1.png   (1920×1080px, 1.2MB)
    ├── screenshot2.png   (1920×1080px, 1.1MB)
    └── screenshot3.png   (1920×1080px, 1.3MB)
```

### Complete Product Press Kit
```
game/
├── data.json
├── description.md
└── images/
    ├── logo.png
    ├── icon.png
    ├── header.png
    ├── screenshots/
    │   ├── 01-title.png
    │   ├── 02-gameplay.png
    │   ├── 03-combat.png
    │   └── 04-exploration.png
    ├── concept-art/
    │   ├── character.png
    │   └── environment.png
    └── press/
        ├── press-quote-1.png
        └── press-quote-2.png
```

## Tools & Resources

### Image Editing
- [GIMP](https://www.gimp.org/) - Free image editor
- [Photopea](https://www.photopea.com/) - Online Photoshop alternative
- [Krita](https://krita.org/) - Free digital painting

### Optimization
- [TinyPNG](https://tinypng.com/)
- [Squoosh](https://squoosh.app/)
- [ImageOptim](https://imageoptim.com/)

### Resizing
- [ImageMagick](https://imagemagick.org/) - Command-line tool
- [XnConvert](https://www.xnview.com/en/xnconvert/) - Batch converter

---

**Need help?** Open an issue at [GitHub](https://github.com/saturnosoftware/presskit.diy/issues)
