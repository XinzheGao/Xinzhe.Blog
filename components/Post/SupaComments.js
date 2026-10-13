import BLOG from '@/blog.config'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { createCommentsClient, normalizePostId } from '@/lib/comments'

const copy = {
  zh: ['评论', '昵称', '联系方式（可选，不公开）', '评论内容', '提交', '删除', '确定删除这条评论吗？', '加载更多', '重试', '还没有评论。', '操作失败，请重试。', '请允许浏览器存储，才能保存删除凭证。', '评论已发布。', '评论直接公开。删除凭证保存在当前浏览器；换设备或清除浏览器数据后，请联系博主删除。', '加载中…'],
  en: ['Comments', 'Name', 'Contact (optional, private)', 'Comment', 'Submit', 'Delete', 'Delete this comment?', 'Load more', 'Retry', 'No comments yet.', 'Please try again.', 'Allow browser storage to save your deletion token.', 'Comment published.', 'Comments are public immediately. Deletion tokens stay in this browser. After switching devices or clearing browser data, contact the author to delete your comment.', 'Loading…'],
  ja: ['コメント', '名前', '連絡先（任意・非公開）', 'コメント内容', '送信', '削除', 'このコメントを削除しますか？', 'もっと見る', '再試行', 'コメントはまだありません。', '再度お試しください。', '削除用の情報を保存できるよう、ブラウザーの保存を許可してください。', '公開しました。', 'コメントはすぐに公開されます。削除用の情報はこのブラウザーに保存されます。端末の変更やデータの消去後は、管理者に削除を依頼してください。', '読み込み中…']
}
const inputClass = 'w-full rounded-lg bg-gray-100 px-4 py-3 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
const buttonClass = 'rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600'

export default function SupaComments({ postId }) {
  const { locale } = useRouter()
  const t = copy[locale] || copy.zh
  const client = useMemo(() => createCommentsClient(BLOG.comment.supaCommentsConfig), [])
  const storageKey = `blog-comment-tokens:${BLOG.comment.supaCommentsConfig.supabaseUrl}:${normalizePostId(postId)}`
  const [comments, setComments] = useState([])
  const [tokens, setTokens] = useState({})
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ name: '', email: '', comment: '' })

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) setTokens(saved)
    } catch { /* Reading comments does not require local storage. */ }
    const controller = new AbortController()
    client.list(postId, 0, controller.signal).then(rows => {
      setComments(rows)
      setHasMore(rows.length === 20)
    }).catch(() => { if (!controller.signal.aborted) setError(t[10]) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [client, postId, storageKey, t])

  async function reload(append = false) {
    setLoading(true)
    setError('')
    try {
      const rows = await client.list(postId, append ? comments.length : 0)
      setComments(current => append ? [...current, ...rows.filter(row => !current.some(item => item.id === row.id))] : rows)
      setHasMore(rows.length === 20)
    } catch { setError(t[10]) } finally { setLoading(false) }
  }

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('')
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
      const id = crypto.randomUUID()
      const deletionHash = Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('')
      // Save ownership before sending; a timeout must not lose the deletion token.
      let nextTokens
      try {
        nextTokens = { ...JSON.parse(localStorage.getItem(storageKey) || '{}'), [id]: token }
        localStorage.setItem(storageKey, JSON.stringify(nextTokens))
      } catch { setError(t[11]); return }
      setTokens(nextTokens)
      await client.submit(postId, { ...form, id, deletionHash })
      setForm({ name: '', email: '', comment: '' })
      setNotice(t[12])
      await reload()
    } catch { setError(t[10]); await reloadAfterFailure() } finally { setBusy(false) }
  }

  async function reloadAfterFailure() {
    // A lost response may follow a successful insert. Display the latest records.
    try { const rows = await client.list(postId); setComments(rows); setHasMore(rows.length === 20) } catch { /* Keep the original failure message. */ }
  }

  async function remove(id) {
    if (busy || !window.confirm(t[6])) return
    setBusy(true)
    setError('')
    try {
      await client.remove(id, tokens[id])
      setComments(current => current.filter(row => row.id !== id))
      const nextTokens = { ...tokens }
      delete nextTokens[id]
      setTokens(nextTokens)
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
        delete saved[id]
        localStorage.setItem(storageKey, JSON.stringify(saved))
      } catch { /* The server deletion has already succeeded. */ }
    } catch { setError(t[10]) } finally { setBusy(false) }
  }

  return <section aria-label={t[0]} className='mx-auto mt-10 max-w-screen-md'>
    <h2 className='mb-5 text-xl font-semibold'>{t[0]}</h2>
    <form onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
      <label><span className='mb-1 block text-sm'>{t[1]}</span><input required maxLength={80} autoComplete='nickname' className={inputClass} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      <label><span className='mb-1 block text-sm'>{t[2]}</span><input maxLength={254} className={inputClass} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
      <label className='sm:col-span-2'><span className='mb-1 block text-sm'>{t[3]}</span><textarea required maxLength={5000} rows={5} className={inputClass} value={form.comment} onChange={event => setForm({ ...form, comment: event.target.value })} /></label>
      <div className='sm:col-span-2'><button type='submit' disabled={busy} className={buttonClass}>{t[4]}</button><p className='mt-3 text-xs text-gray-500 dark:text-gray-400'>{t[13]}</p></div>
    </form>
    {notice && <p role='status' className='mt-4'>{notice}</p>}
    {error && <div role='alert' className='mt-4'><p>{error}</p><button type='button' onClick={() => reload()} disabled={loading || busy} className={`${buttonClass} mt-2`}>{t[8]}</button></div>}
    <div className='mt-8 space-y-4'>
      {comments.map(row => <article key={row.id} className='rounded-lg bg-gray-100 px-5 py-4 dark:bg-gray-700'>
        <div className='flex flex-wrap items-center gap-3'><strong className='break-all'>{row.name}</strong><time dateTime={row.created_at} className='text-xs text-gray-500 dark:text-gray-400'>{new Date(row.created_at).toLocaleDateString(locale || 'zh')}</time>{/^[0-9a-f]{64}$/.test(tokens[row.id] || '') && <button type='button' disabled={busy} onClick={() => remove(row.id)} className='ml-auto text-sm underline'>{t[5]}</button>}</div>
        <p className='mt-2 whitespace-pre-wrap break-words text-sm'>{row.comment}</p>
      </article>)}
      {loading && <p role='status'>{t[14]}</p>}
      {!loading && !error && !comments.length && <p className='text-sm text-gray-500'>{t[9]}</p>}
      {hasMore && <button type='button' disabled={loading || busy} onClick={() => reload(true)} className={buttonClass}>{t[7]}</button>}
    </div>
  </section>
}
