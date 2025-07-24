// Apify actors
export const APIFY_IG_ACTORS = {
  PROFILE_ACTOR: 'dSCLg0C3YEZ83HzYX',
  POST_ACTOR: 'nH2AHrwxeTRJoN5hX',
  COMMENT_ACTOR: 'RA9pXL2RPtBbFamco',
}

// Post actor params
export const POST_IG_ACTOR_PARAMS = {
  skipPinnedPosts: true,
  resultsLimit: 1000,
}

// Comment actor params
export const COMMENT_IG_ACTOR_PARAMS = {
  maxItems: 10000,
}

// COMMENT_ACTOR: 'iQjl9u4oXg67cdRAj',
export const APIFY_FB_ACTORS = {
  POST_ACTOR: 'KoJrdxJCTtpon81KY',
  COMMENT_ACTOR: 'us5srxAYnsrkgUv2v',
  PROFILE_ACTOR: '4Hv5RhChiaDk6iwad',
}

export const FB_POST_ACTOR_PARAMS = {
  resultsLimit: 4000,
}

export const COMMENT_FB_ACTOR_PARAMS = {
  includeNestedComments: false,
  resultsLimit: 10000,
}
