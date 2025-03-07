function generateStarName() {
    const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'z', 'th', 'ch', 'sh', 'ph'];
    const vowels = ['a', 'e', 'i', 'o', 'u', 'ae', 'ei', 'oo', 'aa', 'ai', 'ie', 'ea'];
    
    function generateSyllable() {
        const c = consonants[Math.floor(Math.random() * consonants.length)];
        const v = vowels[Math.floor(Math.random() * vowels.length)];
        return c + v;
    }
    
    // Generate 2 or 3 syllables
    const syllableCount = Math.random() < 0.4 ? 3 : 2;
    const syllables = Array(syllableCount).fill(0).map(() => generateSyllable());
    
    // Capitalize first letter
    const name = syllables.join('');
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function gaussianRandom(mean = 0, sigma = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * sigma + mean;
}

// Check if we're running in Node.js
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

async function loadResources() {
    if (isNode) {
        // Node.js environment
        const { readFile } = await import('fs/promises');
        const resourcesData = JSON.parse(
            await readFile(new URL('./mining_resources.json', import.meta.url))
        );
        return resourcesData;
    } else {
        // Browser environment
        const response = await fetch('mining_resources.json');
        return await response.json();
    }
}

async function saveStarSystems(systems) {
    if (isNode) {
        // Node.js environment
        const { writeFile } = await import('fs/promises');
        await writeFile('star_systems.json', JSON.stringify(systems, null, 2));
        console.log('Star systems saved to file');
    } else {
        // In browser, we don't save the file
        console.log('Generated star systems for browser use');
    }
}

// Modify the main generation function
async function generateStarSystems(count) {
    const resourcesData = await loadResources();
    
    const systems = [];
    // Milky Way approximate dimensions in light years
    const radialSigma = 15000;    // Radial standard deviation
    const centralVerticalSigma = 5000;   // Increased vertical sigma at galactic center
    const bulgeRadius = 15000;     // Radius where the bulge begins to taper off
    const brightnessMean = 128;    // Mean brightness
    const brightnessSigma = 64;    // Brightness standard deviation
    
    for (let i = 0; i < count; i++) {
        // Generate radial distance first
        const r = Math.abs(gaussianRandom(0, radialSigma));
        const theta = Math.random() * 2 * Math.PI;
        
        // Calculate vertical sigma with stronger central bulge
        // Quadratic decay for sharper dropoff from center
        const verticalSigma = centralVerticalSigma * Math.exp(-Math.pow(r / bulgeRadius, 2));
        const y = gaussianRandom(0, verticalSigma);

        // Calculate brightness using gaussian distribution
        const brightness = Math.min(255, Math.max(0, gaussianRandom(brightnessMean, brightnessSigma)));

        // Generate resources for this system
        const systemResources = resourcesData.resources
            .filter(resource => Math.random() * 100 < resource.scarcity_percent)
            .map(resource => ({
                name: resource.name,
                category: resource.category,
                abundance: Math.floor(Math.random() * 100) + 1 // Random abundance 1-100
            }));

        // Convert to Cartesian coordinates
        const system = {
            id: `SYS-${i.toString().padStart(4, '0')}`,
            name: generateStarName(),
            coordinates: {
                x: r * Math.cos(theta),
                y: y,
                z: r * Math.sin(theta)
            },
            brightness: Math.round(brightness), // Round to nearest integer
            resources: systemResources
        };
        systems.push(system);
    }
    
    return systems;
}

// Main execution
async function main() {
    const starSystems = await generateStarSystems(1000);
    
    if (isNode) {
        // Show sample in console when running in Node
        console.log('Sample of generated star systems:');
        console.log(JSON.stringify(starSystems.slice(0, 5), null, 2));
    }
    
    await saveStarSystems(starSystems);
}

// Run the main function
main().catch(console.error);