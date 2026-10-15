# Skill Evaluation & Benchmark Loop Reference

## Benchmark Workflow

1. Spawn parallel runs: with-skill vs baseline (without-skill for new skills; previous snapshot for improvements).
2. Save outputs to `<workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/`.
3. Capture timing and token metrics from subagent notifications:
   ```json
   {
     "total_tokens": 84852,
     "duration_ms": 23332,
     "total_duration_seconds": 23.3
   }
   ```
4. Grade runs against assertions using `agents/grader.md`. Save results to `grading.json`.
5. Aggregate benchmark metrics:
   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
6. Launch review viewer:
   ```bash
   python eval-viewer/generate_review.py <workspace>/iteration-N --skill-name "<name>" --benchmark <workspace>/iteration-N/benchmark.json
   ```
