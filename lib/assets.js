'use strict'

const path = require('upath')

// -------------------------------------------------------------
// Constants.
// -------------------------------------------------------------

const assets = path.join(__dirname, '../assets')

const cssFolder = path.join(assets, 'css')

const assetsToCopy = [
  path.join(assets, 'css/normalize.css'),
  path.join(assets, 'css/print.css'),
  path.join(assets, 'js/hamburger.js'),
  path.join(assets, 'js/imagesloaded.min.js'),
  path.join(assets, 'js/masonry.min.js')
]

const companyTemplate = path.join(assets, 'templates/company.xml')
const productTemplate = path.join(assets, 'templates/product.xml')
const companyJsonTemplate = path.join(assets, 'templates/company.json')
const productJsonTemplate = path.join(assets, 'templates/product.json')
const companyDescriptionTemplate = path.join(assets, 'templates/company.description.md')
const productDescriptionTemplate = path.join(assets, 'templates/product.description.md')

const imagesFolderName = 'images'
const authorizedImageFormats = ['.jpg', '.jpeg', '.png', '.gif']

// -------------------------------------------------------------
// Exports.
// -------------------------------------------------------------

module.exports = {
  assets,
  cssFolder,
  assetsToCopy,
  imagesFolderName,
  authorizedImageFormats,
  companyTemplate,
  productTemplate,
  companyJsonTemplate,
  productJsonTemplate,
  companyDescriptionTemplate,
  productDescriptionTemplate
}
