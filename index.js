require("dotenv").config();
const { Client, GatewayIntentBits } = require('discord.js'); // correct v14 import
const axios = require('axios');

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive");
});

app.listen(3000, () => {
  console.log("Web server running");
});

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

const ALLOWED_ROLE_ID = "1485411945548091462";

let trackerInterval = null;
let trackerMessage = null;
let waitingForCustom = new Map(); // userId -> waiting state

const client = new Client({
  intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const usernames = `
Sr_Davi36
JohnBoy5916
Masoudabi6777
RAMIRO996148
bonitoff25
chopi123937
gg_dani088
reidd2014
lsihamLahessl
lana_nouvelle
srz_01234
BRO99338
RoboJero31
Acekoala398
Iamthenewkid804
amirleg0at25
SAM10120OX
justinaybar2
Vaughndadon00
nathanme51
Cooldog8966
Pumbas12345673
zqvrto
Minions110614
pruzir_2440
Zen44464
WouldYMissMe
Danonino_pro57
kuroneko_811
Kiraund3
49ersontop_2
glggp6
XxvictorxXrh
Baltazar123238
ikerhack_13
carlospajin87438
`.trim().split("\n");

let users = []; // ⚠️ IMPORTANT keep this

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

async function getUserIdsFromNames(names) {
  const res = await axios.post("https://users.roblox.com/v1/usernames/users", {
    usernames: names,
    excludeBannedUsers: false
  });

  return res.data.data.map(u => ({
    name: u.name,
    id: u.id
  }));
}

client.once("clientReady", async () => { 
  console.log(`Logged in as ${client.user.tag}`);

  users = await getUserIdsFromNames(usernames);
  console.log(`Loaded ${users.length} users`);

  client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const hasRole = member.roles.cache.has(ALLOWED_ROLE_ID);

  // ❌ No permission
  if (!hasRole) {
    return interaction.reply({
      content: "❌ You do not have permission to use this.",
      ephemeral: true
    });
  }

  // ✅ START
  if (interaction.customId === "start") {
    startTracker();
    return interaction.reply({
      content: "🟩 Tracker has been **ENABLED**.",
      ephemeral: true
    });
  }

  // 🛑 STOP
  if (interaction.customId === "stop") {
    stopTracker();
    return interaction.reply({
      content: "🟥 Tracker has been **DISABLED**.",
      ephemeral: true
    });
  }

  // ⏱ TIMER MENU
  if (interaction.customId === "timer") {
    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("timer_select")
        .setPlaceholder("Select duration")
        .addOptions([
          { label: "10 minutes", value: "10" },
          { label: "30 minutes", value: "30" },
          { label: "1 hour", value: "60" },
          { label: "2 hours", value: "120" },
          { label: "4 hours", value: "240" },
          { label: "Custom Amount", value: "custom" }
        ])
    );

    return interaction.reply({
      content: "⏱ Select how long to enable the tracker:",
      components: [menu],
      ephemeral: true
    });
  }

  // ⏱ TIMER SELECT
  if (interaction.isStringSelectMenu()) {
    const value = interaction.values[0];

    if (value === "custom") {
      waitingForCustom.set(interaction.user.id, true);

      return interaction.reply({
        content: "✏️ Type the number of minutes in chat.",
        ephemeral: true
      });
    }

    const minutes = parseInt(value);
    startTracker();

    setTimeout(() => stopTracker(), minutes * 60000);

    return interaction.reply({
      content: `⏱ Tracker enabled for **${minutes} minutes**.`,
      ephemeral: true
    });
  }
});

const TARGET_CHANNEL_ID = process.env.CHANNEL_ID; // pull from environment

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return; // ignore bots
  if (msg.channel.id !== TARGET_CHANNEL_ID) return; // ignore other channels

  // Auto delete messages after 2 sec
  setTimeout(() => {
    msg.delete().catch(() => {});
  }, 2000);

  if (!waitingForCustom.has(msg.author.id)) return;

  const minutes = parseInt(msg.content);
  waitingForCustom.delete(msg.author.id);

  if (isNaN(minutes)) return;

  startTracker();
  setTimeout(() => stopTracker(), minutes * 60000);

  msg.channel.send(`⏱ Tracker enabled for **${minutes} minutes**.`)
    .then(m => setTimeout(() => m.delete().catch(() => {}), 2000));
});

  const channel = await client.channels.fetch(CHANNEL_ID);

  const buttonsRow1 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("start")
    .setLabel("Turn ON Tracker 🟩")
    .setStyle(ButtonStyle.Success),

  new ButtonBuilder()
    .setCustomId("stop")
    .setLabel("Turn OFF Tracker 🟥")
    .setStyle(ButtonStyle.Danger)
);

const buttonsRow2 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("timer")
    .setLabel("Turn ON For # Minutes ⏱")
    .setStyle(ButtonStyle.Primary)
);

trackerMessage = await channel.send({
  content: "Loading ma niggas...",
  components: [buttonsRow1, buttonsRow2]
});

function startTracker() {
  if (trackerInterval) return;

  trackerInterval = setInterval(async () => {
    try {
      const data = await getAllPresence(users);

      let text = "**Roblox Player Logs**\n\n";

      users.forEach(user => {
        const presence = data.find(p => p.userId === user.id);
        const emoji = presence ? getStatusEmoji(presence.userPresenceType) : "🔴";
        text += `${emoji} **${user.name}**\n`;
      });

      await trackerMessage.edit({
        content: text,
        components: trackerMessage.components
      });

    } catch (err) {
      console.error(err);
    }
  }, 8000);
}

function stopTracker() {
  if (trackerInterval) {
    clearInterval(trackerInterval);
    trackerInterval = null;
  }
}

});

client.login(TOKEN);