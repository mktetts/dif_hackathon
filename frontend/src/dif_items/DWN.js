import { Web5 } from '@web5/api/browser';

let web5Instance = null;
let web5DID = null;

let protocolDefinition = {
	"protocol": "https://didcomm.org/dif-hospital",
	"published": true,
	"types": {
		"nonVerifiedDoctors" : {
			"schema": "https://didcomm.org/dif-hospital/schemas/nonVerifiedDoctors/list",
			"dataFormats": ["application/json"]
		},
		"verifiedDoctors" : {
			"schema": "https://didcomm.org/dif-hospital/schemas/verifiedDoctors/list",
			"dataFormats": ["application/json"]
		},
		"prescription" : {
			"schema": "https://didcomm.org/dif-hospital/schemas/prescription/list",
			"dataFormats": ["application/json"]
		},
	  "doctorList": {
		"schema": "https://didcomm.org/dif-hospital/schemas/doctors/list",
		"dataFormats": ["application/json"]
	  },
	  "doctorWrite": {
		"schema": "https://didcomm.org/dif-hospital/schemas/doctors/write",
		"dataFormats": ["application/json"]
	  },
	},
	"structure": {
	  "list": {
		"actions": [
		  {
			"who": "anyone",
			"can": "read"
		  },
		  {
			"who": "anyone",
			"can": "write"
		  }
		],
		"write": {
		  "actions": [
			{
			  "who": "author",
			  "of": "list",
			  "can": "write"
			},
		  ]
		}
	  }
	}
  }
  
export const initWeb5 = async (role) => {
	if (!web5Instance && !web5DID) {
		const { web5, did } = await Web5.connect({
			techPreview: {
				dwnEndpoints: ["http://localhost:3000"]
			},
		});
		web5Instance = web5
		web5DID = did
		if(role === 'admin'){
			return getDoctorsRecord()
			// deleteDoctorsRecord()
			// deletePrescriptionRecord	()
		}
		else if(role === 'login'){
			return getVerifiedDoctorsRecord()
		}
	}
	// deleteDoctorsRecord()
}

export const addDoctorsRecord = async (doctorRecord) => {
	console.log(doctorRecord)
	try {
		const { record } = await web5Instance.dwn.records.create({
			data: doctorRecord,
			message: {
                schema: protocolDefinition.types.nonVerifiedDoctors.schema,
                dataFormat: protocolDefinition.types.nonVerifiedDoctors.dataFormats[0],
			}
		});
		console.log(record)
		return true;
	}
	catch (e) {
		console.log(e)
		return false
	}
}

export const addPrescriptionRecord = async (doctorRecord) => {
	try {
		const { record } = await web5Instance.dwn.records.create({
			data: doctorRecord,
			message: {
				schema: protocolDefinition.types.prescription.schema,
                dataFormat: protocolDefinition.types.prescription.dataFormats[0],
			}
		});
		console.log(record)
		return true;
	}
	catch (e) {
		console.log(e)
		return false
	}
}

export const addVerifiedDoctorsRecord = async (doctorRecord) => {
	try {
		const { record } = await web5Instance.dwn.records.create({
			data: doctorRecord,
			message: {
                schema: protocolDefinition.types.verifiedDoctors.schema,
                dataFormat: protocolDefinition.types.verifiedDoctors.dataFormats[0],
			}
		});
		return true;
	}
	catch (e) {
		return false
	}
}
export const getDoctorsRecord = async () => {
	const { records } = await web5Instance.dwn.records.query({
		message: {
			filter: {
				schema: protocolDefinition.types.nonVerifiedDoctors.schema,
			},
		}
	});
	return records
}

export const getPrescriptionRecord = async () => {
	const { records } = await web5Instance.dwn.records.query({
		message: {
			filter: {
				schema: protocolDefinition.types.prescription.schema,
			},
		}
	});
	console.log(records)
	return records
}

export const deletePrescriptionRecord = async () => {
	const { records } = await web5Instance.dwn.records.query({
		message: {
			filter: {
				schema: protocolDefinition.types.prescription.schema,
			},
		}
	});
	console.log(records)
	records.forEach(async (record) => {
		console.log("Record Deleted...")
		await record.delete();
	});
}
export const getVerifiedDoctorsRecord = async () => {
	const { records } = await web5Instance.dwn.records.query({
		message: {
			filter: {
				schema: protocolDefinition.types.verifiedDoctors.schema,
			},
		}
	});
	return records
}
export const deleteDoctorsRecord = async () => {
	const { records } = await web5Instance.dwn.records.query({
		message: {
			filter: {
				schema: protocolDefinition.types.verifiedDoctors.schema,
			},
		}
	});
	records.forEach(async (record) => {
		console.log("Record Deleted...")
		await record.delete();
	});

	const { recordss } = await web5Instance.dwn.records.query({
		message: {
			filter: {
				schema: protocolDefinition.types.nonVerifiedDoctors.schema,
			},
		}
	});
	recordss.forEach(async (record) => {
		console.log("Record Deleted...")
		await record.delete();
	});
}