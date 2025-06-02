import { Router } from 'express'
import { getInstagramData } from '../controllers/instagram.controller'

const router = Router()

router.get('/comments', getInstagramData)

export default router