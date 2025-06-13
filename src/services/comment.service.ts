import { prisma } from '@/config'

/**
 * Sincroniza la cantidad de comentarios de cada post con la cantidad real de
 * comentarios almacenados en la tabla `comment_entity`.  De esta forma los
 * resultados de las consultas que utilizan `instagram_post.numberOfComments`
 * y las que contabilizan registros en `comment_entity` devolverán el mismo
 * valor.
 *
 * Además devuelve un resumen con los posts que fueron actualizados para poder
 * realizar verificaciones o auditorías posteriores.
 *
 * @returns {Promise<{ postsUpdated: number; details: { postId: number; titulo: string; cantOriginal: number; cantReal: number }[]; status: string }>}
 * @throws {Error} Si no se encuentran posts almacenados en la base de datos.
 */
export const syncPostCommentCounts = async (): Promise<{
  postsUpdated: number
  details: { postId: number; titulo: string; cantOriginal: number; cantReal: number; cantAnalysis: number }[]
  status: string
}> => {
  // Obtiene todos los posts con sus comentarios asociados
  const posts = await prisma.instagram_post.findMany({
    include: {
      comment_entity: true,
      comment_analysis: true,
    },
  })

  if (posts.length === 0) throw new Error('No se encontraron posts en la base de datos')

  let postsUpdated = 0
  const details: { postId: number; titulo: string; cantOriginal: number; cantReal: number; cantAnalysis: number }[] = []

  // Recorre los posts y compara el valor almacenado con la cantidad real
  for (const post of posts) {
    const realCount = post.comment_entity.length
    const analysisCount = post.comment_analysis.length
    const originalCount = post.numberOfComments ?? 0

    const needsUpdate = realCount !== originalCount
    const hasMismatch = needsUpdate || realCount !== analysisCount

    if (needsUpdate) {
      // Actualiza el valor de numberOfComments con la cantidad real
      await prisma.instagram_post.update({
        where: { id: post.id },
        data: { numberOfComments: realCount },
      })
      postsUpdated++
    }

    if (hasMismatch) {
      details.push({
        postId: post.id,
        titulo: post.title,
        cantOriginal: originalCount,
        cantReal: realCount,
        cantAnalysis: analysisCount,
      })
    }
  }

  return {
    postsUpdated,
    details,
    status: 'success',
  }
}