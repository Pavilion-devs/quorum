import type { Metadata } from "next"
import { StartMeeting } from "@/components/start-meeting"

export const metadata: Metadata = { title: "Start a meeting" }

export default function StartPage() {
	return <StartMeeting />
}
