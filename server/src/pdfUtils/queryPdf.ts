import { PineconeClient } from '@pinecone-database/pinecone'
import * as dotenv from 'dotenv'
import { VectorDBQAChain } from 'langchain/chains'
import { OpenAIEmbeddings } from 'langchain/embeddings'
import { OpenAI } from 'langchain/llms'
import { PineconeStore } from 'langchain/vectorstores'

dotenv.config()

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? ''
const PINECONE_API_KEY = process.env.PINECONE_API_KEY ?? ''
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT ?? ''
const PINECONE_NAME_SPACE = 'pdf-query' //namespace is optional for your vectors

export const run = async () => {
  const client = new PineconeClient()
  await client.init({
    apiKey: PINECONE_API_KEY,
    environment: PINECONE_ENVIRONMENT,
  })
  const pineconeIndex = client.Index(PINECONE_INDEX_NAME)

  const vectorStore = await PineconeStore.fromExistingIndex(
    pineconeIndex,
    new OpenAIEmbeddings(),
    'text',
    PINECONE_NAME_SPACE,
  )

  /* Search the vector DB independently with meta filters */
  const results = await vectorStore.similaritySearch(
    'What has he done for devix technologies?',
    1,
  )
  console.log('results similarity search', results)

  /* Use as part of a chain (currently no metadata filters) */
  const model = new OpenAI()
  const chain = VectorDBQAChain.fromLLM(model, vectorStore)
  const response = await chain.call({
    query: 'What has he done for devix technologies?',
  })

  console.log(response)
}
