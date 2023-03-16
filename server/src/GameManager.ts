import { Server } from 'socket.io'

import { callChatGPT } from './langchain.js'
import { generateSDImage, generateSpeech } from './helpers.js'
import { createTwitchChat } from './twitch.js'
import eventManager from './eventManager.js'

const SCENE_COUNT = 12

const systemMessage = `You are a text-based role-playing Dungeons & Dragons (D&D 5E) engine. You play out a single quest in exactly ${SCENE_COUNT} scenes. A scene consists of a description and 3 action choices. The quest always starts in the tavern in city Aenys. The quest always ends in a tavern by turning in the quest.

Make sure to construct the story so the ${SCENE_COUNT} scenes span the whole quest, example:
Scene 1: accepting the quest and heading out
Scene ${Math.ceil(
  SCENE_COUNT / 2,
)}: being roughly in the middle of the quest, searching the dungeon
Scene ${SCENE_COUNT}: returning back to the tavern to turn in the quest

Create a diverse and engaging adventure by always driving the quest story forward.
If the player is proceeding too slow, skip tangents and present important decisions that drive the story forward.
If the player is proceeding too fast, generate more tangents or obstacles to utilize all ${SCENE_COUNT} scenes.
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
1) current scene and a reminder how many scenes are left (example: "5/${SCENE_COUNT} - I have to pace accordingly and create exactly ${
  SCENE_COUNT - 5
} more scenes to finish the quest").
2) vivid description of the surroundings and situation, 50 - 70 words. Be specific, don't just say "using your spells you overcome obstacles", describe the obstacles and how you overcome them.
3) three diverse options that are engaging and offer different playstyles or strategies. Consider incorporating elements of risk and reward, potential consequences, and various ways to approach the situation.
4) short dall-e prompt to generate an image for the current scene, emphasize the most important element in the scene, if it's the main character, replace it with PROTAGONIST, examples: "night, PROTAGONIST holding a pouch of gold coins inside a tavern", "day, group of skeletons wielding swords in front of a ruin of a tower covered in vines and moss", "night, ruined wooden hut with torches in the middle of a dense forest".
5) isDone boolean: true when you turn in the completed quest in the tavern, false otherwise.

You can only respond with JSON in this format and nothing else: { "currentSceneAndReminder": string, "description": string, "options": string[], "dallePrompt": string, "isDone": boolean }`

const questOpenings = [
  'The local blacksmith, Gorm, asks you to retrieve his stolen tools from a group of goblins who have taken up residence in a nearby cave system.',
  'The bartender, Orla, tells you that a famous bard is staying at the inn and needs an escort to the nearby city for a performance. However, rumors of bandits along the road have made the bard nervous.',
  'A stranger in the tavern, who introduces himself as the wizard Elric, asks for your help in finding his lost spellbook. He suspects it was stolen by a rival wizard who lives in a nearby tower.',
  'The innkeeper, Drogan, has received reports of a dangerous creature lurking in the nearby forest. He asks you to investigate and deal with the creature before it can harm anyone.',
  'A wealthy merchant, named Carlin, approaches you and asks for your help in transporting a valuable cargo to a nearby town. However, he suspects that bandits may try to rob him along the way.',
  'The town guard captain, Grunthar, tells you that a notorious thief has been spotted in the area. He asks you to help capture the thief before he can steal anything valuable from the town.',
  'A local farmer, named Hilda, has been having trouble with a group of goblins who have been raiding her crops. She asks you to help drive them away and protect her farm.',
  'A mysterious stranger in the tavern, who introduces himself as Zoltar, offers you a lucrative job to retrieve a valuable artifact from a dangerous dungeon located deep in the nearby mountains.',
  'A wealthy noble, named Lord Barrow, is looking for brave adventurers to help him investigate a strange phenomenon that is causing the dead to rise from their graves in the local cemetery.',
  'A group of dwarves in the tavern, who introduce themselves as the Ironbeard clan, have lost a valuable family heirloom in a nearby mine. They offer a large reward for anyone who can retrieve it.',
  'Aldor, a human in the tavern, told you to investigate a nearby ruin where he lost his golden pocket watch. It is rumored skeletons have been spotted there.',
]
  .map((value) => ({ value, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value)

const GameManager = (io: Server) => {
  console.log('Game manager initialized')

  let options: string[] = []
  const history: string[] = []
  const twitchChat = createTwitchChat(io)

  const init = async () => {
    console.log('game started')

    twitchChat.connect()

    eventManager.on('displayScene', displayScene)

    eventManager.on('questDone', () => {
      console.log('Quest done, gonna wait 30s and run the next one')
      history.length = 0
      setTimeout(() => startQuest(), 30 * 1000)
    })

    startQuest()
  }

  const startQuest = async () => {
    const quest = questOpenings.pop() || 'We are out of quests!'
    await generateNextScene(quest)
  }

  const displayScene = () => {
    console.log('Displaying scene')

    // Vote time interval
    let timeLeft = 40
    let timeLeftInterval: NodeJS.Timeout

    const tick = async () => {
      timeLeft -= 1
      io.sockets.emit('updateTimeLeft', timeLeft)

      // stop the interval and run next scene when time is up
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
      }
    }

    tick()
    timeLeftInterval = setInterval(tick, 1000)
  }

  const generateNextScene = async (playerChoice: string) => {
    console.log('generating next scene')

    history.push(playerChoice)

    const { json, text } = await callChatGPT({ systemMessage, history })
    const sdImage = await generateSDImage(json.dallePrompt)
    // const speechResult = await generateSpeech(json.description)

    history.push(text)
    options = json.options
    io.sockets.emit('updateGameState', {
      description: json.description,
      options: json.options,
      image: sdImage,
    })

    const isQuestDone = json.isDone
    if (isQuestDone) {
      eventManager.emit('questDone')
    } else {
      eventManager.emit('displayScene')
    }
  }

  return { init, generateNextScene }
}

export default GameManager
