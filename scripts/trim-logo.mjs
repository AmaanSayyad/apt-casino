#!/usr/bin/env node
/**
 * Trim white padding + edge white border from APT-Casino-Logo.jpg → transparent PNG.
 * Run: node scripts/trim-logo.mjs
 */
import { copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const srcJpg = resolve(root, 'public/APT-Casino-Logo.jpg');
const outPng = resolve(root, 'public/APT-Casino-Logo.png');
const appIcon = resolve(root, 'src/app/icon.png');
const appApple = resolve(root, 'src/app/apple-icon.png');
const venvPy = resolve(root, 'scripts/.venv-trim/bin/python3');
const trimPy = resolve(root, 'scripts/_trim_logo.py');

function pythonBin() {
  if (existsSync(venvPy)) return venvPy;
  execSync(`python3 -m venv "${resolve(root, 'scripts/.venv-trim')}"`, { stdio: 'inherit' });
  execSync(`"${resolve(root, 'scripts/.venv-trim/bin/pip')}" install pillow`, { stdio: 'inherit' });
  return venvPy;
}

const py = pythonBin();
// threshold 18 — aggressive white removal; inner spade stays (not edge-connected)
execSync(`"${py}" "${trimPy}" "${srcJpg}" "${outPng}" 18`, { stdio: 'inherit' });
copyFileSync(outPng, appIcon);
copyFileSync(outPng, appApple);
console.log('Wrote', outPng, appIcon, appApple);
