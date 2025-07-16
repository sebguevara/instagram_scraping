/**
 * Extracts the username from a given Facebook URL.
 * @param {string} url - The Facebook URL to extract the username from
 * @returns {string | null} The extracted username or null if no match is found
 */
export const getFBUsername = (url: string): string | null => {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([^/?#]+)/i)
  return match ? match[1] : null
}
