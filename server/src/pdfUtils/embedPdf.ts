import { Document } from 'langchain/document'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { OpenAIEmbeddings } from 'langchain/embeddings'
import { PineconeStore } from 'langchain/vectorstores'

import { pinecone } from './pineconeClient.js'

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME ?? ''
const PINECONE_NAME_SPACE = 'pdf-query' //namespace is optional for your vectors

export const run = async (pdfContents: Document[]) => {
  try {
    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })

    const docs = await textSplitter.splitDocuments(pdfContents)
    console.log('split docs', docs)

    console.log('creating vector store...')
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings()
    const index = pinecone.Index(PINECONE_INDEX_NAME) //change to your own index name

    //embed the PDF documents
    // @ts-ignore
    await PineconeStore.fromDocuments(
      index,
      docs,
      embeddings,
      'text',
      PINECONE_NAME_SPACE,
    )
  } catch (error) {
    console.log('error', error)
    throw new Error('Failed to ingest your data')
  }
}
