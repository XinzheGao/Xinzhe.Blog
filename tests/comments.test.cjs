const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createCommentsClient, normalizePostId } = require('../lib/comments')
const config = { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'sb_publishable_test' }
const id = '12345678-1234-1234-1234-123456789abc'

test('public comment queries omit contact details and deletion credentials', async () => {
  const client = createCommentsClient(config, async (url, init) => {
    const params = new URL(url).searchParams
    assert.equal(params.get('post_id'), `eq.${id}`)
    assert.equal(params.get('offset'), '20')
    assert.equal(params.get('limit'), '20')
    assert.equal(params.get('show'), 'eq.true')
    assert.equal(params.get('select'), 'id,post_id,name,comment,created_at,show')
    assert.equal(init.headers.apikey, config.supabaseAnonKey)
    return { ok: true, json: async () => [] }
  })
  await client.list(id.replace(/-/g, ''), 20)
})

test('submission does not allow choosing visibility or timestamps', async () => {
  const client = createCommentsClient(config, async (url, init) => {
    const body = JSON.parse(init.body)
    assert.equal(body.name, 'Alice')
    assert.equal(body.comment, 'Hello')
    assert.equal(body.show, undefined)
    assert.equal(body.created_at, undefined)
    assert.equal(init.headers.Prefer, 'return=minimal')
    return { ok: true, status: 201 }
  })
  await client.submit(id, { id, name: ' Alice ', email: '', comment: ' Hello ', deletionHash: 'a'.repeat(64), show: false })
})

test('deletion uses a header credential and reports denied ownership', async () => {
  const token = 'b'.repeat(64)
  const client = createCommentsClient(config, async (url, init) => {
    assert.equal(new URL(url).searchParams.get('id'), `eq.${id}`)
    assert.equal(new URL(url).searchParams.get('select'), 'id')
    assert.ok(!url.includes(token))
    assert.equal(init.method, 'DELETE')
    assert.equal(init.headers['x-comment-token'], token)
    return { ok: true, json: async () => [] }
  })
  await assert.rejects(client.remove(id, token), /rejected/)
  await assert.rejects(client.remove(id, ''), /Missing/)
})

test('invalid input and privileged API keys never reach the network', async () => {
  assert.throws(() => createCommentsClient({ ...config, supabaseAnonKey: 'sb_secret_test' }), /publishable/)
  assert.throws(() => normalizePostId('not-an-id'), /Invalid/)
  let calls = 0
  const client = createCommentsClient(config, async () => { calls++; throw new Error('unexpected') })
  await assert.rejects(client.submit(id, { id, name: ' ', email: '', comment: 'Hi' }), /Invalid/)
  assert.equal(calls, 0)
})

test('HTTP errors are surfaced rather than reported as successful submissions', async () => {
  const client = createCommentsClient(config, async () => ({ ok: false, status: 403 }))
  await assert.rejects(client.list(id), /403/)
})
