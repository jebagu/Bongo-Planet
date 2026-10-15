import { readFileSync, writeFileSync } from 'node:fs';
import { buildAgentGuide } from '../src/agentGuide';

const guide = buildAgentGuide(readFileSync(new URL('../Creation-Guide.md', import.meta.url), 'utf8'));
writeFileSync(new URL('../Agent-Guide.md', import.meta.url), guide);
console.log('Updated Agent-Guide.md from the current musical rules, schemas, instruments, looks and topology.');
