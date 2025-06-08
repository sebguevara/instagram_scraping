import type { Response, Request } from 'express'
import { createProfileHistory } from '@/services/profile.service'
import { createPostComments } from '@/services/post.service'
import { createTestPostComments } from '@/services/post.service.test'

export const createProfileHistoryController = async (req: Request, res: Response) => {
  try {
    const data = await createProfileHistory()
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}

export const createPostCommentsController = async (req: Request, res: Response) => {
  try {
    const data = await createPostComments()
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}

export const createTestPostCommentsController = async (req: Request, res: Response) => {
  try {
    const data = await createTestPostComments()
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}
