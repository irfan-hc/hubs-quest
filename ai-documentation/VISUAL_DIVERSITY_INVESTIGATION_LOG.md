# Visual Diversity Investigation — Recursive Soundscapes

**Date:** 2026-11-26  
**Scope:** Read-only architectural investigation of `branchingEngine.ts`, `presets.ts`, `canvasRenderer.ts`, and `musicMapper.ts` explaining why visual output was limited to binary branching and planning 5 distinct recursive modes.

---

## Complete Prompt

> # VISUAL DIVERSITY INVESTIGATION — RECURSIVE SOUNDSCAPES
>
> The current application appears to generate mostly geometric branching simulations. I want to understand why the visual output is limited and how to introduce genuinely different recursive structures.
>
> Investigate:
> 1. The recursion engine and its generation rules.
> 2. Whether all presets use the same underlying branching algorithm.
> 3. Whether preset differences only change numerical parameters.
> 4. Whether the Canvas renderer restricts the appearance to straight branching lines.
> 5. Whether the existing architecture supports multiple recursive structures.
>
> Explore the possibility of introducing distinct recursive growth styles, such as:
> - Organic branching trees.
> - Crystalline and snowflake structures.
> - Coral-like branching.
> - Spiral and radial recursive patterns.
>
> Important constraints:
> - Do not change code yet.
> - Do not remove existing presets.
> - Do not introduce random visual effects just to create superficial differences.
> - Explain which changes require a new recursion algorithm versus renderer improvements.
> - Explain how each visual structure could generate corresponding musical events.
> - Recommend a realistic implementation plan that preserves the project's core concept.
>
> Return an investigation report with the relevant files and functions. Do not commit, push, or deploy.

---

## Investigation Summary & Findings

1. **`branchingEngine.ts`:** `generateRecursiveTree()` executed a single hardcoded binary split (`recurseBinary` / `recurseBranch`) producing $2^{D+1}-1$ nodes per `maxDepth`, with Mulberry32 PRNG only perturbing angle and length noise.
2. **All Presets Shared One Algorithm:** `Zen`, `Forest`, `Cosmic`, and `Dream` all passed numerical configs into the same `generateRecursiveTree()` binary split.
3. **Renderer vs. Algorithm:** `canvasRenderer.ts` already drew curves, petals, facets, and 6-fold rotated snow crystal plates, so the structural similarity came from every preset sharing the same $2^{D+1}-1$ binary graph topology.
4. **Architecture Readiness:** `BranchEvent` (`id`, `parentId`, `depth`, `order`, `start`, `end`, `angle`, `length`, `isTerminal`, `branchIndex`, `normalizedDepth`, `pan`) is graph-agnostic and cleanly supports multiple `patternType` generators.
5. **Recommended Plan:** Add optional `patternType?: "binary" | "organic" | "crystal" | "coral" | "spiral"` to `RecursionConfig`, dispatch to dedicated generators in `branchingEngine.ts`, map the 4 presets (`zen`→`crystal`, `forest`→`organic`, `cosmic`→`spiral`, `dream`→`coral`), and render directly from generated coordinates.
