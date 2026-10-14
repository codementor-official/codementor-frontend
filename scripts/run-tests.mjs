// Chạy mọi `*.test.ts` (node:assert, mỗi file tự kết thúc bằng một dòng "ok").
// Mỗi file chạy với cwd là package chứa nó, để tsx đọc đúng tsconfig và alias `@/*`.
// Dùng: pnpm test            — tất cả
//       pnpm test lesson     — chỉ các file có "lesson" trong đường dẫn
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const filter = process.argv[2];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

function packageOf(file) {
  let dir = dirname(file);
  while (dir !== root && !existsSync(join(dir, 'package.json'))) dir = dirname(dir);
  return dir;
}

const files = ['apps', 'packages']
  .flatMap((top) => walk(join(root, top)))
  .filter((file) => !filter || file.includes(filter))
  .sort();
const tsx = join(root, 'node_modules', '.bin', 'tsx');
const failed = [];
for (const file of files) {
  const cwd = packageOf(file);
  const result = spawnSync(tsx, [relative(cwd, file)], { cwd, encoding: 'utf8' });
  const label = relative(root, file);
  if (result.status === 0) console.log(`✓ ${label}`);
  else {
    failed.push(label);
    console.log(`✗ ${label}\n${(result.stderr || result.stdout).trim().split('\n').slice(0, 15).join('\n')}`);
  }
}
console.log(`\n${files.length - failed.length}/${files.length} test files passed`);
process.exit(failed.length ? 1 : 0);
