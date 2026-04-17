#!/usr/bin/env node
/**
 * Node.js 24+ pode falhar com ERR_INVALID_PACKAGE_CONFIG ao ler package.json
 * aninhados que só definem { "type": "commonjs" } (glob, minimatch, lru-cache, etc.).
 * Em Node < 24 este script não faz nada (evita postinstall lento).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const major = Number.parseInt(process.version.slice(1).split('.')[0], 10);
if (Number.isFinite(major) && major < 24) {
  process.exit(0);
}

console.log('[backend] Ajuste Node 24+ (package.json aninhados)…');

const root = path.join(__dirname, '..');
const nm = path.join(root, 'node_modules');

if (!fs.existsSync(nm)) {
  process.exit(0);
}

const stub = {
  name: 'nested-cjs-stub',
  version: '0.0.0',
  private: true,
  type: 'commonjs',
};

/** @returns {string[]} */
function listCommonJsPackageJsonFiles() {
  const isWin = process.platform === 'win32';
  if (!isWin) {
    try {
      const out = execSync(
        `find "${nm}" -path '*/dist/commonjs/package.json' -type f 2>/dev/null || true`,
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
      );
      return out
        .trim()
        .split('\n')
        .filter(Boolean);
    } catch {
      /* cai no walk */
    }
  }

  const acc = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (
        ent.isFile() &&
        ent.name === 'package.json' &&
        full.endsWith(`${path.sep}dist${path.sep}commonjs${path.sep}package.json`)
      ) {
        acc.push(full);
      }
    }
  }
  walk(nm);
  return acc;
}

let fixed = 0;
for (const file of listCommonJsPackageJsonFiles()) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    continue;
  }
  const keys = Object.keys(data);
  if (keys.length === 1 && data.type === 'commonjs') {
    fs.writeFileSync(file, JSON.stringify(stub, null, 2) + '\n');
    fixed++;
  }
}

if (fixed > 0) {
  console.log(`[backend] Atualizados ${fixed} package.json (compat. Node 24+).`);
} else {
  console.log('[backend] Nenhum package.json mínimo encontrado (ok).');
}
