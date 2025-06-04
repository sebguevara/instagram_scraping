export const getPostByUrl = (url: string): string | null => {
  const match = url.match(/(?:instagram\.com\/(?:p|reel)\/)([^/?#&]+)/i)
  return match ? match[1] : null
}
