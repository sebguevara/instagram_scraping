import { getPosts, analyzePosts } from '@/repositories/post.repo'

/**
 * Scrapes posts and analyze them with their comments.
 * @returns {Promise<{ posts: number; status: string }>} Object containing the number of posts analyzed and the status
 * @throws {Error} If no posts are found or if no posts are to analyze
 */
export const scrapPostComments = async (): Promise<{ posts: number; status: string }> => {
  const posts = await getPosts()
  if (posts.length <= 0) throw new Error('No posts found')
  console.log(posts.length)

  const postsToAnalyze = await analyzePosts(posts)
  if (postsToAnalyze.length <= 0) throw new Error('No posts to analyze')
  console.log('Done')

  return {
    posts: postsToAnalyze.length,
    status: 'success',
  }
}
