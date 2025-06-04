import { Router } from 'express'
import {
  createPostCommentsController,
  createProfileHistoryController,
} from '@/controllers/instagram.controller'

const router = Router()

router.get('/profile', createProfileHistoryController)
router.get('/post', createPostCommentsController)

export default router
