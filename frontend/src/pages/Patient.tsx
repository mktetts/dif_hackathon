import React, { useEffect, useRef, useState } from "react";
import { Grid, TextField, Container, Modal } from "@mui/material";
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcCallIcon from '@mui/icons-material/AddIcCall';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Table, TableHead, TableBody, TableRow, TableCell, Paper } from '@mui/material';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';
import Peer from 'peerjs'
import Web3 from 'web3';

import Topbar from "../components/Topbar"; import { default as ContactService, Contact, Message } from "../lib/contacts"

import messageStore from "../store/messageStore";
import didStore from "../store/didStore";

import { Profile, generateProfile } from "../lib/profile"
import agent from "../lib/agent"
import { getPrescriptionRecord, initWeb5 } from "../dif_items/DWN";

function CustomTabPanel(props: { [x: string]: any; children: any; value: any; index: any; }) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					<Typography>{children}</Typography>
				</Box>
			)}
		</div>
	);
}
const bull = (
	<Box
		component="span"
		sx={{ display: 'inline-block', mx: '2px', transform: 'scale(0.8)' }}
	>
		•
	</Box>
);
CustomTabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};
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
function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		'aria-controls': `simple-tabpanel-${index}`,
	};
}


interface ProfileAttributes {
	actor?: string
}

function Patient({ actor }: ProfileAttributes) {
	const [open, setOpen] = useState(false);
	const handleOpen = () => setOpen(true);
	const handleClose = () => {
		setOpen(false);
	}
	const [newMessage, setNewMessage] = useState('');
	const [contact, setContact] = useState<Contact | null>(null)
	// const [newContact, setNewContact] = useRef<Partial<Contact>>(null)
	const newContact = useRef<Partial<Contact> | undefined>(undefined);

	const { dataArray } = messageStore();
//	console.log(dataArray)
	const { personDID } = didStore();
//	console.log(personDID)
	const [connected, setConnected] = useState<boolean>(false)
	const [profile, setProfile] = useState<Profile | null>(null)
	const onAddContact = async () => {
//		console.log(newContact)
		ContactService.addContact(newContact.current as Contact)
		setContact(newContact.current as Contact)
		// this.contacts = ContactService.getContacts()
		agent.sendProfile(newContact.current as Contact)
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
//		console.log(generatedProfile)
		// Set up agent
		agent.setupProfile(generatedProfile)
		agent.ondid = onDidGenerated
//		console.log(agent.ondid)
		agent.onconnect = () => setConnected(true)
		agent.ondisconnect = () => setConnected(false)
	}

	const [verifiedDoctors, setVerifiedDoctors] = useState([])
	const [allPrescription, setPrescription] = useState([])
	const getDoctorsList = async () => {
		let records = await initWeb5("login")
		records.forEach(async (record: any) => {
			let rec = await record.data.json()
			setVerifiedDoctors((prevVerifiedDoctors) => [
				...prevVerifiedDoctors,
				rec,
			]);
		});

		let recordss = await getPrescriptionRecord();
		recordss.forEach(async (record: any) => {
			let rec = await record.data.json()
			setPrescription((pre) => [
				...pre,
				rec,
			]);
		});
//		console.log(recordss)
	}
	const peerInstance = useRef(null);
	const connectionInstance = useRef(null);
	const remoteVideoRef = useRef(null);
	const currentUserVideoRef = useRef(null);
	const [peerId, setPeerId] = useState('');
	const [mediaRecorder, setMediaRecorder] = useState(null);
	const [isCall, setIsCall] = useState(false)
	useEffect(() => {
		getDoctorsList();
		initializeProfile()
		const peer: any = new Peer("patient", {
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
				if (data.userType === "call") {

				}
				else if (data.userType === "sender") {

				}
				else if (data.type === "Accept") {
//					console.log(data)
					setIsCall(true)
					newContact.current = {
						did: data.did,
						// Other properties as needed
					};
					connectCall();
					onAddContact()

				}
				else {
					// Assuming the received data is a Blob
					// handleReceivedImageBlob(data);
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
					// remoteVideoRef.current.play();
				});
			});
		})

		peerInstance.current = peer;
	}, [])
	const connectCall = () => {

		var getUserMedia = (navigator as any).getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia;
		getUserMedia({ video: true, audio: true }, (mediaStream: any) => {

			//   currentUserVideoRef.current.srcObject = mediaStream;
			//   currentUserVideoRef.current.play();


			const call = peerInstance.current.call("admin", mediaStream)

			call.on('stream', async (remoteStream: any) => {
				remoteVideoRef.current.srcObject = remoteStream
				remoteVideoRef.current.play();
			});
		});
	}
	const [value, setValue] = React.useState(0);

	const handleChange = (event: any, newValue: React.SetStateAction<number>) => {
		setValue(newValue);
	};
	const connectToPeer = (remotePeerId: any) => {
		var conn = peerInstance.current.connect(remotePeerId);
		conn.on('open', function () {
			let mes = {
				type: "call",
				who: "patient",
				did: personDID
			}
			conn.send(mes);
		});
		connectionInstance.current = conn
	}

	const [selectedDoctor, setSelectedDoctor] = useState(undefined)
	const handleCallClick = (row: any) => {
		setSelectedDoctor(row)
		setOpen(true)

	};

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

	const [pres, setPres] = useState()
	const viewPrescription = (data: any) => {
		// console.log(data)
		setPres(JSON.parse(data.documentJson))
	}

	const handleAccept = async (mes: any) => {
		if (mes === "Accept") {
			if (window.ethereum) {
				// Create a new Web3 instance using MetaMask's provider
				const web3 = new Web3(process.env.REACT_APP_WEB3_ADDRESS);
				const etherAmount = web3.utils.toWei('1', 'ether'); // Adjust the amount as needed
//				console.log(selectedDoctor)
				// Request account access if needed
				web3.eth.sendTransaction({
					from: sessionStorage.getItem('account'),
					to: selectedDoctor.account,
					value: etherAmount,
				})
//					.then(transactionHash => console.log(`Transaction Hash: ${transactionHash}`))
					.catch(console.error);
					connectToPeer("admin")
					setOpen(false)
			} else {
				console.error('MetaMask is not installed. Please install MetaMask to use this app.');
			}
		}
		else {
			setOpen(false)
		}

	}
	return (
		<div>
			<Topbar />
			<Container style={{ marginTop: '30px' }}>

				<h1 style={{ textAlign: "center" }}>
					Welcome to Decentralized DIF Hospital
				</h1>
				<br />

				<h3>
					All Doctors
				</h3>
				<Box sx={{ width: '100%' }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>ID</TableCell>
								<TableCell>Name</TableCell>
								<TableCell>Age</TableCell>
								<TableCell>Email</TableCell>
								<TableCell>Hospital</TableCell>
								<TableCell>Qualification</TableCell>
								<TableCell>Specialization</TableCell>
								<TableCell>Call</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{verifiedDoctors.map((row, index) => (
								<TableRow key={row.name}>
									<TableCell>{index + 1}</TableCell>
									<TableCell>{row.name}</TableCell>
									<TableCell>{row.age}</TableCell>
									<TableCell>{row.email}</TableCell>
									<TableCell>{row.hospital}</TableCell>
									<TableCell>{row.qualification}</TableCell>
									<TableCell>{row.specialization}</TableCell>
									<TableCell>
										<IconButton onClick={() => handleCallClick(row)} >
											<AddIcCallIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>



				</Box>
				{
					(allPrescription.length > 0) && (
						<>
						<br /><br /><br />
							<h3>Your Prescriptions :-</h3>
							{allPrescription.map((row, index) => (
								<Card sx={{ minWidth: 275 }}>
									<CardContent>

										<Typography variant="h5" component="div">
											You have a Prescription
										</Typography>
										<br />
										<Typography variant="body2">
											This is your prescription
										</Typography>
									</CardContent>
									<CardActions>
										<Button size="small" onClick={() => viewPrescription(row)}>Click to view</Button>
									</CardActions>
								</Card>
							))}
						</>
					)
				}
				<pre>{JSON.stringify(pres, null, 2)}</pre>
				{isCall && (
					<>
						<Box mb={2}>
							<h3>Video call and Chat</h3>
						</Box>
						<Grid container spacing={6}>
							{/* First Column */}
							<Grid item xs={8} >
								<video ref={remoteVideoRef} />
								<canvas

									style={{
										position: "absolute",
										marginLeft: "auto",
										marginRight: "auto",
										left: 0,
										right: 0,
										textAlign: "center",
										width: 640,
										height: 180,
									}}
								/>
							</Grid>
							<Grid item xs={4}>
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
									{dataArray.map((msg: any) => (
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
			<Modal
				open={open}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<Typography id="modal-modal-title" variant="h6" component="h2">
						Confirm Call
					</Typography>
					<Typography id="modal-modal-description" sx={{ mt: 2 }}>
						For Calling, you are required to send 1 Ether
					</Typography>
					<br />
					<Button variant="contained" onClick={() => handleAccept("Accept")}>Accept</Button>
					{"      "}
					<Button variant="contained" onClick={() => handleAccept("Reject	")}>Decline</Button>
				</Box>
			</Modal>
		</div>
	)
}

export default Patient