// Player's current position
const playerPosition = {
    x: 0,
    y: 0,
    z: 0
};

// Command definitions
const commands = {
    '?': {
        description: 'Show available commands',
        action: showHelp
    },
    'l': {
        description: 'Show nearest star systems',
        action: displayNearestSystems
    },
    'w': {
        description: 'Warp to system (e.g., W0627)',
        action: warpToSystem
    }
};

function calculateDistance(pos1, pos2) {
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

function appendToOutput(text, isCommand = false) {
    const output = document.getElementById('output');
    const timestamp = new Date().toLocaleTimeString();
    if (isCommand) {
        output.innerHTML += `<span class="command-echo">[${timestamp}] > ${text}</span>\n`;
    } else {
        output.innerHTML += `[${timestamp}] ${text}\n`;
    }
    
    requestAnimationFrame(() => {
        output.scrollTop = output.scrollHeight;
        document.getElementById('commandInput').scrollIntoView();
    });
}

async function displayNearestSystems() {
    const response = await fetch('star_systems.json');
    const systems = await response.json();
    
    const systemsWithDistance = systems.map(system => ({
        ...system,
        distance: calculateDistance(playerPosition, system.coordinates)
    }));
    
    systemsWithDistance.sort((a, b) => a.distance - b.distance);
    
    const table = [
        '',
        '+------------+----------------+-------------+------------------------+-----------+',
        '| SYSTEM ID  | NAME           | DISTANCE    | COORDINATES (X, Y, Z)  | BRIGHT    |',
        '+------------+----------------+-------------+------------------------+-----------+',
        ...systemsWithDistance.slice(0, 10).map(system => {
            const x = Math.round(system.coordinates.x).toString().padStart(6);
            const y = Math.round(system.coordinates.y).toString().padStart(6);
            const z = Math.round(system.coordinates.z).toString().padStart(6);
            return `| ${system.id.padEnd(10)} | ${system.name.padEnd(14)} | ${Math.round(system.distance).toString().padEnd(8)} ly | ${x}, ${y}, ${z} | ${system.brightness.toString().padEnd(9)} |`;
        }),
        '+------------+----------------+-------------+------------------------+-----------+',
        ''
    ].join('\n');

    appendToOutput(`Current Location: ${playerPosition.x}, ${playerPosition.y}, ${playerPosition.z}`);
    appendToOutput(table);
}

// Add this new function
async function warpToSystem(commandText) {
    // Extract system ID from command (e.g., "W0627" -> "SYS-0627")
    const systemId = commandText.toUpperCase().replace('W', 'SYS-');
    
    // Load systems data
    const response = await fetch('star_systems.json');
    const systems = await response.json();
    
    // Find target system
    const targetSystem = systems.find(sys => sys.id === systemId);
    
    if (targetSystem) {
        appendToOutput(`Initiating warp to ${targetSystem.name} (${systemId})`);
        appendToOutput(`Distance: ${Math.round(calculateDistance(playerPosition, targetSystem.coordinates))} light years`);
        
        // Update player position
        playerPosition.x = targetSystem.coordinates.x;
        playerPosition.y = targetSystem.coordinates.y;
        playerPosition.z = targetSystem.coordinates.z;
        
        appendToOutput(`Arrived at ${targetSystem.name}`);
        displayNearestSystems();
    } else {
        appendToOutput(`Error: System ${systemId} not found`);
    }
}

// Initialize terminal
function initTerminal() {
    document.getElementById('commandInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const command = this.value.toLowerCase().trim();
            appendToOutput(command, true);  // Add true parameter for commands
            this.value = '';
            
            if (command.startsWith('w')) {
                warpToSystem(command);
            } else if (commands[command]) {
                commands[command].action();
            } else if (command !== '') {
                appendToOutput(`Unknown command: ${command}\nType ? for help`);
            }
        }
    });

    appendToOutput('=== STELLAR NAVIGATION COMPUTER v1.0 ===');
    appendToOutput('Type ? for available commands\n');
    displayNearestSystems();
}

// Start the terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', initTerminal);