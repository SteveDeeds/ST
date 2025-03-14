const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK with your service account key
const serviceAccount = require('./spacetrade-97027-firebase-adminsdk-fbsvc-554ede5968.json'); // Replace with your key path

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: 'YOUR_DATABASE_URL', // Remove if not using Realtime Database
});

const db = admin.firestore();

// Function to upload data from a JSON file to a Firestore collection
async function uploadData(filePath, collectionName) {
    try {
        const rawData = fs.readFileSync(filePath);
        const data = JSON.parse(rawData);

        if (collectionName === 'users' && data.users) {
            // Handle 'users' collection (special case)
            for (const userId in data.users) {
                const userData = data.users[userId];
                const docRef = db.collection(collectionName).doc(userId); // Use userId as document ID
                await docRef.set(userData);
                console.log(`User document added/updated in collection ${collectionName} with ID: ${userId}`);
            }
        } else if (Array.isArray(data)) {
            // If the data is an array we iterate through it and add each element to the collection
            for (const item of data) {
                const docRef = db.collection(collectionName).doc(); // Automatically generate a unique ID
                await docRef.set(item);
                console.log(`Document added to collection ${collectionName} with ID: ${docRef.id}`);
            }

        } else if (typeof data === 'object') {
            //if the data is an object, we directly add it to the collection.
            const docRef = db.collection(collectionName).doc(); // Automatically generate a unique ID
            await docRef.set(data);
            console.log(`Document added to collection ${collectionName} with ID: ${docRef.id}`);
        } else {
            console.log('Data must be either an array of json objects or a single json object with the key "users" containing the users data');
        }
    } catch (error) {
        console.error(`Error uploading data to collection ${collectionName}:`, error);
    }
}

// Upload users data
async function runUploads() {
    await uploadData('./public/users.json', 'users'); // Create the 'users' collection
    // await uploadData('./public/mining_resources.json', 'mining_resources'); // Create the 'mining_resources' collection
    // await uploadData('./public/star_systems.json', 'star_systems'); // Create the 'star_systems' collection
}

runUploads();
