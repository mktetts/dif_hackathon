import { DwnServer } from '@web5/dwn-server';
import express from "express";
import cors from "cors";
import dotenv from 'dotenv';
import { ExpressPeerServer } from 'peer';
import { SignatureType, TrinsicService } from "@trinsic/trinsic";
import { default as QRCode } from 'qrcode';
dotenv.config();


const authToken = process.env.AUTH_TOEKN;

const trinsic = new TrinsicService({
	authToken: authToken,
});

import { EthrDID } from "ethr-did";
import {
	verifyPresentation,
	verifyCredential,
	createVerifiablePresentationJwt,
	createVerifiableCredentialJwt,
} from "did-jwt-vc";
import * as didJWT from "did-jwt";

// const server = new DwnServer();

// server.start();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(cors());

const exServer = app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});


// ***************PeerJs server**********
const peerServer = ExpressPeerServer(exServer, {
	debug: true,
});
app.use("/", peerServer);
peerServer.on("connection", (client) => {
	client.send({
		user: "Connected with id : " + client.id,
	});
});

const createDID = async (account) => {
	const did = new EthrDID({
		identifier: account,
	})
	return did;
};
app.post("/api/createDID", async (req, res) => {
	const did = await createDID(req.body.account);
	res.json({ status: "Sucess", message: did });
});


app.post("/api/issueCredential", async (req, res) => {
	const data = req.body.info;
	const issueResponse = await trinsic.credential().issueFromTemplate({
		// required
		templateId: "https://schema.trinsic.cloud/confident-hawking-ztyr21c3ptpn/doctor-credential",
		valuesJson: JSON.stringify(data),
		// optional
		signatureType: SignatureType.EXPERIMENTAL,
		includeGovernance: true,
		expirationDate: "2037-02-01T11:11:11Z",
		saveCopy: false,
	});

	if (issueResponse) {
		const sendRequest = {
			email: process.env.EMAIL,
			documentJson: issueResponse.documentJson,
			sendNotification: false
		};
		await trinsic.credential().send(sendRequest);
		res.json({ status: "Success" });
	}
});

app.post("/api/verifyCredential", async (req, res) => {
	let data = req.body.data;
	data = JSON.stringify(data.vp_token)
	const response = await trinsic.credential().verifyProof({
		proofDocumentJson:data
	})
	if(response){
		res.json({
			status : "Success",
			message : response
		})

	}
});

app.post("/api/issuePrecriptionCredential", async (req, res) => {
	const data = req.body.info;
	const issueResponse = await trinsic.credential().issueFromTemplate({
		// required
		templateId: "https://schema.trinsic.cloud/confident-hawking-ztyr21c3ptpn/prescription-template",
		valuesJson: JSON.stringify(data),
		signatureType: SignatureType.EXPERIMENTAL,
		includeGovernance: true,
		expirationDate: "2037-02-01T11:11:11Z",
		saveCopy: false,
	});

	if (issueResponse) {
		res.json({
			status : "Success",
			message : issueResponse
		})
	}
});


