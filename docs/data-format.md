# Data Format Reference

presskit.diy supports two data formats: **JSON** (recommended for new projects) and **XML** (legacy format for compatibility).

## File Structure

### Company Press Kit
```
company/
├── data.json (or data.xml)
├── description.md (or use description field in JSON)
├── images/
│   ├── header.png
│   ├── logo.png
│   └── ...
└── products/
    └── product1/
        └── ...
```

### Product Press Kit
```
product/
├── data.json (or data.xml)
├── description.md
└── images/
    ├── header.png
    ├── logo.png
    ├── icon.png
    └── screenshots/
```

## JSON Format (Recommended)

### Company Data

**data.json:**
```json
{
  "type": "company",
  "title": "My Awesome Studio",
  "website": "https://example.com",
  "email": "contact@example.com",
  "phone": "+1-555-123-4567",
  "address": "123 Main St, City, State 12345",
  "description": "We make awesome games.",
  
  "founding_date": "January 1, 2015",
  
  "socials": [
    {
      "name": "Twitter",
      "url": "https://twitter.com/example"
    },
    {
      "name": "Facebook",
      "url": "https://facebook.com/example"
    }
  ],
  
  "press_contact": "Press Person",
  
  "projects": [
    {
      "title": "Awesome Game",
      "url": "./products/awesome-game/"
    }
  ],
  
  "contacts": [
    {
      "name": "John Doe",
      "role": "CEO",
      "email": "john@example.com"
    }
  ],
  
  "histories": [
    {
      "header": "Early Days",
      "text": "We started in a garage..."
    }
  ]
}
```

### Product Data

**data.json:**
```json
{
  "type": "product",
  "title": "Awesome Game",
  "website": "https://awesomegame.com",
  "description": "An epic adventure game.",
  
  "release_date": "December 2023",
  "press_copy_request": "contact@example.com",
  
  "platforms": [
    "Windows",
    "macOS",
    "Linux",
    "Steam"
  ],
  
  "prices": [
    {
      "currency": "USD",
      "value": "$19.99"
    },
    {
      "currency": "EUR",
      "value": "€17.99"
    }
  ],
  
  "features": [
    {
      "title": "Engaging Story",
      "description": "Experience an unforgettable narrative..."
    },
    {
      "title": "Beautiful Graphics",
      "description": "Stunning visuals powered by..."
    }
  ],
  
  "videos": [
    {
      "name": "Launch Trailer",
      "youtube": "dQw4w9WgXcQ"
    },
    {
      "name": "Gameplay",
      "vimeo": "123456789"
    }
  ],
  
  "awards": [
    {
      "description": "Best Indie Game 2023",
      "info": "IndieGameFest"
    }
  ],
  
  "quotes": [
    {
      "description": "An absolute masterpiece!",
      "name": "Game Reviewer",
      "website": "GameSite",
      "url": "https://gamesite.com/review"
    }
  ],
  
  "additionals": [
    {
      "title": "Development Time",
      "description": "3 years",
      "url": "https://blog.example.com/post"
    }
  ],
  
  "relations": [
    {
      "type": "dlc",
      "product": "Awesome Game: Extra Content",
      "url": "../awesome-game-dlc/"
    }
  ]
}
```

## Field Reference

### Common Fields (Both Company & Product)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `"company"` or `"product"` |
| `title` | string | Yes | Name of company/product |
| `website` | string | No | Official website URL |
| `description` | string | No | Brief description (or use description.md) |

### Company Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Contact email |
| `phone` | string | Contact phone |
| `address` | string | Physical address |
| `founding_date` | string | When company was founded |
| `press_contact` | string | Press contact name |
| `socials` | array | Social media links |
| `projects` | array | List of products |
| `contacts` | array | Team members |
| `histories` | array | Company history milestones |

### Product Fields

| Field | Type | Description |
|-------|------|-------------|
| `release_date` | string | Release date |
| `press_copy_request` | string | How to request review copies |
| `platforms` | array | Supported platforms |
| `prices` | array | Pricing by currency |
| `features` | array | Game features |
| `videos` | array | Trailers and videos |
| `awards` | array | Awards and nominations |
| `quotes` | array | Press quotes |
| `additionals` | array | Additional info |
| `relations` | array | Related products (DLC, sequels) |

### Socials Object

```json
{
  "name": "Twitter",
  "url": "https://twitter.com/username"
}
```

Supported names: Twitter, Facebook, Instagram, YouTube, Twitch, Discord, etc.

### Video Object

```json
{
  "name": "Video Title",
  "youtube": "video_id",
  "vimeo": "video_id"
}
```

Use either `youtube` or `vimeo`, not both.

### Relations Object

```json
{
  "type": "dlc",
  "product": "Product Name",
  "url": "../product-folder/"
}
```

Supported types: `dlc`, `expansion`, `sequel`, `prequel`

## XML Format (Legacy)

### Company XML

**data.xml:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<company>
  <title>My Awesome Studio</title>
  <website>https://example.com</website>
  <founding-date>January 1, 2015</founding-date>
  
  <description>
    We make awesome games.
  </description>
  
  <social>
    <name>Twitter</name>
    <link>https://twitter.com/example</link>
  </social>
  
  <contact>
    <name>John Doe</name>
    <mail>john@example.com</mail>
  </contact>
</company>
```

### Product XML

**data.xml:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<product>
  <title>Awesome Game</title>
  <website>https://awesomegame.com</website>
  <release-date>December 2023</release-date>
  
  <description>
    An epic adventure game.
  </description>
  
  <platform>
    <name>Windows</name>
    <link>https://store.steampowered.com/...</link>
  </platform>
  
  <price>
    <currency>USD</currency>
    <value>$19.99</value>
  </price>
</product>
```

## Markdown Support

### In JSON Files

Markdown is supported in:
- `description` field
- Any `text` or `description` fields in nested objects

### Separate description.md

Instead of inline descriptions, you can create a separate `description.md` file:

```markdown
# About Our Studio

We create **amazing** games that players love.

## Our Mission

- Make fun games
- Build engaged communities
- Push creative boundaries

Visit our [website](https://example.com) for more!
```

## Images

Place images in the `images/` folder. See [Image Guidelines](./images.md) for details on:
- Required sizes
- Naming conventions
- Supported formats

## Best Practices

1. **Use JSON for new projects** - easier to edit and validate
2. **Use description.md** - better for long-form content
3. **Provide complete data** - fill in all relevant fields
4. **Optimize images** - use appropriate sizes
5. **Test locally** - run `presskit-diy build --watch` to preview

## Validation

presskit.diy validates your data files automatically. Common errors:

- Missing required fields (`type`, `title`)
- Invalid video IDs
- Broken relative URLs
- Missing image files

Run `presskit-diy build` to see validation warnings.

## Examples

See [Examples](./examples.md) for complete, real-world data file samples.

---

**Need help?** Open an issue at [GitHub](https://github.com/saturnosoftware/presskit.diy/issues)
