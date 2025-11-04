// Shared filler logic used by both the runtime handler and the discord.js command module

const diceRegex = /(?<![A-Za-z0-9_])(\d*)d(\d+)/gi;

export function rollNdM(n, m) {
  n = Number(n) || 1;
  m = Number(m) || 0;
  if (n <= 0 || m <= 0) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * m) + 1;
  return s;
}

export function replaceDice(expr) {
  return expr.replace(diceRegex, (_, nStr, mStr) => {
    const n = nStr ? parseInt(nStr, 10) : 1;
    const m = parseInt(mStr, 10);
    return String(rollNdM(n, m));
  });
}

export function evalDiceExpr(expr) {
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

// Return detailed evaluation: numeric value plus per-dice breakdown
export function evalDiceExprDetailed(expr) {
  const clean = (expr ?? '0').trim();
  if (!/^[0-9dD+\-*/()%\s.]+$/.test(clean)) {
    throw new Error('Invalid characters in expression');
  }

  const details = [];
  // replace dice tokens while recording individual rolls
  const noDice = clean.replace(diceRegex, (_, nStr, mStr) => {
    const n = nStr ? parseInt(nStr, 10) : 1;
    const m = parseInt(mStr, 10);
    const rolls = [];
    for (let i = 0; i < n; i++) {
      rolls.push(Math.floor(Math.random() * m) + 1);
    }
    const sum = rolls.reduce((a, b) => a + b, 0);
    details.push({ token: `${n}d${m}`, rolls, sum });
    return String(sum);
  });

  if (!/^[0-9+\-*/()%\s.]+$/.test(noDice)) {
    throw new Error('Post-dice expression invalid');
  }
  const val = Function('"use strict"; return (' + noDice + ')')();
  if (!Number.isFinite(val)) throw new Error('Expression did not evaluate to a number');
  return { value: Math.round(val), diceDetails: details };
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

export function fuzzyMatchJob(jobArg) {
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

export function calcMoney(score) {
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

export function calcNonMoney(score) {
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

export function buildEmbed(jobArg, modExpr = '0', rolls = 1) {
  const { current_mission, is_money, dt_per_roll } = fuzzyMatchJob(jobArg);
  const dt_cost = dt_per_roll ? dt_per_roll * rolls : 0;

  // We'll evaluate modifier per-roll so dice in the modifier re-roll each time.
  const rollTotals = [];
  const payLines = [];
  const modDetailsPerRoll = [];
  let totalPay = 0;
  let totalItems = 0;

  for (let i = 0; i < rolls; i++) {
    const d20 = Math.floor(Math.random() * 20) + 1;

    // Evaluate modifier for this roll (captures individual dice rolls)
    let modVal = 0;
    let diceDetails = [];
    try {
      const res = evalDiceExprDetailed(modExpr);
      modVal = res.value;
      diceDetails = res.diceDetails;
    } catch (err) {
      // Propagate as before
      throw err;
    }

    const total = d20 + modVal;
    // include d20 and modifier breakdown in roll display
    const modPart = diceDetails.length > 0 ? ` + ${modVal}` : (modVal !== 0 ? ` + ${modVal}` : '');
    rollTotals.push(`${total} (d20=${d20}${modPart})`);
    // record per-roll modifier details for the embed
    // compute constant part (modVal minus dice sums)
    const diceSumTotal = diceDetails.reduce((s, d) => s + (d.sum || 0), 0);
    const constPart = modVal - diceSumTotal;
    const dicePartStr = diceDetails.length > 0 ? `${diceDetails.map(d => `${d.token}: [${d.rolls.join(', ')}] => ${d.sum}`).join('; ')}` : '';
    let detailLine = `${modExpr} => ${modVal}`;
    if (dicePartStr) detailLine += ` ; ${dicePartStr}`;
    if (constPart !== 0) detailLine += ` ; const: ${constPart}`;
    // always record detail line (so we can show modifier was parsed)
    modDetailsPerRoll.push(detailLine);

    if (is_money) {
      const pay = calcMoney(total);
      payLines.push(`${total}: ${pay.toLocaleString('en-US')} Berri`);
      totalPay += pay;
    } else {
      const { pay, items } = calcNonMoney(total);
      if (items > 0) {
        payLines.push(`${total}: ${pay.toLocaleString('en-US')} Berri + ${items} Item(s)`);
      } else {
        payLines.push(`${total}: ${pay.toLocaleString('en-US')} Berri`);
      }
      totalPay += pay;
      totalItems += items;
    }
  }
  // Build prettier embed fields
  const rollsBlock = rollTotals.map((r, idx) => `Roll ${idx + 1}: ${r}`).join('\n');
  const modBlock = modDetailsPerRoll.length > 0 ? modDetailsPerRoll.map((d, i) => `Roll ${i + 1}: ${d}`).join('\n') : '';
  const payBlock = payLines.length > 0 ? payLines.join('\n') : '—';

  return {
    title: 'Downtime Activity — Working a Job',
    description: `**${current_mission}** — Cost: ${dt_cost} DTP`,
    color: 0x5865F2,
    fields: [
      { name: 'Rolls', value: rollsBlock ? `\n\u200B\n\`\`\`\n${rollsBlock}\n\`\`\`` : '—', inline: false },
      { name: 'Pay Breakdown', value: `\n\u200B\n\`\`\`\n${payBlock}\n\`\`\``, inline: false },
      { name: 'Total Pay', value: `${totalPay.toLocaleString('en-US')} Berri`, inline: true },
      { name: 'Total Items', value: totalItems > 0 ? String(totalItems) : '—', inline: true },
    ],
    footer: { text: 'Generated by /filler' },
    timestamp: new Date().toISOString(),
  };
}

// Return available job keys (for command choice lists)
export function getJobKeys() {
  return Object.keys(JOBS);
}
