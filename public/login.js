// public/login.js
import app from './firebase.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";


function getDB() {
    // Get a Firestore instance
    return getFirestore(app);
}

function getFbAuth() {
    return getAuth(app);
}

// /**
//  * Simulates a login attempt with Firebase Authentication.
//  *
//  * @param {string} email - The user's email address.
//  * @param {string} password - The user's password.
//  * @returns {Promise<{success: boolean, user?: object, error?: string}>} - An object indicating success/failure and user data or error.
//  */
// async function login(email, password) {
//     return new Promise(async (resolve) => {
//         try {
//             const auth = getFbAuth();
//             const userCredential = await signInWithEmailAndPassword(auth, email, password);
//             // Signed in
//             const user = userCredential.user;
//             console.log(`user login: ${user.uid}`);
//             const db = getDB();
//             const userRef = doc(db, 'users', user.uid);
//             const docSnap = await getDoc(userRef);
//             if (docSnap.exists()) {
//                 console.log("user data found");
//                 const foundUser = docSnap.data();
//                 foundUser.lastLogin = new Date().toISOString();
//                 await updateDoc(userRef, { lastLogin: foundUser.lastLogin });

//                 resolve({ success: true, user: foundUser });
//             } else {
//                 console.log(`user data not found`);
//                 resolve({ success: false, error: 'User data not found.' });
//             }
//         } catch (error) {
//             const errorCode = error.code;
//             const errorMessage = error.message;
//             console.error(`Login failed: ${errorCode}, ${errorMessage}`);
//             resolve({ success: false, error: errorMessage });
//         }
//     });
// }

/**
 * create a user if he doesn't exist
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @param {string} userName - The user's user name.
 * @returns {Promise<{success: boolean, user?: object, error?: string}>} - An object indicating success/failure and user data or error.
 */
async function createUser(email, password, userName) {
    return new Promise(async (resolve) => {
        try {
            const auth = getFbAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Signed in
            const user = userCredential.user;
            console.log(`user created: ${user.uid}`);
            const db = getDB();
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                userName: userName,
                email: user.email,
                displayName: null,
                photoURL: null,
                lastLogin: new Date().toISOString(),
                location: {
                    systemId: "SYS-0000",
                    coordinates: { x: 0, y: 0, z: 0 }
                }
            });
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                console.log("user data created");
                resolve({ success: true, user: docSnap.data() });
            } else {
                console.log(`user data not found`);
                resolve({ success: false, error: 'User data not created.' });
            }
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(`User creation failed: ${errorCode}, ${errorMessage}`);
            resolve({ success: false, error: errorMessage });
        }
    });
}
/**
 * Signs in a user with Google using a popup.
 *
 * @returns {Promise<{success: boolean, user?: object, error?: string}>} An object with the result.
 */
async function googleLogin() {
    return new Promise(async (resolve) => {
        try {
            const auth = getFbAuth();
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);

            // The signed-in user info.
            const user = userCredential.user;
            console.log(`user login (google): ${user.uid}`);

            // Check if the user data exists in Firestore
            const db = getDB();
            const userRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                // User data found
                console.log("user data found");
                const foundUser = docSnap.data();
                foundUser.lastLogin = new Date();
                console.log("new last login: ", foundUser.lastLogin);
                await updateDoc(userRef, { lastLogin: foundUser.lastLogin });
                console.log("updated last login");
                resolve({ success: true, user: foundUser });
            } else {
                // User data not found, create a new user profile
                console.log("user data not found, creating new user");
                console.log("user email is: ", user.email);
                console.log("user uid is: ", user.uid);
                 // Add `await` HERE:
                await setDoc(userRef, {
                    uid: user.uid,
                    userName: user.displayName,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    lastLogin: new Date(),
                    location: {
                        systemId: "SYS-0000",
                        coordinates: { x: 0, y: 0, z: 0 }
                    }
                });
                 // the code will wait here before continuing.
                const newDocSnap = await getDoc(userRef);
                if (newDocSnap.exists()) {
                    console.log("new user created");
                    resolve({ success: true, user: newDocSnap.data() });
                } else {
                    console.log("failed to create user");
                    resolve({ success: false, error: "failed to create user" });
                }
            }
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(`Google Login failed: ${errorCode}, ${errorMessage}`);
            resolve({ success: false, error: errorMessage });
        }
    });
}

async function getUser() {
    const auth = getFbAuth();
    return auth.currentUser
}

async function logout() {
    const auth = getFbAuth();
    return signOut(auth);
}

export { login, createUser, logout, getUser, googleLogin };
