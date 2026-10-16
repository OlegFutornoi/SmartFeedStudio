# Perplexity Agent API Examples & Reference

## 1. Quickstart (TypeScript SDK)

```typescript
import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});

const response = await client.responses.create({
  preset: 'low',
  input: 'What are the required XML feed fields for Rozetka seller marketplace in 2026?',
});

console.log('Answer:', response.output_text);
```

## 2. Web Grounding with Tools

```typescript
const response = await client.responses.create({
  model: 'openai/gpt-5.6-sol',
  input: 'Extract Prom.ua supplier feed pricing sync requirements',
  tools: [{ type: 'web_search' }],
});

const searchStep = response.output?.find((o: any) => o.results);
if (searchStep?.results) {
  for (const item of searchStep.results) {
    console.log(`Source: ${item.title} (${item.url})`);
  }
}
```

## 3. Structured JSON Schema Output

```typescript
const response = await client.responses.create({
  preset: 'low',
  input: 'Parse supplier catalog fields for Horoshop integration',
  text: {
    format: {
      type: 'json_schema',
      json_schema: {
        name: 'supplier_feed_schema',
        schema: {
          type: 'object',
          properties: {
            marketplace: { type: 'string' },
            requiredFields: { type: 'array', items: { type: 'string' } },
            optionalFields: { type: 'array', items: { type: 'string' } },
          },
          required: ['marketplace', 'requiredFields'],
          additionalProperties: false,
        },
      },
    },
  },
});

const parsed = JSON.parse(response.output_text);
console.log('Structured Result:', parsed);
```

## 4. Multi-Turn Conversations

```typescript
// Turn 1
const turn1 = await client.responses.create({
  preset: 'low',
  input: 'Compare Prom.ua and Rozetka wholesale pricing margins.',
});

// Turn 2: continue conversation by passing previous_response_id
const turn2 = await client.responses.create({
  preset: 'low',
  previous_response_id: turn1.id,
  input: 'Which of these two requires mandatory RRP adherence?',
});

console.log('Follow-up Answer:', turn2.output_text);
```

## 5. cURL Verification Request

```bash
curl https://api.perplexity.ai/v1/agent \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "preset": "low",
    "input": "Summarize supplier feed synchronization best practices in one sentence."
  }'
```
