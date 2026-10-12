import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HEX_COLOR_PATTERN = /#[\da-f]{3,8}\b/gi;
const COLOR_FUNCTION_PATTERN = /\b(?:rgb|rgba|hsl|hsla)\(/i;
const FONT_FAMILY_PATTERN = /^\s*font-family\s*:\s*(.+?)\s*;?\s*$/i;
const FONT_WEIGHT_PATTERN = /^\s*font-weight\s*:\s*(.+?)\s*;?\s*$/i;
const SEMANTIC_VALUE_PATTERN =
  /^var\(--font-(?:sans|serif|weight-[\w-]+)\)|^(?:inherit|initial|unset|revert|revert-layer)$/i;

const allowedHexByPath = new Map([
  ['src/scripts/route-map.ts', new Set(['#a05c32', '#19342d', '#e5b77e'])],
  ['src/scripts/game-map.ts', new Set(['#a05c32', '#527066', '#e5b77e', '#b7d0bc'])],
  ['src/styles/pages/sobre-el-pueblo.css', new Set(['#315f4e', '#efe6d6'])],
]);

function isTokenSource(path) {
  return path === 'src/styles/tokens.css';
}

function hasExplicitException(line) {
  return /css-architecture:\s*allow\b/i.test(line);
}

function findArchitectureViolations(diffText) {
  const violations = [];
  let currentPath = null;

  for (const rawLine of diffText.split('\n')) {
    if (rawLine.startsWith('+++ b/')) {
      currentPath = rawLine.slice(6);
      continue;
    }

    if (!currentPath || !rawLine.startsWith('+') || rawLine.startsWith('+++')) {
      continue;
    }

    const line = rawLine.slice(1);

    for (const match of line.matchAll(HEX_COLOR_PATTERN)) {
      const value = match[0].toLowerCase();
      const allowed =
        isTokenSource(currentPath) ||
        hasExplicitException(line) ||
        allowedHexByPath.get(currentPath)?.has(value);

      if (!allowed) {
        violations.push({ path: currentPath, line: line.trim(), reason: 'raw color literal' });
      }
    }

    if (!isTokenSource(currentPath) && !hasExplicitException(line)) {
      if (COLOR_FUNCTION_PATTERN.test(line)) {
        violations.push({ path: currentPath, line: line.trim(), reason: 'raw color function' });
      }

      const fontFamily = line.match(FONT_FAMILY_PATTERN)?.[1];
      if (fontFamily && !SEMANTIC_VALUE_PATTERN.test(fontFamily)) {
        violations.push({ path: currentPath, line: line.trim(), reason: 'raw font family' });
      }

      const fontWeight = line.match(FONT_WEIGHT_PATTERN)?.[1];
      if (fontWeight && !SEMANTIC_VALUE_PATTERN.test(fontWeight)) {
        violations.push({ path: currentPath, line: line.trim(), reason: 'raw font weight' });
      }
    }
  }

  return violations;
}

function buildUntrackedDiff(root) {
  let files;
  try {
    files = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'src'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
  } catch {
    return '';
  }

  return files
    .map((file) => {
      const content = readFileSync(resolve(root, file), 'utf8');
      return [`+++ b/${file}`, ...content.split('\n').map((line) => `+${line}`)].join('\n');
    })
    .join('\n');
}

function run() {
  const root = resolve(new URL('.', import.meta.url).pathname, '..');
  const trackedDiff = execFileSync('git', ['diff', '--unified=0', '--', 'src'], {
    cwd: root,
    encoding: 'utf8',
  });
  const violations = findArchitectureViolations(`${trackedDiff}\n${buildUntrackedDiff(root)}`);

  if (violations.length === 0) {
    console.log('CSS architecture guard passed: no new unapproved visual literals.');
    return;
  }

  console.error('CSS architecture guard failed:');
  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.reason}: ${violation.line}`);
  }
  process.exitCode = 1;
}

export { findArchitectureViolations };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  run();
}
