import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';
import { getJobKeys } from './filler_worker.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

// Add the filler command registration
const FILLER_COMMAND = {
  name: 'filler',
  description: 'Run a job roll with fuzzy-matched job and dice modifier',
  options: [
    // Job dropdown choices — populated from filler_worker.js
    {
      type: 3,
      name: 'job',
      description: 'Job name (choose from list)',
      required: true,
      choices: getJobKeys().map(k => ({ name: capitalize(k), value: k })),
    },
    {
      type: 3,
      name: 'mod_expr',
      description: 'Dice/number modifier added to 1d20 (e.g., "5", "1d4+3", "(1d6*2)-1")',
      required: false
    },
    {
      type: 4,
      name: 'rolls',
      description: 'How many times to roll (default 1, max 50)',
      required: false,
      min_value: 1,
      max_value: 50
    }
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2]
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, FILLER_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
