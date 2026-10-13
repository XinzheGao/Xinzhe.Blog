import Avatar from './NotionAvatar.js'
import Social from '../Common/Social.js'
import NotionRenderer from '@/components/Post/NotionRenderer'

const Hero = ({ blockMap }) => {
  return (
    <>
      <div className='container mx-auto flex px-5 py-2 mb-10 md:flex-row flex-col items-center'>
        <div className='flex flex-col md:w-3/5 md:items-start mb-6 md:mb-0 text-left'>
          {blockMap ? (
            <NotionRenderer
              className='md:ml-0'
              blockMap={blockMap}
              frontMatter={{}}
              subPageTitle={null}
            />
          ) : null}
          <Social />
        </div>
        <div className='w-2/5 flex items-end'>
          <Avatar className='text-gray-600 dark:text-gray-300' />
        </div>
      </div>
    </>
  )
}

export default Hero
