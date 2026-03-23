require("dotenv").config();
const { Client, GatewayIntentBits } = require('discord.js'); // correct v14 import
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const users = [
  { name: "romeosuperpro5", id: 7821756300 },
  { name: "Nuggetqveen", id: 2562511540 },
  { name: "luffy_jyz", id: 944709657 },
  { name: "roblox_user_9082847291", id: 9082847291 },
  { name: "bjhb8bhbn", id: 10196460993 },
  { name: "vtqueteamakkj", id: 8539972384 },
  { name: "wilson25344", id: 8327647276 },
  { name: "emanuelzq63", id: 9528965372 },
  { name: "neflix_ng", id: 7026037709 },
  { name: "Dinonuggets4350", id: 8247838264 },
  { name: "dragonglut", id: 1276964172 },
  { name: "Alebrahaham1", id: 9954148601 },
  { name: "Singhraj199", id: 5591995260 },
  { name: "iuuytuhyy", id: 8193096651 },
  { name: "ale_isbest5", id: 9261884340 },
  { name: "kdz3670", id: 10628478530 },
  { name: "capotavtr1", id: 9970672870 },
  { name: "THECOOK0919", id: 10401833510 },
  { name: "proroo054", id: 9005073969 },
  { name: "koodafltrade", id: 1548337605 },
  { name: "AlphaZ3roJ3lly2006", id: 10516745263 },
  { name: "Motje88970", id: 7659101749 },
  { name: "liver_939", id: 9811969478 },
  { name: "LOUISAUBRY4", id: 9697285028 },
  { name: "DangerMav27", id: 7803796544 },
  { name: "hfjfjr624", id: 9470604262 },
  { name: "Xxmanis34", id: 9691462265 },
  { name: "alejandro378259", id: 8970131447 },
  { name: "Yre1qtt9", id: 8038104146 }
];

// Convert Roblox presence type to emoji
function getStatusEmoji(presenceType) {
  switch (presenceType) {
    case 2: return "🟢"; // In game
    case 1: return "🟡"; // Online
    default: return "🔴"; // Offline or studio
  }
}

// Fetch presence
async function getPresence(userIds) {
  const response = await axios.post(
    "https://presence.roblox.com/v1/presence/users",
    { userIds }
  );
  return response.data.userPresences;
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  let message = await channel.send("Loading Roblox statuses...");

  setInterval(async () => {
    try {
      const data = await getPresence(users.map(u => u.id));

      const embed = new EmbedBuilder()
        .setTitle("🎮 Roblox Player Status")
        .setColor(0x1abc9c)
        .setTimestamp()
        .setFooter({ text: "Updated every 8 seconds" });

      users.forEach(user => {
        const presence = data.find(p => p.userId === user.id);
        const emoji = presence ? getStatusEmoji(presence.userPresenceType) : "🔴";
        const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=48&height=48&format=png`;

        embed.addFields([{
          name: `${emoji} ${user.name}`,
          value: `[Avatar](${avatarUrl})`,
          inline: true
        }]);
      });

      await message.edit({ embeds: [embed] });

    } catch (err) {
      console.error(err);
    }
  }, 8000);
});

// LOGIN OUTSIDE
client.login(TOKEN);