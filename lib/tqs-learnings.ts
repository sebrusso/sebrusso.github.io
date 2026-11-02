/**
 * Data for /writing/tqs-learnings. Every number comes from the TQS repo
 * (sebrusso/tqs): labels from the public SWE-bench Verified annotation
 * release, model predictions from runs/pod/t4_8b_32k (Qwen3-8B, LoRA,
 * leave-repo-out fold "sympy", seed 0), token counts from
 * data/processed/full_32k. Task text is quoted verbatim, trimmed where noted.
 */

export type Axis = 'underspecified' | 'false_negative' | 'difficulty'

export interface InputPart {
  key: 'issue' | 'patch' | 'tests' | 'context'
  label: string
  tokens: number // full size before truncation
  keptTokens: number // after fitting the 30,720-token input limit
  excerpt: string
  trimmed?: boolean // excerpt shortened for the page (not for the model)
}

export interface TaskExample {
  id: string
  kind: string
  headline: string
  takeaway: string
  inputs: InputPart[]
  annotators: Record<Axis, number[]> // the three reviewers' ratings
  label: Record<Axis, number> // combined label
  predicted: Record<Axis, number> // model's expected rating (sum of the three CORAL probabilities, 0–3)
  keptInVerified: boolean
  keepDropScore: number // P(underspecification ≥ 2 or false negatives ≥ 2), from the two rating heads
  note: { axis: Axis; text: string }
}

export const BUDGET_TOKENS = 30720

export const DIFFICULTY_TICKS = ['<15m', '15m–1h', '1–4h', '>4h']

export const AXIS_LABEL: Record<Axis, string> = {
  underspecified: 'Underspecification',
  false_negative: 'False negatives',
  difficulty: 'Difficulty',
}

export const EXAMPLES: TaskExample[] = [
  {
    id: 'sympy__sympy-23534',
    kind: 'Clean task',
    headline: 'one-line fix, test matches the issue',
    takeaway:
      'All three reviewers rated underspecification and false negatives 0. The model agrees and ranks it second-best of the 298 held-out tasks.',
    inputs: [
      {
        key: 'issue',
        label: 'Issue',
        tokens: 178,
        keptTokens: 178,
        trimmed: true,
        excerpt: `Using symbols to create functions doesn't work if there is an extra layer of parentheses
Sympy version == 1.10.1

Using \`symbols\` to create symbol-like objects like instances of \`Function\` as shown in the documentation creates objects of class \`Symbol\` instead of \`Function\` if there is an extra layer of parentheses.

    q, u = smp.symbols(('q:2', 'u:2'), cls=smp.Function)
    print(type(q[0]))

Expected result: <class 'sympy.core.function.UndefinedFunction'>
Actual result:   <class 'sympy.core.symbol.Symbol'>`,
      },
      {
        key: 'patch',
        label: 'Gold patch',
        tokens: 117,
        keptTokens: 117,
        excerpt: `--- a/sympy/core/symbol.py
+++ b/sympy/core/symbol.py
@@ -791,7 +791,7 @@ def literal(s):
         for name in names:
-            result.append(symbols(name, **args))
+            result.append(symbols(name, cls=cls, **args))`,
      },
      {
        key: 'tests',
        label: 'Tests',
        tokens: 263,
        keptTokens: 263,
        trimmed: true,
        excerpt: `sympy/core/tests/test_symbol.py
+from sympy.core.function import Function, UndefinedFunction
 ...
Must go from failing to passing: test_symbols`,
      },
      {
        key: 'context',
        label: 'Code context',
        tokens: 7208,
        keptTokens: 7208,
        trimmed: true,
        excerpt: `sympy/core/symbol.py at the base commit (the file the patch touches), in full.`,
      },
    ],
    annotators: { underspecified: [0, 0, 0], false_negative: [0, 0, 0], difficulty: [0, 0, 0] },
    label: { underspecified: 0, false_negative: 0, difficulty: 0 },
    predicted: { underspecified: 0.55, false_negative: 0.31, difficulty: 0.2 },
    keptInVerified: true,
    keepDropScore: 0.22,
    note: {
      axis: 'false_negative',
      text: 'The test checks exactly the issue being raised with the same example that is provided in the issue description. I cannot think of any other solution that might fail.',
    },
  },
  {
    id: 'sympy__sympy-17313',
    kind: 'Underspecified',
    headline: 'a two-line issue behind a 1,400-token patch',
    takeaway:
      'The reviewers split 1, 3 and 1 on underspecification. The combined label takes the maximum, 3, so Verified dropped the task. The model’s expected rating is 2.0.',
    inputs: [
      {
        key: 'issue',
        label: 'Issue',
        tokens: 51,
        keptTokens: 51,
        excerpt: `ceiling(pos) > 0 should be true
Also, shouldn't \`floor(neg) < 0\`, \`floor(pos) >= 0\` and \`ceiling(neg) <=0\` evaluate to True, too?`,
      },
      {
        key: 'patch',
        label: 'Gold patch',
        tokens: 1371,
        keptTokens: 1371,
        trimmed: true,
        excerpt: `--- a/sympy/functions/elementary/integers.py
+++ b/sympy/functions/elementary/integers.py
+    def _eval_is_negative(self):
+        return self.args[0].is_negative
+
+    def _eval_is_nonnegative(self):
+        return self.args[0].is_nonnegative
 ...
     def __le__(self, other):
+        other = S(other)
+        if self.args[0].is_real:
 ... (about 90 more added lines)`,
      },
      {
        key: 'tests',
        label: 'Tests',
        tokens: 2604,
        keptTokens: 2604,
        trimmed: true,
        excerpt: `sympy/functions/elementary/tests/test_integers.py
Must go from failing to passing: test_floor, test_ceiling`,
      },
      {
        key: 'context',
        label: 'Code context',
        tokens: 3015,
        keptTokens: 3015,
        trimmed: true,
        excerpt: `sympy/functions/elementary/integers.py at the base commit, in full.`,
      },
    ],
    annotators: { underspecified: [1, 3, 1], false_negative: [0, 3, 0], difficulty: [3, 2, 3] },
    label: { underspecified: 3, false_negative: 3, difficulty: 3 },
    predicted: { underspecified: 2.04, false_negative: 2.64, difficulty: 1.58 },
    keptInVerified: false,
    keepDropScore: 0.97,
    note: {
      axis: 'underspecified',
      text: 'The issue description uses vague references to variables like "pos" and "neg", and does not offer any detail about the problem. It is almost impossible to determine the requirement from it, much less a strategy for implementation.',
    },
  },
  {
    id: 'sympy__sympy-13806',
    kind: 'False negatives',
    headline: 'the tests check units the issue never mentions',
    takeaway:
      'The issue asks for the degree symbol; the FAIL_TO_PASS tests also check other units. Two of three reviewers rated false negatives 3, since a correct fix for the degree sign could still fail the tests. The model’s expected rating on that axis is 2.8, its fourth-highest of the 298.',
    inputs: [
      {
        key: 'issue',
        label: 'Issue',
        tokens: 58,
        keptTokens: 58,
        excerpt: `No support for \\[{90^^\\circ }\\]
I have latex \\[{90^^\\circ }\\], which means angle ninety degree, for example (cos(90 degree)) = 0, please add support for that? I appreate your reply.`,
      },
      {
        key: 'patch',
        label: 'Gold patch',
        tokens: 977,
        keptTokens: 977,
        trimmed: true,
        excerpt: `--- a/sympy/printing/latex.py
+++ b/sympy/printing/latex.py
     def _print_Mul(self, expr):
         from sympy.core.power import Pow
+        from sympy.physics.units import Quantity
 ...
-                    args = expr.args
+                    args = list(expr.args)
+
+                # If quantities are present append them at the back`,
      },
      {
        key: 'tests',
        label: 'Tests',
        tokens: 1151,
        keptTokens: 1151,
        trimmed: true,
        excerpt: `sympy/printing/pretty/tests/test_pretty.py
-from sympy.physics.units import joule
+from sympy.physics.units import joule, degree, ...
Must go from failing to passing: test_units, test_degree_printing`,
      },
      {
        key: 'context',
        label: 'Code context',
        tokens: 46001,
        keptTokens: 16753,
        trimmed: true,
        excerpt: `The touched printing modules at the base commit. Too large for the input limit, so they were cut to windows around the changed lines.`,
      },
    ],
    annotators: { underspecified: [1, 0, 1], false_negative: [2, 3, 3], difficulty: [1, 1, 2] },
    label: { underspecified: 1, false_negative: 3, difficulty: 1 },
    predicted: { underspecified: 2.01, false_negative: 2.78, difficulty: 1.99 },
    keptInVerified: false,
    keepDropScore: 0.98,
    note: {
      axis: 'false_negative',
      text: 'The tests include checks for other units, such as kilograms and meters, which are not mentioned in the issue description. This indicates that the tests are broader than necessary.',
    },
  },
  {
    id: 'sympy__sympy-20916',
    kind: 'Model error',
    headline: 'a terse but clear issue read as vague',
    takeaway:
      'All three reviewers rated underspecification 0. The model’s expected rating is 2.0, and its keep/drop score would have dropped the task. In training, the median issue is 1,413 characters at label 0 and 804 at label 3; the model appears to read brevity as vagueness.',
    inputs: [
      {
        key: 'issue',
        label: 'Issue',
        tokens: 64,
        keptTokens: 64,
        excerpt: `pprint unicode does not format subscripts on Greek letters
Good:
[ -t₀⋅w₀   -t₁⋅w₀   -t₂⋅w₀]

Bad:
[ -t₀⋅ω0   -t₁⋅ω0   -t₂⋅ω0]`,
      },
      {
        key: 'patch',
        label: 'Gold patch',
        tokens: 227,
        keptTokens: 227,
        trimmed: true,
        excerpt: `--- a/sympy/printing/conventions.py
+++ b/sympy/printing/conventions.py
-_name_with_digits_p = re.compile(r'^([a-zA-Z]+)([0-9]+)$')
+_name_with_digits_p = re.compile(r'^([^\\W\\d_]+)(\\d+)$', re.U)`,
      },
      {
        key: 'tests',
        label: 'Tests',
        tokens: 667,
        keptTokens: 667,
        trimmed: true,
        excerpt: `sympy/printing/tests/test_conventions.py
Must go from failing to passing: test_super_sub`,
      },
      {
        key: 'context',
        label: 'Code context',
        tokens: 652,
        keptTokens: 652,
        trimmed: true,
        excerpt: `sympy/printing/conventions.py at the base commit, in full.`,
      },
    ],
    annotators: { underspecified: [0, 0, 0], false_negative: [1, 0, 1], difficulty: [0, 0, 1] },
    label: { underspecified: 0, false_negative: 1, difficulty: 0 },
    predicted: { underspecified: 2.02, false_negative: 2.51, difficulty: 0.74 },
    keptInVerified: true,
    keepDropScore: 0.96,
    note: {
      axis: 'underspecified',
      text: 'The problem is clear. It seems that `pprint` Unicode does not format subscripts on Greek letters. The ticket description is well-structured and clear.',
    },
  },
]

/** Held-out sympy fold, n = 298, scored against the combined labels. `ci`: paired-bootstrap 95% CI of the 8B model
 *  minus the BEST baseline on that metric (2,000 resamples). `ceiling`: reviewer agreement as previously reported. */
export const RESULTS = [
  { metric: 'Underspecification (ρ)', t4: 0.358, t1: 0.233, length: 0.156, surface: 0.173, ceiling: 0.41, ci: '+0.185 [+0.071, +0.298]', better: true },
  { metric: 'False negatives (ρ)', t4: 0.48, t1: 0.422, length: 0.378, surface: 0.341, ceiling: 0.5, ci: '+0.102 [+0.026, +0.182]', better: true },
  { metric: 'Difficulty (ρ)', t4: 0.623, t1: 0.651, length: 0.618, surface: 0.655, ceiling: 0.56, ci: '−0.032 [−0.078, +0.010]', better: false },
  { metric: 'Keep/drop (AUROC)', t4: 0.772, t1: 0.724, length: 0.705, surface: 0.7, ceiling: null, ci: '+0.067 [+0.013, +0.122]', better: true },
  { metric: 'Quality score vs severity (τ)', t4: 0.354, t1: 0.291, length: 0.264, surface: 0.225, ceiling: null, ci: '+0.090 [+0.018, +0.169]', better: true },
]
