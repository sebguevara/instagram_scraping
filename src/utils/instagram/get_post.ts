/**
 * Extracts the post ID from a given Instagram URL.
 * @param {string} url - The Instagram URL to extract the post ID from
 * @returns {string | null} The extracted post ID or null if no match is found
 */
export const getPostByUrl = (url: string): string | null => {
  const match = url.match(/(?:instagram\.com\/(?:p|reel)\/)([^/?#&]+)/i)
  return match ? match[1] : null
}
