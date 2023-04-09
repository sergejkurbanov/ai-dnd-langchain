import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'
import { SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk'
import * as readline from 'readline'
import * as fs from 'fs'
import player from 'play-sound'
import * as dotenv from 'dotenv'

dotenv.config()

export const generateSDImage = async (prompt: string): Promise<string> => {
  if (!prompt) return ''
  prompt = prompt
    .toLowerCase()
    .replaceAll(
      'protagonist',
      'dwarf wizard wearing a gray hat and a red cloak wielding a wooden staff',
    )

  try {
    const sdPayload = {
      prompt: `(fantasy:1.3), (${prompt}:1.2), professional majestic oil painting by Ed Blinkey, Atey Ghailan, Studio Ghibli, by Jeremy Mann, Greg Manchess, Antonio Moro, trending on ArtStation, trending on CGSociety, Intricate, High Detail, Sharp focus, dramatic, art by midjourney and greg rutkowski`,
      negative_prompt:
        '(signature:1.5), (text:1.5), (letters:1.5), (watermark:1.5), deformed eyes, ((disfigured)), ((bad art)), ((deformed)), ((extra limbs)), (((duplicate))), ((morbid)), ((mutilated)), out of frame, extra fingers, mutated hands, poorly drawn eyes, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), cloned face, body out of frame, out of frame, bad anatomy, gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), (fused fingers), (too many fingers), (((long neck))), tiling, poorly drawn, mutated, cross-eye, canvas frame, frame, cartoon, 3d, weird colors, blurry',
      steps: 20,
      width: 768,
      sampler_name: 'DPM++ 2M Karras',
    }

    const sdRes = await fetch('http://127.0.0.1:7861/sdapi/v1/txt2img', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sdPayload),
    })
    const sdJson = await sdRes.json()

    return `data:image/png;base64,${sdJson.images[0]}`
  } catch (error) {
    console.error('error :>> ', error)
    return ''
  }
}

export const generateSpeech = async (text: string): Promise<void> => {
  console.log('Generating speech from', text)
  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    process.env.SPEECH_KEY!,
    process.env.SPEECH_REGION!,
  )
  speechConfig.speechSynthesisLanguage = 'en-US' // is ignored in favor of the voice name
  speechConfig.speechSynthesisVoiceName = 'en-US-AriaNeural'
  const audioConfig = SpeechSDK.AudioConfig.fromAudioFileOutput('./file.wav')

  const speechSynthesizer = new SpeechSynthesizer(speechConfig, audioConfig)

  console.log('gonna gen')

  const pitchXml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
<voice name="en-US-AmberNeural">
  <prosody pitch="+10%">${text}</prosody>
  </voice>
</speak>`

  console.log('pitchXml :>> ', pitchXml)

  const ttsPromise = new Promise((resolve, reject) => {
    speechSynthesizer.speakSsmlAsync(
      pitchXml,
      (result) => {
        speechSynthesizer.close()
        if (result) {
          console.log('result.audioData :>> ', result.audioData)
          resolve(result.audioData)
        }
      },
      (error) => {
        speechSynthesizer.close()
        console.error(error)
        reject(error)
      },
    )
  })

  const res = await ttsPromise
  console.log('done gen, res', res)

  const myPlayer = player()
  myPlayer.play('./file.wav', function (err) {
    console.log('err playing :>> ', err)

    if (err) throw err
  })
}

// generateSpeech('Haha Now you are just making me angry!')
// generateSpeech('Hi guys! I am Illidan, rawr! Uwu.')

console.log('helprs')
