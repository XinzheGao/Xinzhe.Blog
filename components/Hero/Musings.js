import { NewspaperIcon } from '@heroicons/react/outline'
import NotionRenderer from '@/components/Post/NotionRenderer'

const MusingsHero = ({ blockMap }) => {
  return (
    <>
      <div className='container mx-auto flex px-5 py-2 mb-10 md:flex-row flex-col items-center'>
        <div className='flex flex-col md:w-4/5 md:items-start mb-6 md:mb-0 md:text-left'>
          <NotionRenderer
            className='md:ml-0'
            blockMap={blockMap}
            frontMatter={{}}
            subPageTitle={null}
          />
        </div>
        <div className='w-1/5 ml-4'>
          <NewspaperIcon className='object-cover object-center text-gray-500 dark:text-gray-300' />
        </div>
      </div>
    </>
  )
}

export default MusingsHero
