#!/usr/bin/env node

/**
 * Headroom Context Optimization & Compression Script for SmartFeed Studio Agents
 */

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  countEstimatedTokens,
  readAllStdin,
  postProcessMarkdown,
  validateDefectIntegrity,
  distillAndTranslateViaOmniRoute,
  compressViaHeadroom,
} from './headroom-pipeline.mjs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  const args = process.argv.slice(2);
  let rawContent = '';
  const isJson = args.includes('--json');
  const isRaw = args.includes('--raw');
  let shouldSave = args.includes('--save') || args.includes('-s');
  const skipOmni = args.includes('--no-omni');

  let outputFile = null;
  const outArgIdx = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
  if (outArgIdx !== -1 && args[outArgIdx + 1]) {
    outputFile = args[outArgIdx + 1];
    shouldSave = true;
  }

  const fileArg = args.find((a) => !a.startsWith('-') && existsSync(a));

  const textArgIdx = args.indexOf('--text');
  if (textArgIdx !== -1 && args[textArgIdx + 1]) {
    rawContent = args[textArgIdx + 1];
  } else if (fileArg) {
    rawContent = readFileSync(fileArg, 'utf-8');
  } else {
    rawContent = await readAllStdin();
  }

  const isCompactPlan = args.includes('--compact');

  if (fileArg && (shouldSave || isCompactPlan) && !outputFile) {
    const ext = path.extname(fileArg);
    const base = path.basename(fileArg, ext);
    const dir = path.dirname(fileArg);

    if (isCompactPlan || dir.includes('plans/active') || dir.endsWith('plans/active')) {
      outputFile = path.join(ROOT_DIR, 'plans/completed', `${base}.compressed.md`);
    } else if (base.endsWith('.compressed')) {
      outputFile = fileArg;
    } else {
      outputFile = path.join(dir, `${base}.compressed${ext}`);
    }
  }

  if (!rawContent || !rawContent.trim()) {
    console.error('[HEADROOM] Error: No content provided via file, --text, or stdin.');
    process.exit(1);
  }

  try {
    const origTokens = countEstimatedTokens(rawContent);
    const hasCyrillic = /[\u0400-\u04FF]/.test(rawContent);

    let workingContent = rawContent;
    let didOmniTranslate = false;

    if (hasCyrillic && !skipOmni) {
      console.error(
        '[HEADROOM] Ukrainian text detected. Delegating translation & semantic distillation to OmniRoute...',
      );
      const title = fileArg ? path.basename(fileArg) : '';
      workingContent = await distillAndTranslateViaOmniRoute(workingContent, title);
      didOmniTranslate = true;
    }

    const result = await compressViaHeadroom(workingContent);

    if (result.error && !result.compressed) {
      console.error(`[HEADROOM] Compression error: ${result.error}`);
      process.exit(1);
    }

    const title = fileArg ? path.basename(fileArg, path.extname(fileArg)) : '';
    let finalCleaned = postProcessMarkdown(result.compressed, title);
    validateDefectIntegrity(rawContent, finalCleaned);

    const finalTokens = countEstimatedTokens(finalCleaned, false);
    const tokensSaved = Math.max(0, origTokens - finalTokens);
    const savingsPercent = Math.min(
      95,
      Math.max(0, Math.round((tokensSaved / origTokens) * 1000) / 10),
    );

    const finalResult = {
      compressed: finalCleaned,
      original_tokens: origTokens,
      compressed_tokens: finalTokens,
      tokens_saved: tokensSaved,
      savings_percent: savingsPercent,
      omni_distilled: didOmniTranslate,
      transforms: result.transforms || [],
    };

    if (outputFile) {
      const outDir = path.dirname(outputFile);
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      writeFileSync(outputFile, finalResult.compressed, 'utf-8');

      try {
        await execFileAsync('npx', ['prettier', '--write', outputFile]);
      } catch {
        // Prettier formatting is best-effort
      }

      console.error(`[HEADROOM] Saved compressed output to: ${outputFile}`);
      console.error(
        `[HEADROOM] Tokens: ${origTokens} -> ${finalTokens} (-${savingsPercent}% saved: ${tokensSaved} tokens${
          didOmniTranslate ? ' via OmniRoute English distillation' : ''
        })`,
      );
      if (isJson) {
        console.log(JSON.stringify({ ...finalResult, outputFile }, null, 2));
      } else {
        console.log(outputFile);
      }
      return;
    }

    if (isJson) {
      console.log(JSON.stringify(finalResult, null, 2));
    } else if (isRaw) {
      process.stdout.write(finalResult.compressed);
    } else {
      console.error(
        `[HEADROOM] Tokens: ${origTokens} -> ${finalTokens} (-${savingsPercent}% saved: ${tokensSaved} tokens${
          didOmniTranslate ? ' via OmniRoute English distillation' : ''
        })`,
      );
      console.log(finalResult.compressed);
    }
  } catch (err) {
    console.error(`[HEADROOM] Error: ${err.message}`);
    process.exit(1);
  }
}

main();
