import type { Response, Request } from 'express'
import { getInstagramProfileData } from '@/services/instagram.service'

export const getInstagramProfileDataController = async (req: Request, res: Response) => {
  try {
    const data = await getInstagramProfileData()
    res.status(200).json(data)
  } catch (error: unknown) {
    console.error(error)
    res.status(500).json({ message: (error as Error).message })
  }
}
