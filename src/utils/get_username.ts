export const getUsername = (url: string): string | null => {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i)
  return match ? match[1] : null
}
