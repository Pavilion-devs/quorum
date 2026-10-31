"use client"

import { ArrowRight } from "lucide-react"
import { useState, type FormEvent } from "react"
import { startMeetingAction } from "@/app/start/actions"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

/** Hosts start like guests join: a name is enough — an anonymous session is created, then the room. */
export function StartMeeting() {
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const form = new FormData(event.currentTarget)
		const name = String(form.get("name") ?? "").trim()
		const title = String(form.get("title") ?? "").trim()
		if (!name) return setError("Tell the room your name")
		setPending(true)
		setError(null)
		const session = await authClient.getSession()
		if (!session.data) {
			const signIn = await authClient.signIn.anonymous()
			if (signIn.error) {
				setPending(false)
				return setError(signIn.error.message ?? "Could not start. Please try again.")
			}
		}
		const update = await authClient.updateUser({ name })
		if (update.error) {
			setPending(false)
			return setError(update.error.message ?? "Could not set your name.")
		}
		// Redirects into the new room on success.
		const result = await startMeetingAction(title)
		setPending(false)
		if (result?.error) setError(result.error)
	}

	return (
		<main className="relative grid min-h-dvh flex-1 place-items-center overflow-hidden px-4 py-16">
			<div aria-hidden className="bg-grid absolute inset-0 [mask-image:radial-gradient(circle,black,transparent_65%)]" />
			<form onSubmit={onSubmit} className="glass relative w-full max-w-md overflow-hidden rounded-3xl p-8">
				<Logo className="size-9" />
				<h1 className="font-display mt-7 text-[44px] leading-none tracking-[-0.015em] sm:text-[56px] text-balance">Start a meeting</h1>
				<p className="mt-3 text-[14px] text-muted">Your agent team joins as soon as the room opens. Share the link to invite others.</p>
				<div className="mt-8 space-y-2">
					<Label htmlFor="name">Your name</Label>
					<Input id="name" name="name" required maxLength={60} autoComplete="name" autoFocus placeholder="How the room will see you" />
				</div>
				<div className="mt-4 space-y-2">
					<Label htmlFor="title">Meeting name</Label>
					<Input id="title" name="title" required maxLength={80} defaultValue="Quorum demo" />
				</div>
				{error && (
					<p role="alert" className="mt-3 text-sm text-bad">
						{error}
					</p>
				)}
				<Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
					{pending ? "Starting…" : "Start meeting"} {!pending && <ArrowRight />}
				</Button>
				<p className="mt-4 text-center text-[12px] leading-relaxed text-faint">
					No account needed. What you say is transcribed and shared with everyone in the room.
				</p>
			</form>
		</main>
	)
}
