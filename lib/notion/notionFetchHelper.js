// ISR retains the last successful page when an expired entry cannot refresh.
const cache = new Map()
const pending = new Map()

async function fetchNotionSmart(key, fetcher, { ttl = 60000 } = {}) {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value
  if (pending.has(key)) return pending.get(key)
  const request = Promise.resolve().then(fetcher).then(value => {
    cache.set(key, { value, expiresAt: Date.now() + ttl })
    if (cache.size > 300) cache.delete(cache.keys().next().value)
    return value
  }).finally(() => pending.delete(key))
  pending.set(key, request)
  return request
}

module.exports = { fetchNotionSmart }
