import { Router } from 'express'
import { createPostCommentsController } from '@/controllers/fb.controller'

const router = Router()

router.get('/post', createPostCommentsController)

export default router
