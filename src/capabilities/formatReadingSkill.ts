import { COMMAND_MESSAGE_TAG, COMMAND_NAME_TAG } from '../constants/xml.js'

/**
 * User-visible metadata for auto-loaded internal capabilities.
 * Renders as "Reading skill {name}" via UserCommandMessage (reading-skill-format).
 */
export function formatReadingSkillMetadata(skillName: string): string {
  return [
    `<${COMMAND_MESSAGE_TAG}>${skillName}</${COMMAND_MESSAGE_TAG}>`,
    `<${COMMAND_NAME_TAG}>${skillName}</${COMMAND_NAME_TAG}>`,
    '<reading-skill-format>true</reading-skill-format>',
  ].join('\n')
}
