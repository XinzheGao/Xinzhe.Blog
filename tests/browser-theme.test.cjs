const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { browserThemeScript } = require('../lib/browserTheme')

function loadPage(dark, savedTheme, storageBlocked = false) {
  const classes = new Set(['site', savedTheme === 'dark' ? 'dark' : 'light'])
  const style = {}
  let stored = savedTheme
  vm.runInNewContext(browserThemeScript, {
    window: { matchMedia(query) {
      assert.equal(query, '(prefers-color-scheme: dark)')
      return { matches: dark }
    } },
    document: { documentElement: { style, classList: {
      remove: (...values) => values.forEach(value => classes.delete(value)),
      add: value => classes.add(value)
    } } },
    localStorage: { setItem(key, value) {
      if (storageBlocked) throw new Error('storage unavailable')
      assert.equal(key, 'theme')
      stored = value
    } }
  })
  return { classes: [...classes], colorScheme: style.colorScheme, stored }
}

test('browser preference wins over every saved manual theme on a new page load', () => {
  for (const saved of [undefined, 'light', 'dark', 'system']) {
    for (const dark of [true, false]) {
      const result = loadPage(dark, saved)
      assert.deepEqual(result.classes, ['site', dark ? 'dark' : 'light'])
      assert.equal(result.colorScheme, dark ? 'dark' : 'light')
      assert.equal(result.stored, 'system')
    }
  }
})

test('blocked local storage still allows the correct browser theme', () => {
  assert.deepEqual(loadPage(true, 'light', true).classes, ['site', 'dark'])
  assert.deepEqual(loadPage(false, 'dark', true).classes, ['site', 'light'])
})
