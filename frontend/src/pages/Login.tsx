import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Container, Paper, Avatar, Typography, TextField, Button } from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Modal from '@mui/material/Modal';
import Box from "@mui/material/Box";

import {ConnectClient} from '@trinsic/trinsic'
import { verifyCredential } from '../dif_items/Trinsic_Credential';
import { getVerifiedDoctorsRecord, initWeb5 } from '../dif_items/DWN';
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

const LoginScreen = () => {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
    }
	const [did, setDID] = useState('');

	const [role, setRole] = useState('');

	const handleChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setRole(event.target.value);
	};
	const [verifiedDoctors, setVerifiedDoctors] = useState([])
	const getDoctorsList = async () => {
		let records = await initWeb5("login")
		records.forEach(async (record: any) => {
			let rec = await record.data.json()
			setVerifiedDoctors((prevVerifiedDoctors) => [
				...prevVerifiedDoctors,
				rec,
			]);
		});
	}
	useEffect(() =>{
		getDoctorsList();
	}, [])

	const doctorLogin = async () => {
		let len = verifiedDoctors.length
		let i = 0;
		console.log(verifiedDoctors)
		if(len === 0){
			setOpen(true)
		}
		verifiedDoctors.forEach(async (record: any) => {
			console.log(record)
			if(record.did === did){
				const client = new ConnectClient()
				const response= await client.requestVerifiableCredential({
					ecosystem : "confident-hawking-ztyr21c3ptpn",
					schema :"https://schema.trinsic.cloud/confident-hawking-ztyr21c3ptpn/doctor-credential"
					
				})
				if(response){
					sessionStorage.setItem("myinfo", JSON.stringify(record))
					const res = await verifyCredential(response)
//					console.log(res)
					navigate('/doctor')
				}
				
			}
			else{
				i++;
				if(i == len){
					setOpen(true)
				}
			}
		});
	}
	const handleLogin = () => {
		// Add your login logic here
//		// console.log('Username:', username);
//		// console.log('Password:', password);
		// Add your authentication logic here
	};

	const handleCreateDID = () => {
		navigate("/create")
	}

	const initialize = () => {
		navigate("/init")
	}

	const patientLogin = () =>{
		sessionStorage.setItem('account', did)
		// window.location.reload()
		navigate("/patient")
	}
	return (
		<Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '90vh', width: '80%' }}>
			<Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: "350px" }}>
				<Avatar sx={{ m: 1, bgcolor: 'main' }}>
					<MedicationIcon />
				</Avatar>
				<Typography component="h1" variant="h5">
					Welcome to DIF Hospital
				</Typography>
				<br />
				{(role && role !== "Patient" && role !== "Admin") && (
					<>

						<TextField
							margin="normal"
							required
							fullWidth
							id="username"
							label="Enter DID"
							name="username"
							autoComplete="off"
							autoFocus
							value={did}
							onChange={(e) => setDID(e.target.value)}
						/>

					</>
				)}
				{role === "" && (

					<FormControl fullWidth>
						<InputLabel id="demo-simple-select-label">Select Your Role</InputLabel>
						<Select
							labelId="demo-simple-select-label"
							id="demo-simple-select"
							value={role}
							label="Select Your Role"
							onChange={handleChange}
						>
							<MenuItem value="Admin">Admin</MenuItem>
							<MenuItem value="Doctor">Doctor</MenuItem>
							<MenuItem value="Patient">Patient</MenuItem>
						</Select>
					</FormControl>

				)}
				{(role !== "Patient" && role !== "Admin") && (
				<Button
					fullWidth
					variant="contained"
					color="primary"
					sx={{ mt: 3, mb: 2 }}
					onClick={doctorLogin}
				>
					Sign In
				</Button>

				)}
				{role === "Doctor" && (
					<>
						{/* <br /><br /> */}
						<h3>OR</h3>
						<Button

							variant="contained"
							color="primary"
							sx={{ mt: 3, mb: 2 }}
							onClick={handleCreateDID}
						>
							Register to create DID
						</Button>
					</>
				)}
				{role === "Patient" && (
					<>
					<TextField
							margin="normal"
							required
							fullWidth
							id="username"
							label="Enter your Ethereum Address"
							name="username"
							autoComplete="off"
							autoFocus
							value={did}
							onChange={(e) => setDID(e.target.value)}
						/>
						<Button

							variant="contained"
							color="primary"
							sx={{ mt: 3, mb: 2 }}
							onClick={patientLogin}
						>
							Enter into DIF Hospital
						</Button>
					</>
				)}
				{role === "Admin" && (
					<>
						
						<Button

							variant="contained"
							color="primary"
							sx={{ mt: 3, mb: 2 }}
							onClick={() => navigate('/admin')}
						>
							Admin Entry
						</Button>
					</>
				)}
			</Paper>
			<Modal
                open={open}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Your DID:-
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        {did}
                    </Typography>
					<br />
					<Typography id="modal-modal-title" variant="h6" component="h2">
                        Your are not yet verified by Admin. Please Wait!!!
                    </Typography>
                    <br/>
                    <Button variant="contained" onClick={handleClose}>OK</Button>
                </Box>
            </Modal>
		</Container>
	);
};

export default LoginScreen;
