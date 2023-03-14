export const generateSDImage = async (prompt: string): Promise<string> => {
  if (!prompt) return ''

  try {
    const sdPayload = {
      prompt: `(fantasy:1.3), (${prompt}:1.2), professional majestic oil painting by Ed Blinkey, Atey Ghailan, Studio Ghibli, by Jeremy Mann, Greg Manchess, Antonio Moro, trending on ArtStation, trending on CGSociety, Intricate, High Detail, Sharp focus, dramatic, art by midjourney and greg rutkowski`,
      negative_prompt:
        '(signature:1.5), (text:1.5), (letters:1.5), (watermark:1.5), deformed eyes, ((disfigured)), ((bad art)), ((deformed)), ((extra limbs)), (((duplicate))), ((morbid)), ((mutilated)), out of frame, extra fingers, mutated hands, poorly drawn eyes, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), cloned face, body out of frame, out of frame, bad anatomy, gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), (fused fingers), (too many fingers), (((long neck))), tiling, poorly drawn, mutated, cross-eye, canvas frame, frame, cartoon, 3d, weird colors, blurry',
      steps: 20,
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
