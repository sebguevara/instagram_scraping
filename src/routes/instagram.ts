import { Router } from 'express'
import {
  createPostCommentsController,
  createProfileHistoryController,
  createTestPostCommentsController,
} from '@/controllers/instagram.controller'

const router = Router()

router.get('/profile', createProfileHistoryController)
router.get('/post', createPostCommentsController)
router.get('/post/test', createTestPostCommentsController)

export default router
