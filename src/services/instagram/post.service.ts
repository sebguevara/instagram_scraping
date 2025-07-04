import {
  getPosts,
  analyzePosts,
  analyzePostsWithCommentsAnalyzed,
  addCommentsToPostAnalysis,
  removeDuplicatedPosts,
} from '@/repositories/instagram/post.repo'

/**
 * Scrapes posts and analyze them with their comments.
 * @returns {Promise<{ posts: number; status: string }>} Object containing the number of posts analyzed and the status
 * @throws {Error} If no posts are found or if no posts are to analyze
 */
export const scrapPostComments = async (
  days: number,
  categoryId: number
): Promise<{
  posts_created: number
  posts_analyzed: number
  status: string
}> => {
  const posts = await getPosts(days, categoryId)
  if (posts.length <= 0) return { posts_created: 0, posts_analyzed: 0, status: 'success' }

  console.log(posts.length)
  await analyzePosts(posts, categoryId)

  const postsFull = await addCommentsToPostAnalysis(posts, categoryId)

  console.log('Done')
  return {
    posts_created: posts.length,
    posts_analyzed: postsFull.length,
    status: 'success',
  }
}

/**
 * Scrapes posts from the last x days.
 * @param {number} days - Number of days to scrape posts from
 * @returns {Promise<{ posts: number; status: string }>} Object containing the number of posts scraped and the status
 * @throws {Error} If no posts are found
 */
export const scrapJustPosts = async (
  days: number,
  categoryId: number
): Promise<{ posts: number; status: string }> => {
  const posts = await getPosts(days, categoryId)
  if (posts.length <= 0) {
    return {
      posts: 0,
      status: 'success',
    }
  }

  return {
    posts: posts.length,
    status: 'success',
  }
}

/**
 * Analyzes posts that have not been analyzed yet.
 * @returns {Promise<{ posts: number; status: string }>} Object containing the number of posts analyzed and the status
 * @throws {Error} If no posts are found
 */
export const createPostsWithoutAnalysis = async (
  categoryId: number
): Promise<{ posts: number; status: string }> => {
  const postsToAnalyze = await analyzePostsWithCommentsAnalyzed(categoryId)
  console.log(postsToAnalyze.length)
  if (postsToAnalyze.length <= 0) {
    return {
      posts: 0,
      status: 'success',
    }
  }
  return {
    posts: postsToAnalyze.length,
    status: 'success',
  }
}

/**
 * Removes duplicated posts from the database.
 * @returns {Promise<{ posts_removed: number; status: string }>} Object containing the number of posts removed and the status
 */
export const removeAllDuplicatedPosts = async (): Promise<{
  posts_removed: number
  status: string
}> => {
  const postsRemoved = await removeDuplicatedPosts()
  return {
    posts_removed: postsRemoved,
    status: 'success',
  }
}
