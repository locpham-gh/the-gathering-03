const fs = require('fs');
const path = require('path');

// Image-based map dimensions (Cinematic wide)
const WIDTH = 40;
const HEIGHT = 22;
const TILE_SIZE = 32;

function createLayer(name, data, id) {
    return {
        data: data || new Array(WIDTH * HEIGHT).fill(0),
        height: HEIGHT,
        id: id,
        name: name,
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        width: WIDTH,
        x: 0,
        y: 0
    };
}

const map = {
    compressionlevel: -1,
    height: HEIGHT,
    infinite: false,
    backgroundImage: '/cafe_img.png', // ✅ Path to the custom background image
    layers: [],
    nextlayerid: 10,
    nextobjectid: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    tileheight: TILE_SIZE,
    tilesets: [
        { firstgid: 1, name: 'WA_Special_Zones', image: 'tilesets/WA_Special_Zones.png', columns: 6, tilecount: 12, imagewidth: 192, imageheight: 64, tilewidth: 32, tileheight: 32 }
    ],
    tilewidth: TILE_SIZE,
    type: 'map',
    version: '1.10',
    width: WIDTH
};

// 1. COLLISION LAYER (Invisible tiles that block movement)
const collisionData = new Array(WIDTH * HEIGHT).fill(0);

// Block the top half (Buildings and Sky)
for (let y = 0; y < 14; y++) {
    for (let x = 0; x < WIDTH; x++) {
        collisionData[y * WIDTH + x] = 1;
    }
}

// Block edges
for (let y = 0; y < HEIGHT; y++) {
    collisionData[y * WIDTH] = 1; // Left
    collisionData[y * WIDTH + (WIDTH - 1)] = 1; // Right
}
// Block bottom edge
for (let x = 0; x < WIDTH; x++) {
    collisionData[(HEIGHT - 1) * WIDTH + x] = 1;
}

// Special block: The bar counter in the middle-ish
// According to the image, the counter is roughly in rows 13-14
for (let x = 8; x < 32; x++) {
    collisionData[14 * WIDTH + x] = 1; 
}

map.layers.push(createLayer('collisions', collisionData, 1));

// 2. SPECIAL ZONES (Interactive areas)
const zonesData = new Array(WIDTH * HEIGHT).fill(0);
// Coffee zone (Counter area)
for (let x = 15; x < 25; x++) {
    zonesData[15 * WIDTH + x] = 2; // Zone 2 (can be set to Library/Chat in code)
}
map.layers.push(createLayer('zones', zonesData, 2));

// 3. START LAYER (Spawn point)
const startData = new Array(WIDTH * HEIGHT).fill(0);
startData[18 * WIDTH + 20] = 1; // Spawn on the deck
map.layers.push(createLayer('start', startData, 3));

fs.writeFileSync(path.join(__dirname, 'cafe_map.json'), JSON.stringify(map));
console.log('Café map converted to IMAGE BACKGROUND mode successfully!');
