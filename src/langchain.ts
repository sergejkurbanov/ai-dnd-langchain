import { OpenAIChat } from 'langchain/llms'
import { ChatOpenAI } from 'langchain/chat_models'
import * as dotenv from 'dotenv'

dotenv.config()

export const callChatGPT = async () => {
  const model = new OpenAIChat({
    modelName: 'gpt-3.5-turbo',
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1,
  })

  const res = await model.call(
    'What would be a good company name a company that makes colorful socks?',
  )

  console.log(res)
  console.log({ res })
}
