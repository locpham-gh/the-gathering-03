const fs = require('fs');
const path = require('path');

const WIDTH = 40;
const HEIGHT = 40;
const TILE_SIZE = 32;

// Tileset starting GIDs
const GID_SPECIAL = 1;
const GID_DECO = 13;
const GID_MISC = 109;
const GID_FURNITURE = 219;
const GID_BUILDER = 375;
const GID_SEATS = 1375;
const GID_TABLES = 1557;
const GID_EXTERIOR = 1833;

// Common Tiles (Relative to GIDs)
const GRASS = GID_EXTERIOR + 0;
const DIRT = GID_EXTERIOR + 1;
const WATER = GID_EXTERIOR + 25; // Simple water tile if available
const WALL_STONE = GID_BUILDER + 50;
const FLOWER_RED = GID_DECO + 5;
const FLOWER_BLUE = GID_DECO + 6;
const TREE_TOP = GID_EXTERIOR + 50; 

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
        { firstgid: 109, name: 'WA_Miscellaneous', image: 'tilesets/WA_Miscellaneous.png', columns: 10, tilecount: 110, imagewidth: 320, imageheight: 352, tilewidth: 32, tileheight: 32 },
        { firstgid: 219, name: 'WA_Other_Furniture', image: 'tilesets/WA_Other_Furniture.png', columns: 12, tilecount: 156, imagewidth: 384, imageheight: 416, tilewidth: 32, tileheight: 32 },
        { firstgid: 375, name: 'WA_Room_Builder', image: 'tilesets/WA_Room_Builder.png', columns: 25, tilecount: 1000, imagewidth: 800, imageheight: 1280, tilewidth: 32, tileheight: 32 },
        { firstgid: 1375, name: 'WA_Seats', image: 'tilesets/WA_Seats.png', columns: 13, tilecount: 182, imagewidth: 416, imageheight: 448, tilewidth: 32, tileheight: 32 },
        { firstgid: 1557, name: 'WA_Tables', image: 'tilesets/WA_Tables.png', columns: 10, tilecount: 270, imagewidth: 320, imageheight: 864, tilewidth: 32, tileheight: 32 },
        { firstgid: 1833, name: 'WA_Exterior', image: 'tilesets/WA_Exterior.png', columns: 25, tilecount: 850, imagewidth: 800, imageheight: 1088, tilewidth: 32, tileheight: 32 }
    ],
    tilewidth: TILE_SIZE,
    type: 'map',
    version: '1.10',
    width: WIDTH
};

// 1. FLOOR (Grass)
const floorData = new Array(WIDTH * HEIGHT).fill(GRASS);
// Add some dirt paths
for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
        if (x === 20 || y === 20) floorData[y * WIDTH + x] = DIRT;
    }
}
map.layers.push(createLayer('floor', floorData, 1));

// 2. WALLS / FENCES (Boundary)
const collisionData = new Array(WIDTH * HEIGHT).fill(0);
const wallsData = new Array(WIDTH * HEIGHT).fill(0);

for (let i = 0; i < WIDTH; i++) {
    // Top & Bottom
    collisionData[i] = 1;
    wallsData[i] = GID_EXTERIOR + 10;
    collisionData[(HEIGHT - 1) * WIDTH + i] = 1;
    wallsData[(HEIGHT - 1) * WIDTH + i] = GID_EXTERIOR + 10;
}
for (let i = 0; i < HEIGHT; i++) {
    // Left & Right
    collisionData[i * WIDTH] = 1;
    wallsData[i * WIDTH] = GID_EXTERIOR + 11;
    collisionData[i * WIDTH + (WIDTH - 1)] = 1;
    wallsData[i * WIDTH + (WIDTH - 1)] = GID_EXTERIOR + 11;
}
map.layers.push(createLayer('walls', wallsData, 2));

// 3. FURNITURE / DECOR (Fountain, Benches, Trees)
const furnitureData = new Array(WIDTH * HEIGHT).fill(0);

// Fountain at center
const cx = 20, cy = 20;
for(let dy=-2; dy<=2; dy++) {
    for(let dx=-2; dx<=2; dx++) {
        const idx = (cy+dy)*WIDTH + (cx+dx);
        collisionData[idx] = 1;
        furnitureData[idx] = GID_EXTERIOR + 200 + (dy+2)*25 + (dx+2); // Symbolic fountain
    }
}

// Some benches
const benches = [
    {x: 10, y: 10}, {x: 30, y: 10}, {x: 10, y: 30}, {x: 30, y: 30}
];
benches.forEach(b => {
    furnitureData[b.y * WIDTH + b.x] = GID_SEATS + 5;
    collisionData[b.y * WIDTH + b.x] = 1;
});

// Some Trees (large collisions)
const trees = [
    {x: 5, y: 5}, {x: 35, y: 5}, {x: 5, y: 35}, {x: 35, y: 35},
    {x: 15, y: 5}, {x: 25, y: 5}, {x: 5, y: 15}, {x: 5, y: 25}
];
trees.forEach(t => {
    furnitureData[t.y * WIDTH + t.x] = GID_EXTERIOR + 150;
    collisionData[t.y * WIDTH + t.x] = 1;
});

map.layers.push(createLayer('furniture', furnitureData, 3));
map.layers.push(createLayer('collisions', collisionData, 4));

// 4. START LAYER (Spawn point)
const startData = new Array(WIDTH * HEIGHT).fill(0);
startData[18 * WIDTH + 20] = 1; // Near fountain
map.layers.push(createLayer('start', startData, 5));

fs.writeFileSync(path.join(__dirname, 'garden_map.json'), JSON.stringify(map));
console.log('Garden map generated successfully!');
