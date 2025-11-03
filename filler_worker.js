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

  let modVal;
  try {
    modVal = evalDiceExpr(modExpr);
  } catch (err) {
    throw err;
  }

  const rollTotals = [];
  const payLines = [];
  let totalPay = 0;
  let totalItems = 0;

  for (let i = 0; i < rolls; i++) {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + modVal;
    rollTotals.push(total);

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

  return {
    title: 'Downtime Activity: Working a Job',
    color: 0x5865F2,
    fields: [
      { name: 'Current Job', value: current_mission, inline: true },
      { name: 'Rolls', value: rollTotals.join(', '), inline: true },
      { name: 'Cost', value: `${dt_cost} DTP`, inline: true },
      { name: 'Pay Breakdown', value: payLines.join('; ') || '—' },
      { name: 'Total Pay', value: `${totalPay.toLocaleString('en-US')} Berri`, inline: true },
      { name: 'Total Items', value: totalItems > 0 ? String(totalItems) : '—', inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

// Return available job keys (for command choice lists)
export function getJobKeys() {
  return Object.keys(JOBS);
}
