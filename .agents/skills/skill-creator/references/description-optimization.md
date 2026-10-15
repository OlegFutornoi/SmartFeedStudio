# Skill Description Optimization Reference

## Trigger Optimization Protocol

1. Generate 20 trigger evaluation queries: 10 should-trigger (diverse user phrasings, edge cases) and 10 should-not-trigger (near misses, adjacent domains).
2. Save queries to `eval_set.json`:
   ```json
   [
     { "query": "concrete user prompt with file paths and context", "should_trigger": true },
     { "query": "adjacent task needing different tool", "should_trigger": false }
   ]
   ```
3. Run optimization loop via Python runner:
   ```bash
   python -m scripts.run_loop --eval-set <path-to-trigger-eval.json> --skill-path <path-to-skill> --max-iterations 5 --verbose
   ```
4. Extract `best_description` from output JSON and apply to skill YAML frontmatter.
