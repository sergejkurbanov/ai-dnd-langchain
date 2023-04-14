// @ts-ignore
import { keyboard, Key } from '@nut-tree/nut-js'
import { uIOhook, UiohookKey } from 'uiohook-napi'
import player from 'play-sound'

import { startRecording, getRecordingTranscript } from './microphone.js'
import { callChatGPT } from './callGPT.js'
import { generateSpeech } from './helpers.js'

let isRecordKeyPressed = false

uIOhook.on('keydown', (e) => {
  if (e.keycode === UiohookKey.F8 && !isRecordKeyPressed) {
    isRecordKeyPressed = true
    // console.log('F7 pressed')
    startRecording()
  }
})

uIOhook.on('keyup', async (e) => {
  if (e.keycode === UiohookKey.F8 && isRecordKeyPressed) {
    isRecordKeyPressed = false
    // console.log('F7 unpressed')
    const recordingTranscript = await getRecordingTranscript()
    console.log('recordingTranscript :>> ', recordingTranscript)

    const gptResponse = await callChatGPT({
      systemMessage:
        'You are a helpful assistant. Keep it brief and to the point.',
      history: [recordingTranscript],
    })

    await generateSpeech(gptResponse.text)

    // const res = await fetch('http://127.0.0.1:8000/create_sound', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text: gptResponse.text }),
    // })

    // const myPlayer = player()
    // myPlayer.play('./python-tts.wav', function (err) {
    //   console.log('err playing :>> ', err)

    //   if (err) throw err
    // })
  }
})

// Register and start hook
uIOhook.start()

console.log('running assistant')
