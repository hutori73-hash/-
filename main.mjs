// main.mjs - Discord Botのメインプログラム

import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { moods } from './moods.js';
import { foods } from './foods.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(`🎉 ${client.user.tag} が正常に起動しました！`);
  console.log(`📊 ${client.guilds.cache.size} つのサーバーに参加中`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /今日の気分
  if (interaction.commandName === '今日の気分') {
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    await interaction.reply(`${randomMood}`);
    console.log(`📝 ${interaction.user.tag} が /今日の気分 を実行 → ${randomMood}`);
  }

  // /食べ物占い
  if (interaction.commandName === '食べ物占い') {
    const roll = Math.random();
    let rarity;
    if (roll < 0.10) {
      rarity = 'SR';
    } else if (roll < 0.40) {
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
