import { Router } from 'express'
import {
  createPostCommentsController,
  createProfileHistoryController,
  removeAllDuplicatedPostsController,
  scrapCommentsByDateController,
  scrapJustPostsController,
  syncPostCommentsController,
  updatePostsAnalysisController,
} from '@/controllers/ig.controller'

const router = Router()

router.get('/profile', createProfileHistoryController)
router.get('/post', createPostCommentsController)
router.get('/post/scrap', scrapJustPostsController)
router.get('/comments/sync', syncPostCommentsController)
router.get('/comments/scrap', scrapCommentsByDateController)
router.get('/post/remove-duplicated', removeAllDuplicatedPostsController)
router.get('/post/update-analysis', updatePostsAnalysisController)

export default router
