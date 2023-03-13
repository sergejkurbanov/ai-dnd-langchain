import tmi, { ChatUserstate } from 'tmi.js'

export const connectTwitchChat = () => {
  // Define configuration options
  const opts = { channels: ['sirgg_tv'] }

  // Create a client with our options
  const client = new tmi.client(opts)

  // Register our event handlers (defined below)
  client.on('message', onMessageHandler)
  client.on('connected', onConnectedHandler)

  // Connect to Twitch:
  client.connect()

  // Called every time a message comes in
  function onMessageHandler(
    channel: string,
    userstate: ChatUserstate,
    message: string,
    self: boolean,
  ) {
    console.log(
      'channel, userstate, messsage, self :>> ',
      channel,
      userstate,
      message,
      self,
    )
  }

  // Called every time the bot connects to Twitch chat
  function onConnectedHandler(addr: string, port: number) {
    console.log(`* Connected to ${addr}:${port}`)
  }
}

const getTwitchToken = async () => {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  })
  const json = await res.json()
  console.log('json :>> ', json)

  return json.access_token
}

// getTwitchToken()

const getTwitchChatters = async () => {
  const token = await getTwitchToken()
  const res = await fetch(
    'https://api.twitch.tv/helix/chat/chatters?broadcaster_id=sirgg_tv&moderator_id=sirgg_tv',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
      },
    },
  )
  const json = await res.json()
  console.log('json :>> ', json)
}

const getTwitchUser = async () => {
  const token = await getTwitchToken()
  const res = await fetch('https://api.twitch.tv/helix/users?login=sirgg_tv', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-ID': process.env.TWITCH_CLIENT_ID!,
    },
  })
  const json = await res.json()
  console.log('json :>> ', json)
}

//   getTwitchChatters()

// my id 601671036
