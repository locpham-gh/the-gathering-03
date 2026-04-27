const fs = require('fs');
const path = require('path');

const WIDTH = 35;
const HEIGHT = 25;
const TILE_SIZE = 32;

// Tileset starting GIDs
const GID_BUILDER = 375;
const GID_SEATS = 1375;
const GID_TABLES = 1557;

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
    layers: [],
    nextlayerid: 10,
    nextobjectid: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    tileheight: TILE_SIZE,
    tilesets: [
        { firstgid: 1, name: 'WA_Special_Zones', image: 'tilesets/WA_Special_Zones.png', columns: 6, tilecount: 12, imagewidth: 192, imageheight: 64, tilewidth: 32, tileheight: 32 },
        { firstgid: 13, name: 'WA_Decoration', image: 'tilesets/WA_Decoration.png', columns: 12, tilecount: 96, imagewidth: 384, imageheight: 256, tilewidth: 32, tileheight: 32 },
        { firstgid: 375, name: 'WA_Room_Builder', image: 'tilesets/WA_Room_Builder.png', columns: 25, tilecount: 1000, imagewidth: 800, imageheight: 1280, tilewidth: 32, tileheight: 32 },
        { firstgid: 1375, name: 'WA_Seats', image: 'tilesets/WA_Seats.png', columns: 13, tilecount: 182, imagewidth: 416, imageheight: 448, tilewidth: 32, tileheight: 32 },
        { firstgid: 1557, name: 'WA_Tables', image: 'tilesets/WA_Tables.png', columns: 10, tilecount: 270, imagewidth: 320, imageheight: 864, tilewidth: 32, tileheight: 32 }
    ],
    tilewidth: TILE_SIZE,
    type: 'map',
    version: '1.10',
    width: WIDTH
};

// 1. FLOOR (Carpet)
const floorData = new Array(WIDTH * HEIGHT).fill(GID_BUILDER + 400); // Gray carpet
map.layers.push(createLayer('floor', floorData, 1));

// 2. WALLS & COLLISIONS
const collisionData = new Array(WIDTH * HEIGHT).fill(0);
const wallsData = new Array(WIDTH * HEIGHT).fill(0);

for (let i = 0; i < WIDTH; i++) {
    collisionData[i] = 1;
    wallsData[i] = GID_BUILDER + 1;
    collisionData[(HEIGHT - 1) * WIDTH + i] = 1;
    wallsData[(HEIGHT - 1) * WIDTH + i] = GID_BUILDER + 1;
}
for (let i = 0; i < HEIGHT; i++) {
    collisionData[i * WIDTH] = 1;
    wallsData[i * WIDTH] = GID_BUILDER + 2;
    collisionData[i * WIDTH + (WIDTH - 1)] = 1;
    wallsData[i * WIDTH + (WIDTH - 1)] = GID_BUILDER + 2;
}
map.layers.push(createLayer('walls', wallsData, 2));

// 3. STAGE (Raised area at top)
const furnitureData = new Array(WIDTH * HEIGHT).fill(0);
for (let y = 1; y < 6; y++) {
    for (let x = 1; x < WIDTH - 1; x++) {
        floorData[y * WIDTH + x] = GID_BUILDER + 410; // Darker wood for stage
    }
}
// Stage boundary collision
for (let x = 1; x < WIDTH - 1; x++) {
    collisionData[6 * WIDTH + x] = 1; // Collision at stage edge
    furnitureData[6 * WIDTH + x] = GID_BUILDER + 5; // Visual edge
}
// Openings for stairs
collisionData[6 * WIDTH + 5] = 0;
collisionData[6 * WIDTH + 29] = 0;

// Podium
furnitureData[3 * WIDTH + 17] = GID_TABLES + 50;
collisionData[3 * WIDTH + 17] = 1;

// 4. AUDIENCE SEATING
for (let y = 9; y < HEIGHT - 2; y += 2) {
    for (let x = 4; x < WIDTH - 4; x++) {
        if (x % 3 !== 0) { // Rows of 2 seats
            furnitureData[y * WIDTH + x] = GID_SEATS + 15;
            collisionData[y * WIDTH + x] = 1;
        }
    }
}

map.layers.push(createLayer('furniture', furnitureData, 3));
map.layers.push(createLayer('collisions', collisionData, 4));

// 5. START LAYER
const startData = new Array(WIDTH * HEIGHT).fill(0);
startData[(HEIGHT - 2) * WIDTH + 17] = 1; // Entrance at bottom center
map.layers.push(createLayer('start', startData, 5));

fs.writeFileSync(path.join(__dirname, 'conference_map.json'), JSON.stringify(map));
console.log('Conference map generated successfully!');
