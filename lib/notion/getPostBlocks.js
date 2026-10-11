import BLOG from '@/blog.config'
import { getPageRecordMap } from './officialClient'
import { getPreviewImageMap } from './previewImages'

export async function getPostBlocks(id) {
  const pageBlock = await getPageRecordMap(id)
  if (!pageBlock) return null
  if (BLOG.previewImagesEnabled) {
    const previewImages = await getPreviewImageMap(pageBlock)
    return { ...pageBlock, preview_images: previewImages }
  }
  return pageBlock
}
