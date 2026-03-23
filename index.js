require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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
    default: return "🔴"; // Offline
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

  let message = await channel.send({ content: "Loading..." });

  setInterval(async () => {
    try {
      const data = await getPresence(users.map(u => u.id));

      // Separate users by status
      const inGame = [];
      const online = [];
      const offline = [];

      users.forEach(user => {
        const presence = data.find(p => p.userId === user.id);
        const emoji = presence ? getStatusEmoji(presence.userPresenceType) : "🔴";

        const line = `**${user.name}** ${emoji}`;
        if (emoji === "🟢") inGame.push(line);
        else if (emoji === "🟡") online.push(line);
        else offline.push(line);
      });

      const embed = new EmbedBuilder()
        .setTitle("✨ **Roblox Player Tracker** ✨")
        .setColor(0x1abc9c) // cyan
        .setDescription("A live overview of player activity")
        .addFields(
          { name: "🟢 In Game", value: inGame.length ? inGame.join("\n") : "_No one in game_", inline: true },
          { name: "🟡 Online", value: online.length ? online.join("\n") : "_No one online_", inline: true },
          { name: "🔴 Offline", value: offline.length ? offline.join("\n") : "_Everyone offline_", inline: true }
        )
        .setFooter({ text: "Updated every 8 seconds | Roblox Status" })
        .setTimestamp()
        .setThumbnail("https://tr.rbxcdn.com/6c1f8473f2f1521c8834ef0b2f9f26a0/420/420/Image/Png"); // Roblox logo thumbnail

      await message.edit({ embeds: [embed], content: "" });

    } catch (err) {
      console.error(err);
    }
  }, 8000);
});

client.login(TOKEN);