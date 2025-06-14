import { getPosts, analyzePosts } from '@/repositories/post.repo'

/**
 * Scrapes posts and analyze them with their comments.
 * @returns {Promise<{ posts: number; status: string }>} Object containing the number of posts analyzed and the status
 * @throws {Error} If no posts are found or if no posts are to analyze
 */
export const scrapPostComments = async (
  days: number
): Promise<{ posts: number; status: string }> => {
  const posts = await getPosts(days)
  if (posts.length <= 0) throw new Error('No posts found')

  const postsToAnalyze = await analyzePosts(posts)
  if (postsToAnalyze.length <= 0) throw new Error('No posts to analyze')
  console.log('Done')

  return {
    posts: postsToAnalyze.length,
    status: 'success',
  }
}

/**
 * Scrapes posts from the last x days.
 * @param {number} days - Number of days to scrape posts from
 * @returns {Promise<{ posts: number; status: string }>} Object containing the number of posts scraped and the status
 * @throws {Error} If no posts are found
 */
export const scrapJustPosts = async (days: number): Promise<{ posts: number; status: string }> => {
  const posts = await getPosts(days)
  if (posts.length <= 0) throw new Error('No posts found')

  return {
    posts: posts.length,
    status: 'success',
  }
}
