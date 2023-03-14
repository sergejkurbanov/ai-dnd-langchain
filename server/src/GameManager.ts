import { Server } from 'socket.io'

import { callChatGPT } from './langchain.js'
import { generateSDImage } from './helpers.js'
import { createTwitchChat } from './twitch.js'

const systemMessage = `You are a text-based role-playing Dungeons & Dragons (D&D 5E) engine. You play out a single quest in exactly 15 scenes. A scene consists of a description and 3 action choices. You always start and end in the tavern of city Aenys.

Make sure to construct the story so the 15 scenes span the whole quest, example:
Scene 1: accepting the quest and heading out
Scene 7: being roughly in the middle of the quest, searching the dungeon
Scene 15: returning back to the tavern

Create a diverse and engaging adventure by always driving the quest story forward.
If the player is proceeding too slow, skip tangents and present important decisions that drive the story forward.
If the player is proceeding too fast, generate more tangents or obstacles to utilize all 15 scenes.
If the player is too reckless and makes risky decisions, the quest can fail.
Use descriptive language and vivid imagery with sensory details to immerse the player in the world. Use suspense, humor and wit.

[Character]
Snorri, dwarf wizard

[Inventory]
wooden staff
gray wizard hat
red cape

[Spells]
Any usual wizard spells that provide creative and engaging solutions

Your output is:
1) current scene and a reminder how many scenes are left (example: "9/15 - I have to pace accordingly and create exactly 6 more scenes to finish the quest").
2) vivid description of the surroundings and situation, 50 - 70 words.
3) three diverse options that are engaging and offer different playstyles or strategies. Consider incorporating elements of risk and reward, potential consequences, and various ways to approach the situation.
4) short dall-e prompt to generate an image for the current scene, emphasize the most important element in the scene, if it's the main character, replace it with PROTAGONIST, examples: "night, PROTAGONIST holding a pouch of gold coins inside a tavern", "day, group of skeletons wielding swords in front of a ruin of a tower covered in vines and moss", "night, ruined wooden hut with torches in the middle of a dense forest".
5) isDone boolean, true if the quest is finished, false otherwise.

You can only respond with JSON in this format and nothing else: { "currentSceneAndReminder": string, "description": string, "options": string[], "dallePrompt": string, isDone: boolean }`

const quest =
  'Begin quest: Aldor, a human in the tavern, told you to investigate a nearby ruin where he lost his golden pocket watch. It is rumored skeletons have been spotted there. You head out.'

const GameManager = (io: Server) => {
  console.log('Game manager initialized')
  const history: string[] = []
  let options: string[] = []
  const twitchChat = createTwitchChat(io)

  const start = async () => {
    console.log('game started')
    await generateNextScene(quest)
    twitchChat.connect()
    runGameLoop()
  }

  const runGameLoop = () => {
    console.log('Running game loop')

    // Vote time interval
    let timeLeft = 40
    const timeLeftInterval = setInterval(async () => {
      timeLeft -= 1
      io.sockets.emit('updateTimeLeft', timeLeft)

      // stop the interval and reset the game loop when time runs out
      if (timeLeft <= 0) {
        const votes = twitchChat.getVotes()
        console.log('votes :>> ', votes, options)

        let maxVoteIndex
        if (votes.a > votes.b && votes.a > votes.c) {
          maxVoteIndex = 0
        } else if (votes.b > votes.a && votes.b > votes.c) {
          maxVoteIndex = 1
        } else if (votes.c > votes.a && votes.c > votes.b) {
          maxVoteIndex = 2
        } else {
          if (votes.a === votes.b && votes.a > votes.c) {
            maxVoteIndex = Math.floor(Math.random() * 2)
          } else if (votes.a === votes.c && votes.a > votes.b) {
            maxVoteIndex = Math.floor(Math.random() * 2) * 2
          } else if (votes.b === votes.c && votes.b > votes.a) {
            maxVoteIndex = Math.floor(Math.random() * 2) + 1
          } else {
            maxVoteIndex = 0
          }
        }
        console.log(maxVoteIndex)
        clearInterval(timeLeftInterval)
        await generateNextScene(options[maxVoteIndex])
        twitchChat.resetVotes()
        runGameLoop()
      }
    }, 1000)
  }

  const generateNextScene = async (playerChoice: string) => {
    console.log('generating next scene')

    history.push(playerChoice)

    const { json, text } = await callChatGPT({ systemMessage, history })
    const sdImage = await generateSDImage(json.dallePrompt)

    history.push(text)
    options = json.options
    io.sockets.emit('updateGameState', {
      description: json.description,
      options: json.options,
      image: sdImage,
    })
  }

  return {
    start,
    generateNextScene,
  }
}

export default GameManager
