/* eslint-disable */
/**
 * Утиліта генерації AJV JSON Schema (Draft-07) з прикладу JSON-відповіді або payload.
 *
 * Використання:
 *   node .agents/skills/pw-api/scripts/generate-json-schema.js <input.json> [output.json] [--title="My Schema"] [--allow-additional]
 */

const fs = require('fs');
const path = require('path');

function detectStringFormat(val) {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) return 'uuid';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) return 'date-time';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'date';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'email';
  if (/^https?:\/\//.test(val)) return 'uri';
  return undefined;
}

function inferSchema(value, options = { strict: true }) {
  if (value === null) {
    return { type: ['string', 'null'] };
  }

  const type = typeof value;

  if (type === 'boolean') {
    return { type: 'boolean' };
  }

  if (type === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' };
  }

  if (type === 'string') {
    const schema = { type: 'string' };
    const format = detectStringFormat(value);
    if (format) schema.format = format;
    return schema;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', items: {} };
    }
    return {
      type: 'array',
      items: inferSchema(value[0], options),
    };
  }

  if (type === 'object') {
    const properties = {};
    const required = Object.keys(value);

    for (const [key, val] of Object.entries(value)) {
      properties[key] = inferSchema(val, options);
    }

    const schema = {
      type: 'object',
      required,
      properties,
    };

    if (options.strict) {
      schema.additionalProperties = false;
    }

    return schema;
  }

  return {};
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Використання:
  node generate-json-schema.js <input.json> [output.json] [опції]

Опції:
  --title="Назва схеми"        Задає заголовок схеми
  --allow-additional           Дозволяє додаткові поля (additionalProperties: true)
`);
    process.exit(0);
  }

  const inputFile = args[0];
  const outputFile = args[1] && !args[1].startsWith('--') ? args[1] : null;

  const titleArg = args.find((a) => a.startsWith('--title='));
  const title = titleArg
    ? titleArg.split('=')[1].replace(/['"]/g, '')
    : path.basename(inputFile, '.json');
  const allowAdditional = args.includes('--allow-additional');

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Вхідний файл не знайдено: ${inputFile}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(inputFile, 'utf-8');
  const json = JSON.parse(rawData);

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: title,
    description: `Автоматично згенерована схема для ${title}`,
    ...inferSchema(json, { strict: !allowAdditional }),
  };

  const outputContent = JSON.stringify(schema, null, 2);

  if (outputFile) {
    const outDir = path.dirname(outputFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(outputFile, outputContent, 'utf-8');
    console.log(`✅ Схему успішно збережено у: ${outputFile}`);
  } else {
    console.log(outputContent);
  }
}

if (require.main === module) {
  main();
}

module.exports = { inferSchema };
