import { apifyClient, prisma } from '@/config'
import { getPostEngagement, getPostTopic, getUsername } from '@/utils'
import { createComments } from './comment.repo'
import { APIFY_ACTORS, POST_ACTOR_PARAMS } from '@/const'
import { mapApifyPostToPost } from '@/mappers'
import type {
  AccountEntity,
  ApifyPostResponse,
  PostAnalysis,
  PostEntity,
  PostEntityWithAnalysis,
  PostTopic,
} from '@/interfaces'
import pLimit from 'p-limit'

/**
 * Retrieves posts from enabled accounts, maps and saves them to the database.
 * Calls the Apify actor to get posts, filters and maps the data,
 * updates existing posts and creates new ones in the database.
 * @returns {Promise<PostEntity[]>} List of posts obtained and stored in the database
 * @throws {Error} If no post data is found or if an unexpected error occurs
 */
export const getPosts = async (days: number): Promise<PostEntity[]> => {
  try {
    // Get enabled accounts from the database
    const accounts = (await prisma.account_entity.findMany({
      where: { enabled: 'TRUE' },
      include: { instagram_user_account: true },
    })) as unknown as AccountEntity[]

    // Map usernames to their account IDs
    const accountsMap = new Map(
      accounts.map((account) => [getUsername(account.accountURL), account.id])
    ) as Map<string | null, number>

    // Call Apify actor to get user posts
    const { defaultDatasetId } = await apifyClient.actor(APIFY_ACTORS.POST_ACTOR).call({
      username: Array.from(accountsMap.keys()),
      onlyPostsNewerThan: `${days} days`,
      skipPinnedPosts: POST_ACTOR_PARAMS.skipPinnedPosts,
    })

    // Get items (posts) from the Apify dataset
    const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
    const data = items as unknown as ApifyPostResponse[]

    if (data.length <= 0) throw new Error('No data found')
    // Filter posts that belong to mapped accounts
    const dataFiltered = data.filter((item) => accountsMap.has(item.ownerUsername))
    // Map Apify data to post entity format
    const postsMapped: PostEntity[] = await Promise.all(
      dataFiltered.map((item) => mapApifyPostToPost(item, accountsMap.get(item.ownerUsername)!))
    )

    // Find already existing posts in the database
    const posts = await prisma.instagram_post.findMany({
      where: { link: { in: dataFiltered.map((item) => item.url) } },
    })

    // Update existing posts
    for (const post of posts) {
      const postData = postsMapped.find((item) => item.link === post.link)
      if (!postData) continue
      await prisma.instagram_post.update({ where: { id: post.id }, data: postData })
    }

    // Filter posts that do not exist yet to create them
    let postsToCreate: PostEntity[] = postsMapped
    if (posts.length > 0) {
      postsToCreate = postsMapped.filter((item) => !posts.some((post) => post.link === item.link))
    }

    // Create new posts in the database
    await prisma.instagram_post.createMany({ data: postsToCreate })

    // Get all stored posts (existing and new)
    const postsFromDb = (await prisma.instagram_post.findMany({
      where: { link: { in: postsMapped.map((item) => item.link) } },
    })) as unknown as PostEntity[]

    return postsFromDb
  } catch (error) {
    console.error('Error in getPosts:', error)
    throw new Error(
      'Failed to get and store posts: ' + (error instanceof Error ? error.message : String(error))
    )
  }
}

/**
 * Analyzes the received posts, assigns topics, calculates engagement, and analyzes comments.
 * Creates post analysis records in the database.
 * @param {PostEntity[]} posts - List of posts to analyze
 * @returns {Promise<PostEntity[]>} List of analyzed posts
 * @throws {Error} If no topics or comment analysis are found or if an unexpected error occurs
 */
export const analyzePosts = async (posts: PostEntity[]): Promise<PostEntity[]> => {
  try {
    // Get available topics
    const topics = (await prisma.post_topic.findMany()) as unknown as PostTopic[]
    if (topics.length <= 0) throw new Error('No topics found')

    // Get enabled accounts
    const accounts = (await prisma.account_entity.findMany({
      where: { enabled: 'TRUE' },
      include: { instagram_user_account: true },
    })) as unknown as AccountEntity[]

    const limit = pLimit(8)
    // Assign topics to posts
    const postsAnalysis = (await Promise.all(
      posts.map(async (post) => {
        const postTopic = await limit(async () => await getPostTopic(post.title, topics))
        return {
          post_topic_id: Number(postTopic.id),
          instagram_post_id: post.id,
          post_date: post.postDate,
        }
      })
    )) as unknown as PostAnalysis[]

    // Filter posts that are not of type "Sorteo"
    const postAnalysisFiltered = postsAnalysis.filter(
      (item) => item.post_topic_id !== topics.find((topic) => topic.topic === 'Sorteo')?.id
    )

    // Filter posts to analyze
    const postsToAnalyze = posts.filter((post) =>
      postAnalysisFiltered.some((item) => item.instagram_post_id === post.id)
    )

    // Create analyzed comments for the posts
    const commentsAnalysis = []
    for (const post of postsToAnalyze) {
      const comments = await createComments([post])
      commentsAnalysis.push(...comments)
    }

    if (commentsAnalysis.length <= 0) {
      throw new Error('No comments analysis found')
    }

    // Calculate post engagement
    const postsWithEngagement = postsToAnalyze.map((post) => {
      const account = accounts.find((item) => item.id === post.accountId)
      if (!account) return null
      const post_engagement = getPostEngagement(post, account.instagram_user_account!.followers)
      return {
        post_engagement,
        post_id: post.id!,
      }
    }) as unknown as { post_engagement: number; post_id: number }[]

    // Get post from db with their analysis
    const postsWithAnalysis = (await prisma.instagram_post.findMany({
      where: { id: { in: postsToAnalyze.map((item) => item.id!) } },
      include: { comment_analysis: true, post_analysis: true },
    })) as unknown as PostEntityWithAnalysis[]

    // Create post analysis in the database
    await createPostAnalysis(postsAnalysis, postsWithEngagement, postsWithAnalysis)
    return postsToAnalyze
  } catch (error) {
    console.error('Error in analyzePosts:', error)
    throw new Error(
      'Failed to analyze posts: ' + (error instanceof Error ? error.message : String(error))
    )
  }
}

/**
 * Creates post analysis, calculating engagement and comment counts by emotion.
 * Saves new analysis records in the database.
 * @param {PostAnalysis[]} posts - Post analysis data
 * @param {{ post_engagement: number; post_id: number }[]} postsWithEngagement - Post engagement data
 * @param {PostEntity[]} postsWithAnalysis - Post with comment analysis data
 * @returns {Promise<PostAnalysis[]>} Created post analysis records
 */
const createPostAnalysis = async (
  posts: PostAnalysis[],
  postsWithEngagement: { post_engagement: number; post_id: number }[],
  postsWithAnalysis: PostEntityWithAnalysis[]
): Promise<PostAnalysis[]> => {
  // Map and calculate analysis data for each post
  const postAnalysis = posts.map((post) => {
    const postWithEngagement = postsWithEngagement.find(
      (item) => item.post_id === post.instagram_post_id
    )
    const commentsAmount = postsWithAnalysis.find((item) => item.id === post.instagram_post_id)
      ?.comment_analysis?.length

    if (commentsAmount === undefined) return null

    const negativeComments = postsWithAnalysis
      .find((item) => item.id === post.instagram_post_id)
      ?.comment_analysis?.filter((item) => item.emotion === 'negativo').length

    const positiveComments = postsWithAnalysis
      .find((item) => item.id === post.instagram_post_id)
      ?.comment_analysis?.filter((item) => item.emotion === 'positivo').length

    const neutralComments = commentsAmount - (negativeComments ?? 0) - (positiveComments ?? 0)
    if (!postWithEngagement) return null
    return {
      ...post,
      post_engagement: postWithEngagement.post_engagement,
      comments_amount: commentsAmount,
      ammount_negative_comments: negativeComments,
      ammount_positive_comments: positiveComments,
      ammount_neutral_comments: neutralComments,
      createdat: new Date(),
      updatedat: new Date(),
    }
  }) as unknown as PostAnalysis[]

  // Filter valid analysis records
  const postAnalysisFiltered = postAnalysis.filter((item) => item !== null)

  // Find already existing analysis records in the database
  const postAnalysisInDb = await prisma.post_analysis.findMany({
    where: { instagram_post_id: { in: posts.map((item) => item.instagram_post_id) } },
  })

  const postAnalysisToUpdate = postAnalysisFiltered.filter((item) =>
    postAnalysisInDb.some((post) => post.instagram_post_id === item.instagram_post_id)
  )

  // update existing analysis records in the database
  if (postAnalysisToUpdate.length > 0) {
    for (const post of postAnalysisToUpdate) {
      await prisma.post_analysis.update({
        where: { instagram_post_id: post.instagram_post_id },
        data: post,
      })
    }
  }

  // filter just the new analysis records
  const postAnalysisToCreate = postAnalysisFiltered.filter(
    (item) => !postAnalysisInDb.some((post) => post.instagram_post_id === item.instagram_post_id)
  )

  // Create new analysis records in the database
  await prisma.post_analysis.createMany({ data: postAnalysisToCreate })
  return postAnalysisFiltered
}

/**
 * Gets posts that have not been analyzed yet.
 * @returns {Promise<PostEntity[]>} List of posts that have not been analyzed yet
 */
export const getPostsToAnalyze = async (): Promise<PostEntity[]> => {
  const posts = await prisma.instagram_post.findMany({
    where: {
      post_analysis: {
        is: null,
      },
    },
  })
  return posts as unknown as PostEntity[]
}

export const analyzePostsWithCommentsAnalyzed = async (): Promise<PostEntity[]> => {
  const postsToAnalyze = await getPostsToAnalyze()
  const topics = (await prisma.post_topic.findMany()) as unknown as PostTopic[]
  const accounts = await prisma.account_entity.findMany({
    where: { enabled: 'TRUE' },
    include: { instagram_user_account: true },
  })

  const postsAnalysis: PostAnalysis[] = []
  for (const post of postsToAnalyze) {
    const postTopic = await getPostTopic(post.title, topics)
    postsAnalysis.push({
      post_topic_id: Number(postTopic.id),
      instagram_post_id: post.id!,
      post_date: post.postDate,
    })
  }

  // get comments amount and post engagement
  const postsWithEngagement = postsToAnalyze.map((post) => {
    const account = accounts.find((item) => item.id === post.accountId)
    if (!account) return null
    const post_engagement = getPostEngagement(post, account.instagram_user_account!.followers)
    return {
      post_engagement,
      post_id: post.id!,
    }
  }) as unknown as { post_engagement: number; post_id: number }[]

  // Get post from db with their analysis
  const postsWithAnalysis = (await prisma.instagram_post.findMany({
    where: { id: { in: postsToAnalyze.map((item) => item.id!) } },
    include: { comment_analysis: true, post_analysis: true },
  })) as unknown as PostEntityWithAnalysis[]

  // Create post analysis in the database
  await createPostAnalysis(postsAnalysis, postsWithEngagement, postsWithAnalysis)
  return postsToAnalyze
}
