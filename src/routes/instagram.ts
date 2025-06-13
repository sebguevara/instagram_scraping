import { Router } from 'express'
import {
  createPostCommentsController,
  createProfileHistoryController,
  syncPostCommentsController,
} from '@/controllers/instagram.controller'

const router = Router()

router.get('/profile', createProfileHistoryController)
router.get('/post', createPostCommentsController)
router.get('/comments/sync', syncPostCommentsController)

export default router
