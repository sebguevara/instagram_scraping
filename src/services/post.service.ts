import { apifyClient } from '@/config/apify'
import { prisma } from '@/config/prisma'
import { APIFY_ACTORS } from '@/const'
import { mapApifyCommentToComment } from '@/mappers/comment.mapper'
import { mapApifyPostToPost } from '@/mappers/post.mapper'
import { getUsername, getPostByUrl } from '@/utils'
import type { ApifyCommentResponse, CommentEntity } from '@/interfaces/comment'
import type { ApifyPostResponse, PostEntity } from '@/interfaces/post'

export const createPostComments = async () => {
  const accounts = await prisma.account_entity.findMany({ where: { enabled: 'TRUE' } })
  const accountsMap = new Map(
    accounts.map((account) => [getUsername(account.accountURL), account.id])
  )

  const posts = await getCreatedPosts(accountsMap)
  if (posts.length <= 0) throw new Error('No posts to create')

  const comments = await getCreatedComments(posts)
  if (comments.length <= 0) throw new Error('No comments to create')

  return { posts, comments }
}

const getCreatedPosts = async (accountsMap: Map<string | null, number>) => {
  const { defaultDatasetId } = await apifyClient.actor(APIFY_ACTORS.POST_ACTOR).call({
    username: Array.from(accountsMap.keys()),
    skipPinnedPosts: true,
    onlyPostsNewerThan: '1 days',
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyPostResponse[]

  if (data.length <= 0) throw new Error('No data found')
  const dataFiltered = data.filter((item) => accountsMap.has(item.ownerUsername))

  const posts = await prisma.instagram_post.findMany({
    where: { link: { in: dataFiltered.map((item) => item.url) } },
  })

  let postsFiltered: ApifyPostResponse[] = dataFiltered
  if (posts.length > 0) {
    postsFiltered = dataFiltered.filter((item) => !posts.some((post) => post.link === item.url))
  }

  const postsToCreate = postsFiltered.map((item) =>
    mapApifyPostToPost(item, accountsMap.get(item.ownerUsername)!)
  )

  await prisma.instagram_post.createMany({ data: postsToCreate })

  const postsCreated = (await prisma.instagram_post.findMany({
    where: { link: { in: data.map((item) => item.url) } },
  })) as unknown as PostEntity[]

  return postsCreated
}

const getCreatedComments = async (posts: PostEntity[]) => {
  const igIdPostIdMap = new Map(posts.map((item) => [getPostByUrl(item.link), item.id]))

  const { defaultDatasetId } = await apifyClient.actor(APIFY_ACTORS.COMMENT_ACTOR).call({
    startUrls: posts.map((item) => item.link),
    maxItems: 2000,
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyCommentResponse[]

  if (data.length <= 0) throw new Error('No data found')

  const dataFiltered = data.filter((item) => !item.noResults)
  const commentsToCreate = dataFiltered.map((item) =>
    mapApifyCommentToComment(item, igIdPostIdMap.get(item.postId)!)
  )

  if (commentsToCreate.length <= 0) throw new Error('No comments to create')

  const createdComments = await prisma.comment_entity.createMany({ data: commentsToCreate })

  return createdComments as unknown as CommentEntity[]
}
