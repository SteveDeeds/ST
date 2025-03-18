// This code is designed to be run in a Node.js environment
// and will update all user documents in Firestore to include a
// default ship object.

// --- Setup and Configuration ---

// Import necessary Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
//import { readFile } from 'fs/promises'; // No longer needed

// Import Firebase configuration from the JS file
import { firebaseConfig } from './firebaseConfig.js'; // Changed to import from .js file

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Default Ship Object ---

// Define the default ship object to be added to each user
const defaultShip = {
    name: "Default Ship",
    cargoCapacity: 100,
    speed: 10,
    cargo: []
};

// --- Function to Update User Documents ---

async function addDefaultShipToUsers() {
    try {
        // Get a reference to the 'users' collection
        const usersCollection = collection(db, 'users');

        // Retrieve all user documents
        const querySnapshot = await getDocs(usersCollection);

        // Loop through each user document and update it
        const updatePromises = querySnapshot.docs.map(async (userDocument) => { // changed the name of the doc object to userDocument.
            const userRef = doc(db, 'users', userDocument.id); // changed doc.id to userDocument.id
            console.log('Adding default ship to user:', userDocument.id); // changed doc.id to userDocument.id
            //get the users data
            const userData = userDocument.data(); //changed doc.data to userDocument.data()
            //check if the user already has a ship object
            if (!userData.ship) {
                // Update the user document with the default ship object
                return updateDoc(userRef, { ship: defaultShip });
            } else {
                console.log("user: ", userData.userName, " already has a ship");
                return Promise.resolve();
            }
        });

        // Wait for all update operations to complete
        await Promise.all(updatePromises);

        console.log('Successfully added default ship to all user documents.');
    } catch (error) {
        console.error('Error adding default ship to users:', error);
    }
}

// --- Main Execution ---

// Run the main function
addDefaultShipToUsers();
