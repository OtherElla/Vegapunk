import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { DiscordRequest } from './utils.js';
import { buildEmbed } from './filler_worker.js';
import { handleTechniqueCommand, buildTechniqueListPageResponse } from './technique_worker.js';
import { handleConditionCommand } from './condition_worker.js';

// -----------------------------
// filler command helper functions (ported from filler.js)
// -----------------------------
const diceRegex = /(?<![A-Za-z0-9_])(\d*)d(\d+)/gi;

function rollNdM(n, m) {
  n = Number(n) || 1;
  m = Number(m) || 0;
  if (n <= 0 || m <= 0) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * m) + 1;
  return s;
}

function replaceDice(expr) {
  return expr.replace(diceRegex, (_, nStr, mStr) => {
    const n = nStr ? parseInt(nStr, 10) : 1;
    const m = parseInt(mStr, 10);
    return String(rollNdM(n, m));
  });
}

function evalDiceExpr(expr) {
  const clean = (expr ?? '0').trim();
  if (!/^[0-9dD+\-*/()%\s.]+$/.test(clean)) {
    throw new Error('Invalid characters in expression');
  }
  const noDice = replaceDice(clean);
  if (!/^[0-9+\-*/()%\s.]+$/.test(noDice)) {
    throw new Error('Post-dice expression invalid');
  }
  const val = Function('"use strict"; return (' + noDice + ')')();
  if (!Number.isFinite(val)) throw new Error('Expression did not evaluate to a number');
  return Math.round(val);
}

const JOBS = {
  'mapping': { is_money: true },
  'manual labor': { is_money: true },
  'doctor': { is_money: false },
  'research': { is_money: false },
  'moving cargo': { is_money: false },
  'host': { is_money: true },
  'technology tester': { is_money: false },
  'investigative reporting': { is_money: true },
  'fauna control': { is_money: false },
  'junior deputy': { is_money: false },
  'line cook': { is_money: false },
  'ship building': { is_money: true },
};

function matchScore(a, b) {
  a = (a || '').toLowerCase();
  b = (b || '').toLowerCase();
  if (!a.length || !b.length) return 0;
  let score = 0;
  let idx = 0;
  for (const ch of a) {
    const pos = b.indexOf(ch, idx);
    if (pos !== -1) {
      score += 1;
      idx = pos + 1;
    }
  }
  return score / Math.max(a.length, b.length);
}

function fuzzyMatchJob(jobArg) {
  jobArg = (jobArg || '').trim();
  if (!jobArg) return { current_mission: 'Unknown Job', is_money: false, dt_per_roll: 0 };

  let best = null;
  let bestScore = 0;
  for (const key of Object.keys(JOBS)) {
    const sc = matchScore(jobArg, key);
    if (sc > bestScore) {
      bestScore = sc;
      best = key;
    }
  }
  if (best && bestScore >= 0.5) {
    const is_money = JOBS[best].is_money;
    const dt_per_roll = is_money ? 3 : 2;
    return { current_mission: titleCase(best), is_money, dt_per_roll };
  }
  return { current_mission: 'Unknown Job', is_money: false, dt_per_roll: 0 };
}

function titleCase(s) {
  return s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function calcMoney(score) {
  if (score <= 5) return 3000;
  if (score <= 10) return 6000;
  if (score <= 15) return 9000;
  if (score <= 20) return 12000;
  if (score <= 25) return 15000;
  let pay = 15000;
  const over = score - 25;
  pay += over * 500;
  pay += Math.floor(over / 5) * 1000;
  return pay;
}

function calcNonMoney(score) {
  const items = score > 25 ? Math.floor(score / 5) - 5 : 0;
  let pay;
  if (score < 5) pay = 2000;
  else if (score <= 10) pay = 3000;
  else if (score <= 15) pay = 5000;
  else if (score <= 20) pay = 8500;
  else if (score <= 25) pay = 10000;
  else pay = 10000 + (score - 25) * 500;
  return { pay, items };
}

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "condition" command
    if (name === 'condition') {
      const options = (req.body.data && req.body.data.options) || [];
      const args = options.map(opt => opt.value);
      const response = handleConditionCommand(args);
      return res.send(response);
    }

    // "technique" command
    if (name === 'technique') {
      const options = (req.body.data && req.body.data.options) || [];
      const args = options.map(opt => opt.value);
      const response = handleTechniqueCommand(args);
      return res.send(response);
    }

    // "filler" command (uses shared worker to avoid duplication)
    if (name === 'filler') {
      const options = (req.body.data && req.body.data.options) || [];
      const getOpt = (optName) => {
        const o = options.find(x => x.name === optName);
        return o ? o.value : undefined;
      };

      const jobArg = getOpt('job') || '';
      const modExpr = getOpt('mod_expr') ?? '0';
      const rolls = Number(getOpt('rolls')) || 1;

      let embedPlain;
      try {
        embedPlain = buildEmbed(jobArg, modExpr, rolls);
      } catch (err) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `❌ Invalid modifier expression: \`${modExpr}\``, flags: InteractionResponseFlags.EPHEMERAL }
        });
      }

      return res.send({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { embeds: [embedPlain] } });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  /**
   * Handle requests from interactive components
   * See https://discord.com/developers/docs/components/using-message-components#using-message-components-with-interactions
   */
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    // Handle technique list pagination buttons
    // custom_id format: tech_list_prev:<filter>:<page> or tech_list_next:<filter>:<page>
    if (componentId && (componentId.startsWith('tech_list_prev:') || componentId.startsWith('tech_list_next:'))) {
      try {
        const parts = componentId.split(':');
        const action = parts[0].split('_')[2]; // prev or next
        const filter = parts[1] === 'all' ? null : parts[1];
        const currentPage = parseInt(parts[2], 10) || 1;
        const newPage = action === 'prev' ? Math.max(1, currentPage - 1) : currentPage + 1;

        const response = buildTechniqueListPageResponse(filter, newPage);
        return res.send(response);
      } catch (err) {
        console.error('Error handling tech list button:', err);
        return res.status(500).json({ error: 'internal error' });
      }
    }

    console.error('unknown component id:', componentId);
    return res.status(400).json({ error: 'unknown component id' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
