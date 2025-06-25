export interface ApifyFBPostResponse {
  facebookUrl: string
  postId: string
  pageName: string
  url: string
  time: string
  timestamp: number
  user: User
  text: string
  link?: string
  previewTitle?: string
  previewDescription?: string
  previewSource?: string
  previewTarget?: PreviewTarget
  likes: number
  shares: number
  topReactionsCount: number
  media: Media[]
  feedbackId: string
  topLevelUrl: string
  facebookId: string
  pageAdLibrary: PageAdLibrary
  inputUrl: string
  textReferences?: TextReference[]
  comments?: number
  isVideo?: boolean
  viewsCount?: number
}

interface TextReference {
  url: string
  external_url?: string
  web_link?: Weblink
  mobileUrl: string
  id: string
}

interface Weblink {
  __typename: string
  url: string
  fbclid: null
  lynx_mode: string
}

interface PageAdLibrary {
  is_business_page_active: boolean
  id: string
}

interface Media {
  thumbnail?: string
  __typename?: string
  __isMedia?: string
  flexible_height_share_image?: null
  large_share_image?: Largeshareimage
  id?: string
  thumbnailImage?: ThumbnailImage
  is_clipping_enabled?: boolean
  live_rewind_enabled?: boolean
  owner?: Owner
  playable_duration_in_ms?: number
  is_huddle?: boolean
  url?: string
  if_viewer_can_use_latency_menu?: null
  if_viewer_can_use_latency_menu_toggle?: null
  captions_url?: null | string
  video_available_captions_locales?: Videoavailablecaptionslocale[]
  if_viewer_can_see_community_moderation_tools?: null
  if_viewer_can_use_live_rewind?: null
  if_viewer_can_use_clipping?: null
  if_viewer_can_see_costreaming_tools?: null
  video_player_scrubber_base_content_renderer?: null
  video_player_scrubber_preview_renderer?: Videoplayerscrubberpreviewrenderer
  recipient_group?: null
  music_attachment_metadata?: null
  video_container_type?: string
  breakingStatus?: boolean
  videoId?: string
  isPremiere?: boolean
  liveViewerCount?: number
  rehearsalInfo?: null
  is_gaming_video?: boolean
  is_live_audio_room_v2_broadcast?: boolean
  publish_time?: number
  live_speaker_count_indicator?: null
  can_viewer_share?: boolean
  end_cards_channel_info?: Endcardschannelinfo
  is_soundbites_video?: boolean
  is_looping?: boolean
  info?: Info
  animated_image_caption?: null
  width?: number
  height?: number
  broadcaster_origin?: null
  broadcast_id?: null
  broadcast_status?: null
  is_live_streaming?: boolean
  is_live_trace_enabled?: boolean
  is_video_broadcast?: boolean
  is_podcast_video?: boolean
  loop_count?: number
  is_spherical?: boolean
  is_spherical_enabled?: boolean
  unsupported_browser_message?: null
  can_play_undiscoverable?: boolean
  pmv_metadata?: null
  latency_sensitive_config?: null
  live_playback_instrumentation_configs?: null
  is_ncsr?: boolean
  permalink_url?: string
  dash_prefetch_experimental?: string[]
  video_status_type?: string
  can_use_oz?: boolean
  dash_manifest?: string
  dash_manifest_url?: string
  min_quality_preference?: null
  audio_user_preferred_language?: string
  is_rss_podcast_video?: boolean
  browser_native_sd_url?: string
  browser_native_hd_url?: string
  spherical_video_fallback_urls?: null
  is_latency_menu_enabled?: boolean
  fbls_tier?: null
  is_latency_sensitive_broadcast?: boolean
  comet_video_player_static_config?: string
  comet_video_player_context_sensitive_config?: string
  video_player_shaka_performance_logger_init?: Videoplayershakaperformanceloggerinit
  video_player_shaka_performance_logger_should_sample?: boolean
  video_player_shaka_performance_logger_init2?: Videoplayershakaperformanceloggerinit2
  autoplay_gating_result?: string
  viewer_autoplay_setting?: string
  can_autoplay?: boolean
  drm_info?: string
  p2p_settings?: null
  audio_settings?: null
  captions_settings?: null
  broadcast_low_latency_config?: null
  audio_availability?: string
  muted_segments?: unknown[]
  spherical_video_renderer?: null
  preferred_thumbnail?: Preferredthumbnail
  video_imf_data?: null
  original_width?: number
  original_height?: number
  original_rotation?: string
  if_viewer_can_see_pay_to_access_paywall?: null
  comet_video_player_audio_overlay_renderer?: null
  comet_video_player_audio_background_renderer?: null
  comet_video_player_music_sprout_background_renderer?: null
  clip_fallback_cover?: null
  is_clip?: boolean
  matcha_related_keywords_links?: string[]
  is_music_clip?: boolean
  video_collaborator_page_or_delegate_page?: null
  video_anchor_tag_info?: null
  image?: Largeshareimage
  canonical_uri_with_fallback?: string
  photo_image?: Largeshareimage
  accent_color?: string
  photo_product_tags?: unknown[]
  ocrText?: string
  mediaset_token?: string
  comet_product_tag_feed_overlay_renderer?: null
  is_playable?: boolean
  photo_cix_screen?: null
  copyright_banner_info?: null
}

interface Preferredthumbnail {
  image: ThumbnailImage
  image_preview_payload: null | string
  id: string
}

interface Videoplayershakaperformanceloggerinit2 {
  __typename: string
  __module_operation_useVideoPlayerShakaPerformanceLoggerBuilder_video: ModuleoperationVideoPlayerScrubberPreviewvideo
  __module_component_useVideoPlayerShakaPerformanceLoggerBuilder_video: ModuleoperationVideoPlayerScrubberPreviewvideo
  per_session_sampling_rate: null
}

interface Videoplayershakaperformanceloggerinit {
  __typename: string
  __module_operation_useVideoPlayerShakaPerformanceLoggerRelayImpl_video: ModuleoperationVideoPlayerScrubberPreviewvideo
  __module_component_useVideoPlayerShakaPerformanceLoggerRelayImpl_video: ModuleoperationVideoPlayerScrubberPreviewvideo
}

interface Info {
  video_chaining_caller: string
  video_channel_entry_point: string
  video_id: string
  __module_operation_useVideoPlayerWatchPauseScreenWithActions_video: ModuleoperationVideoPlayerScrubberPreviewvideo
  __module_component_useVideoPlayerWatchPauseScreenWithActions_video: ModuleoperationVideoPlayerScrubberPreviewvideo
}

interface Endcardschannelinfo {
  video_chaining_caller: string
  video_channel_entry_point: string
  video: Video2
  __module_operation_useVideoPlayerWatchEndScreenWithActions_video: ModuleoperationVideoPlayerScrubberPreviewvideo
  __module_component_useVideoPlayerWatchEndScreenWithActions_video: ModuleoperationVideoPlayerScrubberPreviewvideo
}

interface Video2 {
  id: string
  can_viewer_share: boolean
  creation_story: Creationstory
}

interface Creationstory {
  shareable: null
  id: string
}

interface Videoplayerscrubberpreviewrenderer {
  __typename: string
  video: Video
  __module_operation_VideoPlayerScrubberPreview_video: ModuleoperationVideoPlayerScrubberPreviewvideo
  __module_component_VideoPlayerScrubberPreview_video: ModuleoperationVideoPlayerScrubberPreviewvideo
}

interface ModuleoperationVideoPlayerScrubberPreviewvideo {
  __dr: string
}

interface Video {
  scrubber_preview_thumbnail_information: Scrubberpreviewthumbnailinformation
  id: string
}

interface Scrubberpreviewthumbnailinformation {
  sprite_uris: string[]
  thumbnail_width: number
  thumbnail_height: number
  has_preview_thumbnails: boolean
  num_images_per_row: number
  max_number_of_images_per_sprite: number
  time_interval_between_image: number
}

interface Videoavailablecaptionslocale {
  localized_creation_method: string
  captions_url: string
  locale: string
  localized_language: string
  localized_country: null
}

interface Owner {
  __typename: string
  id: string
}

interface ThumbnailImage {
  uri: string
}

interface Largeshareimage {
  height: number
  uri: string
  width: number
}

interface PreviewTarget {
  __typename: string
  article_author: null
  external_url: string
  id: string
}

interface User {
  id: string
  name: string
  profileUrl: string
  profilePic: string
}
