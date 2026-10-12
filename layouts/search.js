import { useState, useEffect } from 'react'
import { randomContents, searchContents } from '@/lib/search'
import BlogPost from '@/components/BlogPost'
import Container from '@/components/Container'
import Tags from '@/components/Common/Tags'
import PropTypes from 'prop-types'
import { lang } from '@/lib/lang'
import { useRouter } from 'next/router'

const SearchLayout = ({ tags, posts = [], initialPosts = [], currentTag }) => {
  const [searchValue, setSearchValue] = useState('')
  const [suggestions, setSuggestions] = useState(initialPosts)
  const [visibleCount, setVisibleCount] = useState(20)
  const { locale } = useRouter()
  const t = lang[locale]
  const keyword = searchValue.trim()

  useEffect(() => {
    if (!currentTag) setSuggestions(randomContents(posts))
    setSearchValue('')
    setVisibleCount(20)
  }, [posts, currentTag])

  const filteredBlogPosts = keyword ? searchContents(posts, keyword) : posts
  const displayedPosts = !keyword && !currentTag
    ? suggestions
    : filteredBlogPosts.slice(0, visibleCount)
  const showTags = !currentTag && (!keyword || !filteredBlogPosts.length)

  return (
    <Container>
      <div className='relative'>
        <input
          type='text'
          placeholder={
            currentTag
              ? `${t.SEARCH.ONLY_SEARCH} #${currentTag}`
              : `${t.SEARCH.PLACEHOLDER}`
          }
          className='w-full bg-white dark:bg-gray-600 shadow-md rounded-lg outline-none focus:shadow p-3'
          aria-label={t.SEARCH.PLACEHOLDER}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
            setVisibleCount(20)
          }}
        />
        <svg
          className='absolute right-3 top-3 h-5 w-5 text-gray-400'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          ></path>
        </svg>
      </div>
      <div className='article-container my-8'>
        {!displayedPosts.length && (
          <p className='text-gray-500 dark:text-gray-300'>
            {t.SEARCH.NOT_FOUND}
          </p>
        )}
        {showTags && <Tags tags={tags} currentTag={currentTag} />}
        {displayedPosts.map((post) => (
          <BlogPost key={post.id} post={post} />
        ))}
        {(keyword || currentTag) && filteredBlogPosts.length > visibleCount && (
          <button
            type='button'
            onClick={() => setVisibleCount(count => count + 20)}
            className='rounded-lg bg-gray-100 px-5 py-3 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          >
            {t.SEARCH.LOAD_MORE}
          </button>
        )}
      </div>
    </Container>
  )
}
SearchLayout.propTypes = {
  posts: PropTypes.array.isRequired,
  tags: PropTypes.object.isRequired,
  initialPosts: PropTypes.array,
  currentTag: PropTypes.string
}
export default SearchLayout
