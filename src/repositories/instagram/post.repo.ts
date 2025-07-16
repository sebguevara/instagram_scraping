import { apifyClient, prisma } from '@/config'
import { getPostEngagement, getPostTopic, getUsername } from '@/utils'
import { createComments } from './comment.repo'
import { APIFY_IG_ACTORS, POST_IG_ACTOR_PARAMS } from '@/const'
import { mapApifyPostToPost } from '@/mappers'
import type {
  ApifyIGPostResponse,
  IGPostAnalysis,
  IGPostEntity,
  PostTopic,
  AccountEntityWithRelations,
  IGCommentAnalysis,
} from '@/interfaces'
import pLimit from 'p-limit'

/**
 * Retrieves enabled accounts from the database.
 * @returns {Promise<AccountEntityWithRelations[]>} List of enabled accounts
 */
const getEnabledAccounts = async (categoryId: number): Promise<AccountEntityWithRelations[]> => {
  const accounts = await prisma.account_entity.findMany({
    where: { enabled: 'TRUE', account_type_id: 1, account_category_id: categoryId },
    include: { instagram_user_account: true },
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
 * @returns {Promise<IGPostEntity[]>} List of existing posts
 */
const getExistingPostsByLinks = async (links: string[]): Promise<IGPostEntity[]> => {
  return (await prisma.instagram_post.findMany({
    where: { link: { in: links } },
  })) as unknown as IGPostEntity[]
}

/**
 * Updates existing posts in the database.
 * @param {IGPostEntity[]} posts - List of existing posts
 * @param {IGPostEntity[]} postsMapped - List of posts to update
 * @returns {Promise<void>} Promise that resolves when the posts are updated
 */
const updateExistingPosts = async (
  posts: IGPostEntity[],
  postsMapped: IGPostEntity[]
): Promise<void> => {
  for (const post of posts) {
    const postData = postsMapped.find((item) => item.link === post.link)
    if (!postData) continue
    await prisma.instagram_post.update({ where: { id: post.id }, data: postData })
  }
}

/**
 * Creates new posts in the database.
 * @param {IGPostEntity[]} postsToCreate - List of posts to create
 * @returns {Promise<void>} Promise that resolves when the posts are created
 */
const createNewPosts = async (postsToCreate: IGPostEntity[]): Promise<void> => {
  const existingPosts = await prisma.instagram_post.findMany({
    where: { link: { in: postsToCreate.map((p) => p.link) } },
    select: { link: true },
  })
  const existingLinks = new Set(existingPosts.map((p) => p.link))

  const postsToReallyCreate = postsToCreate.filter((post) => !existingLinks.has(post.link))

  for (const post of postsToReallyCreate) {
    await prisma.instagram_post.create({ data: post })
  }
}

/**
 * Creates post analysis in the database.
 * @param {IGPostAnalysis[]} posts - List of posts to create
 * @returns {Promise<void>} Promise that resolves when the posts are created
 */
const createPostAnalysis = async (posts: IGPostAnalysis[]): Promise<void> => {
  for (const post of posts) {
    await prisma.post_analysis.create({ data: post })
  }
}

/**
 * Calls Apify to get posts from users.
 * @param {string[]} usernames - List of usernames
 * @param {number} days - Number of days
 * @returns {Promise<{ defaultDatasetId: string }>} Promise that resolves when the posts are retrieved
 */
const getPostsFromApify = async (
  usernames: (string | null)[],
  days: number
): Promise<{ defaultDatasetId: string }> => {
  return await apifyClient.actor(APIFY_IG_ACTORS.POST_ACTOR).call({
    username: usernames,
    onlyPostsNewerThan: `${days} days`,
    skipPinnedPosts: POST_IG_ACTOR_PARAMS.skipPinnedPosts,
    resultsLimit: POST_IG_ACTOR_PARAMS.resultsLimit,
  })
}

/**
 * Maps and filters Apify posts according to the accountsMap.
 * @param {ApifyIGPostResponse[]} data - List of Apify posts
 * @param {Map<string | null, number>} accountsMap - Map of accounts
 * @returns {Promise<IGPostEntity[]>} List of mapped and filtered posts
 */
const mapAndFilterApifyPosts = async (
  data: ApifyIGPostResponse[],
  accountsMap: Map<string | null, number>
): Promise<IGPostEntity[]> => {
  const dataFiltered = data.filter((item) => accountsMap.has(item.ownerUsername))
  return await Promise.all(
    dataFiltered.map((item) => mapApifyPostToPost(item, accountsMap.get(item.ownerUsername)!))
  )
}

/**
 * Retrieves posts from enabled accounts, maps and saves them to the database.
 * Calls the Apify actor to get posts, filters and maps the data,
 * updates existing posts and creates new ones in the database.
 * @returns {Promise<PostEntity[]>} List of posts obtained and stored in the database
 * @throws {Error} If no post data is found or if an unexpected error occurs
 */
export const getPosts = async (days: number, categoryId: number): Promise<IGPostEntity[]> => {
  try {
    const accounts = await getEnabledAccounts(categoryId)
    const accountsMap = new Map(
      accounts.map((account) => [
        getUsername(account.accountURL),
        account.instagram_user_account?.id,
      ])
    ) as Map<string | null, number>

    if (accountsMap.size <= 0) return []
    const { defaultDatasetId } = await getPostsFromApify(Array.from(accountsMap.keys()), days)
    const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
    const data = items as unknown as ApifyIGPostResponse[]

    if (data.length <= 0) return []
    const dataFiltered = data.filter((item) => accountsMap.has(item.ownerUsername))
    const postsMapped: IGPostEntity[] = await mapAndFilterApifyPosts(data, accountsMap)

    const posts = await getExistingPostsByLinks(dataFiltered.map((item) => item.url))

    await updateExistingPosts(posts, postsMapped)

    let postsToCreate: IGPostEntity[] = postsMapped
    if (posts.length > 0) {
      postsToCreate = postsMapped.filter((item) => !posts.some((post) => post.link === item.link))
    }

    await createNewPosts(postsToCreate)

    const postsFromDb = (await prisma.instagram_post.findMany({
      where: { link: { in: postsMapped.map((item) => item.link) } },
    })) as unknown as IGPostEntity[]

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
  posts: IGPostEntity[],
  categoryId: number
): Promise<IGPostAnalysis[]> => {
  try {
    const topics = await getAvailableTopics()
    if (topics.length <= 0) return []

    const accounts = await getEnabledAccounts(categoryId)

    const limit = pLimit(20)
    const postsAnalysis = (await Promise.all(
      posts.map(async (post) => {
        const account = accounts.find((item) => item.instagram_user_account?.id === post.accountId)
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
          post_topic_id: Number(postTopic.id),
          instagram_post_id: post.id,
          post_date: post.postDate,
          tags: postTopic.tags.join(','),
        }
      })
    )) as unknown as IGPostAnalysis[]

    const postsAnalysisFiltered = postsAnalysis.filter((item) => item !== null)
    const postAnalysisInDb = await prisma.post_analysis.findMany({
      where: { instagram_post_id: { in: posts.map((item) => item.id!) } },
    })

    const postAnalysisToUpdate = postsAnalysisFiltered.filter((item) =>
      postAnalysisInDb.some((post) => post.instagram_post_id === item.instagram_post_id)
    )

    for (const post of postAnalysisToUpdate) {
      await prisma.post_analysis.update({
        where: { instagram_post_id: post.instagram_post_id! },
        data: {
          tags: post.tags,
          post_topic_id: post.post_topic_id,
        },
      })
    }

    const postAnalysisToCreate = postsAnalysisFiltered.filter(
      (item) => !postAnalysisInDb.some((post) => post.instagram_post_id === item.instagram_post_id)
    )
    await createPostAnalysis(postAnalysisToCreate)

    const postsAnalyzed = (await prisma.post_analysis.findMany({
      where: {
        instagram_post_id: { in: posts.map((item) => item.id!) },
        comments_amount: { equals: null },
      },
    })) as unknown as IGPostAnalysis[]

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
  posts: IGPostEntity[],
  categoryId: number
): Promise<IGPostAnalysis[]> => {
  const accounts = await getEnabledAccounts(categoryId)
  const commentsAnalysis = await createComments(posts)

  // get postsanalyze by posts
  const postsAnalyzed = await prisma.post_analysis.findMany({
    where: { instagram_post_id: { in: posts.map((item) => item.id!) } },
  })
  const postsAnalyzedMap = new Map(postsAnalyzed.map((item) => [item.instagram_post_id, item]))

  const postsWithEngagement = posts.map((post) => {
    const account = accounts.find((item) => item.instagram_user_account!.id === post.accountId)
    if (!account) return null
    const post_engagement = getPostEngagement(post, account.instagram_user_account!.followers)
    return {
      post_engagement,
      post_id: post.id!,
    }
  }) as unknown as { post_engagement: number; post_id: number }[]

  const postAnalysisToUpdate = posts.map((post) => {
    const postWithEngagement = postsWithEngagement.find((item) => item.post_id === post.id)
    if (!postWithEngagement) return null

    const commentsAmount = commentsAnalysis.filter((item) => item.post_id === post.id).length

    const postAnalyzed = postsAnalyzedMap.get(post.id!)
    if (!postAnalyzed) return null

    const negativeComments = commentsAnalysis
      .filter((item) => item.post_id === post.id)
      .filter((item) => item.emotion === 'negativo').length

    const positiveComments = commentsAnalysis
      .filter((item) => item.post_id === post.id)
      .filter((item) => item.emotion === 'positivo').length

    const neutralComments = commentsAmount - (negativeComments ?? 0) - (positiveComments ?? 0)

    return {
      post_topic_id: postAnalyzed.post_topic_id,
      instagram_post_id: post.id,
      post_date: post.postDate,
      tags: postAnalyzed.tags,
      post_engagement: postWithEngagement.post_engagement,
      comments_amount: commentsAmount,
      ammount_negative_comments: negativeComments,
      ammount_positive_comments: positiveComments,
      ammount_neutral_comments: neutralComments,
      createdat: new Date(),
      updatedat: new Date(),
    }
  }) as unknown as IGPostAnalysis[]

  const postAnalysisFiltered = postAnalysisToUpdate.filter((item) => item !== null)

  if (postAnalysisFiltered.length > 0) {
    for (const post of postAnalysisFiltered) {
      await prisma.post_analysis.update({
        where: { instagram_post_id: post.instagram_post_id },
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
export const getPostsToAnalyze = async (): Promise<IGPostEntity[]> => {
  const posts = await prisma.instagram_post.findMany({
    where: {
      post_analysis: {
        is: null,
      },
    },
  })
  return posts as unknown as IGPostEntity[]
}

/**
 * Analyzes posts that have not been analyzed yet, assigns topics, calculates engagement, and analyzes comments.
 * Creates post analysis records in the database.
 * @returns {Promise<PostEntity[]>} List of posts that have not been analyzed yet
 */
export const analyzePostsWithCommentsAnalyzed = async (
  categoryId: number
): Promise<IGPostEntity[]> => {
  const postsToAnalyze = await getPostsToAnalyze()
  const topics = await getAvailableTopics()
  const accounts = await getEnabledAccounts(categoryId)

  if (postsToAnalyze.length <= 0) return []

  const postsAnalysis: IGPostAnalysis[] = []
  for (const post of postsToAnalyze) {
    const account = accounts.find((item) => item.id === post.accountId)
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
      instagram_post_id: post.id!,
      post_date: post.postDate,
      tags: postTopic.tags.join(','),
    })
  }

  await createPostAnalysis(postsAnalysis)

  const postsFiltered = postsToAnalyze.filter((post) => {
    const postAnalysis = postsAnalysis.find(
      (item) => item.instagram_post_id === post.id && item.id !== 21
    )
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
  const allPosts = await prisma.instagram_post.findMany()
  const postsWithDuplicatedLink = allPosts.filter((post) => {
    const postsWithSameLink = allPosts.filter((item) => item.link === post.link)
    return postsWithSameLink.length > 1
  })

  const postWithMostComments = postsWithDuplicatedLink.sort(
    (a, b) => (b.numberOfComments ?? 0) - (a.numberOfComments ?? 0)
  )[0]

  const comments = await prisma.comment_entity.findMany({
    where: { postId: { in: postsWithDuplicatedLink.map((item) => item.id) } },
  })
  for (const comment of comments) {
    const commentAnalysis = await prisma.comment_analysis.findFirst({
      where: { comment_entity_id: comment.id },
    })
    if (commentAnalysis) {
      await prisma.comment_analysis.delete({ where: { id: commentAnalysis.id } })
    }

    await prisma.comment_entity.delete({ where: { id: comment.id } })
  }

  // delete posts analysis
  const postsAnalysis = await prisma.post_analysis.findMany({
    where: { instagram_post_id: { in: postsWithDuplicatedLink.map((item) => item.id) } },
  })
  for (const postAnalysis of postsAnalysis) {
    await prisma.post_analysis.delete({ where: { id: postAnalysis.id } })
  }

  for (const post of postsWithDuplicatedLink) {
    if (post.id !== postWithMostComments.id) {
      await prisma.instagram_post.delete({ where: { id: post.id } })
    }
  }

  return postsWithDuplicatedLink.length
}

export const updatePostsAnalysis = async (): Promise<number> => {
  try {
    const postsAnalysis = (await prisma.post_analysis.findMany({
      where: {
        comments_amount: null,
      },
    })) as unknown as IGPostAnalysis[]
    if (postsAnalysis.length <= 0) return 0

    // then get all posts where id is in the postsAnalysis
    const posts = (await prisma.instagram_post.findMany({
      where: {
        id: { in: postsAnalysis.map((item) => item.instagram_post_id) },
      },
    })) as unknown as IGPostEntity[]

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
  posts: IGPostEntity[]
): Promise<IGPostAnalysis[]> => {
  const accounts = await getEnabledAccounts(1)

  const postsWithEngagement = posts.map((post) => {
    const account = accounts.find((item) => item.instagram_user_account?.id === post.accountId)

    if (!account) return null

    const post_engagement = getPostEngagement(post, account.instagram_user_account!.followers)
    return {
      post_engagement,
      post_id: post.id,
    }
  }) as unknown as { post_engagement: number; post_id: number }[]

  const postsWithEngagementFiltered = postsWithEngagement.filter((item) => item !== null)
  const commentsAnalysis = (await prisma.comment_analysis.findMany({
    where: { post_id: { in: postsWithEngagementFiltered.map((item) => item.post_id) } },
  })) as unknown as IGCommentAnalysis[]

  const postAnalysisToUpdate = posts.map((post) => {
    const postWithEngagement = postsWithEngagementFiltered.find((item) => item.post_id === post.id)
    if (!postWithEngagement) return null

    const commentsAmount = commentsAnalysis.filter((item) => item.post_id === post.id).length

    const negativeComments = commentsAnalysis
      .filter((item) => item.post_id === post.id)
      .filter((item) => item.emotion === 'negativo').length

    const positiveComments = commentsAnalysis
      .filter((item) => item.post_id === post.id)
      .filter((item) => item.emotion === 'positivo').length

    const neutralComments = commentsAmount - (negativeComments ?? 0) - (positiveComments ?? 0)

    return {
      instagram_post_id: postWithEngagement.post_id,
      post_engagement: postWithEngagement.post_engagement,
      comments_amount: commentsAmount,
      ammount_negative_comments: negativeComments,
      ammount_positive_comments: positiveComments,
      ammount_neutral_comments: neutralComments,
      createdat: new Date(),
    }
  }) as unknown as IGPostAnalysis[]

  const postAnalysisFiltered = postAnalysisToUpdate.filter((item) => item !== null)

  if (postAnalysisFiltered.length > 0) {
    for (const post of postAnalysisFiltered) {
      await prisma.post_analysis.update({
        where: { instagram_post_id: post.instagram_post_id },
        data: post,
      })
    }
  }

  return postAnalysisFiltered
}
