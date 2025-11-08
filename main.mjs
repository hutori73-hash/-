// ---------------- 必要モジュール ----------------
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';   // Render用
import { kibun } from './kibun.js';
import { foods } from './foods.js';
import { nriichi } from './ri-chan.js';
import { tuikesi } from './tuikesi.js';

dotenv.config();

// ---------------- Discordクライアント ----------------
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

// テストサーバー専用 (直書き)
const voiceNotifyChannels = {
  "1434604040096059475": "1434604040943173774", // guildId: channelId
};

client.on('voiceStateUpdate', async (oldState, newState) => {
  console.log('🧪 voiceStateUpdate イベント発火');

  const guildId = newState.guild?.id;
  console.log(`🧪 guildId: ${guildId}`);

  const channelId = voiceNotifyChannels[guildId];
  console.log(`🧪 channelId: ${channelId}`);

  if (!channelId) {
    console.log('🧪 対応する通知チャンネルが見つかりません');
    return;
  }

  let textChannel;
  try {
    textChannel = await newState.guild.channels.fetch(channelId);
    console.log(`🧪 通知チャンネル取得成功: ${textChannel.name}`);
  } catch (err) {
    console.error(`❌ チャンネル取得失敗: guild=${guildId}, channel=${channelId}`, err);
    return;
  }

  if (!textChannel?.isTextBased()) {
    console.log('🧪 通知チャンネルがテキストチャンネルではありません');
    return;
  }

  console.log(`🔔 voiceStateUpdate: old=${oldState.channelId}, new=${newState.channelId}, member=${newState.member?.displayName}`);

  // 入室
  if (!oldState.channelId && newState.channelId) {
    const member = newState.member;
    const voiceChannel = newState.channel;
    const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;

    console.log(`➡️ 入室検知: ${member.displayName}, VC=${voiceChannel.name}, 人数=${memberCount}`);

    if (memberCount === 1) {
      voiceStartTimes.set(voiceChannel.id, Date.now());
      textChannel.send(`@everyone ${member.displayName}がお話を待ってます`);
    }
  }

  // 退室
  if (oldState.channelId && !newState.channelId) {
    const voiceChannel = oldState.channel;
    const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;

    console.log(`⬅️ 退室検知: VC=${voiceChannel.name}, 残り人数=${memberCount}`);

    if (memberCount === 0) {
      const startTime = voiceStartTimes.get(voiceChannel.id);
      if (startTime) {
        const durationMs = Date.now() - startTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const durationText = hours > 0
          ? `${hours}時間${minutes}分 話しました！`
          : `${minutes}分 話しました！`;

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

// ---------------- Express サーバー (Render用) ----------------
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'Bot is running! 🤖',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🌐 Web サーバーがポート ${port} で起動しました`);
});
