import express, { Express, Request, Response } from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import multer from 'multer'

import * as dotenv from 'dotenv'
dotenv.config()

import GameManager from './GameManager.js'

import { CustomPDFLoader } from './pdfUtils/customPDFLoader.js'
import { run } from './pdfUtils/embedPdf.js'
import { run as runReadPdf } from './pdfUtils/queryPdf.js'

// Setup
const app: Express = express()
app.use(cors())
app.use(express.json())
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })
const gameInstance = GameManager(io)

io.on('connection', (socket) => {
  console.log('a user connected')

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

app.get('/', async (req: Request, res: Response) => {
  res.status(200).send({ message: 'Hello!' })
})
// Setup end

// Start game
app.post('/', async (req: Request, res: Response) => {
  try {
    console.log('body req', req.body)

    gameInstance.init()

    res.status(200).send({ res: 'success' })
  } catch (err) {
    console.error('err :>> ', err)
    res.status(500).send({ err })
  }
})

// Handle pdf
const upload = multer()
app.post('/pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    console.log('body req', req.body)
    // Read the contents of the uploaded file using Buffer
    // @ts-ignore
    const fileContents = new Blob([req.file.buffer], {
      // @ts-ignore
      type: req.file.mimetype,
    })

    // console.log('req :>> ', req)
    // console.log('req.body :>> ', req.body)
    // console.log('req.formdata() :>> ', formData.get('pdf'))
    const pdfLoader = new CustomPDFLoader(fileContents)
    const pdfContents = await pdfLoader.load()
    await run(pdfContents)
    console.log('pdfRes :>> ', pdfContents)

    res.status(200).send({ res: 'success' })
  } catch (err) {
    console.error('err :>> ', err)
    res.status(500).send({ err })
  }
})

app.post('/pdf-query', async (req: Request, res: Response) => {
  try {
    await runReadPdf()

    res.status(200).send({ res: 'success' })
  } catch (err) {
    console.error('err :>> ', err)
    res.status(500).send({ err })
  }
})

httpServer.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
})
