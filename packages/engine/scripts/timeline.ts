import type { AgentPhase } from "../src/index"

/**
 * Records each agent's phase changes so the end of a run can prove, not just claim, that agents
 * worked at the same time: a per-agent lane chart plus the peak number of loops in flight.
 */

const BUSY: ReadonlySet<AgentPhase> = new Set(["thinking", "tool", "answering", "paused"])
const GLYPH: Partial<Record<AgentPhase, string>> = { queued: "░", thinking: "█", tool: "▓", answering: "█", paused: "▒" }

interface Span {
	readonly agent: string
	readonly phase: AgentPhase
	readonly from: number
	to: number
}

export class Timeline {
	private readonly spans: Span[] = []
	private readonly open = new Map<string, Span>()

	constructor(private readonly startedAt: number) {}

	record(agent: string, phase: AgentPhase, at = Date.now()): void {
		const current = this.open.get(agent)
		if (current) current.to = at
		if (phase === "listening" || phase === "degraded") {
			this.open.delete(agent)
			return
		}
		const span: Span = { agent, phase, from: at, to: at }
		this.spans.push(span)
		this.open.set(agent, span)
	}

	/** Highest number of agents simultaneously busy (thinking, calling a tool, or paused on approval). */
	peak(): { count: number; at: number; agents: string[] } {
		const busy = this.spans.filter((s) => BUSY.has(s.phase) && s.to > s.from)
		const edges = busy.flatMap((s) => [
			{ at: s.from, delta: 1, s },
			{ at: s.to, delta: -1, s },
		])
		// Close before open at the same instant so back-to-back spans don't count as overlap.
		edges.sort((a, b) => a.at - b.at || a.delta - b.delta)
		const live = new Set<Span>()
		let best = { count: 0, at: this.startedAt, agents: [] as string[] }
		for (const e of edges) {
			if (e.delta > 0) live.add(e.s)
			else live.delete(e.s)
			const agents = [...new Set([...live].map((s) => s.agent))]
			if (agents.length > best.count) best = { count: agents.length, at: e.at, agents }
		}
		return best
	}

	/** Seconds during which two or more agents were busy at once. */
	overlapSeconds(): number {
		const busy = this.spans.filter((s) => BUSY.has(s.phase) && s.to > s.from)
		const edges = busy.flatMap((s) => [
			{ at: s.from, agent: s.agent, delta: 1 },
			{ at: s.to, agent: s.agent, delta: -1 },
		])
		edges.sort((a, b) => a.at - b.at || a.delta - b.delta)
		const counts = new Map<string, number>()
		let total = 0
		let prev = edges[0]?.at ?? 0
		for (const e of edges) {
			const liveAgents = [...counts.values()].filter((n) => n > 0).length
			if (liveAgents >= 2) total += e.at - prev
			prev = e.at
			counts.set(e.agent, (counts.get(e.agent) ?? 0) + e.delta)
		}
		return total / 1000
	}

	render(width = 64, color: (agent: string, s: string) => string = (_, s) => s): string {
		const end = Math.max(this.startedAt + 1, ...this.spans.map((s) => s.to))
		const total = Math.max(1, end - this.startedAt)
		const agents = [...new Set(this.spans.map((s) => s.agent))]
		const nameWidth = Math.max(...agents.map((a) => a.length), 5)
		const lines = agents.map((agent) => {
			const lane = Array.from({ length: width }, () => "·")
			for (const s of this.spans.filter((x) => x.agent === agent)) {
				const glyph = GLYPH[s.phase]
				if (!glyph) continue
				const a = Math.floor(((s.from - this.startedAt) / total) * width)
				const b = Math.max(a + 1, Math.ceil(((s.to - this.startedAt) / total) * width))
				for (let i = a; i < Math.min(b, width); i++) lane[i] = glyph
			}
			return `${agent.padEnd(nameWidth)} │${color(agent, lane.join(""))}│`
		})
		const axis = `${" ".repeat(nameWidth)} 0s${" ".repeat(Math.max(1, width - 6))}${(total / 1000).toFixed(0)}s`
		const legend = "█ thinking  ▓ tool call  ▒ paused for approval  ░ queued (room semaphore)"
		return [...lines, axis, legend].join("\n")
	}
}
