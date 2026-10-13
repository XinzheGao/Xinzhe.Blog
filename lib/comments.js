const PUBLIC_FIELDS = 'id,post_id,name,comment,created_at,show'

function normalizePostId(value) {
  const compact = String(value || '').replace(/-/g, '')
  if (!/^[0-9a-f]{32}$/i.test(compact)) throw new Error('Invalid article ID')
  return compact.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5').toLowerCase()
}

function createCommentsClient({ supabaseUrl, supabaseAnonKey }, fetcher = fetch) {
  const url = new URL(supabaseUrl)
  if (url.protocol !== 'https:' || !supabaseAnonKey?.startsWith('sb_publishable_')) {
    throw new Error('Comments require an HTTPS URL and a publishable key')
  }
  const endpoint = `${url.origin}/rest/v1/comments`
  async function request(query, init = {}) {
    const response = await fetcher(`${endpoint}?${query}`, {
      ...init, signal: init.signal || AbortSignal.timeout(15000),
      headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json', ...init.headers }
    })
    if (!response.ok) throw new Error(`Comments request failed (${response.status})`)
    if (response.status === 204 || init.headers?.Prefer === 'return=minimal') return null
    return response.json()
  }
  return {
    async list(postId, offset = 0, signal) {
      const query = new URLSearchParams({ select: PUBLIC_FIELDS, post_id: `eq.${normalizePostId(postId)}`, show: 'eq.true', order: 'created_at.desc,id.desc', limit: '20', offset: String(offset) })
      return request(query, { signal })
    },
    async submit(postId, { id, name, email, comment, deletionHash }) {
      if (!name.trim() || name.trim().length > 80 || !comment.trim() || comment.trim().length > 5000 || email.trim().length > 254) throw new Error('Invalid comment fields')
      return request('', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
        id: normalizePostId(id), post_id: normalizePostId(postId), name: name.trim(), email: email.trim(), comment: comment.trim(), deletion_hash: deletionHash
      }) })
    },
    async remove(id, token) {
      if (!/^[0-9a-f]{64}$/.test(token)) throw new Error('Missing deletion token')
      const query = new URLSearchParams({ id: `eq.${normalizePostId(id)}`, select: 'id' })
      const rows = await request(query, { method: 'DELETE', headers: { Prefer: 'return=representation', 'x-comment-token': token } })
      if (!rows?.length) throw new Error('Comment missing or deletion token rejected')
    }
  }
}
module.exports = { PUBLIC_FIELDS, normalizePostId, createCommentsClient }
