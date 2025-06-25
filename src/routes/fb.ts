import { Router } from 'express'
import {
  createPostCommentsController,
  createProfileHistoryController,
  scrapCommentsByDateController,
  scrapJustPostsController,
  syncPostCommentsController,
} from '@/controllers/fb.controller'

const router = Router()

router.get('/profile', createProfileHistoryController)
router.get('/post', createPostCommentsController)
router.get('/post/scrap', scrapJustPostsController)
router.get('/comments/sync', syncPostCommentsController)
router.get('/comments/scrap', scrapCommentsByDateController)

export default router
