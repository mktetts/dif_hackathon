import React, { useEffect, useState } from "react";
import { Grid, TextField, Container } from "@mui/material";
import PropTypes from "prop-types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Modal from '@mui/material/Modal';


import { formatEther, formatUnits, ethers } from "ethers";
import { Web3Provider } from "@ethersproject/providers";


import { createDID } from "../dif_items/createDID"
import Topbar from "../components/Topbar";
import { addDoctorsRecord, getDoctorsRecord, initWeb5 } from "../dif_items/DWN";
import { useNavigate } from "react-router-dom";


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
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

function Create() {
    const naviagate = useNavigate()

    const [accounts, setAccounts] = useState([])
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        // naviagate("/")
        setOpen(false);
    }

    const [doctorForm, setDoctorForm] = useState({
        name: "Muthukumar",
        age: "23",
        qualification: "BE",
        hospital: "ABC",
        specialization: "Therapy",
        email: "mk@gmail.com",
        account: "",
        file: "",
        did: "",
    });

    const handleDoctorFormChange = (e: { target: { files?: any; name?: any; value?: any; }; }) => {
        const { name, value } = e.target;
        if (name === "account") {
            setDoctorForm((prevForm) => ({
                ...prevForm,
                [name]: value,
            }));
        }
        else if (name === "file") {
            const file = e.target.files[0];
            console.log(file)
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result;
                console.log(base64Data)
                setDoctorForm((prevForm) => ({
                    ...prevForm,
                    [name]: base64Data,
                }));
            };
            reader.readAsDataURL(file);

        }
        else {
            setDoctorForm((prevForm) => ({
                ...prevForm,
                [name]: value,
            }));
        }
    };

    const [did, setDid] = useState("")
    const handleRegister = async () => {
        const doctorDID: any = await createDID(doctorForm.account)

        setDid(doctorDID.did)
        let form = {
            did: doctorDID.did,
            info: doctorForm,
        }
        if(await addDoctorsRecord(JSON.stringify(form))){
            handleOpen()
        }
    }

    useEffect(() => {
        initWeb5();
        // getDoctorsRecord()
        if (window.ethereum) {
            const provider = new Web3Provider(window.ethereum);
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then(async (accounts: any) => {
                    let options = []
                    for (const account of accounts) {
                        const wallet = provider.getSigner(account);

                        let balance: any = await wallet.getBalance();
                        options.push({
                            account: account,
                            balance: (balance / 1e18) + ' ' + ' ETH'
                        })
                    }
                    setAccounts(options)
                })
                .catch((error: any) => {
                    console.error("Error connecting to MetaMask:", error);
                });
        } else {
            console.error(
                "MetaMask not detected. Please make sure MetaMask is installed."
            );
        }
    }, []);
    return (
        <div>
            <Topbar />
            <Container style={{ marginTop: "50px" }}>
                <h1 style={{ textAlign: "center" }}>
                    Welcome to Decentralized DIF Hospital
                </h1>
                <br />
                <h3>Enter the Doctor's Details to create a DID and Register</h3>
                <Grid container spacing={4}>
                    <Grid item xs={6}>
                        <TextField label="Doctor's Name" fullWidth name="name" value={doctorForm.name} onChange={handleDoctorFormChange} autoComplete="off" />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField label="Doctor's Age" fullWidth autoComplete="off"
                            value={doctorForm.age} onChange={handleDoctorFormChange}
                            name="age" />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Doctor's Qualification"
                            fullWidth
                            autoComplete="off"
                            name="qualification"
                            value={doctorForm.qualification} onChange={handleDoctorFormChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField label="Doctor's Hospital" fullWidth
                            value={doctorForm.hospital} onChange={handleDoctorFormChange} autoComplete="off" name="hospital" />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            label="Doctor's Specialized Area"
                            fullWidth
                            autoComplete="off"
                            name="specialization"
                            value={doctorForm.specialization} onChange={handleDoctorFormChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField label="Doctor's Email" fullWidth autoComplete="off"
                            value={doctorForm.email} onChange={handleDoctorFormChange} name="email" />
                    </Grid>
                </Grid>
                <br />
                <br />

                <FormControl fullWidth>
                    <InputLabel id="selectBox-label">Select Ethereum Account</InputLabel>
                    <Select
                        labelId="selectBox-label"
                        id="selectBox"
                        name="account"
                        value={doctorForm.account}
                        label="Select an option"
                        onChange={handleDoctorFormChange}
                    >
                        <MenuItem value="">
                            <em>Select your Ethereum Account to create a DID</em>
                        </MenuItem>
                        {accounts.map((option, index) => (
                            <MenuItem key={index} value={String(option.account)}>
                                {option.account} - {option.balance}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <br /><br />
                <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} >
                    Upload Supportive Document
                    <VisuallyHiddenInput type="file" name="file" onChange={handleDoctorFormChange} />
                </Button>
                <br /><br />
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Button variant="contained" onClick={handleRegister}>Register</Button>
                </Box>
            </Container>
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
                    <br/>
                    <Button variant="contained" onClick={handleClose}>OK</Button>
                </Box>
            </Modal>
        </div>
    );
}

export default Create;
