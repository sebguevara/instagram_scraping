import { Router } from 'express'
import {
  createPostCommentsController,
  createProfileHistoryController,
  syncPostCommentsController,
} from '@/controllers/fb.controller'

const router = Router()

router.get('/post', createPostCommentsController)
router.get('/comments/sync', syncPostCommentsController)
router.get('/profile', createProfileHistoryController)

export default router
