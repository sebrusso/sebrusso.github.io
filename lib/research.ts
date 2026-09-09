/**
 * Research / project entries rendered on /research.
 *
 * Kept as data rather than JSX so the page stays a thin map over this list, and
 * so an entry can be pulled from the site by flipping `hidden` instead of
 * commenting out a block of markup.
 *
 * Card shape (see components/research-card.tsx):
 *   always visible -> title, meta, authors, `summary`
 *   behind expand  -> body, figure, links
 *
 * An entry with no `body` and no `figure` has nothing to reveal, so it renders
 * as a static card: no chevron, no expand, links shown inline.
 */

export interface ResearchLink {
  label: string
  href: string
}

export interface ResearchFigure {
  src: string
  /** Alt text for screen readers; describe the scene, not the caption. */
  alt: string
  /** Visible caption printed under the image. */
  caption: string
  width: number
  height: number
}

export interface ResearchEntry {
  /** Stable key; also used as the DOM id linking the button to its panel. */
  id: string
  title: string
  /** Small grey line under the title: venue, org, role, date. */
  meta: string
  /**
   * arXiv id used to look up a live citation count at build time. Omit for
   * entries with no paper.
   */
  arxivId?: string
  /** Author list, shown in the always-visible head. */
  authors?: string[]
  /** Two sentences, visible in the collapsed state. Keep it to two. */
  summary: string
  /**
   * Long description revealed on expand. Each string renders as its own
   * paragraph.
   */
  body: string[]
  figure?: ResearchFigure
  links: ResearchLink[]
  /** Set true to keep an entry in the repo but off the live page. */
  hidden?: boolean
}

export const RESEARCH_ENTRIES: ResearchEntry[] = [
  {
    id: 'litbench',
    title: 'LitBench: A Benchmark and Dataset for Reliable Evaluation of Creative Writing',
    meta: 'EACL 2026 · Stanford Autonomous Agents Lab',
    arxivId: '2507.00769',
    authors: [
      'Daniel Fein',
      'Sebastian Russo',
      'Violet Xiang',
      'Kabir Jolly',
      'Rafael Rafailov',
      'Nick Haber',
    ],
    // What we built and what we did with it. Paraphrased rather than lifted
    // from the abstract, which opens on the problem statement. No em dashes,
    // "we" as the subject, mixed sentence lengths. Results are left to the
    // paper; the links are one click away.
    summary:
      'We built LitBench from Reddit story comparisons. The test set holds 2,480 debiased, human-labeled pairs, with another 43,827 for training. We scored off-the-shelf LLM judges against it, then trained Bradley-Terry and generative reward models of our own.',
    // No body paragraphs — the figure alone is what expanding reveals.
    body: [],
    figure: {
      src: '/images/eacl-2026-litbench.webp',
      alt: 'Daniel Fein and Sebastian Russo standing beside the LitBench poster at EACL 2026.',
      caption: 'daniel and i at EACL 2026 in Rabat, Morocco',
      width: 1200,
      height: 875,
    },
    links: [
      { label: 'arXiv', href: 'https://arxiv.org/abs/2507.00769' },
      { label: 'ACL Anthology', href: 'https://aclanthology.org/2026.eacl-long.362/' },
      { label: 'HuggingFace', href: 'https://huggingface.co/SAA-Lab' },
      { label: 'GitHub', href: 'https://github.com/drfein/LitBench' },
    ],
  },

  {
    // Hidden for now at Seb's request. Left in place so it can be restored by
    // deleting the `hidden` flag.
    id: 'embeddinggemma',
    hidden: true,
    title: 'EmbeddingGemma: An Open On-Device Text Embedding Model',
    meta: 'Google DeepMind · Contributor',
    summary:
      'EmbeddingGemma is a 308M-parameter multilingual text embedding model built on Gemma 3, released with open weights. It covers 100+ languages at a 2K-token context.',
    body: [
      'Matryoshka representation learning yields usable vectors from 768 down to 128 dimensions, and quantized it runs under 200MB of RAM at roughly 22ms per embedding on EdgeTPU — small enough for retrieval, semantic search, and classification to happen entirely on-device.',
    ],
    links: [
      { label: 'Model card', href: 'https://ai.google.dev/gemma/docs/embeddinggemma/model_card' },
      { label: 'Overview', href: 'https://ai.google.dev/gemma/docs/embeddinggemma' },
      { label: 'HuggingFace', href: 'https://huggingface.co/google/embeddinggemma-300m' },
    ],
  },

  {
    id: 'gemini-embedding-2',
    title: 'Gemini Embedding 2: A Native Multimodal Embedding Model from Gemini',
    meta: 'Google DeepMind · Contributor · May 2026',
    arxivId: '2605.27295',
    summary:
      'Gemini Embedding 2 embeds video, audio, image, and text into a single shared representation space, so arbitrary interleaved combinations of those modalities can be compared directly. It reaches state-of-the-art results on unimodal, cross-modal, and multimodal retrieval benchmarks.',
    // Empty body and no figure, so this renders as a static card: no chevron,
    // no expand, links inline.
    body: [],
    links: [
      { label: 'arXiv', href: 'https://arxiv.org/abs/2605.27295' },
      {
        label: 'Blog',
        href: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/',
      },
    ],
  },
]
