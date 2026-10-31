"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createRoomRecord } from "@/lib/rooms"
import { getSessionUser } from "@/lib/session"

const NewMeeting = z.object({ title: z.string().trim().min(1, "Give the meeting a name").max(80) })

export type StartMeetingState = { error: string | null }

/** Anyone with a session — including a just-created guest — can host; no account needed. */
export async function startMeetingAction(title: string): Promise<StartMeetingState> {
	const user = await getSessionUser()
	if (!user) return { error: "Could not start a session. Please try again." }
	const parsed = NewMeeting.safeParse({ title })
	if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name" }
	const room = await createRoomRecord(user.id, parsed.data.title)
	redirect(`/r/${room.id}`)
}
