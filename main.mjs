import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { kibun } from './kibun.js';
import { foods } from './foods.js';
import { nriichi } from './ri-chan.js';
import { tuikesi } from './tuikesi.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once('ready', () => {
  console.log(`✅ 起動: ${client.user.tag} (${client.guilds.cache.size} サーバー参加中)`);
});

// ---------------- スラッシュコマンド ----------------
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === '食べ物占い') {
    const rarity = Math.random() < 0.25 ? 'R' : 'N';
    const candidates = foods[rarity];
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    await interaction.reply(selected);
    console.log(`🍽 ${interaction.user.tag} → ${rarity}`);
  }
});

// ---------------- メッセージ反応 ----------------
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const content = message.content;

  if (content.includes('今日の気分')) {
    const reply = kibun[Math.floor(Math.random() * kibun.length)];
    await message.reply(reply);
  }

  if (content.includes('ﾝﾘｲﾁ')) {
    const reply = nriichi[Math.floor(Math.random() * nriichi.length)];
    await message.reply(reply);
  }
});

// ---------------- メッセージ削除検知 ----------------
client.on('messageDelete', async message => {
  if (!message.channel || message.author?.bot) return;
  const reply = tuikesi[Math.floor(Math.random() * tuikesi.length)];
  await message.channel.send(reply);
});

// ---------------- ボイスチャット通知 ----------------
const voiceStartTimes = new Map();

// guildId → channelId の対応表 (.env から読み込み)
const voiceNotifyChannels = {
  [process.env.VOICE_NOTIFY_GUILD_TEST]: process.env.VOICE_NOTIFY_CHANNEL_TEST,
  [process.env.VOICE_NOTIFY_GUILD_PROD]: process.env.VOICE_NOTIFY_CHANNEL_PROD,
};

client.on('voiceStateUpdate', (oldState, newState) => {
  const guildId = newState.guild.id;
  const channelId = voiceNotifyChannels[guildId];
  if (!channelId) return;

  const textChannel = newState.guild.channels.cache.get(channelId);
  if (!textChannel?.isTextBased()) return;

  // 入室
  if (!oldState.channelId && newState.channelId) {
    const member = newState.member;
    const voiceChannel = newState.channel;
    const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;

    if (memberCount === 1) {
      voiceStartTimes.set(voiceChannel.id, Date.now());
      textChannel.send(`@everyone (${member.user.username})<お話を待ってます`);
    }
  }

  // 退室
  if (oldState.channelId && !newState.channelId) {
    const voiceChannel = oldState.channel;
    const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;

    if (memberCount === 0) {
      const startTime = voiceStartTimes.get(voiceChannel.id);
      if (startTime) {
        const durationMs = Date.now() - startTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const durationText = hours > 0 ? `${hours}時間${minutes}分 話しました！` : `${minutes}分 話しました！`;

        textChannel.send(durationText);
      }
      voiceStartTimes.delete(voiceChannel.id);
    }
  }
});

// ---------------- 起動処理 ----------------
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN が設定されていません');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
