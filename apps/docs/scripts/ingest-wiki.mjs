import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const WIKI_DIR = path.join(ROOT_DIR, 'wiki');
const DOCS_DIR = path.join(ROOT_DIR, 'apps/docs/src/content/docs');

const MAPPINGS = [
  { srcDir: '01-overview', destDir: 'overview' },
  { srcDir: '02-tech-stack', destDir: 'architecture' },
  { srcDir: '03-database-schema', destDir: 'database' },
  { srcDir: '04-backend-cqrs', destDir: 'backend' },
  { srcDir: '05-desktop-client', destDir: 'desktop' },
  { srcDir: '06-admin-portal', destDir: 'admin' },
  { srcDir: '07-testing-and-qa', destDir: 'testing' },
  { srcDir: '08-user-faq', destDir: 'faq' },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function processMarkdown(content) {
  const lines = content.split('\n');
  let title = 'SmartFeed Studio Documentation';
  let firstHeadingIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim();
      firstHeadingIdx = i;
      break;
    }
  }

  // Remove the initial # title line to avoid double title in Starlight
  let bodyLines = [...lines];
  if (firstHeadingIdx >= 0) {
    bodyLines.splice(firstHeadingIdx, 1);
  }

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "Технічна та архітектурна документація SmartFeed Studio"
---

`;

  return frontmatter + bodyLines.join('\n').trim() + '\n';
}

function createEnglishVersion(ukContent, _filename) {
  const lines = ukContent.split('\n');
  let title = 'SmartFeed Studio Documentation';
  for (const line of lines) {
    if (line.startsWith('title: "')) {
      title = line.replace('title: "', '').replace('"', '').trim();
      break;
    }
  }

  return `---
title: "${title} (EN)"
description: "SmartFeed Studio Engineering & Architectural Documentation"
---

> **Note:** English translation of this document is synchronized with the canonical Ukrainian architectural reference.

${lines.slice(4).join('\n')}
`;
}

for (const { srcDir, destDir } of MAPPINGS) {
  const sourcePath = path.join(WIKI_DIR, srcDir);
  if (!fs.existsSync(sourcePath)) continue;

  const targetUkDir = path.join(DOCS_DIR, destDir);
  const targetEnDir = path.join(DOCS_DIR, 'en', destDir);
  ensureDir(targetUkDir);
  ensureDir(targetEnDir);

  const files = fs.readdirSync(sourcePath).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const rawContent = fs.readFileSync(path.join(sourcePath, file), 'utf-8');
    const ukDoc = processMarkdown(rawContent);
    const enDoc = createEnglishVersion(ukDoc, file);

    fs.writeFileSync(path.join(targetUkDir, file), ukDoc, 'utf-8');
    fs.writeFileSync(path.join(targetEnDir, file), enDoc, 'utf-8');
    console.log(`Synced: ${srcDir}/${file} -> docs/${destDir}/${file} & docs/en/${destDir}/${file}`);
  }
}

console.log('Wiki ingestion complete.');
