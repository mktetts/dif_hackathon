import axios from 'axios'


export const issueCredential   = async (info) => {
	let status = null
	await axios.post('http://localhost:5000/api/issueCredential', {
		info: info
	})
		.then(async (response) => {
			status = (response.data.status)
		})
		.catch(error => console.error('Error:', error));
	if(status === "Success")
		return true
}

export const verifyCredential   = async (data) => {
	let res = null
	await axios.post('http://localhost:5000/api/verifyCredential', {
		data: data
	})
		.then(async (response) => {
			res = (response.data.message)
		})
		.catch(error => console.error('Error:', error));
	if(res)
		return res
}

export const issuePrecriptionCredential   = async (info) => {
	let status = null, mes = null
	await axios.post('http://localhost:5000/api/issuePrecriptionCredential', {
		info: info
	})
		.then(async (response) => {
			status = (response.data.status)
			mes = (response.data.message)
		})
		.catch(error => console.error('Error:', error));
	if(status === "Success")
		return mes
}