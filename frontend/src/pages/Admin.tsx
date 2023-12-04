import React, { useEffect, useState } from "react";
import { Grid, TextField, Container } from "@mui/material";
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Table, TableHead, TableBody, TableRow, TableCell, Paper } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import IconButton from '@mui/material/IconButton';

import Topbar from "../components/Topbar";
import { addVerifiedDoctorsRecord, getDoctorsRecord, getVerifiedDoctorsRecord, initWeb5 } from "../dif_items/DWN";
import { issueCredential } from "../dif_items/Trinsic_Credential";


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

CustomTabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		'aria-controls': `simple-tabpanel-${index}`,
	};
}


function Admin() {
	const [nonVerifiedDoctors, setNonVerifiedDoctors] = useState([])
	const [verifiedDoctors, setVerifiedDoctors] = useState([])
	const getDoctorsList = async () => {
		let records = await initWeb5("admin")
		records.forEach(async (record: any) => {
			let rec = await record.data.json()
			rec.info.did = rec.did
			console.log(rec)
			setNonVerifiedDoctors((prevNonVerifiedDoctors) => [
				...prevNonVerifiedDoctors,
				rec.info,
			]);
		});

		let verifiedRecords = await getVerifiedDoctorsRecord();
		verifiedRecords.forEach(async (record: any) => {
			let rec = await record.data.json()
			console.log(rec)
			setVerifiedDoctors((preVerifiedDoctors) => [
				...preVerifiedDoctors,
				rec,
			]);
		});
//		console.log(verifiedDoctors)
	}

	useEffect(() => {
		getDoctorsList();
	}, [])


	const [value, setValue] = React.useState(0);

	const handleChange = (event: any, newValue: React.SetStateAction<number>) => {
		setValue(newValue);
	};

	const handleViewClick = (base64Image: any) => {
		const newTab = window.open();
		newTab.document.write('<html><head><title>Document</title></head><body>');
		newTab.document.write(`<img src="${base64Image}" alt="Image" width="1000" height="800" />`);
		newTab.document.write('</body></html>');
		newTab.document.close();
	  };

	const callIssueCredential = async (row : any) =>{
		let status = await issueCredential(row)
		if(status){
			let records = await getDoctorsRecord()
			records.forEach(async (record: any) => {
				let rec = await record.data.json()
				if(rec.info.account === row.account){
					addVerifiedDoctorsRecord(row)
					await record.delete()
//					console.log("Record moved")
					setTimeout(() =>{
						window.location.reload()
					}, 1000)
				}
			});
		}
	}
	const data = [
		{ id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
		{ id: 2, name: 'Jane Doe', age: 25, email: 'jane@example.com' },
		// Add more data as needed
	];

	return (
		<div>
			<Topbar />
			<h1 style={{ textAlign: "center" }}>
				Welcome to Decentralized DIF Hospital
			</h1>
			<br />
			<Box sx={{ width: '100%' }}>
				<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
					<Tabs value={value} onChange={handleChange} aria-label="basic tabs example" variant="fullWidth">
						<Tab label="Verified Doctors" {...a11yProps(0)} />
						<Tab label="Non Verified Doctors" {...a11yProps(1)} />
					</Tabs>
				</Box>
				<CustomTabPanel value={value} index={0}>
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
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CustomTabPanel>
				<CustomTabPanel value={value} index={1}>
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
								<TableCell>View Document</TableCell>
								<TableCell>Issue Credential</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{nonVerifiedDoctors.map((row, index) => (
								<TableRow key={row.name}>
									<TableCell>{index + 1}</TableCell>
									<TableCell>{row.name}</TableCell>
									<TableCell>{row.age}</TableCell>
									<TableCell>{row.email}</TableCell>
									<TableCell>{row.hospital}</TableCell>
									<TableCell>{row.qualification}</TableCell>
									<TableCell>{row.specialization}</TableCell>
									<TableCell>
										<IconButton onClick={() => { handleViewClick(row.file) }} aria-label="See Image">
											<VisibilityIcon />
										</IconButton>
									</TableCell>
									<TableCell>
									<Button variant="contained" onClick={() => callIssueCredential(row)}>Issue</Button>
									</TableCell>

								</TableRow>
							))}
						</TableBody>
					</Table>
				</CustomTabPanel>
				<CustomTabPanel value={value} index={2}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>ID</TableCell>
								<TableCell>Name</TableCell>
								<TableCell>Age</TableCell>
								<TableCell>Email</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.map((row) => (
								<TableRow key={row.id}>
									<TableCell>{row.id}</TableCell>
									<TableCell>{row.name}</TableCell>
									<TableCell>{row.age}</TableCell>
									<TableCell>{row.email}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CustomTabPanel>


			</Box>
		</div>
	);
}

export default Admin;
