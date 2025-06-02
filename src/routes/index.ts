import { Router } from 'express'
import { readdirSync } from 'fs'

const PATH_ROUTES = `${__dirname}`

const router = Router()

const cleanFileName = (fileName: string) => {
    const file = fileName.split('.').shift() || ''
    return file
}

const importedModules: { [key: string]: any } = {}

readdirSync(PATH_ROUTES).forEach((fileName) => {
    const file = cleanFileName(fileName)
    if (file === 'index' || importedModules[file]) return

    importedModules[file] = true

    import(`${PATH_ROUTES}/${file}`).then((module) => {
        router.use(`/${file}`, module.default)
    })
})

export default router