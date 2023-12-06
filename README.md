# Decentralized DIF Hospital

This project is about Decentralized DIF Hospital using Decentralized Identity. It includes the DIF work items like, Decentralized Web Nodes (DWN), DIDComm, and Trinsic ID.

Other technologies incluede:-
1. ReactJS - for UI
2. NodeJS - for server
3. PeerJS - for video calling and exchanges the peer did method which enables the communication between doctor and patient. By default, PeerJS Id is set for both doctor and patient.
4. Web3 - for connecting blockchain and enables payment. I used Ganche local blockchain for demo purpose.


# For running a project:
1. Clone the git repo.
2. You can find the fronend folder and server folder.
3. Run "npm install" by entering both the folders
4. And for the .env file for frontend, enter the blockchain endpoint you are using. and for server .env, enter the Trinsic token and email.


# Workflow and Roles:
There are three Roles:
1. Doctor:
2. Admin
3. Patient

  Doctor can create a account in the DIF hospital by entering their details and supportive document which can prove doctor for admin. This details are stored in DWN.
Once registered, doctors will receive Ethr DID as a part of their credential. It can be used for login later.Then admin will see and verify and issue the credential by using the trinsic wallet.
Then, when doctor attempt to login, they will redirect to trinsic cloud wallet to verify and then enter into the dashboard. For demo purpose, I used only one account for admin, doctor and patient in Trinsic platform.
And for Patients, only thing is to enter their Ethereum address for payment, and they can enter. Patients can make a call to doctor and doctor will accept, both will chat using DIDComm, and will video call using PeerJS.
PeerJS library also used to exchange the DIDComm peer DID to enable the communication. And finally doctor can give the signed prescription using the Trinsic Template and they will be stored in patients DWN. These prescription 
can be used to get the medicine from external medicals, with the proof of prescription is given by authorized doctors.
