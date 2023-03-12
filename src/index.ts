import express, { Express, Request, Response } from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'

import { callChatGPT } from './langchain.js'

dotenv.config()

const app: Express = express()
app.use(cors())
app.use(express.json())

app.get('/', async (req: Request, res: Response) => {
  res.status(200).send({
    message: 'Hello!',
  })
})

app.post('/', async (req: Request, res: Response) => {
  try {
    console.log('body req', req.body)

    const sdPayload = {
      prompt: 'cat',
      steps: 20,
      sampler_name: 'DPM++ 2M Karras',
    }

    const sdRes = await fetch('http://127.0.0.1:7861/sdapi/v1/txt2img', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sdPayload),
    })
    const sdJson = await sdRes.json()

    console.log('sdJson :>> ', sdJson)

    res.status(200).send({ image: sdJson.images[0] })
  } catch (err) {
    console.error('err :>> ', err)
    res.status(500).send({ err })
  }
})

app.listen(5000, () => console.log('Server running on http://localhost:5000'))
