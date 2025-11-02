require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// スラッシュコマンド定義
const commands = [
  new SlashCommandBuilder()
    .setName('今日の気分') // ← コマンド名（日本語でもOK）
    .setDescription('今日の気分をBotが占います')
    .toJSON()
];

// RESTクライアントにトークンを設定
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// コマンド登録処理
(async () => {
  try {
    console.log('🔄 /今日の気分 コマンド登録中...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ 登録完了');
  } catch (error) {
    console.error('❌ 登録エラー:', error);
  }
})();

