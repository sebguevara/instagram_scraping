/**
 * Extracts the username from a given Instagram URL.
 * @param {string} url - The Instagram URL to extract the username from
 * @returns {string | null} The extracted username or null if no match is found
 */
export const getUsername = (url: string): string | null => {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i)
  return match ? match[1] : null
}
