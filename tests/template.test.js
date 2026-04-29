'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const handlebars = require('handlebars')

const config = require('../lib/config')
const console = require('../lib/helpers/color-console')
const { __registerHelpers: registerHelpers } = require('../lib/core/template')

// -------------------------------------------------------------
// Tests.
// -------------------------------------------------------------

describe('template helpers', () => {
  let tempDir

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'presskit-template-test-'))
    registerHelpers(tempDir)
  })

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  afterEach(() => {
    console.warn.mockRestore()
    console.error.mockRestore()
  })

  it('renders trusted rich text without escaping HTML', () => {
    const template = handlebars.compile('{{richText content}}')

    const html = template({
      content: '<p><strong>Bold</strong> text</p>'
    })

    expect(html).toBe('<p><strong>Bold</strong> text</p>')
  })

  it('renders an empty string for missing rich text', () => {
    const template = handlebars.compile('{{richText content}}')

    const html = template({})

    expect(html).toBe('')
  })

  it('keeps plain handlebars escaping unchanged for normal fields', () => {
    const template = handlebars.compile('{{content}}')

    const html = template({
      content: '<p><strong>Bold</strong> text</p>'
    })

    expect(html).toBe('&lt;p&gt;&lt;strong&gt;Bold&lt;/strong&gt; text&lt;/p&gt;')
  })

  it('formats urls with prettyURL', () => {
    const template = handlebars.compile('{{prettyURL link}}')

    expect(template({ link: 'https://www.example.com/path/to/page' })).toBe('example.com/path/to/page')
  })

  it('returns the original value when prettyURL receives an invalid url', () => {
    const template = handlebars.compile('{{prettyURL link}}')

    expect(template({ link: 'not a url' })).toBe('not a url')
  })

  it('keeps query strings out of prettyURL output', () => {
    const template = handlebars.compile('{{prettyURL link}}')

    expect(template({ link: 'https://www.example.com/path/to/page?ref=test' })).toBe('example.com/path/to/page')
  })

  it('extracts domains with domainURL', () => {
    const template = handlebars.compile('{{domainURL link}}')

    expect(template({ link: 'https://www.example.com/path/to/page' })).toBe('example.com')
  })

  it('returns the original value when domainURL receives an invalid url', () => {
    const template = handlebars.compile('{{domainURL link}}')

    expect(template({ link: 'not a url' })).toBe('not a url')
  })

  it('keeps subdomains when extracting a domain url', () => {
    const template = handlebars.compile('{{domainURL link}}')

    expect(template({ link: 'https://games.example.com/path/to/page' })).toBe('games.example.com')
  })

  it('removes index.html from links when pretty links are enabled', () => {
    config.commands.build = { prettyLinks: true }
    const template = handlebars.compile('{{permalink link}}')

    expect(template({ link: '/games/test/index.html' })).toBe('/games/test/')
  })

  it('keeps links unchanged when pretty links are disabled', () => {
    config.commands.build = { prettyLinks: false }
    const template = handlebars.compile('{{permalink link}}')

    expect(template({ link: '/games/test/index.html' })).toBe('/games/test/index.html')
  })

  it('keeps non-index links unchanged when pretty links are enabled', () => {
    config.commands.build = { prettyLinks: true }
    const template = handlebars.compile('{{permalink link}}')

    expect(template({ link: '/games/test/trailer.html' })).toBe('/games/test/trailer.html')
  })

  it('returns the basename without extension', () => {
    const template = handlebars.compile('{{basename name}}')

    expect(template({ name: 'header.png' })).toBe('header')
  })

  it('returns the basename of nested paths', () => {
    const template = handlebars.compile('{{basename name}}')

    expect(template({ name: 'wallpapers/header.final.png' })).toBe('header.final')
  })

  it('trims surrounding whitespace', () => {
    const template = handlebars.compile('{{trim content}}')

    expect(template({ content: '  padded  ' })).toBe('padded')
  })

  it('trims non-string values after coercion', () => {
    const template = handlebars.compile('{{trim content}}')

    expect(template({ content: 42 })).toBe('42')
  })

  it('returns the thumbnail path when a thumbnail exists', () => {
    fs.mkdirSync(path.join(tempDir, 'images'), { recursive: true })
    fs.writeFileSync(path.join(tempDir, 'images', 'shot.png.thumb.jpg'), 'thumb')

    const template = handlebars.compile('{{thumbOrImage image}}')

    expect(template({ image: 'shot.png' })).toBe('images/shot.png.thumb.jpg')
  })

  it('returns the original image path when a thumbnail does not exist', () => {
    const template = handlebars.compile('{{thumbOrImage image}}')

    expect(template({ image: 'missing.png' })).toBe('images/missing.png')
  })

  it('returns the nested thumbnail path when a nested thumbnail exists', () => {
    fs.mkdirSync(path.join(tempDir, 'images', 'wallpapers'), { recursive: true })
    fs.writeFileSync(path.join(tempDir, 'images', 'wallpapers', 'shot.png.thumb.jpg'), 'thumb')

    const template = handlebars.compile('{{thumbOrImage image}}')

    expect(template({ image: 'wallpapers/shot.png' })).toBe('images/wallpapers/shot.png.thumb.jpg')
  })

  it('returns raw string content unchanged with rawText', () => {
    const template = handlebars.compile('{{rawText content}}')

    expect(template({ content: 'Plain text' })).toBe('Plain text')
  })

  it('returns undefined with rawText when the value is missing', () => {
    const template = handlebars.compile('{{rawText content}}')

    expect(template({})).toBe('')
  })

  it('recovers text content from XML-shaped rich text objects with rawText', () => {
    const template = handlebars.compile('{{rawText content}}')

    expect(template({
      content: {
        _: 'Recovered'
      }
    })).toBe('Recovered')
  })

  it('warns when rawText receives an object instead of a string', () => {
    const template = handlebars.compile('{{rawText content}}')

    template({
      content: {
        _: 'Recovered'
      }
    })

    expect(console.warn).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })

  it('renders nested html with richText unchanged', () => {
    const template = handlebars.compile('{{richText content}}')

    expect(template({ content: '<div class="hero">Launch</div>' })).toBe('<div class="hero">Launch</div>')
  })
})
