require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const guildIdList = GUILD_ID?.split(',') ?? [];

const commands = [
  new SlashCommandBuilder()
    .setName('食べ物占い')
    .setDescription('あなたを食べ物に例えて占います！')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('今日の気分')
    .setDescription('今日の気分をBotが占います')
    .toJSON()
  ];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  for (const guildId of guildIdList) {
    try {
      console.log(`🔄 Guild ${guildId} にコマンド登録中...`);
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(`✅ Guild ${guildId} に登録完了`);
    } catch (error) {
      console.error(`❌ Guild ${guildId} の登録に失敗:`, error);
    }
  }

  try {
    console.log('🌐 グローバルコマンドを登録中...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ グローバルコマンド登録完了（反映に最大1時間かかる場合あり）');
  } catch (error) {
    console.error('❌ グローバルコマンド登録に失敗:', error);
  }
})();
