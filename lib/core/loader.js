'use strict'

const fs = require('fs')
const path = require('upath')
const parser = require('./parser')

// -------------------------------------------------------------
// Constants.
// -------------------------------------------------------------

// The XML parser can't understand automatically that a list of
// XML children is an array.
//
// So it generates aberrations like:
//
//   "awards": {
//     "award": [
//       {"description": ""},
//       {"description": ""}
//     ]
//   }
//
// Moreover, if there's only one element, it will not put it in
// an array. ie., if there's one award in the array above, the result
// is going to be:
//
//   "awards": {
//     "award": {"description": ""}
//   }
//
// But we want an array every time.
//
// The keys below are the arrays that need to be normalized.
const keysToNormalize = [
  // Remember, we convert kebab-case to camelCase,
  // so release-dates is converted to releaseDates.
  'releaseDates',
  'partners',
  'platforms',
  'prices',
  'relations',
  'features',
  'socials',
  'histories',
  'trailers',
  'awards',
  'quotes',
  'additionals',
  'abouts',
  'credits',
  'contacts'
]

const tagsToClean = [
  '<br>',
  '<br />',
  '<br/>',
  '<hr>',
  '<hr />',
  '<hr/>',
  '<strong>',
  '</strong>',
  '<em>',
  '</em>',
  '<i>',
  '</i>',
  '<b>',
  '</b>'
]

// -------------------------------------------------------------
// Module.
// -------------------------------------------------------------

function loadDataFile (filename) {
  const ext = path.extname(filename)
  const source = fs.readFileSync(filename, 'utf-8')

  if (ext === '.json') {
    try {
      const data = loadJSON(source)
      return refineLoadedData(data, {
        baseDir: path.dirname(filename),
        resolveMarkdown: true
      })
    } catch (err) {
      throw new Error(`Failed to load JSON file "${filename}": ${err.message}`)
    }
  }

  let xml = source

  // Remove inline tags.
  xml = cleanTokens(tagsToClean, xml)

  const rawJSON = parser.parseXML(xml)

  // Normalize some keys.
  const normalized = normalizeKeys(keysToNormalize, rawJSON)
  return refineLoadedData(normalized)
}

function loadJSON (source) {
  const data = parseJSONC(source)

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('JSON root must be an object')
  }

  if (data.type !== 'company' && data.type !== 'product') {
    throw new Error('Unrecognized JSON file, expected "company" or "product" type')
  }

  if (!data.title || typeof data.title !== 'string') {
    throw new Error('JSON file must define a string "title"')
  }

  return normalizeJSON(data)
}

function parseJSONC (source) {
  const withoutComments = stripJSONComments(source)
  const normalized = stripTrailingCommas(withoutComments)
  return JSON.parse(normalized)
}

function stripJSONComments (source) {
  let result = ''
  let inString = false
  let stringDelimiter = '"'
  let isEscaped = false

  for (let i = 0; i < source.length; i++) {
    const current = source[i]
    const next = source[i + 1]

    if (inString) {
      result += current

      if (isEscaped) {
        isEscaped = false
      } else if (current === '\\') {
        isEscaped = true
      } else if (current === stringDelimiter) {
        inString = false
      }

      continue
    }

    if (current === '"' || current === '\'') {
      inString = true
      stringDelimiter = current
      result += current
      continue
    }

    if (current === '/' && next === '/') {
      i += 2
      while (i < source.length && source[i] !== '\n') {
        i++
      }

      if (i < source.length) {
        result += '\n'
      }

      continue
    }

    if (current === '/' && next === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') {
          result += '\n'
        }
        i++
      }

      i++
      continue
    }

    result += current
  }

  return result
}

function stripTrailingCommas (source) {
  let result = ''
  let inString = false
  let stringDelimiter = '"'
  let isEscaped = false

  for (let i = 0; i < source.length; i++) {
    const current = source[i]

    if (inString) {
      result += current

      if (isEscaped) {
        isEscaped = false
      } else if (current === '\\') {
        isEscaped = true
      } else if (current === stringDelimiter) {
        inString = false
      }

      continue
    }

    if (current === '"' || current === '\'') {
      inString = true
      stringDelimiter = current
      result += current
      continue
    }

    if (current === ',') {
      let lookAhead = i + 1
      while (lookAhead < source.length && /\s/.test(source[lookAhead])) {
        lookAhead++
      }

      if (source[lookAhead] === '}' || source[lookAhead] === ']') {
        continue
      }
    }

    result += current
  }

  return result
}

function normalizeJSON (data) {
  validateArrayBackedFields(data)
  return data
}

function refineLoadedData (data, options = {}) {
  validateLoadedDataShape(data)
  validateArrayBackedFields(data)

  if (options.resolveMarkdown) {
    return resolveMarkdownReferences(data, options.baseDir)
  }

  return data
}

function validateLoadedDataShape (data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Loaded data must be an object')
  }

  if (data.type !== 'company' && data.type !== 'product') {
    throw new Error('Loaded data must define type "company" or "product"')
  }

  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Loaded data must define a string "title"')
  }
}

function validateArrayBackedFields (data) {
  keysToNormalize.forEach(key => {
    if (key in data && !Array.isArray(data[key])) {
      throw new Error(`Field "${key}" must be an array`)
    }
  })

  if (data.address && 'line' in data.address && !Array.isArray(data.address.line)) {
    throw new Error('Field "address.line" must be an array')
  }
}

function resolveMarkdownReferences (data, baseDir) {
  resolveRichTextField(data, 'description', baseDir, 'description')
  resolveRichTextField(data, 'history', baseDir, 'history')

  if (Array.isArray(data.histories)) {
    data.histories.forEach(item => resolveRichTextField(item, 'text', baseDir, 'histories[].text'))
  }

  if (Array.isArray(data.features)) {
    data.features = data.features.map(item => resolveRichTextValue(item, baseDir, 'features[]'))
  }

  resolveObjectArrayField(data.abouts, 'description', baseDir, 'abouts[].description')
  resolveObjectArrayField(data.awards, 'description', baseDir, 'awards[].description')
  resolveObjectArrayField(data.quotes, 'description', baseDir, 'quotes[].description')
  resolveObjectArrayField(data.additionals, 'description', baseDir, 'additionals[].description')
  resolveObjectArrayField(data.credits, 'role', baseDir, 'credits[].role')

  return data
}

function resolveObjectArrayField (items, field, baseDir, fieldPath) {
  if (!Array.isArray(items)) return

  items.forEach(item => resolveRichTextField(item, field, baseDir, fieldPath))
}

function resolveRichTextField (obj, field, baseDir, fieldPath) {
  if (!obj || !(field in obj)) return
  obj[field] = resolveRichTextValue(obj[field], baseDir, fieldPath)
}

function resolveRichTextValue (value, baseDir, fieldPath) {
  if (typeof value === 'string') {
    return hasMarkdownSyntax(value) ? renderMarkdown(value) : value
  }

  if (!isMarkdownReference(value)) {
    throw new Error(`Invalid markdown reference in "${fieldPath}"`)
  }

  const target = path.join(baseDir, value.markdownFile)
  if (!fs.existsSync(target)) {
    throw new Error(`Markdown file not found: "${target}"`)
  }

  return renderMarkdown(fs.readFileSync(target, 'utf-8'))
}

function isMarkdownReference (value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.markdownFile === 'string' &&
    value.markdownFile.trim() !== ''
  )
}

function renderMarkdown (source) {
  const normalized = (source || '').replace(/\r\n/g, '\n').trim()
  if (!normalized) return ''

  const lines = normalized.split('\n')
  const isList = lines.every(line => line.trim().startsWith('- '))

  if (isList) {
    const items = lines
      .map(line => line.trim().replace(/^- /, ''))
      .map(renderInlineMarkdown)
      .map(item => `<li>${item}</li>`)
      .join('')

    return `<ul>${items}</ul>`
  }

  return normalized
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${renderInlineMarkdown(paragraph)}</p>`)
    .join('')
}

function renderInlineMarkdown (source) {
  return source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

function hasMarkdownSyntax (source) {
  return /\*\*.+?\*\*|\*.+?\*|^\s*-\s+/m.test(source)
}

function cleanTokens (tokens, str) {
  const regex = new RegExp(tokens.join('|'), 'gi')
  return str.replace(regex, '')
}

// TODO: this should probably be done as a custom tag processor with xml2js.
function normalizeKeys (keys, json) {
  Object.keys(json)
    .filter(k => keys.includes(k))
    .forEach(k => {
      json[k] = normalize(json[k])
    })

  return json
}

function normalize (obj) {
  const keys = Object.keys(obj)

  // Ignore if there're more than one key or 0 in the object.
  if (keys.length === 0 || keys.length > 1) return obj

  // Get the content of the only key of the object.
  const data = obj[keys[0]]

  // An array? Return it.
  if (Array.isArray(data)) {
    return data
  }

  // Otherwise, wrap in an array.
  return [data]
}

// -------------------------------------------------------------
// Exports.
// -------------------------------------------------------------

module.exports = {
  loadDataFile,

  __cleanTokens: cleanTokens,
  __normalizeKeys: normalizeKeys,
  __normalize: normalize,
  __loadJSON: loadJSON,
  __parseJSONC: parseJSONC,
  __stripJSONComments: stripJSONComments,
  __stripTrailingCommas: stripTrailingCommas,
  __normalizeJSON: normalizeJSON,
  __refineLoadedData: refineLoadedData,
  __resolveMarkdownReferences: resolveMarkdownReferences,
  __renderMarkdown: renderMarkdown,
  __hasMarkdownSyntax: hasMarkdownSyntax
}
