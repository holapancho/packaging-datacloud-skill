#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;

let hasErrors = false;

function readFrontmatter(skillMdPath) {
  const content = fs.readFileSync(skillMdPath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? yaml.load(match[1]) : null;
}

function validateSkill(dirName) {
  const errors = [];
  const skillMdPath = path.join(SKILLS_DIR, dirName, 'SKILL.md');

  if (!fs.existsSync(skillMdPath)) {
    errors.push('missing SKILL.md');
  } else {
    const frontmatter = readFrontmatter(skillMdPath);

    if (!frontmatter || typeof frontmatter !== 'object') {
      errors.push('SKILL.md has no valid YAML frontmatter');
    } else {
      const { name, description } = frontmatter;

      if (!name) {
        errors.push('frontmatter is missing "name"');
      } else {
        if (!NAME_PATTERN.test(name)) {
          errors.push(`"name" must use lowercase letters, numbers and single hyphens (got "${name}")`);
        }
        if (name.length > MAX_NAME_LENGTH) {
          errors.push(`"name" exceeds ${MAX_NAME_LENGTH} characters`);
        }
        if (name !== dirName) {
          errors.push(`frontmatter "name" ("${name}") must match the folder name ("${dirName}")`);
        }
      }

      if (!description || !String(description).trim()) {
        errors.push('frontmatter is missing "description"');
      }
    }
  }

  if (errors.length > 0) {
    hasErrors = true;
    for (const message of errors) {
      console.error(`✗ ${dirName}: ${message}`);
    }
  } else {
    console.log(`✓ ${dirName}`);
  }
}

if (!fs.existsSync(SKILLS_DIR)) {
  console.error(`No "skills/" directory found at ${SKILLS_DIR}`);
  process.exit(1);
}

const skillDirs = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (skillDirs.length === 0) {
  console.error(`No skill folders found in ${SKILLS_DIR}`);
  process.exit(1);
}

for (const dirName of skillDirs) {
  validateSkill(dirName);
}

if (hasErrors) {
  process.exit(1);
}

console.log(`\nAll ${skillDirs.length} skill(s) valid.`);
