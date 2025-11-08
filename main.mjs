import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { kibun } from './kibun.js';   // ← moods → kibun に変更
import { foods } from './foods.js';
import { nriichi } from './ri-chan.js';
import { tuikesi } from './tuikesi.js';   // ← 追加

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,   // ← ボイス状態検知に必要
  ],
});

client.once('ready', () => {
  console.log(`🎉 ${client.user.tag} が正常に起動しました！`);
  console.log(`📊 ${client.guilds.cache.size} つのサーバーに参加中`);
});

// ✅ スラッシュコマンド：/食べ物占い
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === '食べ物占い') {
    const roll = Math.random();
    let rarity;

    // R25% / N75%
    if (roll < 0.25) {
      rarity = 'R';
    } else {
      rarity = 'N';
    }

    const candidates = foods[rarity];
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    await interaction.reply(`${selected}`);
    console.log(`🍽 ${interaction.user.tag} が /食べ物占い → ${rarity}`);
  }
});

// ✅ 通常メッセージ：キーワード反応
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const content = message.content;

  // 「今日の気分」に反応
  if (content.includes('今日の気分')) {
    const randomMood = kibun[Math.floor(Math.random() * kibun.length)];
    await message.reply(randomMood);
    console.log(`📝 ${message.author.tag} が「${content}」に反応 → ${randomMood}`);
  }

  // 「ﾝﾘｲﾁ」に反応
  if (content.includes('ﾝﾘｲﾁ')) {
    const randomReply = nriichi[Math.floor(Math.random() * nriichi.length)];
    await message.reply(randomReply);
    console.log(`🌀 ${message.author.tag} が「${content}」に反応 → ${randomReply}`);
  }
});

// ✅ メッセージ削除検知 → ランダムコメント
client.on('messageDelete', async message => {
  if (!message.channel) return;
  if (message.author?.bot) return;

  const randomComment = tuikesi[Math.floor(Math.random() * tuikesi.length)];
  await message.channel.send(randomComment);
  console.log(`🗑 ${message.author?.tag ?? '不明'} のメッセージ削除 → ${randomComment}`);
});

// ✅ ボイスチャット開始／終了通知
const voiceStartTimes = new Map();

client.on('voiceStateUpdate', (oldState, newState) => {
  const textChannel = newState.guild.channels.cache.get('1434697004151210127');
  if (!textChannel || !textChannel.isTextBased()) return;

  // 入室判定
  if (!oldState.channelId && newState.channelId) {
    const member = newState.member;
    const voiceChannel = newState.channel;

    const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;
    if (memberCount === 1) {
      // 開始時刻を記録
      voiceStartTimes.set(voiceChannel.id, Date.now());

      // 開始通知（全体メンション）
      textChannel.send(`@everyone (${member.user.username})<お話を待ってます`);
      console.log(`🎧 START: ${member.user.tag} started ${voiceChannel.name}`);
    }
  }

  // 退室判定
  if (oldState.channelId && !newState.channelId) {
    const voiceChannel = oldState.channel;
    const memberCount = voiceChannel.members.filter(m => !m.user.bot).size;

    if (memberCount === 0) {
      const startTime = voiceStartTimes.get(voiceChannel.id);
      if (startTime) {
        const durationMs = Date.now() - startTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);

        let durationText;
        if (hours > 0) {
          durationText = `${hours}時間${minutes}分 話しました！`;
        } else {
          durationText = `${minutes}分 話しました！`;
        }

        textChannel.send(durationText);
        console.log(`🎧 END: ${voiceChannel.name} lasted ${durationText}`);
      }
      voiceStartTimes.delete(voiceChannel.id);
    }
  }
});

// ✅ エラーハンドリング
client.on('error', (error) => {
  console.error('❌ Discord クライアントエラー:', error);
});

process.on('SIGINT', () => {
  console.log('🛑 Botを終了しています...');
  client.destroy();
  process.exit(0);
});

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN が .env ファイルに設定されていません！');
  process.exit(1);
}

console.log('🔄 Discord に接続中...');
client.login(process.env.DISCORD_TOKEN)
  .catch(error => {
    console.error('❌ ログインに失敗しました:', error);
    process.exit(1);
  });

// ✅ Express Webサーバー（Uptime用）
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
