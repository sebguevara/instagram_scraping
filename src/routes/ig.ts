import { Router } from 'express'
import {
  createPostCommentsController,
  createProfileHistoryController,
  removeAllDuplicatedPostsController,
  scrapCommentsByDateController,
  scrapJustPostsController,
  syncPostCommentsController,
} from '@/controllers/ig.controller'

const router = Router()

router.get('/profile', createProfileHistoryController)
router.get('/post', createPostCommentsController)
router.get('/post/scrap', scrapJustPostsController)
router.get('/comments/sync', syncPostCommentsController)
router.get('/comments/scrap', scrapCommentsByDateController)
router.get('/post/remove-duplicated', removeAllDuplicatedPostsController)

export default router
