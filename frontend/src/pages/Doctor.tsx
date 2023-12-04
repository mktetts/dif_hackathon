import React, { useEffect, useRef, useState } from 'react'
import { Grid, TextField, Container, Paper, Typography, Box, TextareaAutosize, Button } from "@mui/material";
import PortraitIcon from '@mui/icons-material/Portrait';
import Topbar from "../components/Topbar";
import { default as ContactService, Contact, Message } from "../lib/contacts"
import Peer from 'peerjs'
import Modal from '@mui/material/Modal';
import didStore from "../store/didStore";


import { Profile, generateProfile } from "../lib/profile"
import agent from "../lib/agent"
import messageStore from '../store/messageStore';
import { issuePrecriptionCredential } from '../dif_items/Trinsic_Credential';
import { addPrescriptionRecord, initWeb5 } from '../dif_items/DWN';
interface ProfileAttributes {
	actor?: string
}

const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 500,
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
};

function Doctor({ actor }: ProfileAttributes) {
	const [newMessage, setNewMessage] = useState('');
	const [connected, setConnected] = useState<boolean>(false)
	const [profile, setProfile] = useState<Profile | null>(null)

	const [open, setOpen] = useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => {
		setOpen(false);
	}
	const [newContact, setNewContact] = useState<Partial<Contact>>(null)
	// let newContact: Partial<Contact> = {}
	const [contact, setContact] = useState<Contact | null>(null)
	const [messages, setMessages] = useState([
		{ sender: 'John', message: 'Hello there!', time: '10:00 AM' },
		{ sender: 'Jane', message: 'Hi John! How are you?', time: '10:05 AM' },
		{ sender: 'John', message: 'I\'m doing well. Thanks for asking!', time: '10:10 AM' },
		// Add more messages as needed
	]);

	const updateNewContact = (event: any) => {
		const newDidValue = event.target.value;

		// Update only the 'did' property while keeping other properties unchanged
		setNewContact((prevContact) => ({
			...prevContact,
			did: newDidValue,
		}));
	}
	const [senderMessage, updateSenderMessage] = useState([])

	const sendMessage = async (content: string) => {
		updateSenderMessage([...senderMessage, content]);
		const message = {
			type: "https://didcomm.org/basicmessage/2.0/message",
			lang: "en",
			body: {
				content,
			},
		}
		await agent.sendMessage(contact, message)
	}
	const onAddContact = async () => {
		ContactService.addContact(newContact as Contact)
		setContact(newContact as Contact)
		// this.contacts = ContactService.getContacts()
		agent.sendProfile(newContact as Contact)
		// setTimeout(async () => {
		//   if (!this.newContact.label)
		// 	await agent.requestProfile(this.newContact as Contact)
		//   agent.sendFeatureDiscovery(this.newContact as Contact)
		// }, 500)

	}
	const onDidGenerated = (did: string) => {
		if (profile) {
			profile.did = did
			setProfile({ ...profile })
		}
	}
	const initializeProfile = async () => {
		const generatedProfile = await generateProfile({ label: actor })
		setProfile(generatedProfile)
		// Set up agent
		agent.setupProfile(generatedProfile)
		agent.ondid = onDidGenerated
		agent.onconnect = () => setConnected(true)
		agent.ondisconnect = () => setConnected(false)
	}

	const peerInstance = useRef(null);
	const connectionInstance = useRef(null);
	const remoteVideoRef = useRef(null);
	const currentUserVideoRef = useRef(null);
	const [peerId, setPeerId] = useState('');
	const [mediaRecorder, setMediaRecorder] = useState(null);
	const [isCall, setIsCall] = useState(false)

	const {personDID} = didStore();

	const { dataArray } = messageStore();
	const myInfo = useRef<{}>(undefined);
	useEffect(() => {
		initWeb5()
		const info = JSON.parse(sessionStorage.getItem("myinfo"))
		myInfo.current = info
		// setMyinfo(info)
		const peer: any = new Peer("admin", {
			host: "127.0.0.1",
			port: 5000,
			path: "/",
		})

		peer.on('open', (id: any) => {
//			console.log("My Peer id : ", id)
			setPeerId(id)
		});

		peer.on('connection', function (conn: any) {
			conn.on('data', function (data: any) {
				setOpen(true)
				if (data.type === "call") {
//					console.log(data)
					setNewContact((prevContact) => ({
						...prevContact,
						did: data.did,
					}));
				}
				else if (data.userType === "sender") {

				}

				else {

				}
			});
		});

		peer.on('call', (call: any) => {
			var getUserMedia = (navigator as any).getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia;

			getUserMedia({ video: true, audio: true }, (mediaStream: any) => {
				//   currentUserVideoRef.current.srcObject = mediaStream;
				//   currentUserVideoRef.current.play();

				call.answer(mediaStream)
				call.on('stream', async function (remoteStream: any) {
					let stream = remoteStream;
					remoteVideoRef.current.srcObject = remoteStream
					remoteVideoRef.current.play();
				});
			});
		})

		peerInstance.current = peer;
		initializeProfile()
	}, [])

	const handleAccept = async (reply: any) => {
		var conn = peerInstance.current.connect('patient');
		conn.on('open', function () {
			conn.send({
				type:reply,
				did : personDID
			});
		});

		connectionInstance.current = conn
		if (reply === "Accept"){
			connectCall();
			onAddContact()
		}
		setOpen(false)
	}
	const connectCall = () => {
		setIsCall(true)
		var getUserMedia = (navigator as any).getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia;
		getUserMedia({ video: true, audio: true }, (mediaStream: any) => {
			const call = peerInstance.current.call("patient", mediaStream)
			call.on('stream', async (remoteStream: any) => {
				remoteVideoRef.current.srcObject = remoteStream
				remoteVideoRef.current.play();
			});
		});
	}
	const handleSend = () => {
		if (newMessage.trim() !== '') {
			const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
			const newMessageObj = { sender: 'John', message: newMessage, time: currentTime };
			setMessages([...messages, newMessageObj]);
			setNewMessage('');
		}
	};

	const [prescriptionForm, setPrescriptionForm] = useState({
        disease : "",
		prescription : "",
		comments : "",
		issuedBy : JSON.parse(sessionStorage.getItem('myinfo')).did,
		issuerEmail : JSON.parse(sessionStorage.getItem('myinfo')).email
    });
	const handlePrescriptionFormChange = (e: { target: { files?: any; name?: any; value?: any; }; }) => {
        const { name, value } = e.target;
		setPrescriptionForm((prevForm) => ({
			...prevForm,
			[name]: value,
		}));
	}

	const submit = async () =>{
		const res = await issuePrecriptionCredential(prescriptionForm)
		if(res){
			if(addPrescriptionRecord(JSON.stringify(res)))
				sendMessage("Prescription Sent")
		}
	}
	return (
		<div>
			<Topbar />
			<Container style={{ marginTop: '30px' }}>
				<h1 style={{ textAlign: 'center' }}>Welcome to Decentralized DIF Hospital</h1>
				<br />
				<Grid container spacing={6}>
					{/* First Column */}
					<Grid item xs={8} >
						<Box mb={2}>
							<h3>Doctor's Prescription:</h3>
						</Box>
						<Box mb={2}>
							<TextField label="Enter the Disease" name="disease" value={prescriptionForm.disease} onChange={handlePrescriptionFormChange} fullWidth />
						</Box>
						<Box mb={2}>
							<TextField label="Enter the Prescription" name="prescription" value={prescriptionForm.prescription} onChange={handlePrescriptionFormChange} fullWidth />
						</Box>
						<TextareaAutosize
							placeholder="Prescription Comments" name='comments' value={prescriptionForm.comments} onChange={handlePrescriptionFormChange}
							style={{ width: '100%', resize: 'vertical', minHeight: '200px' }}
						/>
						<br />
						<Button variant="contained" color="primary" onClick={submit} sx={{ marginLeft: '1px' }}>
								Submit
							</Button>
					</Grid>

					{/* Second Column */}
					<Grid item xs={4}>
						<Box mb={8}>

						</Box>
						<Paper elevation={3} style={{ padding: 16 }}>
							{/* User Image at the Top Center */}
							<Box textAlign="center" mb={2}>
								<PortraitIcon style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
							</Box>

							{/* Profile Information Heading */}
							<Typography variant="h6" align="center" gutterBottom>
								Profile Information
							</Typography>

							{/* Profile Information Properties */}
							<Grid container spacing={2} textAlign="center" mb={2}>
								<Grid item xs={6}>
									Name:
								</Grid>
								<Grid item xs={1}>
								{JSON.parse(sessionStorage.getItem("myinfo")).name}
								</Grid>
								<Grid item xs={6}>
									Email:
								</Grid>
								<Grid item xs={1}>
								{JSON.parse(sessionStorage.getItem("myinfo")).email}
								</Grid>
								<Grid item xs={6}>
									Hospital:
								</Grid>
								<Grid item xs={1}>
								{JSON.parse(sessionStorage.getItem("myinfo")).hospital}
								</Grid>
								<Grid item xs={6}>
									Qualification:
								</Grid>
								<Grid item xs={1}>
								{JSON.parse(sessionStorage.getItem("myinfo")).qualification}
								</Grid>
								
								



							</Grid>

						</Paper>
					</Grid>
				</Grid>
				{isCall && (
					<>
				<Box mb={2}>
					<h3>Video call and Chat</h3>
				</Box>
				<Grid container spacing={8}>
					{/* First Column */}
					<Grid item xs={7} >
						<video ref={remoteVideoRef} />
						<canvas

							// style={{
							// 	position: "absolute",
							// 	marginLeft: "auto",
							// 	marginRight: "auto",
							// 	left: 0,
							// 	right: 0,
							// 	textAlign: "center",
							// 	width: 640,
							// 	height: 180,
							// }}
						/>
					</Grid>
					<Grid item xs={5}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								height: '400px', // Set a height for the chat box
								padding: '16px',
								overflowY: 'auto',
								borderRadius: '25px',
								border: '2px solid black',
							}}
						>
							{/* {messages.map((msg, index) => (
								<Paper
									key={index}
									elevation={3}
									sx={{
										maxWidth: '70%',
										padding: '8px',
										marginBottom: '8px',
										alignSelf: msg.sender === 'sender' ? 'flex-end' : 'flex-start',
									}}
								>
									<Typography variant="body1">
										<strong>{msg.sender}:</strong> {msg.message}
									</Typography>
									<Typography variant="caption" color="textSecondary" align="right">
										{msg.time}
									</Typography>
								</Paper>
							))} */}
							{senderMessage.map((msg, index) => (
							<Paper
									elevation={3}
									sx={{
										maxWidth: '70%',
										padding: '8px',
										marginBottom: '8px',
										alignSelf: 'flex-end',
									}}
								>
									<Typography variant="body1">
										{msg}
									</Typography>
									
								</Paper>
								))}
								{dataArray.map((msg : any) => (
							<Paper
									elevation={3}
									sx={{
										maxWidth: '70%',
										padding: '8px',
										marginBottom: '8px',
										alignSelf: 'flex-start',
									}}
								>
									<Typography variant="body1">
										{msg.body.content}
									</Typography>
									
								</Paper>
								))}

						</Box>
						{/* Message Input Box and Send Button */}
						<br />
						<Box sx={{ display: 'flex', marginTop: 'auto', alignItems: 'center' }}>
							<TextField
								label="Type a message"
								variant="outlined"
								fullWidth
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
							/>
							<Button variant="contained" color="primary" onClick={() => sendMessage(newMessage)} sx={{ marginLeft: '8px' }}>
								Send
							</Button>
						</Box>

					</Grid>
				</Grid>
					</>
				)}
			</Container>
			{/* <Grid item xs={6}>
				<TextField label="Doctor's Name" fullWidth name="name" value={newContact?.did || ''} onChange={updateNewContact} autoComplete="off" />
				<Button variant="contained" color="primary" onClick={onAddContact} sx={{ marginLeft: '8px' }}>connect</Button>
			</Grid> */}

			<Modal
				open={open}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<Typography id="modal-modal-title" variant="h6" component="h2">
						INCOMING CALL!!!!
					</Typography>
					<Typography id="modal-modal-description" sx={{ mt: 2 }}>
						There is a Call from the patient with DID:
					</Typography>
					<Typography id="modal-modal-description" sx={{ mt: 2 }}>
						{newContact?.did || ''}
					</Typography>
					<br />
					<Button variant="contained" onClick={() => handleAccept("Accept")}>Accept</Button>
					{"      "}
					<Button variant="contained" onClick={() => handleAccept("Accept")}>Decline</Button>
				</Box>
			</Modal>
		</div>
	)
}

export default Doctor