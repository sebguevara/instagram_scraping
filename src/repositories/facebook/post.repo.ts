import { apifyClient, prisma } from '@/config'
import { getPostTopic } from '@/utils'
import { getPostEngagement } from '@/utils/facebook/get_post_engagement'
import { createComments } from './comment.repo'
import { APIFY_FB_ACTORS, FB_POST_ACTOR_PARAMS } from '@/const'
import type { AccountEntityWithRelations, ApifyFBPostResponse, PostTopic } from '@/interfaces'
import pLimit from 'p-limit'
import type { FBPostAnalysisEntity, FBPostEntity } from '@/interfaces/schemas/facebook/post'
import { mapApifyFBPostToPost } from '@/mappers/facebook/post.mapper'
import type { FBCommentAnalysisEntity } from '@/interfaces/schemas/facebook/comment'

/**
 * Retrieves enabled accounts from the database.
 * @returns {Promise<AccountEntityWithRelations[]>} List of enabled accounts
 */
const getEnabledAccounts = async (categoryId: number): Promise<AccountEntityWithRelations[]> => {
  const accounts = await prisma.account_entity.findMany({
    where: { enabled: 'TRUE', account_type_id: 2, account_category_id: categoryId },
    include: { facebook_user_account: true },
  })

  return accounts as unknown as AccountEntityWithRelations[]
}

/**
 * Retrieves available topics from the database.
 * @returns {Promise<PostTopic[]>} List of available topics
 */
const getAvailableTopics = async (): Promise<PostTopic[]> => {
  return (await prisma.post_topic.findMany()) as unknown as PostTopic[]
}

/**
 * Retrieves existing posts by their links.
 * @param {string[]} links - List of post links
 * @returns {Promise<FBPostEntity[]>} List of existing posts
 */
const getExistingPostsByLinks = async (links: string[]): Promise<FBPostEntity[]> => {
  return (await prisma.facebook_post.findMany({
    where: { link: { in: links } },
  })) as unknown as FBPostEntity[]
}

/**
 * Updates existing posts in the database.
 * @param {FBPostEntity[]} posts - List of existing posts
 * @param {FBPostEntity[]} postsMapped - List of posts to update
 * @returns {Promise<void>} Promise that resolves when the posts are updated
 */
const updateExistingPosts = async (
  posts: FBPostEntity[],
  postsMapped: FBPostEntity[]
): Promise<void> => {
  for (const post of posts) {
    const postData = postsMapped.find((item) => item.link === post.link)
    if (!postData) continue
    await prisma.facebook_post.update({ where: { id: post.id }, data: postData })
  }
}

/**
 * Creates new posts in the database.
 * @param {FBPostEntity[]} postsToCreate - List of posts to create
 * @returns {Promise<void>} Promise that resolves when the posts are created
 */
const createNewPosts = async (postsToCreate: FBPostEntity[]): Promise<void> => {
  const existingPosts = (await prisma.facebook_post.findMany({
    where: { facebookPostID: { in: postsToCreate.map((p) => p.facebookPostID!) } },
    select: { facebookPostID: true },
  })) as unknown as FBPostEntity[]
  const existingLinks = new Set(existingPosts.map((p) => p.facebookPostID))

  const postsToReallyCreate = postsToCreate.filter(
    (post) => !existingLinks.has(post.facebookPostID!)
  )

  for (const post of postsToReallyCreate) {
    await prisma.facebook_post.create({ data: post })
  }
}

/**
 * Creates post analysis in the database.
 * @param {FBPostAnalysisEntity[]} posts - List of posts to create
 * @returns {Promise<void>} Promise that resolves when the posts are created
 */
const createPostAnalysis = async (posts: FBPostAnalysisEntity[]): Promise<void> => {
  for (const post of posts) {
    await prisma.facebook_post_analysis.create({ data: post })
  }
}

/**
 * Calls Apify to get posts from users.
 * @param {string[]} urls - List of urls
 * @param {number} days - Number of days
 * @returns {Promise<{ defaultDatasetId: string }>} Promise that resolves when the posts are retrieved
 */
const getPostsFromApify = async (
  urls: (string | null)[],
  days: number
): Promise<{ defaultDatasetId: string }> => {
  return await apifyClient.actor(APIFY_FB_ACTORS.POST_ACTOR).call({
    startUrls: urls.map((url) => ({ url, method: 'GET' })),
    onlyPostsNewerThan: `${days} days`,
    resultsLimit: FB_POST_ACTOR_PARAMS.resultsLimit,
  })
}

/**
 * Maps and filters Apify posts according to the accountsMap.
 * @param {ApifyFBPostResponse[]} data - List of Apify posts
 * @param {Map<string | null, number>} accountsMap - Map of accounts
 * @returns {Promise<FBPostEntity[]>} List of mapped and filtered posts
 */
const mapAndFilterApifyPosts = async (
  data: ApifyFBPostResponse[],
  accountsMap: Map<string | null, number>
): Promise<FBPostEntity[]> => {
  const dataFiltered = data.filter((item) => accountsMap.has(item.facebookUrl))
  return await Promise.all(
    dataFiltered.map((item) => mapApifyFBPostToPost(item, accountsMap.get(item.facebookUrl)!))
  )
}

/**
 * Retrieves posts from enabled accounts, maps and saves them to the database.
 * Calls the Apify actor to get posts, filters and maps the data,
 * updates existing posts and creates new ones in the database.
 * @returns {Promise<FBPostEntity[]>} List of posts obtained and stored in the database
 * @throws {Error} If no post data is found or if an unexpected error occurs
 */
export const getPosts = async (days: number, categoryId: number): Promise<FBPostEntity[]> => {
  try {
    const accounts = await getEnabledAccounts(categoryId)
    const accountsMap = new Map(
      accounts.map((account) => [account.accountURL, account.facebook_user_account?.id])
    ) as Map<string, number>

    if (accountsMap.size <= 0) return []
    // const { defaultDatasetId } = await getPostsFromApify(Array.from(accountsMap.keys()), days)
    const { items } = await apifyClient.dataset('yr0HVpbntVIPoCewa').listItems()
    const data = items as unknown as ApifyFBPostResponse[]

    if (data.length <= 0) return []
    const dataFiltered = data.filter((item) => accountsMap.has(item.facebookUrl))
    const postsMapped: FBPostEntity[] = await mapAndFilterApifyPosts(data, accountsMap)

    const posts = await getExistingPostsByLinks(dataFiltered.map((item) => item.url))

    await updateExistingPosts(posts, postsMapped)

    let postsToCreate: FBPostEntity[] = postsMapped
    if (posts.length > 0) {
      postsToCreate = postsMapped.filter((item) => !posts.some((post) => post.link === item.link))
    }

    await createNewPosts(postsToCreate)

    const postsFromDb = (await prisma.facebook_post.findMany({
      where: { link: { in: postsMapped.map((item) => item.link) } },
    })) as unknown as FBPostEntity[]

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
export const analyzePosts = async (
  posts: FBPostEntity[],
  categoryId: number
): Promise<FBPostAnalysisEntity[]> => {
  try {
    const topics = await getAvailableTopics()
    if (topics.length <= 0) return []

    const accounts = await getEnabledAccounts(categoryId)

    const limit = pLimit(20)
    const postsAnalysis = (await Promise.all(
      posts.map(async (post) => {
        const account = accounts.find((item) => item.facebook_user_account?.id === post.accountid)
        if (!account) return null
        const filterTopics = topics.filter(
          (topic) =>
            topic.account_category_id === account.account_category_id ||
            topic.account_category_id === 3
        )
        if (filterTopics.length <= 0) return null
        const postTopic = await limit(async () => await getPostTopic(post.title, filterTopics))
        if (!postTopic) return null
        return {
          postID: post.id,
          post_topic_id: Number(postTopic.id),
          tags: postTopic.tags.join(','),
        }
      })
    )) as unknown as FBPostAnalysisEntity[]

    const postsAnalysisFiltered = postsAnalysis.filter((item) => item !== null)
    const postAnalysisInDb = await prisma.facebook_post_analysis.findMany({
      where: { postID: { in: posts.map((item) => item.id!) } },
    })

    const postAnalysisToUpdate = postsAnalysisFiltered.filter((item) =>
      postAnalysisInDb.some((post) => post.postID === item.postID)
    )

    for (const post of postAnalysisToUpdate) {
      await prisma.facebook_post_analysis.update({
        where: { postID: post.postID! },
        data: {
          tags: post.tags,
          post_topic_id: post.post_topic_id,
        },
      })
    }

    const postAnalysisToCreate = postsAnalysisFiltered.filter(
      (item) => !postAnalysisInDb.some((post) => post.postID === item.postID)
    )
    await createPostAnalysis(postAnalysisToCreate)

    const postsAnalyzed = (await prisma.facebook_post_analysis.findMany({
      where: {
        postID: { in: posts.map((item) => item.id!) },
        commentsAmmount: { equals: null },
      },
    })) as unknown as FBPostAnalysisEntity[]

    return postsAnalyzed
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
 * @returns {Promise<PostAnalysis[]>} Created post analysis records
 */
export const addCommentsToPostAnalysis = async (
  posts: FBPostEntity[],
  categoryId: number
): Promise<FBPostAnalysisEntity[]> => {
  const accounts = await getEnabledAccounts(categoryId)
  const commentsAnalysis = await createComments(posts)

  const postsAnalyzed = await prisma.facebook_post_analysis.findMany({
    where: { postID: { in: posts.map((item) => item.id!) } },
  })
  const postsAnalyzedMap = new Map(postsAnalyzed.map((item) => [item.postID, item]))

  const postsWithEngagement = posts.map((post) => {
    const account = accounts.find((item) => item.facebook_user_account!.id === post.accountid)
    if (!account) return null
    const post_engagement = getPostEngagement(post, account.facebook_user_account!.followers)
    return {
      post_engagement,
      postID: post.id!,
    }
  }) as unknown as { post_engagement: number; postID: number }[]

  const postAnalysisToUpdate = posts.map((post) => {
    const postWithEngagement = postsWithEngagement.find((item) => item.postID === post.id)
    if (!postWithEngagement) return null

    const commentsAmount = commentsAnalysis.filter((item) => item?.postID === post.id).length

    const postAnalyzed = postsAnalyzedMap.get(post.id!)
    if (!postAnalyzed) return null

    const negativeComments = commentsAnalysis
      .filter((item) => item?.postID === post.id)
      .filter((item) => item?.emotion === 'negativo').length

    const positiveComments = commentsAnalysis
      .filter((item) => item?.postID === post.id)
      .filter((item) => item?.emotion === 'positivo').length

    const neutralComments = commentsAmount - (negativeComments ?? 0) - (positiveComments ?? 0)

    return {
      postID: post.id,
      post_topic_id: postAnalyzed.post_topic_id,
      tags: postAnalyzed.tags,
      postEngagement: postWithEngagement.post_engagement,
      commentsAmmount: commentsAmount,
      ammountNegativeComments: negativeComments,
      ammountPositiveComments: positiveComments,
      ammountNeutralComments: neutralComments,
    }
  }) as unknown as FBPostAnalysisEntity[]

  const postAnalysisFiltered = postAnalysisToUpdate.filter((item) => item !== null)

  if (postAnalysisFiltered.length > 0) {
    for (const post of postAnalysisFiltered) {
      await prisma.facebook_post_analysis.update({
        where: { postID: post.postID },
        data: post,
      })
    }
  }

  return postAnalysisFiltered
}

/**
 * Gets posts that have not been analyzed yet.
 * @returns {Promise<PostEntity[]>} List of posts that have not been analyzed yet
 */
export const getPostsToAnalyze = async (): Promise<FBPostEntity[]> => {
  const posts = await prisma.facebook_post.findMany({
    where: {
      facebook_post_analysis: {
        is: null,
      },
    },
  })
  return posts as unknown as FBPostEntity[]
}

/**
 * Analyzes posts that have not been analyzed yet, assigns topics, calculates engagement, and analyzes comments.
 * Creates post analysis records in the database.
 * @returns {Promise<PostEntity[]>} List of posts that have not been analyzed yet
 */
export const analyzePostsWithCommentsAnalyzed = async (
  categoryId: number
): Promise<FBPostEntity[]> => {
  const postsToAnalyze = await getPostsToAnalyze()
  const topics = await getAvailableTopics()
  const accounts = await getEnabledAccounts(categoryId)

  if (postsToAnalyze.length <= 0) return []

  const postsAnalysis: FBPostAnalysisEntity[] = []
  for (const post of postsToAnalyze) {
    const account = accounts.find((item) => item.id === post.accountid)
    if (!account) return []
    const filterTopics = topics.filter(
      (topic) =>
        topic.account_category_id === account.account_category_id || topic.account_category_id === 3
    )
    if (filterTopics.length <= 0) return []

    const postTopic = await getPostTopic(post.title, filterTopics)
    if (!postTopic) return []
    postsAnalysis.push({
      post_topic_id: Number(postTopic.id),
      postID: post.id!,
      tags: postTopic.tags.join(','),
    })
  }

  await createPostAnalysis(postsAnalysis)

  const postsFiltered = postsToAnalyze.filter((post) => {
    const postAnalysis = postsAnalysis.find((item) => item.postID === post.id && item.id !== 21)
    return !postAnalysis
  })

  await addCommentsToPostAnalysis(postsFiltered, categoryId)
  return postsFiltered
}

/**
 * Removes duplicated posts from the database.
 * @returns {Promise<number>} Number of posts removed
 */
export const removeDuplicatedPosts = async (): Promise<number> => {
  const allPosts = await prisma.facebook_post.findMany()
  const postsWithDuplicatedLink = allPosts.filter((post) => {
    const postsWithSameLink = allPosts.filter((item) => item.link === post.link)
    return postsWithSameLink.length > 1
  })

  const postWithMostComments = postsWithDuplicatedLink.sort(
    (a, b) => (b.numberofcomments ?? 0) - (a.numberofcomments ?? 0)
  )[0]

  const comments = await prisma.facebook_comment_entity.findMany({
    where: { postID: { in: postsWithDuplicatedLink.map((item) => item.id) } },
  })
  for (const comment of comments) {
    const commentAnalysis = await prisma.facebook_comment_analysis.findFirst({
      where: { commentID: comment.id },
    })
    if (commentAnalysis) {
      await prisma.facebook_comment_analysis.delete({ where: { id: commentAnalysis.id } })
    }

    await prisma.facebook_comment_entity.delete({ where: { id: comment.id } })
  }

  // delete posts analysis
  const postsAnalysis = await prisma.facebook_post_analysis.findMany({
    where: { postID: { in: postsWithDuplicatedLink.map((item) => item.id!) } },
  })
  for (const postAnalysis of postsAnalysis) {
    await prisma.facebook_post_analysis.delete({ where: { id: postAnalysis.id } })
  }

  for (const post of postsWithDuplicatedLink) {
    if (post.id !== postWithMostComments.id) {
      await prisma.facebook_post.delete({ where: { id: post.id } })
    }
  }

  return postsWithDuplicatedLink.length
}

export const updatePostsAnalysis = async (): Promise<number> => {
  try {
    const postsAnalysis = (await prisma.facebook_post_analysis.findMany({
      where: {
        commentsAmmount: null,
      },
    })) as unknown as FBPostAnalysisEntity[]
    if (postsAnalysis.length <= 0) return 0

    // then get all posts where id is in the postsAnalysis
    const posts = (await prisma.facebook_post.findMany({
      where: {
        id: { in: postsAnalysis.map((item) => item.postID) },
      },
    })) as unknown as FBPostEntity[]

    const postsUpdated = await addCommentsAndUpdatePostAnalysis(posts)

    return postsUpdated.length
  } catch (error) {
    console.error('Error in updatePostsAnalysis:', error)
    throw new Error(
      'Failed to update posts analysis: ' + (error instanceof Error ? error.message : String(error))
    )
  }
}

export const addCommentsAndUpdatePostAnalysis = async (
  posts: FBPostEntity[]
): Promise<FBPostAnalysisEntity[]> => {
  const accounts = await getEnabledAccounts(1)

  const postsWithEngagement = posts.map((post) => {
    const account = accounts.find((item) => item.facebook_user_account?.id === post.accountid)

    if (!account) return null
    if (account.facebook_user_account!.followers <= 0)
      return {
        post_engagement: -1,
        postID: post.id,
      }

    const post_engagement = getPostEngagement(post, account.facebook_user_account!.followers)
    return {
      post_engagement,
      postID: post.id,
    }
  }) as unknown as { post_engagement: number; postID: number }[]

  const postsWithEngagementFiltered = postsWithEngagement.filter((item) => item !== null)
  const commentsAnalysis = (await prisma.facebook_comment_analysis.findMany({
    where: { postID: { in: postsWithEngagementFiltered.map((item) => item.postID) } },
  })) as unknown as FBCommentAnalysisEntity[]

  const postAnalysisToUpdate = posts.map((post) => {
    const postWithEngagement = postsWithEngagementFiltered.find((item) => item.postID === post.id)
    if (!postWithEngagement) return null

    const commentsAmount = commentsAnalysis.filter((item) => item.postID === post.id).length

    const negativeComments = commentsAnalysis
      .filter((item) => item.postID === post.id)
      .filter((item) => item.emotion === 'negativo').length

    const positiveComments = commentsAnalysis
      .filter((item) => item.postID === post.id)
      .filter((item) => item.emotion === 'positivo').length

    const neutralComments = commentsAmount - (negativeComments ?? 0) - (positiveComments ?? 0)

    return {
      postID: postWithEngagement.postID,
      postEngagement: postWithEngagement.post_engagement,
      commentsAmmount: commentsAmount,
      ammountNegativeComments: negativeComments,
      ammountPositiveComments: positiveComments,
      ammountNeutralComments: neutralComments,
    }
  }) as unknown as FBPostAnalysisEntity[]

  const postAnalysisFiltered = postAnalysisToUpdate.filter((item) => item !== null)

  if (postAnalysisFiltered.length > 0) {
    for (const post of postAnalysisFiltered) {
      await prisma.facebook_post_analysis.update({
        where: { postID: post.postID },
        data: post,
      })
    }
  }

  return postAnalysisFiltered
}
