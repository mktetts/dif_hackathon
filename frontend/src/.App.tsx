import React from "react"
import { IMessage } from "didcomm"
import { Profile, generateProfile } from "./lib/profile"
import agent from "./lib/agent"
import { default as ContactService, Contact } from "./lib/contacts"
import { useEffect, useState } from "react"

interface ProfileAttributes {
	actor?: string
}
function App({ actor }: ProfileAttributes) {
	const [connected, setConnected] = useState<boolean>(false)
	const [profile, setProfile] = useState<Profile | null>(null)
	useEffect(() => {
		const initializeProfile = async () => {
			const generatedProfile = await generateProfile({ label: actor })
			setProfile(generatedProfile)
			console.log(generatedProfile)
			// Set up agent
			agent.setupProfile(generatedProfile)
			agent.ondid = onDidGenerated
			agent.onconnect = () => setConnected(true)
			agent.ondisconnect = () => setConnected(false)
		}

		initializeProfile()
	}, [actor])

	const onDidGenerated = (did: string) => {
		if (profile) {
			profile.did = did
			setProfile({ ...profile })
		}
	}
	return <div>App</div>
}
export default App
