# Migration Guide

This guide helps you migrate from the original presskit() or presskit.html to presskit.diy.

## Quick Summary

**Good news:** If you have existing `data.xml` and `images/` folders, they should work with minimal changes!

presskit.diy is designed to be **backward compatible** with the original presskit() format. In most cases, you can point presskit.diy at your existing data and it will just work.

## From presskit.html

presskit.diy is based on presskit.html, so migration is straightforward.

### What Works Out of the Box

✅ Your existing `data.xml` files  
✅ Your existing `images/` folder structure  
✅ Your existing directory organization  
✅ Product/company hierarchy

### What's Different

#### Installation Method

**presskit.html:**
```bash
npm install presskit.html
```

**presskit.diy:**
```bash
npm install -g presskit-diy
```

#### Build Command

**presskit.html:**
```bash
presskit build
```

**presskit.diy:**
```bash
presskit-diy build
# or
presskit build  # alias works too
```

#### Configuration

Most CLI options are the same, but check the updated flags:

```bash
presskit-diy build --help
```

### Migration Steps

1. **Install presskit.diy**
```bash
npm install -g presskit-diy
```

2. **Navigate to your existing project**
```bash
cd /path/to/your/presskit
```

3. **Build with presskit.diy**
```bash
presskit-diy build
```

4. **Verify output**
```bash
open build/index.html
```

That's it! Your press kit should work.

### New Features You Can Use

Once migrated, you can take advantage of:

- **JSON format** - easier to edit than XML
- **Markdown support** - rich text in descriptions
- **JSONC support** - JSON with comments
- **Improved watch mode** - faster rebuilds
- **Better error messages** - clearer validation

## From Original presskit()

The original presskit() by Rami Ismail used PHP. presskit.diy uses the same data format but is built in Node.js.

### Key Differences

| Original presskit() | presskit.diy |
|---------------------|--------------|
| PHP server required | Static HTML generator |
| Runs on the server | Generates files once |
| `.htaccess` needed | Works anywhere |
| Limited customization | Fully customizable |

### Migration Steps

1. **Backup your data**
```bash
cp -r presskit/ presskit-backup/
```

2. **Install Node.js** (if not already installed)
   - Download from [nodejs.org](https://nodejs.org/)

3. **Install presskit.diy**
```bash
npm install -g presskit-diy
```

4. **Navigate to your data folder**
```bash
cd presskit/
```

5. **Build static files**
```bash
presskit-diy build
```

6. **Deploy the `build/` folder**

The `build/` folder now contains static HTML files. Upload them to any web host.

### File Structure Changes

**Before (presskit()):**
```
presskit/
├── install.php       # PHP installer
├── _presskit/        # PHP code
├── data.xml          # Your data
└── images/
```

**After (presskit.diy):**
```
presskit/
├── data.xml          # Your data (unchanged)
├── images/           # Your images (unchanged)
└── build/            # Generated output
    ├── index.html
    ├── style.css
    └── images/
```

### What to Keep

Keep these files (they work with presskit.diy):
- `data.xml`
- `images/` folder
- Product subdirectories

### What to Remove

You can remove these (no longer needed):
- `install.php`
- `_presskit/` folder
- `.htaccess` (unless needed for other reasons)
- `README.md` from original presskit()

## Modernizing Your Data

Once migrated, consider modernizing your data format.

### Converting XML to JSON

You can manually convert your XML to JSON for easier editing:

**Before (data.xml):**
```xml
<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>My Game</title>
  <website>https://mygame.com</website>
  <release-date>January 2023</release-date>
  <platform>
    <name>Windows</name>
    <link>https://steam...</link>
  </platform>
</product>
```

**After (data.json):**
```json
{
  "type": "product",
  "title": "My Game",
  "website": "https://mygame.com",
  "release_date": "January 2023",
  "platforms": [
    {
      "name": "Windows",
      "link": "https://steam..."
    }
  ]
}
```

### Field Name Changes

Some XML field names are different in JSON:

| XML | JSON |
|-----|------|
| `<release-date>` | `release_date` |
| `<founding-date>` | `founding_date` |
| `<press-contact>` | `press_contact` |
| `<press-copy-request>` | `press_copy_request` |

See the [Data Format Reference](./data-format.md) for complete field mappings.

### Using Markdown

Extract long descriptions to separate files:

**Before:**
```json
{
  "description": "A very long description with lots of text..."
}
```

**After:**
```
game/
├── data.json
└── description.md
```

**description.md:**
```markdown
# About My Game

My game is an **epic adventure** that takes you on a journey...

## Features
- Amazing graphics
- Compelling story
- 40+ hours of gameplay
```

## Deployment Changes

### Before (PHP hosting)

Original presskit() required:
- PHP 5.3+
- Apache with mod_rewrite
- Specific server configuration

### After (Static hosting)

presskit.diy generates static files that work on:
- GitHub Pages
- Netlify
- Vercel
- Any web host
- S3/CloudFront
- Your own server

No special server requirements!

### Deployment Example (GitHub Pages)

```bash
# Build your press kit
presskit-diy build

# Copy to GitHub Pages
cp -r build/* docs/

# Commit and push
git add docs/
git commit -m "Update press kit"
git push

# Enable GitHub Pages in repository settings
```

## Customization

### Custom CSS

**presskit.html:**
```bash
presskit build --css custom.css
```

**presskit.diy:**
```bash
presskit-diy build --css custom.css
```

Same syntax!

### Custom Templates

presskit.diy uses Handlebars templates (same as presskit.html):

```
project/
├── data.json
└── assets/
    └── templates/
        ├── product.hbs
        └── company.hbs
```

Your existing template customizations should work.

## Common Issues

### Issue: "No data.xml or data.json found"

**Cause:** Running command from wrong directory

**Solution:**
```bash
# Navigate to your data folder
cd path/to/presskit/data

# Then build
presskit-diy build
```

Or specify the path:
```bash
presskit-diy build path/to/presskit/data
```

### Issue: "Images not found"

**Cause:** Images are in a different location

**Solution:** Ensure images are in `images/` folder relative to your `data.xml`:

```
myproject/
├── data.xml
└── images/
    └── logo.png
```

### Issue: "Build folder is empty"

**Cause:** Build errors (check console output)

**Solution:**
```bash
# Run build with verbose output
presskit-diy build --dev

# Check for validation errors
```

### Issue: "Videos not displaying"

**Cause:** Video embed format changed

**Solution:** Use the new video format:

**Old XML:**
```xml
<video>
  <name>Trailer</name>
  <youtube>dQw4w9WgXcQ</youtube>
</video>
```

**New JSON:**
```json
{
  "videos": [
    {
      "name": "Trailer",
      "youtube": "dQw4w9WgXcQ"
    }
  ]
}
```

## Testing Your Migration

1. **Build locally**
```bash
presskit-diy build
```

2. **Use watch mode for testing**
```bash
presskit-diy build --watch
```

3. **Compare output**
   - Check all pages render correctly
   - Verify images load
   - Test all links
   - Confirm videos play

4. **Validate with multiple browsers**

## Rollback Plan

If you need to go back:

1. **Keep your original files**
```bash
# Before migrating, backup everything
cp -r presskit/ presskit-backup/
```

2. **Revert if needed**
```bash
# Remove presskit.diy
npm uninstall -g presskit-diy

# Restore original
rm -rf presskit/
mv presskit-backup/ presskit/
```

## Getting Help

If you encounter issues during migration:

1. Check the [Data Format Reference](./data-format.md)
2. See [Examples](./examples.md) for complete samples
3. Open an issue: [GitHub Issues](https://github.com/saturnosoftware/presskit.diy/issues)
4. Include:
   - Your original presskit version
   - Error messages
   - Sample of your data structure

## Next Steps

After successful migration:

- [ ] Test the generated press kit thoroughly
- [ ] Update bookmarks/links to new URL
- [ ] Consider modernizing to JSON format
- [ ] Add new features (Markdown, videos, etc.)
- [ ] Update your deployment process
- [ ] Archive the old PHP version

---

**Welcome to presskit.diy!** 🎉

Maintained by [Saturno.Software](https://saturno.software/)
