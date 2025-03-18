// Import the toEng function from toEng.js
import { toEng } from './public/toEng.js'; // Changed to import and added .js extension

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

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


async function loadResources() {
    if (isNode) {
        // Node.js environment
        const { readFile } = await import('fs/promises');
        const resourcesData = JSON.parse(
            await readFile(new URL('./public/mining_resources.json', import.meta.url))
        );
       
        return { resources: resourcesData };
    } else {
        // Browser environment
        const resourcesResponse = await fetch('./public/mining_resources.json');
        
        return { resources: await resourcesResponse.json() };
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
    const { resources: resourcesData } = await loadResources();

    const systems = [];
    // Milky Way approximate dimensions in light years
    const radialSigma = 15000;    // Radial standard deviation
    const centralVerticalSigma = 5000;   // Increased vertical sigma at galactic center
    const bulgeRadius = 15000;     // Radius where the bulge begins to taper off

    for (let i = 0; i < count; i++) {
        // Generate radial distance first
        const r = Math.abs(gaussianRandom(0, radialSigma));
        const theta = Math.random() * 2 * Math.PI;

        // Calculate vertical sigma with stronger central bulge
        // Quadratic decay for sharper dropoff from center
        const verticalSigma = centralVerticalSigma * Math.exp(-Math.pow(r / bulgeRadius, 2));
        const y = gaussianRandom(0, verticalSigma);

        // Generate resources for this system
        const systemResources = resourcesData.resources
            .filter(resource => Math.random() * 100 < resource.scarcity_percent)
            .map(resource => {
                const maxAbundance = resource.scarcity_percent; // Get the max abundance from resourcesData
                // const randomAbundance = Math.floor(Math.random() * (maxAbundance + 1)); // Generate random number up to maxAbundance
                const randomAbundance = Math.random() * 100
                return {
                    name: resource.name,
                    category: resource.category,
                    abundance: randomAbundance // Use the new random abundance
                };
            });
        // Calculate max population based on resource limitations
        let maxPopulation = Infinity;
        let canSupportLife = true; // Assume a system can support life initially

        // Iterate over all resources in resourcesData to check for life support
        for (const fullResource of resourcesData.resources) {
            // Only consider resources with a minimum consumption greater than zero
            if (fullResource.min_consumption > 0) {
                // Check if the current resource is present in the systemResources
                const systemResource = systemResources.find(r => r.name === fullResource.name);

                // If the resource is needed but not found in the system, then it can't support life
                if (!systemResource) {
                    canSupportLife = false;
                    maxPopulation = 0
                    //console.log("No resources found: ",fullResource.name);
                    break; // No need to check other resources, population is already zero
                } else {
                   // If the resource is present, calculate the population limit as before
                    const populationLimit = (systemResource.abundance / fullResource.min_consumption) * 10000000;
                    maxPopulation = Math.min(maxPopulation, populationLimit);
                }
            }
        }
          if (canSupportLife && isFinite(maxPopulation))
           {
            maxPopulation = Math.round(maxPopulation);
           } else {
            maxPopulation = 0
           }
        


        // Convert to Cartesian coordinates
        const system = {
            id: `SYS-${i.toString().padStart(4, '0')}`,
            name: generateStarName(),
            coordinates: {
                x: r * Math.cos(theta),
                y: y,
                z: r * Math.sin(theta)
            },
            resources: systemResources,
            population: isFinite(maxPopulation) ? maxPopulation : 0 // Ensure population is not infinite
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
        console.log('Populated Systems (Population and Name):');
        const populatedSystems = starSystems.filter(system => system.population > 0);
        populatedSystems.forEach(system => {
            console.log(`System: ${system.name}, Population: ${toEng(system.population)}`);
        });
    }

    await saveStarSystems(starSystems);
}

// Run the main function
main().catch(console.error);
