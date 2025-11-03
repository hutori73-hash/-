require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { DISCORD_TOKEN, CLIENT_ID, GUILD_IDS } = process.env;

// サーバーIDを配列に変換（文字列のままでOK）
const guildIdList = GUILD_IDS?.split(',') ?? [];

// スラッシュコマンド定義
const commands = [
  new SlashCommandBuilder()
    .setName('今日の気分')
    .setDescription('今日の気分をBotが占います')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('食べ物占い')
    .setDescription('あなたを食べ物に例えて占います！')
    .toJSON()
];

// RESTクライアントにトークンを設定
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// コマンド登録処理（複数Guildに対応）
(async () => {
  try {
    for (const guildId of guildIdList) {
      console.log(`🔄 サーバー ${guildId} にコマンド登録中...`);
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(`✅ サーバー ${guildId} に登録完了`);
    }
  } catch (error) {
    console.error('❌ 登録エラー:', error);
  }
})();
