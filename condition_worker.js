// Condition lookup and formatting utilities
import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';

const CONDITIONS = {
  dying: {
    name: "DYING",
    details: `You are bleeding out or otherwise at death’s door. You automatically enter the dying condition when you would fall to 0 hit points don’t die as a result of instant death. While you have this condition, you are Unconscious. Whenever you start your turn with 0 hit points, you must make a special saving throw, called a death saving throw, to determine whether you creep closer to death or hang onto life. Unlike other saving throws, this one isn’t tied to any ability score. You are in the hands of fate now, aided only by techniques and features that improve your chances of succeeding on a saving throw.

Roll a d20, if the roll is 10 or higher, you succeed. Otherwise, you fail. A success or failure has no effect by itself. On your third success, you become stable (see below). On your third failure, you die. The successes and failures don’t need to be consecutive; keep track of both until you collect three of a kind. The number of successful death saves are reset to zero when you regain any hit points or become stable. The number of failures does not reset until you complete a long rest.

Rolling 1 or 20. When you make a death saving throw and roll a 1 on the d20, it counts as two failures. If you roll a 20 on the d20, you regain 1 hit point and remove two failed death saving throws from the count. Damage at 0 Hit Points. If you take any damage while you have 0 hit points (for example, by catching fire because your limbs were all chopped off next to a pit of lava), you suffer a death saving throw failure. If the damage is from a critical hit, you suffer two failures instead. If the damage equals or exceeds your hit point maximum, you suffer instant death.`,
  },

  mortally_wounded: {
    name: "MORTALLY WOUNDED",
    details: `When your hit points are reduced to 0, you may choose to gain the **Mortally Wounded** condition instead of falling unconscious and gaining the **Dying** condition. In this state, you fight through sheer force of will, but your body is rapidly failing.
**Effects:**
* You immediately gain 1 level of exhaustion.
* Your speed becomes 0, and you cannot benefit from bonuses to speed.
* You cannot regain hit points or stabilize yourself by any means, including techniques, features, regeneration, or temporary hit points.
* Attack rolls against you have advantage. Hits on you count as 1 level of exhaustion per.
* At the start of each of your turns, you make a death saving throw (as if you were Dying).
  * On your second failed save, you fall unconscious and begin Dying.
  * On your third success, nothing changes—you remain Mortally Wounded and continue making saves.
* On your turn, you may use only one of the following:
  * **Action** — Gain 3 levels of exhaustion.
  * **Bonus Action** — Gain 2 levels of exhaustion.
  * **Reaction** — Gain 1 level of exhaustion (if used before your next turn).
  * After using any of these, your turn immediately ends.
**Ending the Condition:**
* If another creature heals you, stabilizes you, or restores hit points to you by any means, the Mortally Wounded condition ends immediately.
* You resume normal unconscious or conscious behavior based on the amount of healing you received.
* This condition cannot be ended by yourself through any means.`,
  },

  exhaustion: {
    name: "EXHAUSTION",
    details: `Some special abilities and environmental hazards, such as and the long-term effects of freezing or scorching temperatures, can lead to a special condition called exhaustion.

If an already exhausted creature suffers another effect that causes exhaustion, its current level of exhaustion increases by 1 rank.

An effect that removes exhaustion reduces its rank by 1. Finishing a long rest reduces a creature’s exhaustion level by 1, provided that the creature has also ingested some food and drink. When a creature exceeds 10 ranks of exhaustion, they die.

For every rank of exhaustion, a creature has all of the following statistics are reduced by 1, and for every two ranks of exhaustion a creatures speed is reduced by 5:
 * Armor Class
 * Ability Checks
 * Skill Checks
 * Saving Throws
 * Attack Rolls
 * Damage Rolls
 * Save DC’s`,
  },

  unconscious: {
    name: "UNCONSCIOUS",
    details: `* An unconscious creature is incapacitated (see the condition), can’t move or speak, and is unaware of its surroundings
* The creature drops whatever it holding and falls prone.
* The creature automatically fails Strength and Dexterity saving throws.
* Attack rolls against the creature have advantage.
* Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.`,
  },

  incapacitated: {
    name: "INCAPACITATED",
    details: `An incapacitated creature can't take actions or reactions.`,
  },

  grappled: {
    name: "GRAPPLED",
    details: `* A grappled creature’s speed becomes 0, and it can’t benefit from any bonus to its speed.
* The condition ends if the grappler is incapacitated (see the condition).
* The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect.`,
  },

  restrained: {
    name: "RESTRAINED",
    details: `* A restrained creature’s speed becomes 0, and it can’t benefit from any bonus to its speed.
* Attack rolls against the creature have advantage, and the creature’s attack rolls have disadvantage.
* The creature has disadvantage on Dexterity saving throws.`,
  },

  prone: {
    name: "PRONE",
    details: `• A prone creature’s only movement option is to crawl which they can do, up to half their movement speed unable to gain any bonuses to their speed, unless it stands up and thereby ends the condition.
• The creature has disadvantage on melee attack rolls.
• The creature has disadvantage on ranged attack rolls against targets within 30 feet.
• An attack roll against the creature has advantage if the attacker is within 5 feet of the creature or the weapon used has the reach property. Otherwise, the attack roll has disadvantage.`,
  },

  suppressed: {
    name: "SUPPRESSED",
    details: `* A Suppressed creature cannot gain the benefits of or utilize any feature of their devil fruit which requires them to be conscious. This includes any feats, fighting styles, stances, and techniques with the Devil Fruit keyword. If a feature or effect would currently be active that requires them to be conscious that feature then ends. If a feature, feat, fighting style, or stance would grant any effects which would be active even while unconscious but not be beneficial or usable by an unconscious creature then those are also counted for this condition.`
  },

  disrupted: {
    name: "DISRUPTED",
    details: `* A Disrupted creature cannot use Haki features, feats, techniques or features while under the Disrupted condition.
* Any Haki features that a Disrupted creature have active immediately end.`
  },

  diseased: {
    name: "DISEASED",
    details: `Each disease carries its own unique effect, but this condition is a hold over to mark a creature as a Diseased for the purposes of some features. The Diseased condition cannot be removed by any means until the disease itself is cured.`,
  },

  tipsy: {
    name: "TIPSY",
    details: `Whenever you drink too much you have a chance of becoming tipsy. Each rank of Tipsy will have its effects detailed below, every additional rank of tipsy carries with it the effects of prior ranks in addition. If an effect gives a minus then that minus is equal to the ranks of tipsy the creature has.

1: Just a little drunk you suffer a minus to Insight and Acrobatics checks.

2: Your words are starting to blur together making it harder to understand you, you suffer a minus to your Persuasion, Deception, as well as Intimidation checks.

3: Is the room spinning or is that you?  You suffer a minus to Perception and Navigation checks

4: Your brain feels fuzzy, your thoughts and memory turning blurry. You suffer a minus to Artifact Knowledge, History,  and Investigation checks.

5: This is getting bad. You suffer a minus to your attack rolls and in addition with how badly you sway you spend an extra 2 feet for every 1 foot moved.

6: You feel like you should vomit, you suffer a minus to all remaining skill checks not listed prior.

7: You should have stopped drinking. You suffer a minus to all your saving throws.

8: You fall to 0 Hit Points and begin making Death Saving Throws, if you become stabilized or would be healed then you fall unconscious for the remaining time you should be Tipsy.`,
  },

  burned: {
    name: "BURNED",
    details: `A Burned Creature or object takes 1d8 fire damage at the start of each of their turns for the duration of this condition or 1 minute has passed, whichever comes first.
Burned can be applied to a creature up to 5 times total. Each application increases the amount of fire damage by 1d8, up to a maximum of 5d8 at max ranks.
A creature takes a -2 Penalty to Concentration Checks for each Rank of Burned they are currently affected by.
Creatures that are immune to fire damage are immune to this condition.
A Creature can spend an Action to make a DC 15 Dexterity (Survival) Check to put out the flames. On a successful check, the condition ends or submerging themselves fully into a body of water.
A creature who would gain a 6th rank of burned instead gains one rank of scorched and is cured of all ranks of burned.`,
  },

  scorched: {
    name: "SCORCHED",
    details: `A Scorched Creature or object takes 5d10 fire damage at the start of each of their turns for the duration of this condition or 1 minute has passed, whichever comes first.
A creature takes a -12 Penalty to Concentration Checks and cannot  cast any techniques that require concentration while Scorched.
A Scorched creature is  treated as  having 5 ranks of burned for any features, feats, traits, or abilities that would interact with them and while Scorched cannot be gain any ranks of Burned.
Creatures that are immune to fire damage or the burned condition are immune to this condition.
A Creature can spend an Action to make a DC 20 Dexterity (Survival) Check to put out the flames. On a successful check, the condition ends or submerging themselves fully into a body of water.`,
  },

  chilled: {
    name: "CHILLED",
    details: `A Chilled creature's speed is reduced by 5 feet.
A Chilled Creature has its body overwhelmed by cold, taking 1d6 cold damage at the start of each of their turns for the duration of this condition or 1 minute has passed, whichever comes first.
Chilled can be applied to a creature up to 5 times total. Each application increases the amount of cold damage by 1d6 and the speed penalty by 5 feet, up to a maximum of 5d6 and -25 speed at max ranks.
A creature takes a -1 penalty to Dexterity Saving throws, Ability checks and skill checks for each rank of Chilled they have.
A creature resistant or immune to Cold Damage also has resistance or immunity to this condition. Taking fire damage automatically ends this condition.
A creature who would gain a 6th rank of Chilled instead gains one rank  of Frozen and  loses all current ranks of Chilled.`,
  },

  frozen: {
    name: "FROZEN",
    details: `A Frozen creature speed is reduced by 30 feet and cannot gain bonuses.
A Frozen creature takes 6d6 cold damage at the start of its turn.
A creature takes a -6 penalty to Dexterity Saving throws, Ability checks and skill checks while Frozen.
A Frozen creature is treated as having 5 ranks of chilled for an features,  feats, traits, or abilities that would interact with them and while Frozen cannot gain ranks of Chilled.
A creature resistant or immune to Cold Damage or the Chilled condition also has resistance or immunity to this condition.
A frozen creature has vulnerability to fire damage and Bludgeoning damage, as well as resistance to Piercing and Slashing damage.
The Frozen condition ends immediately after taking fire or bludgeoning damage, and can alternatively be ended by spending no less than a minute slowly warming a creature up.`,
  },

  decayed: {
    name: "DECAYED",
    details: `A Decayed creature cannot regain hit points or gain temporary hit points.
A Decayed Creature has its body consumed by rot and pestilence taking 1d6 Necrotic damage at the start of each of their turns for the duration of this condition or 1 minute has passed, whichever comes first. A creature may use their action to make a DC 15 Wisdom (Medicine) Check to try and cure the source of Necrosis. On a successful check the condition ends.
Decayed can be applied to a creature up to 5 times total. Each application increases the amount of Necrotic damage by 1d6, up to a maximum of 5d6.
A creature Immune to Necrotic Damage also has immunity to this condition.
A creature who would gain a 6th rank of Decayed instead gains one rank of Rotted and loses all ranks of Decayed.`,
  },

  rotted: {
    name: "ROTTED",
    details: `A Rotted creature cannot regain hit points or gain temporary hit points.
A Decayed Creature has its body consumed by rot and pestilence taking 5d8 Necrotic damage at the start of each of their turns for the duration of this condition or until 1 minute has passed, whichever comes first.
A creature may use their action to make a DC 25 Wisdom (Medicine) Check to try and cure the source of Necrosis. On a successful check the condition ends, on a failure the creature afflicted with Rotted takes 5d8 Necrotic damage.
A Rotted creature is treated as having 5 ranks of Decayed for any features,  feats, traits, or abilities that would interact with them and while Rotted cannot gain ranks of Decayed.
A creature resistant or Immune to Necrotic Damage or the Decayed condition also has resistance or immunity to this condition.`,
  },

  corroded: {
    name: "CORRODED",
    details: `A Corroded creature gains a -1 to all skill checks and attack rolls.
A Corroded creatures takes 1d4 Acid damage at the beginning of each of their turns.
The Corroded condition can be applied to a creature up to 5 times total. Each application increases the penalty to all skill checks and attack rolls by -1, and Acid damage by 1d4.
A creature can end the corroded condition by using their action making a DC 15 Dexterity or Constitution saving throw or submerging themselves fully into a body of water.
A creature immune to Acid damage is immune to this condition.
A creature who would gain a 6th rank of Corroded gains one rank of Melted and loses all ranks of Corroded.`,
  },

  melted: {
    name: "MELTED",
    details: `A Melted creature gains a -6 to all ability & skill checks and attack rolls.
A Melted creature gets a -3 penalty to their AC and damage rolls.
A Melted creatures takes 6d4 Acid damage at the beginning of each of their turns.
A creature immune to Acid damage or the Corroded condition is immune to this condition.
A Melted creature is treated as having 5 ranks of Corroded for any features,  feats, traits, or abilities that would interact with them and while Melted cannot gain ranks of Corroded.
A creature can end the Melted condition by using their action making a DC 20 Dexterity or Constitution saving throw or submerging themselves fully into a body of water.`,
  },

  poisoned: {
    name: "POISONED",
    details: `A Poisoned creature takes 1d4 poison damage at the start of their turn.
The Poisoned condition can be applied to a creature up to 5 times total. Each application increases the poison damage by 1d4 for each stack.
A Creature can spend an Action to try and cure themselves if they have a gallon of water or other liquid. If they do so they must make a DC 15 Constitution (Endurance) Check to try and shrug off the effects of the poison. On a successful check, the condition ends. Alternatively this Condition ends after 10 minutes.
A creature immune to poison damage is immune to this condition.
A creature that would gain a 6th rank of Poisoned instead gains 1 rank of Envenomed and loses all ranks of Poisoned.`,
  },

  envenomed: {
    name: "ENVENOMED",
    details: `A Envenomed creature takes 4d6 poison damage at the beginning of each of its turns.
A Envenomed creature loses 4d6 energy at the beginning of each of its turns.
A Envenomed creature is treated as having 5 ranks of Poisoned for any features,  feats, traits, or abilities that would interact with them and while Envenomed cannot gain ranks of Poisoned.
A Creature can spend an Action to try and cure themselves if they have a gallon of water or other liquid. If they do so they must make a DC 20 Constitution (Endurance) Check to try and shrug off the effects of the poison. On a successful check, the condition ends. Alternatively this Condition ends after 10 minutes.
Creatures that are immune to the Poisoned condition or poison damage are immune to the Envenomed condition.`,
  },

  shocked: {
    name: "SHOCKED",
    details: `The first time each turn a Shocked Creature takes lightning damage they take an additional 1d6 lightning damage, for the duration of this condition or until 1 minute has passed, whichever comes first.
A shocked creature has a -1 Penalty to Strength based saving throws, and ability checks.
Shocked can be applied to a creature up to 5 times total. Each application increases the Penalty by -1, up to a maximum of -5 at max ranks.
A creature Immune to lightning damage also has immunity to this condition.
A creature that would gain a 6th rank of Shocked instead gains one rank of Electrocuted and loses all ranks of Shocked.`,
  },

  electrocuted: {
    name: "ELECTROCUTED",
    details: `A Electrocuted Creature takes an additional 5d8 lightning damage when they would take lightning damage, for the duration of this condition or 1 minute has passed, whichever comes first.
A Electrocuted creature has a -6 Penalty to Strength based Saving throws and, ability checks.
A Electrocuted creature is treated as having 5 ranks of Shocked for any features,  feats, traits, or abilities that would interact with them and while Electrocuted cannot gain ranks of Shocked.
A creature Immune to lightning damage or the Shocked condition also has immunity to this condition.`,
  },
};

function normalizeKey(q) {
  if (!q) return '';
  return q.toString().trim().toLowerCase().replace(/[\s\-]+/g, '_');
}

function getCondition(key) {
  const k = normalizeKey(key);
  return CONDITIONS[k] || null;
}

function findCondition(query) {
  if (!query) return null;
  const q = normalizeKey(query);
  // exact
  if (CONDITIONS[q]) return { key: q, cond: CONDITIONS[q] };
  // partial search by name or summary
  const results = [];
  for (const [key, cond] of Object.entries(CONDITIONS)) {
    const hay = (cond.name + ' ' + cond.summary).toLowerCase();
    if (hay.includes(query.toString().toLowerCase())) results.push({ key, cond });
  }
  return results.length ? results : null;
}

function formatCondition(key) {
  const cond = getCondition(key);
  if (!cond) return null;
  return `**${cond.name}**\n${cond.summary}\n\n${cond.details}`;
}

// Get color based on condition category
function getConditionColor(conditionName) {
  const name = normalizeKey(conditionName);
  
  // Death/Critical conditions - Dark Red
  if (['dying', 'mortally_wounded'].includes(name)) return 0x8B0000;
  
  // Fire conditions - Orange
  if (['burned', 'scorched'].includes(name)) return 0xFF6347;
  
  // Cold conditions - Light Blue
  if (['chilled', 'frozen'].includes(name)) return 0x5DADE2;
  
  // Necrotic conditions - Dark Purple
  if (['decayed', 'rotted'].includes(name)) return 0x6C3483;
  
  // Acid conditions - Yellow-Green
  if (['corroded', 'melted'].includes(name)) return 0xC0CA33;
  
  // Poison conditions - Green
  if (['poisoned', 'envenomed'].includes(name)) return 0x27AE60;
  
  // Lightning conditions - Yellow
  if (['shocked', 'electrocuted'].includes(name)) return 0xF1C40F;
  
  // Special/Movement conditions - Gray
  if (['exhaustion', 'unconscious', 'incapacitated', 'grappled', 'restrained', 'prone'].includes(name)) return 0x95A5A6;
  
  // Game-specific conditions - Gold
  if (['suppressed', 'disrupted', 'diseased', 'tipsy'].includes(name)) return 0xF39C12;
  
  // Default - Discord Blurple
  return 0x5865F2;
}

// Build embed for a specific condition
function buildConditionEmbed(conditionName) {
  const result = findCondition(conditionName);
  
  if (!result) {
    return {
      title: 'Condition Not Found',
      description: `Could not find condition: **"${conditionName}"**\n\nPlease check the spelling and try again.`,
      color: 0xFF0000
    };
  }

  // If multiple results, use the first one
  const { key, cond } = Array.isArray(result) ? result[0] : result;
  const color = getConditionColor(key);
  
  let description = cond.details;

  // Discord embed description limit is 4096 characters
  if (description.length > 4096) {
    description = description.substring(0, 4090) + '\n...';
  }

  return {
    title: cond.name,
    description: description,
    color: color,
    footer: {
      text: 'One Piece D&D  * Condition Reference'
    }
  };
}

// Main handler for condition command
export function handleConditionCommand(args) {
  if (!args || args.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Please specify a condition name. Example: `/condition dying`',
        flags: InteractionResponseFlags.EPHEMERAL
      }
    };
  }

  const conditionName = args[0];

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [buildConditionEmbed(conditionName)]
    }
  };
}

export {
  CONDITIONS,
  getCondition,
  findCondition,
  formatCondition,
};
