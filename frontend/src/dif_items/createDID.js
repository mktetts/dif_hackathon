import axios from 'axios'


export const createDID = async (account) => {
	let did = null
	await axios.post('http://localhost:5000/api/createDID', {
		account: account
	})
		.then(async (response) => {
			did = response.data.message
		})
		.catch(error => console.error('Error:', error));
	return did
}