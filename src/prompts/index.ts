/**
 * Combines all system prompt sections into the complete system prompt
 */

import { BASE_INSTRUCTIONS } from './base-instructions';
import { TOOL_CALLING_FORMAT } from './tool-calling-format';
import { APEX_CORE_RULES } from './apex-core-rules';
import { WORKFLOW_GUIDE } from './workflow-guide';
import { ALL_TOOLS_REFERENCE } from '../tools';

/**
 * Complete system prompt constructed from modular sections
 */
export const SYSTEM_PROMPT = `${BASE_INSTRUCTIONS}

${APEX_CORE_RULES}

${TOOL_CALLING_FORMAT}

${ALL_TOOLS_REFERENCE}

${WORKFLOW_GUIDE}`;
