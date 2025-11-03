import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { buildEmbed } from './filler_worker.js';

// -----------------------------
// Slash command (ESM exports)
// -----------------------------
export const data = new SlashCommandBuilder()
  .setName('filler')
  .setDescription('Run a job roll with fuzzy-matched job, dice modifier, and multiple rolls.')
  .addStringOption(opt =>
    opt.setName('job')
      .setDescription('Job name (fuzzy-matched, e.g., "map", "host", "ship build")')
      .setRequired(true))
  .addStringOption(opt =>
    opt.setName('mod_expr')
      .setDescription('Dice/number modifier added to 1d20 (e.g., "5", "1d4+3", "(1d6*2)-1")')
      .setRequired(false))
  .addIntegerOption(opt =>
    opt.setName('rolls')
      .setDescription('How many times to roll (default 1, max 50)')
      .setMinValue(1)
      .setMaxValue(50)
      .setRequired(false));

export async function execute(interaction) {
  const jobArg = interaction.options.getString('job', true);
  const modExpr = interaction.options.getString('mod_expr') ?? '0';
  const rolls = interaction.options.getInteger('rolls') ?? 1;

  let embedPlain;
  try {
    embedPlain = buildEmbed(jobArg, modExpr, rolls);
  } catch (err) {
    return interaction.reply({ content: `❌ Invalid modifier expression: \`${modExpr}\``, ephemeral: true });
  }

  const embed = new EmbedBuilder(embedPlain);
  await interaction.reply({ embeds: [embed] });
}
