'use strict'

const fs = require('fs')

const assets = require('../lib/assets')

describe('asset paths', () => {
  it.each([
    ['assets folder', assets.assets],
    ['css folder', assets.cssFolder],
    ['company xml template', assets.companyTemplate],
    ['product xml template', assets.productTemplate],
    ['company json template', assets.companyJsonTemplate],
    ['product json template', assets.productJsonTemplate],
    ['company markdown template', assets.companyDescriptionTemplate],
    ['product markdown template', assets.productDescriptionTemplate]
  ])('points to an existing %s', (label, target) => {
    expect(fs.existsSync(target)).toBe(true)
  })

  it('exports the mandatory asset copy list', () => {
    expect(assets.assetsToCopy.length).toBeGreaterThan(0)
  })

  it.each([
    'css/normalize.css',
    'css/print.css',
    'js/hamburger.js',
    'js/imagesloaded.min.js',
    'js/masonry.min.js'
  ])('includes %s in the mandatory asset copy list', (suffix) => {
    expect(assets.assetsToCopy.some(item => item.endsWith(suffix))).toBe(true)
  })

  it('uses "images" as the canonical images folder name', () => {
    expect(assets.imagesFolderName).toBe('images')
  })

  it('lists the supported raster image formats', () => {
    expect(assets.authorizedImageFormats).toEqual(['.jpg', '.jpeg', '.png', '.gif'])
  })

  it.each([
    ['company xml template suffix', assets.companyTemplate, 'company.xml'],
    ['product xml template suffix', assets.productTemplate, 'product.xml'],
    ['company json template suffix', assets.companyJsonTemplate, 'company.json'],
    ['product json template suffix', assets.productJsonTemplate, 'product.json'],
    ['company markdown template suffix', assets.companyDescriptionTemplate, 'company.description.md'],
    ['product markdown template suffix', assets.productDescriptionTemplate, 'product.description.md']
  ])('uses the expected %s', (label, target, suffix) => {
    expect(target.endsWith(suffix)).toBe(true)
  })

  it.each([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif'
  ])('includes %s in authorizedImageFormats', (ext) => {
    expect(assets.authorizedImageFormats).toContain(ext)
  })
})
