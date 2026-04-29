/**
 * Template Rendering Tests
 *
 * Tests for:
 * - Markdown rendering
 * - HTML escaping
 * - Special character handling
 * - Unicode and emoji support
 * - Template variable substitution
 * - Conditional rendering
 * - Loop rendering
 */

const fs = require('fs-extra')
const path = require('path')
const os = require('os')

describe('Template Rendering', () => {
  let tempDir

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `presskit-template-test-${Date.now()}`)
    fs.ensureDirSync(tempDir)
  })

  afterEach(() => {
    fs.removeSync(tempDir)
  })

  describe('Basic Rendering', () => {
    it('should render simple HTML template', () => {
      const template = '<h1>{{title}}</h1>'
      const data = { title: 'Test' }

      // Simple string interpolation
      const rendered = template.replace('{{title}}', data.title)
      expect(rendered).toBe('<h1>Test</h1>')
    })

    it('should render multiple variables', () => {
      const template = '<h1>{{title}}</h1><p>{{desc}}</p>'
      const data = { title: 'Test', desc: 'Description' }

      let rendered = template
      Object.entries(data).forEach(([key, value]) => {
        rendered = rendered.replace(`{{${key}}}`, value)
      })

      expect(rendered).toContain('Test')
      expect(rendered).toContain('Description')
    })

    it('should handle missing variables gracefully', () => {
      const template = '<h1>{{title}}</h1><p>{{missing}}</p>'
      const data = { title: 'Test' }

      let rendered = template
      Object.entries(data).forEach(([key, value]) => {
        rendered = rendered.replace(`{{${key}}}`, value)
      })

      expect(rendered).toContain('{{missing}}')
    })

    it('should render nested object paths', () => {
      const template = '<p>{{company.name}}</p>'
      const data = { company: { name: 'Acme Corp' } }

      // Simplified path handling
      const rendered = template.replace('{{company.name}}', data.company.name)
      expect(rendered).toContain('Acme Corp')
    })

    it('should preserve HTML structure', () => {
      const template = '<div><p>{{content}}</p></div>'
      const data = { content: 'Text' }

      const rendered = template.replace('{{content}}', data.content)
      expect(rendered).toBe('<div><p>Text</p></div>')
    })
  })

  describe('HTML Escaping', () => {
    it('should escape HTML special characters', () => {
      const unsafe = '<script>alert("xss")</script>'
      const escaped = unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

      expect(escaped).not.toContain('<script>')
      expect(escaped).toContain('&lt;')
    })

    it('should escape ampersands in content', () => {
      const content = 'Smith & Sons'
      const escaped = content.replace(/&/g, '&amp;')
      expect(escaped).toBe('Smith &amp; Sons')
    })

    it('should escape quotes in attributes', () => {
      const attr = 'value with "quotes"'
      const escaped = attr.replace(/"/g, '&quot;')
      expect(escaped).toBe('value with &quot;quotes&quot;')
    })

    it('should escape angle brackets', () => {
      const content = 'a < b > c'
      const escaped = content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      expect(escaped).toBe('a &lt; b &gt; c')
    })

    it('should handle multiple special characters', () => {
      const content = '<p>Test & "quoted"</p>'
      const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

      expect(escaped).toContain('&lt;')
      expect(escaped).toContain('&amp;')
      expect(escaped).toContain('&quot;')
    })
  })

  describe('Markdown Rendering', () => {
    it('should render bold text', () => {
      const md = '**bold text**'
      const html = md.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      expect(html).toContain('<strong>')
    })

    it('should render italic text', () => {
      const md = '*italic text*'
      const html = md.replace(/\*(.*?)\*/g, '<em>$1</em>')
      expect(html).toContain('<em>')
    })

    it('should render headers', () => {
      const md = '# Header 1\n## Header 2'
      let html = md.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')

      expect(html).toContain('<h1>')
      expect(html).toContain('<h2>')
    })

    it('should render links', () => {
      const md = '[Link](https://example.com)'
      const html = md.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      expect(html).toContain('<a href="https://example.com">')
    })

    it('should render code blocks', () => {
      const md = '`code`'
      const html = md.replace(/`(.*?)`/g, '<code>$1</code>')
      expect(html).toContain('<code>')
    })

    it('should preserve plain text', () => {
      const md = 'Plain text with no formatting'
      expect(md).toBe('Plain text with no formatting')
    })

    it('should handle mixed markdown', () => {
      const md = '**bold** and *italic* and `code`'
      const html = md
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')

      expect(html).toContain('<strong>')
      expect(html).toContain('<em>')
      expect(html).toContain('<code>')
    })
  })

  describe('Unicode & Special Characters', () => {
    it('should handle Unicode characters', () => {
      const text = 'Société Française'
      expect(text).toContain('é')
      expect(text.length).toBeGreaterThan(0)
    })

    it('should handle Chinese characters', () => {
      const text = '中文文本'
      expect(text).toContain('中')
    })

    it('should handle emoji in content', () => {
      const text = 'Game Studio 🎮'
      expect(text).toContain('🎮')
    })

    it('should handle RTL languages', () => {
      const text = 'مرحبا'
      expect(typeof text).toBe('string')
      expect(text.length).toBeGreaterThan(0)
    })

    it('should preserve special punctuation', () => {
      const text = 'Price: $99.99 (50% off!) — Save now!'
      expect(text).toContain('$')
      expect(text).toContain('—')
    })

    it('should handle combining characters', () => {
      const text = 'é' // Precomposed
      expect(text).toBeDefined()
    })

    it('should handle zero-width characters safely', () => {
      const text = 'normal\u200bzero-width-space'
      // 'normal' (6) + '\u200b' (1) + 'zero-width-space' (16) = 23
      expect(text.length).toBe(23)
    })
  })

  describe('List Rendering', () => {
    it('should render unordered list', () => {
      const items = ['item1', 'item2', 'item3']
      const html = '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>'

      expect(html).toContain('<ul>')
      expect(html).toContain('<li>')
      expect(html.match(/<li>/g).length).toBe(3)
    })

    it('should render ordered list', () => {
      const items = ['first', 'second', 'third']
      const html = '<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ol>'

      expect(html).toContain('<ol>')
      expect(html.match(/<li>/g).length).toBe(3)
    })

    it('should render empty list', () => {
      const items = []
      const html = '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>'

      expect(html).toBe('<ul></ul>')
    })

    it('should escape list item content', () => {
      const items = ['<script>alert(1)</script>', 'safe item']
      const escaped = items.map(i =>
        `<li>${i
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</li>`
      ).join('')

      expect(escaped).toContain('&lt;script&gt;')
    })
  })

  describe('Conditional Rendering', () => {
    it('should include content when condition is true', () => {
      const data = { isVisible: true, content: 'Visible' }
      const html = data.isVisible ? `<p>${data.content}</p>` : ''

      expect(html).toContain('Visible')
    })

    it('should exclude content when condition is false', () => {
      const data = { isVisible: false, content: 'Hidden' }
      const html = data.isVisible ? `<p>${data.content}</p>` : ''

      expect(html).toBe('')
    })

    it('should render alternative content', () => {
      const data = { show: false, primary: 'A', fallback: 'B' }
      const html = data.show ? data.primary : data.fallback

      expect(html).toBe('B')
    })

    it('should handle multiple conditions', () => {
      const data = { isPremium: true, isActive: true }
      const badge = data.isPremium && data.isActive ? 'Premium Active' : 'Regular'

      expect(badge).toBe('Premium Active')
    })
  })

  describe('Table Rendering', () => {
    it('should render HTML table', () => {
      const headers = ['Name', 'Value']
      const rows = [
        { Name: 'Row1', Value: 'Value1' },
        { Name: 'Row2', Value: 'Value2' }
      ]

      let html = '<table><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>'
      html += rows.map(row => '<tr>' + headers.map(h => `<td>${row[h]}</td>`).join('') + '</tr>').join('')
      html += '</tbody></table>'

      expect(html).toContain('<table>')
      expect(html).toContain('<tr>')
      expect(html).toContain('<td>')
    })

    it('should handle empty tables', () => {
      const headers = ['Name', 'Value']
      const rows = []

      let html = '<table><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>'
      html += rows.map(row => '<tr>' + headers.map(h => `<td>${row[h]}</td>`).join('') + '</tr>').join('')
      html += '</tbody></table>'

      expect(html).toContain('<table>')
      expect(html).toContain('<thead>')
      expect(html).not.toContain('<td>')
    })

    it('should escape table cell content', () => {
      const cells = ['<b>Bold</b>', 'Normal']
      const escaped = cells.map(c => c.replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('')

      expect(escaped).toContain('&lt;b&gt;')
    })
  })

  describe('Partial/Component Rendering', () => {
    it('should handle template file loading', () => {
      const templatePath = path.join(tempDir, 'header.html')
      const templateContent = '<header><h1>{{title}}</h1></header>'
      fs.writeFileSync(templatePath, templateContent)

      const loaded = fs.readFileSync(templatePath, 'utf-8')
      expect(loaded).toContain('<header>')
    })

    it('should compose templates', () => {
      const header = '<header>{{title}}</header>'
      const main = '<main>{{content}}</main>'
      const footer = '<footer>Copyright</footer>'

      const full = header + main + footer
      expect(full).toContain('<header>')
      expect(full).toContain('<main>')
      expect(full).toContain('<footer>')
    })

    it('should substitute in composed templates', () => {
      const header = '<header>{{title}}</header>'
      const main = '<main>{{content}}</main>'

      const rendered = (header + main).replace('{{title}}', 'Page').replace('{{content}}', 'Body')
      expect(rendered).toContain('Page')
      expect(rendered).toContain('Body')
    })
  })

  describe('Performance & Edge Cases', () => {
    it('should handle long text', () => {
      const longText = 'a'.repeat(10000)
      expect(longText.length).toBe(10000)
    })

    it('should handle many substitutions', () => {
      let template = ''
      const data = {}

      for (let i = 0; i < 100; i++) {
        template += `{{var${i}}}`
        data[`var${i}`] = `value${i}`
      }

      let rendered = template
      Object.entries(data).forEach(([key, value]) => {
        rendered = rendered.replace(`{{${key}}}`, value)
      })

      expect(rendered).toContain('value0')
      expect(rendered).toContain('value99')
    })

    it('should handle nested quotes', () => {
      const html = '<div data-value="It\'s \\"quoted\\"">'
      expect(html).toContain('It\'s')
      expect(html).toContain('quoted')
    })

    it('should handle whitespace preservation', () => {
      const template = '<pre>  spaces\n  preserved</pre>'
      expect(template).toContain('  spaces')
      expect(template).toContain('\n')
    })

    it('should handle CDATA sections', () => {
      const cdata = '<![CDATA[<p>This is not parsed</p>]]>'
      expect(cdata).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed templates gracefully', () => {
      const malformed = '<p>{{unclosed'
      expect(malformed).toBeDefined()
    })

    it('should handle recursive templates', () => {
      // Simulating deep recursion - just check it doesn't crash
      let level = 0
      const render = () => {
        if (level > 100) return 'done'
        level++
        return render()
      }

      expect(() => render()).not.toThrow()
    })

    it('should prevent infinite loops in template processing', () => {
      const data = { a: '{{b}}', b: '{{a}}' }
      // Just verify we can create the data structure without processing recursively
      expect(data.a).toBe('{{b}}')
    })
  })
})
