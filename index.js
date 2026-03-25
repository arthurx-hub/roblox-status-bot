require("dotenv").config();
const { Client, GatewayIntentBits } = require('discord.js'); // correct v14 import
const axios = require('axios');

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

const users = [
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
  { name: "JosephP1906", id: 3906320056 },
  { name: "proroo054", id: 9005073969 },
  { name: "axstamado", id: 3946668632 },
  { name: "jaidenepikk", id: 1214430122 },
  { name: "koodafltrade", id: 1548337605 },
  { name: "AlphaZ3roJ3lly2006", id: 10516745263 },
  { name: "Kdhrbhegdgfgdg", id: 9936735208 },
  { name: "s_tonecool", id: 1698040484 },
  { name: "liver_939", id: 9811969478 },
  { name: "LOUISAUBRY4", id: 9697285028 },
  { name: "DangerMav27", id: 7803796544 },
  { name: "hfjfjr624", id: 9470604262 },
  { name: "Xxmanis34", id: 9691462265 },
  { name: "alejandro378259", id: 8970131447 },
  { name: "daviff_386", id: 8158572166 },
  { name: "soy_dylan2026", id: 6073139220 },
  { name: "danyer4487", id: 7503963496 },
  { name: "Briggsy2207", id: 4956079261 },
  { name: "Maribecerraok", id: 8094607204 },
  { name: "MARIANORASO01", id: 8885200414 },
  { name: "jairo_3528", id: 9873514388 },
  { name: "poitoket", id: 10256296579 },
  { name: "andreaepaolo5642", id: 10555314969 },
  { name: "samuel1234y34", id: 9283590235 },
  { name: "benicio67245", id: 10434119204 },
  { name: "spidexrj", id: 10283640588 },
  { name: "ClutchJooa", id: 9109392103 },
  { name: "Supermasonalexboy", id: 5550058054 },
  { name: "kagura_Gaming67", id: 10569651239 },
  { name: "russellnoah5", id: 4947065346 },
  { name: "Amartinezcastillo", id: 4239702511 },
  { name: "mohamed896532", id: 2662290115 },
  { name: "Toey_vip1", id: 9765970069 },
  { name: "Salim666939", id: 10185177763 },
  { name: "Bozo_935", id: 5071134199 },
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

client.once("clientReady", async () => { 
  console.log(`Logged in as ${client.user.tag}`);

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

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // Auto delete ALL messages after 2 sec
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
    .then(m => setTimeout(() => m.delete().catch(()=>{}), 2000));
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
      const data = await getPresence(users.map(u => u.id));

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