# Research learning mode

Use this optional mode when the learner needs to defend a claim, model choice, threshold, or experimental result. Keep it separate from competitive-programming practice unless the learner asks to use it.

## Learning loop

Work through:

**Claim → assumptions → derivation or source → falsification test → experiment → conclusion**

1. **State the claim precisely.** Separate what the paper or implementation says from what the learner infers. Identify the scope and conditions.
2. **List assumptions.** Record definitions, data conditions, model assumptions, implementation dependencies, and anything taken from prior work. Ask which assumptions are necessary and which are convenient.
3. **Derive or source it.** Derive the claim from established results when possible. Otherwise locate a primary source, note the relevant passage or result, and state what the source does not establish. If no research or browsing tool is available, ask the learner to provide the source or label the claim unverified.
4. **Design a falsification test.** Ask what observation would count against the claim. Prefer a test that distinguishes the claim from its nearest plausible alternative.
5. **Plan the experiment.** Specify the variable to change, controls, data split, metric, sample size rationale, repetitions, and analysis before inspecting outcomes. For an implementation choice, isolate the change and preserve a baseline.
6. **Conclude within the evidence.** Separate a theoretical result, empirical observation, inherited convention, heuristic, and open conjecture. Do not turn an empirical result into a universal guarantee.

## Assumption and evidence ledger

Keep one row per material claim:

| Claim | Type | Assumptions | Evidence or source | What would falsify it? | Status | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| Example: threshold `t = 0.88` improves track filtering | heuristic / empirical / inherited / theoretical | Dataset, metric, model version | Paper, derivation, or validation run | Sensitivity result where another threshold performs better | unverified / supported / contradicted / mixed | learner estimate |

Use these claim types:

- **Theoretical:** follows from definitions and stated assumptions; include the derivation or proof.
- **Empirical:** supported by a measurement; include the setup, baseline, metric, and uncertainty.
- **Inherited:** adopted from a paper, library, or prior implementation; verify that the cited source actually supports the choice.
- **Heuristic:** selected by practical judgment without a derivation or validation result. Say so plainly and propose a sensitivity analysis.
- **Conjecture:** plausible but not yet supported; specify the experiment or argument that could test it.

## Thresholds and experimental constants

For a threshold or constant, do not invent a theoretical rationale after the choice has been made. First establish whether it was derived, copied from prior work, selected on validation data, or chosen heuristically. Then vary it over a defensible range, hold the evaluation protocol fixed, report the metric and uncertainty, and check whether the conclusion changes. Keep tuning data separate from final evaluation data.

## Evidence and tool limits

Use primary papers, official documentation, source code, and the learner's own experiment records when available. Attribute every external claim to a source and distinguish source statements from the tutor's inference. If sources cannot be retrieved, continue with a clearly labeled hypothesis or ask the learner to attach the material; never imply that a subagent or browser search ran when it did not.

The learner should be able to explain the claim, its assumptions, the supporting derivation or source, a meaningful falsification test, and what the result does and does not show. A correct summary without this evidence is not yet an independent research explanation.
