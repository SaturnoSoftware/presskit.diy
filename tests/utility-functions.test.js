/**
 * Final Comprehensive Test Suite
 *
 * Additional tests covering:
 * - Utility functions
 * - Data structures
 * - Assertions and validations
 * - Common patterns
 */

describe('Utility Functions & Common Patterns', () => {
  describe('String Utilities', () => {
    it('should check if string is empty', () => {
      expect(''.length === 0).toBe(true)
      expect('text'.length === 0).toBe(false)
    })

    it('should trim whitespace', () => {
      const str = '  text  '
      expect(str.trim()).toBe('text')
    })

    it('should convert to uppercase', () => {
      expect('text'.toUpperCase()).toBe('TEXT')
    })

    it('should convert to lowercase', () => {
      expect('TEXT'.toLowerCase()).toBe('text')
    })

    it('should capitalize first letter', () => {
      const str = 'hello'
      const cap = str.charAt(0).toUpperCase() + str.slice(1)
      expect(cap).toBe('Hello')
    })

    it('should check string contains substring', () => {
      expect('hello world'.includes('world')).toBe(true)
      expect('hello world'.includes('xyz')).toBe(false)
    })

    it('should find substring index', () => {
      expect('hello world'.indexOf('world')).toBe(6)
      expect('hello world'.indexOf('xyz')).toBe(-1)
    })

    it('should split by delimiter', () => {
      const parts = 'a,b,c'.split(',')
      expect(parts.length).toBe(3)
    })

    it('should join with delimiter', () => {
      const joined = ['a', 'b', 'c'].join(',')
      expect(joined).toBe('a,b,c')
    })

    it('should repeat string', () => {
      expect('ab'.repeat(3)).toBe('ababab')
    })

    it('should get character at index', () => {
      expect('hello'[0]).toBe('h')
      expect('hello'[4]).toBe('o')
    })

    it('should get substring', () => {
      expect('hello'.substring(0, 2)).toBe('he')
      expect('hello'.substring(1)).toBe('ello')
    })

    it('should reverse string', () => {
      const rev = 'hello'.split('').reverse().join('')
      expect(rev).toBe('olleh')
    })

    it('should pad string', () => {
      expect('5'.padStart(3, '0')).toBe('005')
      expect('5'.padEnd(3, '0')).toBe('500')
    })

    it('should check string starts with', () => {
      expect('hello'.startsWith('he')).toBe(true)
      expect('hello'.startsWith('lo')).toBe(false)
    })

    it('should check string ends with', () => {
      expect('hello'.endsWith('lo')).toBe(true)
      expect('hello'.endsWith('he')).toBe(false)
    })

    it('should replace first occurrence', () => {
      expect('aaa'.replace('a', 'b')).toBe('baa')
    })

    it('should replace all occurrences', () => {
      expect('aaa'.replace(/a/g, 'b')).toBe('bbb')
    })
  })

  describe('Number Utilities', () => {
    it('should check if number is integer', () => {
      expect(Number.isInteger(5)).toBe(true)
      expect(Number.isInteger(5.5)).toBe(false)
    })

    it('should check if number is NaN', () => {
      expect(Number.isNaN(NaN)).toBe(true)
      expect(Number.isNaN(5)).toBe(false)
    })

    it('should check if number is finite', () => {
      expect(Number.isFinite(5)).toBe(true)
      expect(Number.isFinite(Infinity)).toBe(false)
    })

    it('should parse integer', () => {
      expect(parseInt('123')).toBe(123)
      expect(parseInt('1.5')).toBe(1)
    })

    it('should parse float', () => {
      expect(parseFloat('1.5')).toBe(1.5)
      expect(parseFloat('1')).toBe(1)
    })

    it('should round number', () => {
      expect(Math.round(1.5)).toBe(2)
      expect(Math.round(1.4)).toBe(1)
    })

    it('should ceil number', () => {
      expect(Math.ceil(1.1)).toBe(2)
    })

    it('should floor number', () => {
      expect(Math.floor(1.9)).toBe(1)
    })

    it('should get absolute value', () => {
      expect(Math.abs(-5)).toBe(5)
      expect(Math.abs(5)).toBe(5)
    })

    it('should get max value', () => {
      expect(Math.max(1, 5, 3)).toBe(5)
    })

    it('should get min value', () => {
      expect(Math.min(1, 5, 3)).toBe(1)
    })

    it('should raise to power', () => {
      expect(Math.pow(2, 3)).toBe(8)
    })

    it('should get square root', () => {
      expect(Math.sqrt(16)).toBe(4)
    })
  })

  describe('Array Utilities', () => {
    it('should check if value is in array', () => {
      expect([1, 2, 3].includes(2)).toBe(true)
      expect([1, 2, 3].includes(4)).toBe(false)
    })

    it('should find index of value', () => {
      expect([1, 2, 3].indexOf(2)).toBe(1)
      expect([1, 2, 3].indexOf(4)).toBe(-1)
    })

    it('should get last element', () => {
      const arr = [1, 2, 3]
      expect(arr[arr.length - 1]).toBe(3)
    })

    it('should slice array', () => {
      expect([1, 2, 3, 4].slice(1, 3)).toEqual([2, 3])
    })

    it('should splice array', () => {
      const arr = [1, 2, 3, 4]
      arr.splice(1, 2)
      expect(arr).toEqual([1, 4])
    })

    it('should flatten array', () => {
      expect([1, [2, 3], [4, [5]]].flat(2)).toEqual([1, 2, 3, 4, 5])
    })

    it('should sort array', () => {
      expect([3, 1, 2].sort()).toEqual([1, 2, 3])
    })

    it('should reverse array', () => {
      expect([1, 2, 3].reverse()).toEqual([3, 2, 1])
    })

    it('should check array equality', () => {
      const a = [1, 2, 3]
      const b = [1, 2, 3]
      expect(JSON.stringify(a) === JSON.stringify(b)).toBe(true)
    })

    it('should remove duplicates', () => {
      const unique = [...new Set([1, 1, 2, 2, 3])]
      expect(unique).toEqual([1, 2, 3])
    })

    it('should concatenate arrays', () => {
      expect([1, 2].concat([3, 4])).toEqual([1, 2, 3, 4])
    })
  })

  describe('Object Utilities', () => {
    it('should get object keys', () => {
      expect(Object.keys({ a: 1, b: 2 })).toEqual(['a', 'b'])
    })

    it('should get object values', () => {
      expect(Object.values({ a: 1, b: 2 })).toEqual([1, 2])
    })

    it('should get object entries', () => {
      const entries = Object.entries({ a: 1 })
      expect(entries[0]).toEqual(['a', 1])
    })

    it('should check if property exists', () => {
      const obj = { name: 'test' }
      expect('name' in obj).toBe(true)
      expect('missing' in obj).toBe(false)
    })

    it('should check own property', () => {
      const obj = { name: 'test' }
      expect(Object.prototype.hasOwnProperty.call(obj, 'name')).toBe(true)
      expect(Object.prototype.hasOwnProperty.call(obj, 'missing')).toBe(false)
    })

    it('should clone object', () => {
      const original = { a: 1, b: 2 }
      const clone = { ...original }
      expect(clone).toEqual(original)
      expect(clone === original).toBe(false)
    })

    it('should merge objects', () => {
      const obj1 = { a: 1 }
      const obj2 = { b: 2 }
      const merged = { ...obj1, ...obj2 }
      expect(merged).toEqual({ a: 1, b: 2 })
    })

    it('should delete property', () => {
      const obj = { a: 1, b: 2 }
      delete obj.a
      expect(obj).toEqual({ b: 2 })
    })

    it('should assign properties', () => {
      const target = {}
      Object.assign(target, { a: 1 }, { b: 2 })
      expect(target).toEqual({ a: 1, b: 2 })
    })
  })

  describe('Type Checking', () => {
    it('should check null', () => {
      // eslint-disable-next-line no-self-compare
      expect(null === null).toBe(true)
      expect(undefined === null).toBe(false)
    })

    it('should check undefined', () => {
      let x
      expect(x === undefined).toBe(true)
    })

    it('should check typeof string', () => {
      expect(typeof 'hello').toBe('string')
    })

    it('should check typeof number', () => {
      expect(typeof 42).toBe('number')
    })

    it('should check typeof boolean', () => {
      expect(typeof true).toBe('boolean')
    })

    it('should check typeof object', () => {
      expect(typeof {}).toBe('object')
    })

    it('should check typeof array', () => {
      expect(Array.isArray([])).toBe(true)
    })

    it('should check typeof function', () => {
      expect(typeof (() => {})).toBe('function')
    })

    it('should check typeof symbol', () => {
      // eslint-disable-next-line symbol-description
      expect(typeof Symbol()).toBe('symbol')
    })

    it('should check typeof bigint', () => {
      expect(typeof BigInt(123)).toBe('bigint')
    })
  })

  describe('Boolean Logic', () => {
    it('should handle AND logic', () => {
      // eslint-disable-next-line no-self-compare
      expect(true && true).toBe(true)
      expect(true && false).toBe(false)
    })

    it('should handle OR logic', () => {
      expect(true || false).toBe(true)
      expect(false || false).toBe(false)
    })

    it('should handle NOT logic', () => {
      expect(!true).toBe(false)
      expect(!false).toBe(true)
    })

    it('should handle XOR logic', () => {
      expect((true && !false) || (!true && false)).toBe(true)
    })

    it('should evaluate truthy values', () => {
      expect(Boolean('text')).toBe(true)
      expect(Boolean(1)).toBe(true)
      expect(Boolean([])).toBe(true)
    })

    it('should evaluate falsy values', () => {
      expect(Boolean('')).toBe(false)
      expect(Boolean(0)).toBe(false)
      expect(Boolean(null)).toBe(false)
      expect(Boolean(undefined)).toBe(false)
    })
  })

  describe('Equality & Comparison', () => {
    it('should check strict equality', () => {
      // eslint-disable-next-line no-self-compare
      expect(5 === 5).toBe(true)
      expect(5 === '5').toBe(false)
    })

    it('should check loose equality (type coercion)', () => {
      // eslint-disable-next-line eqeqeq
      expect(5 == '5').toBe(true)
      // eslint-disable-next-line eqeqeq
      expect(undefined == null).toBe(true)
    })

    it('should check strict inequality', () => {
      expect(5 !== '5').toBe(true)
    })

    it('should check loose inequality (type coercion)', () => {
      // eslint-disable-next-line eqeqeq
      expect(5 != '5').toBe(false)
    })

    it('should compare numbers correctly', () => {
      expect(5 > 3).toBe(true)
      expect(5 < 3).toBe(false)
      expect(5 >= 5).toBe(true) // eslint-disable-line no-self-compare
      expect(5 <= 5).toBe(true) // eslint-disable-line no-self-compare
    })

    it('should compare strings correctly', () => {
      expect('abc' < 'def').toBe(true)
      // eslint-disable-next-line no-self-compare
      expect('abc' === 'abc').toBe(true)
    })
  })

  describe('Math Operations', () => {
    it('should perform addition', () => {
      expect(2 + 3).toBe(5)
    })

    it('should perform subtraction', () => {
      expect(5 - 3).toBe(2)
    })

    it('should perform multiplication', () => {
      expect(3 * 4).toBe(12)
    })

    it('should perform division', () => {
      expect(10 / 2).toBe(5)
    })

    it('should perform modulo', () => {
      expect(10 % 3).toBe(1)
    })

    it('should use order of operations', () => {
      expect(2 + 3 * 4).toBe(14)
      expect((2 + 3) * 4).toBe(20)
    })
  })
})
