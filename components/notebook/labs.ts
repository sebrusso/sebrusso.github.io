// Lab → color token. The tokens live in app/notebook-7f3k9q/notebook.css with
// light and dark values, so the plot stays legible in both themes.
const LABS: [RegExp, string][] = [
  [/anthropic|claude/i, 'anthropic'],
  [/openai|gpt|o3|o4/i, 'openai'],
  [/google|gemini|deepmind/i, 'google'],
  [/xai|grok/i, 'xai'],
  [/deepseek/i, 'deepseek'],
  [/moonshot|kimi/i, 'moonshot'],
  [/alibaba|qwen/i, 'qwen'],
  [/zhipu|z\.ai|glm/i, 'zhipu'],
  [/meta|llama/i, 'meta'],
  [/mistral|devstral/i, 'mistral'],
]

export function labKey(lab: string): string {
  return LABS.find(([re]) => re.test(lab))?.[1] ?? 'other'
}

export function labToken(lab: string): string {
  return `var(--lab-${labKey(lab)})`
}
