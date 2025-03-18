// public/computer.js

// Command definitions
const commands = {
    '?': {
        description: 'Show available commands',
        action: showHelp
    },
    'l': {
        description: 'Show nearest star systems',
        action: displayVisibleSystems
    },
    'w': {
        description: 'Warp to system (e.g., W0627)',
        action: warpToSystem
    },
    'i': {
        description: 'Inspect system details (e.g., I or I0627)',
        action: inspectSystem
    },
    'signout': {
        description: 'Signs out of your google account',
        action: signOutUser
    },
    'clear': {
        description: 'Clears the terminal',
        action: clearTerminal
    }
};

// Firebase imports
import app from './firebase.js';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
// import JSON data in public here
import starSystemsData from './star_systems.json'; // Correct path

// login imports
import { createUser, logout, getUser, googleLogin } from './login.js';

function getDB() {
    // Get a Firestore instance
    return getFirestore(app);
}

// Player's current position (will be loaded from Firestore)
let playerPosition = {
    x: 0,
    y: 0,
    z: 0
};
let playerName = "unknown";
let playerId = "default";

function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2 || typeof pos1 !== 'object' || typeof pos2 !== 'object' || !('x' in pos1) || !('y' in pos1) || !('z' in pos1) || !('x' in pos2) || !('y' in pos2) || !('z' in pos2)) {
        console.error("Invalid coordinates:", pos1, pos2);
        return 0; // Or handle it in a way that makes sense for your application
    }
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function showHelp() {
    const helpText = Object.entries(commands)
        .map(([key, cmd]) => `${key.padEnd(8)} - ${cmd.description}`)
        .join('\n');

    appendToOutput(`Available commands:\n${helpText}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function appendToOutput(text, isCommand = false) {
    const output = document.getElementById('output');

    // Convert text to array if it's not already
    const lines = Array.isArray(text) ? text : text.split('\n');

    // Process each line with delay
    for (const line of lines) {
        if (line.length > 0) {  // Skip empty lines
            await sleep(100);
            if (isCommand) {
                output.innerHTML += `<span class="command-echo"> > ${line}</span>\n`; // Keep command output
            } else {
                output.innerHTML += `${line}\n`; // Keep regular output
            }

            requestAnimationFrame(() => {
                output.scrollTop = output.scrollHeight;
                document.getElementById('commandInput').scrollIntoView();
            });
        }
    }
}

async function fetchStarSystems() {
    return starSystemsData;
  }

async function displayVisibleSystems(max_distance = 1000) {
    const systems = await fetchStarSystems();

    if (systems.length === 0) {
        return;
    }

    const systemsWithDistance = systems.map(system => {
        if (!system.coordinates) {
            console.error("System is missing coordinates:", system);
        }
        return {
            ...system,
            distance: calculateDistance(playerPosition, system.coordinates),
        }
    });
    // Filter systems based on minVisibility
    const visibleSystems = systemsWithDistance.filter(system => system.distance >= max_distance);

    visibleSystems.sort((a, b) => a.distance - b.distance);

    const table = [
        '',
       //1234567890123456789012345678901234567890
        '+-------+----------------+-------------+',
        '| ID    | NAME           | DISTANCE    |',
        '+-------+----------------+-------------+',
        ...visibleSystems.slice(0, 10).map(system => {
            return `| ${system.id.padEnd(5)} | ${system.name.padEnd(14)} | ${Math.round(system.distance).toString().padEnd(8)} ly |`;
        }),
        '+-------+----------------+-------------+',
        ''
    ].join('\n');

    await appendToOutput(`${playerName} is at: \n  ${playerPosition.x}, \n  ${playerPosition.y}, \n  ${playerPosition.z}`);
    appendToOutput(table);
}

async function warpToSystem(commandText) {
    // Extract system ID from command (e.g., "W0627" -> "0627")
    const systemId = commandText.toUpperCase().replace('W', '');

    // Load systems data
    const systems = await fetchStarSystems();

    // Find target system
    const targetSystem = systems.find(sys => sys.id === systemId);

    if (targetSystem) {
        appendToOutput(`Initiating warp to ${targetSystem.name} (${systemId})`);
        appendToOutput(`Distance: ${Math.round(calculateDistance(playerPosition, targetSystem.coordinates))} light years`);

        // Update player position
        playerPosition.x = targetSystem.coordinates.x;
        playerPosition.y = targetSystem.coordinates.y;
        playerPosition.z = targetSystem.coordinates.z;
        // Get the db
        const db = getDB();
        // Get the user doc
        const userRef = doc(db, 'users', playerId);
        // Create the data to update
        const data = {
            location: {
                systemId: systemId,
                coordinates: playerPosition
            }
        }
        // Update the db
        await updateDoc(userRef, data);
        console.log("user location stored:", data);

        appendToOutput(`Arrived at ${targetSystem.name}`);
        displayVisibleSystems();
    } else {
        appendToOutput(`Error: System ${systemId} not found`);
    }
}

async function inspectSystem(commandText) {
    const systems = await fetchStarSystems();

    if (systems.length === 0) {
        return;
    }

    let targetSystem;

    if (commandText.length > 1) {
        const systemId = commandText.toUpperCase().replace('I', '');
        targetSystem = systems.find(sys => sys.id === systemId);
    } else {
        targetSystem = systems.find(sys =>
            sys.coordinates.x === playerPosition.x &&
            sys.coordinates.y === playerPosition.y &&
            sys.coordinates.z === playerPosition.z
        );
    }

    if (targetSystem) {
        // Use array of strings for consistent delay handling
        const output = [
            `=== ${targetSystem.name} (${targetSystem.id}) ===`,
            'Location:'.padEnd(12) + `X: ${Math.round(targetSystem.coordinates.x)}, Y: ${Math.round(targetSystem.coordinates.y)}, Z: ${Math.round(targetSystem.coordinates.z)}`,
            'Distance:'.padEnd(12) + `${Math.round(calculateDistance(playerPosition, targetSystem.coordinates))} light years`,
            'Brightness:'.padEnd(12) + targetSystem.brightness
        ];

        if (targetSystem.resources && targetSystem.resources.length > 0) {
            output.push(
                '',
                'Resources:',
                //1234567890123456789012345678901234567890
                '+-------------+-------+-----------------+',
                '| Resource    | amt.  | Category        |',
                '+-------------+-------+-----------------+'
            );

            targetSystem.resources.forEach(resource => {
                output.push(`| ${resource.name.padEnd(11)} | ${resource.abundance.toString().padEnd(5)} | ${resource.category.padEnd(15)} |`);
            });

            output.push('+-------------+-------+-----------------+');
        } else {
            output.push('', 'No resources detected in this system.');
        }

        // Send all lines at once to appendToOutput
        await appendToOutput(output);
    } else {
        await appendToOutput(`Error: System not found`);
    }
}

// New function to fetch player data from Firestore
async function fetchPlayerData(userId) {
    try {
        console.log("Fetching player data for user:", userId);
        const db = getDB();
        const docRef = doc(db, "users", userId);
        console.log("Document reference:", docRef);
        const docSnap = await getDoc(docRef);
        console.log("Document snapshot id:", docSnap.id);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.location) {
                console.log("Player data found");
                playerPosition = data.location.coordinates; // Assuming 'location' is the field in your Firestore document
                console.log("Player position loaded:", playerPosition);
                playerName = data.userName; // Assuming 'userName' is the field
                console.log("Player name loaded:", playerName);
                playerId = docSnap.id;
                console.log("Player ID loaded:", playerId);
            } else {
                console.log("Player position or name not found!");
                await appendToOutput('Could not find player position or name');
            }

        } else {
            console.log("No player data found!");
            await appendToOutput('Could not find player data');
        }
    } catch (error) {
        console.error("Error fetching player data:", error);
        await appendToOutput('Error: could not fetch player data');
    }
}

async function clearTerminal() {
    document.getElementById('output').innerHTML = "";
}

async function signOutUser() {
    try {
        await logout();
        clearTerminal();
        appendToOutput("Successfully logged out.");
        document.body.classList.remove('signed-in');
    } catch (e) {
        appendToOutput(`There was an error trying to log out: ${e}`);
    }
}

// Initialize terminal
async function initTerminal() {
    const currentUser = await getUser();
    if (!currentUser) {
        console.log("No current user.");
    } else {
        console.log("Current user:", currentUser);
        await fetchPlayerData(currentUser.uid); // Load player data first
        if (!playerPosition) {
            console.log("Player Position did not load")
            return;
        }
        document.body.classList.add('signed-in');
    }


    document.getElementById('commandInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const command = this.value.toLowerCase().trim();
            appendToOutput(command, true);  // Add true parameter for commands
            this.value = '';
            if (commands[command]) {
                commands[command].action();
            } else if (command.startsWith('w')) {
                warpToSystem(command);
            } else if (command.startsWith('i')) {
                inspectSystem(command);
            } else if (command !== '') {
                appendToOutput(`Unknown command: ${command}\nType ? for help`);
            }
        }
    });
    // Get the commandInput element
    const commandInput = document.getElementById('commandInput');
    // Set focus on the command input
    commandInput.focus();

    appendToOutput('=== STELLAR NAVIGATION COMPUTER v1.0 ===');
    appendToOutput('Type ? for available commands\n');
    displayVisibleSystems();
}

// Function to handle successful Google sign-in
async function handleGoogleSignInSuccess(result) {
    console.log("Google login result:", result);
    if (!result.success) {
        console.error('Login failed:', result.error);
        await appendToOutput('Error: could not log in');
    }
    else {
        document.body.classList.add('signed-in');
        await fetchPlayerData(result.user.uid); // Load player data first
        if (!playerPosition) {
            console.log("Player Position did not load")
            return;
        }
        initTerminal();
    }
}

async function googleSignIn() {
    const result = await googleLogin();
    handleGoogleSignInSuccess(result);
}

// Function to set up the sign-in button click handler
function setupSignInButton() {
    const signInButton = document.getElementById('googleSignInButton');
    signInButton.addEventListener('click', googleSignIn);
}
document.addEventListener('DOMContentLoaded', setupSignInButton);
