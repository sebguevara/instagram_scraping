export const getIdFromUrl = (url: string) => {
  const commentId = url.split('comment_id=')[1]
  return commentId
}
