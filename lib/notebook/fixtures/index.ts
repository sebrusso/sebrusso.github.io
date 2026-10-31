import type { RawFixture } from '../build'
import terminalBench4 from './terminal-bench-4.json'
import deepswe11 from './deepswe-v1-1.json'
import cursorBench4 from './cursorbench-4.json'
import frontierCode11 from './frontiercode-1-1.json'

// Research fixtures for the mock. Each is written by the research pass
// (sources on every value; TB4 and DeepSWE merged from two independent
// passes) and becomes one eval on first load.
export const FIXTURES: RawFixture[] = [terminalBench4, deepswe11, cursorBench4, frontierCode11] as RawFixture[]
