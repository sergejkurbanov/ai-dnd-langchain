import express, { Express, Request, Response } from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

import * as dotenv from 'dotenv'
dotenv.config()

import GameManager from './GameManager.js'

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

  // socket.on('newPlayerChoice', (newPlayerChoice) => {
  //   console.log('New player choice :>> ', newPlayerChoice)
  //   gameInstance.generateNextScene(newPlayerChoice)
  // })
})

app.get('/', async (req: Request, res: Response) => {
  res.status(200).send({
    message: 'Hello!',
  })
})
// Setup end

// Start game
app.post('/', async (req: Request, res: Response) => {
  try {
    console.log('body req', req.body)

    gameInstance.start()

    res.status(200).send({ res: 'success' })
  } catch (err) {
    console.error('err :>> ', err)
    res.status(500).send({ err })
  }
})

httpServer.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
})
