import type { Response, Request } from 'express'
import { InstagramService } from '../services/instagram.service'

const instagramService = new InstagramService()

export const getInstagramData = async (req: Request, res: Response) => {
    try {
        const data = await instagramService.getInstagramData()
        res.status(200).json(data)
    } catch (error: unknown) {
        res.status(500).json({ message: (error as Error).message })
    }
}
