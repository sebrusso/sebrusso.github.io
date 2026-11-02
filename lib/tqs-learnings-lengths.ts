/**
 * Serialized input lengths for all 1,699 annotated tasks (full_32k recipe, Qwen3 tokenizer), before truncation:
 * sum of issue + gold patch + tests + code-context tokens. Bins are log-spaced with an edge exactly at the
 * 30,720-token budget. Trim levels: how far code context had to be cut. Generated from sebrusso/tqs
 * data/processed/full_32k/tasks.parquet.
 */
export const INPUT_LENGTHS = {
  "n": 1699,
  "budget": 30720,
  "overflow": 224,
  "median": 10886,
  "p90": 35861,
  "max": 352963,
  "bins": [
    {
      "lo": 307,
      "hi": 387,
      "n": 0
    },
    {
      "lo": 387,
      "hi": 487,
      "n": 0
    },
    {
      "lo": 487,
      "hi": 613,
      "n": 0
    },
    {
      "lo": 613,
      "hi": 772,
      "n": 1
    },
    {
      "lo": 772,
      "hi": 971,
      "n": 11
    },
    {
      "lo": 971,
      "hi": 1223,
      "n": 7
    },
    {
      "lo": 1223,
      "hi": 1540,
      "n": 11
    },
    {
      "lo": 1540,
      "hi": 1938,
      "n": 23
    },
    {
      "lo": 1938,
      "hi": 2440,
      "n": 58
    },
    {
      "lo": 2440,
      "hi": 3072,
      "n": 64
    },
    {
      "lo": 3072,
      "hi": 3867,
      "n": 90
    },
    {
      "lo": 3867,
      "hi": 4869,
      "n": 110
    },
    {
      "lo": 4869,
      "hi": 6129,
      "n": 149
    },
    {
      "lo": 6129,
      "hi": 7717,
      "n": 138
    },
    {
      "lo": 7717,
      "hi": 9715,
      "n": 123
    },
    {
      "lo": 9715,
      "hi": 12230,
      "n": 126
    },
    {
      "lo": 12230,
      "hi": 15396,
      "n": 167
    },
    {
      "lo": 15396,
      "hi": 19383,
      "n": 145
    },
    {
      "lo": 19383,
      "hi": 24402,
      "n": 148
    },
    {
      "lo": 24402,
      "hi": 30720,
      "n": 104
    },
    {
      "lo": 30720,
      "hi": 38674,
      "n": 73
    },
    {
      "lo": 38674,
      "hi": 48688,
      "n": 39
    },
    {
      "lo": 48688,
      "hi": 61294,
      "n": 24
    },
    {
      "lo": 61294,
      "hi": 77165,
      "n": 23
    },
    {
      "lo": 77165,
      "hi": 97145,
      "n": 25
    },
    {
      "lo": 97145,
      "hi": 122299,
      "n": 16
    },
    {
      "lo": 122299,
      "hi": 153965,
      "n": 14
    },
    {
      "lo": 153965,
      "hi": 193830,
      "n": 5
    },
    {
      "lo": 193830,
      "hi": 244018,
      "n": 4
    },
    {
      "lo": 244018,
      "hi": 307200,
      "n": 0
    },
    {
      "lo": 307200,
      "hi": 386742,
      "n": 1
    }
  ],
  "trim": [
    [
      "Whole files fit",
      1475
    ],
    [
      "\u00b1200-line windows",
      181
    ],
    [
      "\u00b1100",
      19
    ],
    [
      "\u00b150",
      7
    ],
    [
      "\u00b120",
      5
    ],
    [
      "\u00b120 + tail cut",
      12
    ]
  ],
  "testsCut": 5,
  "patchCut": 1,
  "issueCut": 0
} as const
