import { Router } from 'express'
import { getInstagramProfileDataController } from '@/controllers/instagram.controller'

const router = Router()

router.get('/profile', getInstagramProfileDataController)

export default router
