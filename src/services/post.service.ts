import { apifyClient, prisma } from '@/config'
import { mapApifyCommentToComment, mapApifyPostToPost } from '@/mappers'
import {
  getAnalyzedComment,
  getPostByUrl,
  getPostTopic,
  getUsername,
  getPostEngagement,
} from '@/utils'
import type {
  ApifyPostResponse,
  PostEntity,
  PostTopic,
  PostAnalysis,
  ApifyCommentResponse,
  CommentEntity,
  AccountEntity,
  CommentAnalysisEntity,
} from '@/interfaces'
import { APIFY_ACTORS } from '@/const'
import pLimit from 'p-limit'

export const createPostComments = async () => {
  const topics = (await prisma.post_topic.findMany()) as unknown as PostTopic[]
  if (topics.length <= 0) throw new Error('No topics found')

  const accounts = (await prisma.account_entity.findMany({
    where: { enabled: 'TRUE' },
    include: { instagram_user_account: true },
  })) as unknown as AccountEntity[]

  const posts = await getPosts(accounts)

  const postsFromDb = (await prisma.instagram_post.findMany({
    where: {
      link: { in: posts.map((item) => item.link) },
    },
  })) as unknown as PostEntity[]

  const postsToAnalyze = await analyzePosts(postsFromDb, topics, accounts)
  console.log('Done')

  return postsToAnalyze
}

const getPosts = async (accounts: AccountEntity[]) => {
  const accountsMap = new Map(
    accounts.map((account) => [getUsername(account.accountURL), account.id])
  ) as Map<string | null, number>
  const { defaultDatasetId } = await apifyClient.actor(APIFY_ACTORS.POST_ACTOR).call({
    username: Array.from(accountsMap.keys()),
    skipPinnedPosts: true,
    onlyPostsNewerThan: '4 days',
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyPostResponse[]

  if (data.length <= 0) throw new Error('No data found')
  const dataFiltered = data.filter((item) => accountsMap.has(item.ownerUsername))
  const postsMapped: PostEntity[] = dataFiltered.map((item) =>
    mapApifyPostToPost(item, accountsMap.get(item.ownerUsername)!)
  )
  const posts = await prisma.instagram_post.findMany({
    where: { link: { in: dataFiltered.map((item) => item.url) } },
  })

  for (const post of posts) {
    const postData = postsMapped.find((item) => item.link === post.link)
    if (!postData) continue
    await prisma.instagram_post.update({ where: { id: post.id }, data: postData })
  }

  let postsToCreate: PostEntity[] = postsMapped
  if (posts.length > 0) {
    postsToCreate = postsMapped.filter((item) => !posts.some((post) => post.link === item.link))
  }

  await prisma.instagram_post.createMany({ data: postsToCreate })

  return postsMapped
}

const analyzePosts = async (
  posts: PostEntity[],
  topics: PostTopic[],
  accounts: AccountEntity[]
) => {
  const postsAnalysis = (await Promise.all(
    posts.map(async (post) => {
      const postTopic = await getPostTopic(post.title, topics)
      return {
        post_topic_id: Number(postTopic.id),
        instagram_post_id: post.id,
        post_date: post.postDate,
      }
    })
  )) as unknown as PostAnalysis[]

  const postAnalysisFiltered = postsAnalysis.filter(
    (item) => item.post_topic_id !== topics.find((topic) => topic.topic === 'Sorteo')?.id
  )

  const postsToAnalyze = posts.filter((post) =>
    postAnalysisFiltered.some((item) => item.instagram_post_id === post.id)
  )

  await createComments(postsToAnalyze)
  const commentsAnalysis = (await prisma.comment_analysis.findMany({
    where: { post_id: { in: postsToAnalyze.map((item) => item.id!) } },
  })) as unknown as CommentAnalysisEntity[]

  if (commentsAnalysis.length <= 0) {
    throw new Error('No comments analysis found')
  }

  const postsWithEngagement = postsToAnalyze.map((post) => {
    const account = accounts.find((item) => item.id === post.accountId)
    if (!account) return null
    const post_engagement = getPostEngagement(post, account.instagram_user_account!.followers)
    return {
      post_engagement,
      post_id: post.id!,
    }
  }) as unknown as { post_engagement: number; post_id: number }[]

  await createPostAnalysis(postsAnalysis, postsWithEngagement, commentsAnalysis)
  return postsToAnalyze
}

const createComments = async (posts: PostEntity[]) => {
  const igIdPostIdMap = new Map(posts.map((item) => [getPostByUrl(item.link), item.id]))

  const { defaultDatasetId } = await apifyClient.actor(APIFY_ACTORS.COMMENT_ACTOR).call({
    startUrls: posts.map((item) => item.link),
    maxItems: 4000,
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyCommentResponse[]

  if (data.length <= 0) throw new Error('No data found')

  const dataFiltered = data.filter(
    (item) =>
      !item.noResults &&
      data.filter(
        (other) =>
          item.postId === other.postId &&
          item.user.username === other.user.username &&
          item.message === other.message
      ).length === 1
  )

  const commentsMapped = dataFiltered.map((item) =>
    mapApifyCommentToComment(item, igIdPostIdMap.get(item.postId)!)
  )

  const commentsInDb = await prisma.comment_entity.findMany({
    where: { instagramid: { in: commentsMapped.map((item) => item.instagramid!) } },
  })

  for (const comment of commentsInDb) {
    const commentData = commentsMapped.find((item) => item.instagramid === comment.instagramid)
    if (!commentData) continue
    await prisma.comment_entity.update({ where: { id: comment.id }, data: commentData })
  }

  const commentsToCreate = commentsMapped.filter(
    (item) => !commentsInDb.some((comment) => comment.instagramid === item.instagramid)
  )

  if (commentsToCreate.length > 0) {
    await prisma.comment_entity.createMany({ data: commentsToCreate })
  }

  const allComments = (await prisma.comment_entity.findMany({
    where: { instagramid: { in: commentsMapped.map((item) => item.instagramid!) } },
  })) as unknown as CommentEntity[]

  const commentAnalysis = await createCommentAnalysis(allComments)
  return commentAnalysis
}

const createCommentAnalysis = async (comments: CommentEntity[]) => {
  const limit = pLimit(20)
  const commentAnalysis = (await Promise.all(
    comments.map((comment) =>
      limit(async () => {
        const commentAnalysis = await getAnalyzedComment(comment.comment)
        return {
          comment_entity_id: comment.id!,
          post_id: comment.postId,
          emotion: commentAnalysis.emotion,
          topic: commentAnalysis.topic,
          request: commentAnalysis.request,
          analyzedat: new Date(),
          updatedat: new Date(),
        }
      })
    )
  )) as unknown as CommentAnalysisEntity[]

  const commentAnalysisInDb = await prisma.comment_analysis.findMany({
    where: { comment_entity_id: { in: commentAnalysis.map((item) => item.comment_entity_id) } },
  })

  const commentAnalysisToUpdate = commentAnalysisInDb.filter(
    (item) =>
      !commentAnalysis.some((comment) => comment.comment_entity_id === item.comment_entity_id)
  )

  if (commentAnalysisToUpdate.length > 0) {
    for (const comment of commentAnalysisToUpdate) {
      const commentAnalysisToUpdate = commentAnalysis.find(
        (item) => item.comment_entity_id === comment.comment_entity_id
      )
      if (!commentAnalysisToUpdate) continue
      await prisma.comment_analysis.update({
        where: { id: comment.id },
        data: commentAnalysisToUpdate,
      })
    }
  }

  const commentAnalysisToCreate = commentAnalysis.filter(
    (item) =>
      !commentAnalysisInDb.some((comment) => comment.comment_entity_id === item.comment_entity_id)
  )

  await prisma.comment_analysis.createMany({ data: commentAnalysisToCreate })
  return commentAnalysis
}

const createPostAnalysis = async (
  posts: PostAnalysis[],
  postsWithEngagement: { post_engagement: number; post_id: number }[],
  commentsAnalysis: CommentAnalysisEntity[]
) => {
  const postAnalysis = posts.map((post) => {
    const postWithEngagement = postsWithEngagement.find(
      (item) => item.post_id === post.instagram_post_id
    )
    const commentsAmount = commentsAnalysis.filter(
      (item) => item.post_id === post.instagram_post_id
    ).length

    const negativeComments = commentsAnalysis.filter(
      (item) => item.post_id === post.instagram_post_id && item.emotion === 'negativo'
    ).length

    const positiveComments = commentsAnalysis.filter(
      (item) => item.post_id === post.instagram_post_id && item.emotion === 'positivo'
    ).length

    const neutralComments = commentsAmount - negativeComments - positiveComments
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

  const postAnalysisFiltered = postAnalysis.filter((item) => item !== null)

  const postAnalysisInDb = await prisma.post_analysis.findMany({
    where: { instagram_post_id: { in: posts.map((item) => item.instagram_post_id) } },
  })

  const postAnalysisToCreate = postAnalysisFiltered.filter(
    (item) => !postAnalysisInDb.some((post) => post.instagram_post_id === item.instagram_post_id)
  )

  await prisma.post_analysis.createMany({ data: postAnalysisToCreate })
  return postAnalysisToCreate
}
