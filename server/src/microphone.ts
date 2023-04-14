import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
// @ts-ignore
import mic from 'mic'
import { FileWriter } from 'wav'
import { Configuration, OpenAIApi } from 'openai'

// Load environment variables from .env file
dotenv.config()

// Configure OpenAI API
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY })
const openai = new OpenAIApi(configuration)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AUDIO_FILE_PATH = path.resolve(__dirname, 'audio.wav')

let micInstance: mic
let micInputStream
let outputFileStream

export function startRecording() {
  micInstance = mic({ rate: '44100', channels: '1', filetype: 'wav' })
  micInputStream = micInstance.getAudioStream()

  outputFileStream = new FileWriter(AUDIO_FILE_PATH, {
    sampleRate: 88200,
    channels: 1,
  })
  micInputStream.pipe(outputFileStream)
  micInstance.start()
  console.log('Recording audio...', AUDIO_FILE_PATH)
}

export async function getRecordingTranscript(): Promise<string> {
  micInstance.stop()
  console.log('Audio recorded. Sending to Whisper API...')

  try {
    const audioReadStream = fs.createReadStream(AUDIO_FILE_PATH)
    const response = await openai.createTranscription(
      // @ts-ignore
      audioReadStream,
      'whisper-1',
    )
    // console.log('Transcript:', response)

    return response.data.text
  } catch (error) {
    console.error('Error during transcription:', error)

    return String(error)
  }
}
