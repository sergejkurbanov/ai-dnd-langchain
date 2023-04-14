import { ChatOpenAI } from 'langchain/chat_models'
import {
  HumanChatMessage,
  SystemChatMessage,
  AIChatMessage,
} from 'langchain/schema'
import * as dotenv from 'dotenv'

dotenv.config()

export const callChatGPT = async ({
  systemMessage,
  history,
}: {
  systemMessage: string
  history: string[]
}): Promise<{ text: string }> => {
  try {
    const chat = new ChatOpenAI({ temperature: 1 })

    const gptInput = [
      new SystemChatMessage(systemMessage),
      ...history.map((h, index) =>
        index % 2 === 0 ? new HumanChatMessage(h) : new AIChatMessage(h),
      ),
    ]
    // console.log('gptInput :>> ', gptInput)

    const response = await chat.call(gptInput)

    const fixedText = response.text
      .replace(/[“”]/g, '"') // fix quotation marks
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // remove control characters
      .replace(/,\s*]/g, ']') // remove trailing commas
      .replace(/,\s*}/g, '}') // remove trailing commas

    console.log('gpt response', response)
    // console.log(fixedText)

    return { text: fixedText }
  } catch (e) {
    console.error(e)

    return { text: 'Oops, something went wrong. Let me take a look!' }
  }
}
