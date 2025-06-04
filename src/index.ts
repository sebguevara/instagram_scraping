import express from 'express'
import { createServer } from 'http'
import bodyParser from 'body-parser'
import cors from 'cors'
import indexRoutes from './routes/index'

const app: express.Application = express()
const port: number = parseInt(process.env.PORT || '4200')
const server = createServer(app)

const startServer = (callback: () => void) => {
  server.listen(port, () => {
    callback()
  })
}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static('public'))

app.options(/(.*)/, cors())
app.use(
  cors({
    origin: '*',
    credentials: true,
    allowedHeaders: 'Content-Type',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  })
)

app.use('/api/v1/', indexRoutes)

startServer(() => {
  console.log(`Server running on port ${port}`)
})
