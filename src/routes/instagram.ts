import { Router } from 'express'
import {
  createPostCommentsController,
  createProfileHistoryController,
  scrapCommentsByDateController,
  syncPostCommentsController,
} from '@/controllers/instagram.controller'

const router = Router()

router.get('/profile', createProfileHistoryController)
router.get('/post', createPostCommentsController)
router.get('/comments/sync', syncPostCommentsController)
router.get('/comments/scrap', scrapCommentsByDateController)

export default router
