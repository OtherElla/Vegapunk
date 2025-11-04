import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';
import { getJobKeys } from './filler_worker.js';

// Technique command
const TECHNIQUE_COMMAND = {
  name: 'technique',
  description: 'Search and display martial techniques',
  options: [
    {
      type: 3,
      name: 'action',
      description: 'Action to perform (technique name, list, or summary)',
      required: true,
    },
    {
      type: 3,
      name: 'source',
      description: 'Source filter for list command or tier for technique search',
      required: false,
    },
    {
      type: 3,
      name: 'name',
      description: 'Technique name when searching with tier',
      required: false,
    }
  ],
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

// Condition command
const CONDITION_COMMAND = {
  name: 'condition',
  description: 'Look up game condition details',
  options: [
    {
      type: 3,
      name: 'name',
      description: 'Condition name',
      required: true
    }
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2]
};

const ALL_COMMANDS = [FILLER_COMMAND, TECHNIQUE_COMMAND, CONDITION_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
