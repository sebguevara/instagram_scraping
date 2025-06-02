import { prisma } from '../config/prisma'

export class InstagramService {
    getInstagramData = async () => {
        const instagramData = await prisma.comment.findMany()
        return instagramData
    }
}