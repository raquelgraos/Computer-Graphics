import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

var renderer;

var cameras = [];
var scene, camera;

const materials = {
    lambert: new Map(),
    phong: new Map(),
    toon: new Map(),
    basic: new Map(),
    other: new Map()
};

const treesPositions = [[-30, -10, -30], [30, -10, -30], [-30, -10, 30], [30, -10, 30]]; //TODO

var geometry, mesh;
var flowerField;
var moon, ufo, house;
const corkOaks = [];

var globalLight = new THREE.DirectionalLight(0xffffff, 1);
var ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
var spotlight;
var pointLights = [];

var lastMaterial = "lambert";

var movementVector = new THREE.Vector3(0, 0, 0)
const clock = new THREE.Clock();
var delta;

var helper;

let leftKey = false, upKey = false, rightKey = false, downKey = false, shading = true;

var cameraChanges = 0;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color('#4a4a4a');

    createFlowerField(0, -20, 10);
    createSkydome();

    createMoon(25, 35, 0);
    populateCorkOaks();
    createHouse(-10, -5, -3);
    createUFO(-15, 20, -4);
}

function createFlowerField(x, y, z) {
    const loader = new THREE.TextureLoader();
    const heightmap = loader.load('./js/heightmap.png');
    const flowerTexture = generateFlowerFieldTexture();

    // Creates material with heighmap and floral texture
    const terrainMaterial = new THREE.MeshPhongMaterial({
        map: flowerTexture,
        displacementMap: heightmap,
        displacementScale: 20,
        bumpMap: heightmap,
        bumpScale: 5
    });

    geometry = new THREE.PlaneGeometry(200, 150, 100, 100);
    mesh = new THREE.Mesh(geometry, terrainMaterial);

    flowerField = new THREE.Object3D();
    flowerField.add(mesh);

    flowerField.rotation.x = 3 * Math.PI / 2;
    flowerField.position.set(x, y, z);
    scene.add(flowerField);

    // Stores material for texture change (key '1')
    materials.other.set("terrain", terrainMaterial);
}

function createSkydome() {
    const skyTexture = generateStarSkyTexture();
    const skyGeo = new THREE.SphereGeometry(85, 64, 64);
    const skyMat = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide
    });
    const skydome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skydome);

    // Stores material for texture change (key '2')
    materials.other.set("skydome", skyMat);
}

//////////////////////
/* CREATE TEXTURES  */
//////////////////////

function generateFlowerFieldTexture(size = 1024, nFlowers = 400) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#a8e063'; // light green
    ctx.fillRect(0, 0, size, size);

    // Flowers' colors
    const colors = ['#ffffff', '#ffe066', '#cdb4f6', '#a2d5f2'];

    for (let i = 0; i < nFlowers; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 3 + Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.globalAlpha = 0.85 + Math.random() * 0.15;
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    return new THREE.CanvasTexture(canvas);
}

function generateStarSkyTexture(size = 1024, nStars = 500) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Blue to violet gradient
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#12a5f5'); // light blue on top
    grad.addColorStop(1, '#fa148c'); // lilac on bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // White stars
    for (let i = 0; i < nStars; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 1 + Math.random() * 0.25;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    return new THREE.CanvasTexture(canvas);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras() {

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);

    camera.position.set(0, 130, 0);
    camera.lookAt(scene.position);
    
    cameras.push(camera);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);

    camera.position.set(80, 45, 80);
    camera.lookAt(scene.position);

    cameras.push(camera);
}

function setFlowerFieldTexture() {
    const flowerTexture = generateFlowerFieldTexture();
    materials.other.get("terrain").map = flowerTexture;
    materials.other.get("terrain").map.needsUpdate = true;
}

function setStarSkyTexture() {
    const skyTexture = generateStarSkyTexture();
    materials.other.get("skydome").map = skyTexture;
    materials.other.get("skydome").map.needsUpdate = true;
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createLights() {

    globalLight.position.set(moon.position.x, moon.position.y, moon.position.z);
    globalLight.target.position.set(10, 10, 10);
    scene.add(globalLight);
    scene.add(globalLight.target);

    scene.add(ambientLight);
}

function updatePointlights() {
    pointLights.forEach((light) => {
        light.visible = !light.visible;
    })
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createMaterials() {
    // Lambert materials
    materials.lambert.set("moon", new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 }));

    materials.lambert.set("stripped trunk", new THREE.MeshLambertMaterial({ color: 0xa14a0d }));
    materials.lambert.set("trunk", new THREE.MeshLambertMaterial({ color: 0x3d1c05 }));
    materials.lambert.set("leaves", new THREE.MeshLambertMaterial({ color: 0x1b3d05 }));

    materials.lambert.set("ufo", new THREE.MeshLambertMaterial({ color: 0x666464 }));
    materials.lambert.set("cockpit", new THREE.MeshLambertMaterial({ color: 0x808080 }));
    materials.lambert.set("cylinder", new THREE.MeshLambertMaterial({ color: 0xf5a958 }));
    materials.lambert.set("light", new THREE.MeshLambertMaterial({ color: 0x78f556 }));

    materials.lambert.set("walls", new THREE.MeshLambertMaterial({ color: 0xffffff }));
    materials.lambert.set("window", new THREE.MeshLambertMaterial({ color: 0x358edb }));
    materials.lambert.set("door", new THREE.MeshLambertMaterial({ color: 0x358edb }));
    materials.lambert.set("roof", new THREE.MeshLambertMaterial({ color: 0xde5721 }));

    // Phong materials
    materials.phong.set("moon", new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 }));

    materials.phong.set("stripped trunk", new THREE.MeshPhongMaterial({ color: 0xa14a0d }));
    materials.phong.set("trunk", new THREE.MeshPhongMaterial({ color: 0x3d1c05 }));
    materials.phong.set("leaves", new THREE.MeshPhongMaterial({ color: 0x1b3d05 }));

    materials.phong.set("ufo", new THREE.MeshPhongMaterial({ color: 0x666464 }));
    materials.phong.set("cockpit", new THREE.MeshPhongMaterial({ color: 0x808080 }));
    materials.phong.set("cylinder", new THREE.MeshPhongMaterial({ color: 0xf5a958 }));
    materials.phong.set("light", new THREE.MeshPhongMaterial({ color: 0x78f556 }));

    materials.phong.set("walls", new THREE.MeshPhongMaterial({ color: 0xffffff }));
    materials.phong.set("window", new THREE.MeshPhongMaterial({ color: 0x358edb }));
    materials.phong.set("door", new THREE.MeshPhongMaterial({ color: 0x358edb }));
    materials.phong.set("roof", new THREE.MeshPhongMaterial({ color: 0xde5721 }));

    // Toon materials
    materials.toon.set("moon", new THREE.MeshToonMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 }));

    materials.toon.set("stripped trunk", new THREE.MeshToonMaterial({ color: 0xa14a0d }));
    materials.toon.set("trunk", new THREE.MeshToonMaterial({ color: 0x3d1c05 }));
    materials.toon.set("leaves", new THREE.MeshToonMaterial({ color: 0x1b3d05 }));

    materials.toon.set("ufo", new THREE.MeshToonMaterial({ color: 0x666464 }));
    materials.toon.set("cockpit", new THREE.MeshToonMaterial({ color: 0x808080 }));
    materials.toon.set("cylinder", new THREE.MeshToonMaterial({ color: 0xf5a958 }));
    materials.toon.set("light", new THREE.MeshToonMaterial({ color: 0x78f556 }));

    materials.toon.set("walls", new THREE.MeshToonMaterial({ color: 0xffffff }));
    materials.toon.set("window", new THREE.MeshToonMaterial({ color: 0x358edb }));
    materials.toon.set("door", new THREE.MeshToonMaterial({ color: 0x358edb }));
    materials.toon.set("roof", new THREE.MeshToonMaterial({ color: 0xde5721 }));

    // Basic (no light calculations)
    materials.basic.set("moon", new THREE.MeshToonMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 }));

    materials.basic.set("stripped trunk", new THREE.MeshToonMaterial({ color: 0xa14a0d }));
    materials.basic.set("trunk", new THREE.MeshToonMaterial({ color: 0x3d1c05 }));
    materials.basic.set("leaves", new THREE.MeshToonMaterial({ color: 0x1b3d05 }));

    materials.basic.set("ufo", new THREE.MeshToonMaterial({ color: 0x666464 }));
    materials.basic.set("cockpit", new THREE.MeshToonMaterial({ color: 0x808080 }));
    materials.basic.set("cylinder", new THREE.MeshToonMaterial({ color: 0xf5a958 }));
    materials.basic.set("light", new THREE.MeshToonMaterial({ color: 0x78f556 }));
    
    materials.basic.set("walls", new THREE.MeshToonMaterial({ color: 0xffffff }));
    materials.basic.set("window", new THREE.MeshToonMaterial({ color: 0x358edb }));
    materials.basic.set("door", new THREE.MeshToonMaterial({ color: 0x358edb }));
    materials.basic.set("roof", new THREE.MeshToonMaterial({ color: 0xde5721 }));
}

function updateMaterials(type) {
    if (!shading) return;
    if (type != "basic") lastMaterial = type;

    // Moon
    moon.getObjectByName("Moon Mesh").material = materials[type].get("moon");

    // UFO
    ufo.getObjectByName("UFO Mesh").material = materials[type].get("ufo");     
    ufo.getObjectByName("Cockpit Mesh").material = materials[type].get("cockpit"); 
    ufo.getObjectByName("Cylinder Mesh").material = materials[type].get("cylinder");
    for (let i = 3; i < 11; i++) {
        ufo.children[i].material = materials[type].get("light");
    } // UFO lights (children 3 to 10 (8 lights))

    // House 
    house.getObjectByName("Front Wall").children.forEach(child => {
        child.material = materials[type].get("walls");
    }); 
    house.getObjectByName("Back Wall").getObjectByName("Mesh").material = materials[type].get("walls");
    house.getObjectByName("Close Side Wall").children.forEach(child => {
        if (child.isMesh) child.material = materials[type].get("walls");
    });
    house.getObjectByName("Far Side Wall").getObjectByName("Mesh").material = materials[type].get("walls");
    house.getObjectByName("Side Window").getObjectByName("Mesh").material = materials[type].get("window");
    house.getObjectByName("Front Windows").getObjectByName("Front Window1 Mesh").material = materials[type].get("window");
    house.getObjectByName("Front Windows").getObjectByName("Front Window2 Mesh").material = materials[type].get("window");
    house.getObjectByName("Door").getObjectByName("Mesh").material = materials[type].get("door");
    house.getObjectByName("Roof").children.forEach(child => {
        if (child.isMesh) child.material = materials[type].get("roof");
    });

    // Trees 
    corkOaks.forEach(corkOak => {
        corkOak.getObjectByName("Stripped Trunk Mesh").material = materials[type].get("stripped trunk");
        corkOak.getObjectByName("Trunk Mesh").material = materials[type].get("trunk");
        corkOak.getObjectByName("Lower Branch").getObjectByName("Mesh").material = materials[type].get("trunk");
        corkOak.getObjectByName("Middle Branch").getObjectByName("Mesh").material = materials[type].get("trunk");
        corkOak.getObjectByName("Upper Branch").getObjectByName("Mesh").material = materials[type].get("trunk");
        corkOak.getObjectByName("Lower Leaves").getObjectByName("Mesh").material = materials[type].get("leaves");
        corkOak.getObjectByName("Middle Leaves").getObjectByName("Mesh").material = materials[type].get("leaves");
        corkOak.getObjectByName("Upper Leaves").getObjectByName("Mesh").material = materials[type].get("leaves");
    });
}

function toggleShading(){
    if (shading){
        updateMaterials("basic");
        shading = false;
    } else {
        shading = true;
        updateMaterials(lastMaterial);
    }
}


function createMoon(x, y, z) {

    geometry = new THREE.SphereGeometry(3, 64, 32);
    mesh = new THREE.Mesh(geometry, materials.lambert.get("moon"));
    mesh.name = "Moon Mesh";

    moon = new THREE.Object3D();
    moon.add(mesh);

    scene.add(moon);
    moon.position.set(x, y, z);
}

function addLights() {
    const nLights = 8;

    for (let i = 0; i < nLights; i++) {

        geometry = new THREE.SphereGeometry(0.20);
        mesh = new THREE.Mesh(geometry, materials.lambert.get("light"));
        mesh.position.set(2.5, -0.2, 0);
        mesh.rotation.x = Math.PI;

        var pointlight = new THREE.PointLight(0x78f556, 5, 50, 1.5);
        pointLights.push(pointlight);

        var light = new THREE.Object3D();
        light.add(mesh);
        light.add(pointlight);

        var angle = i * (2 * Math.PI) / nLights;
        light.rotation.y = angle;

        ufo.add(light);
    }
}

function createUFO(x, y, z) {

    ufo = new THREE.Object3D();

    // body
    geometry = new THREE.SphereGeometry(3, 25, 50);
    mesh = new THREE.Mesh(geometry, materials.lambert.get("ufo"));
    mesh.position.set(0, 0, 0);
    mesh.scale.set(1, 0.2, 1);
    mesh.name = "UFO Mesh";

    ufo.add(mesh);

    // cockpit
    geometry = new THREE.SphereGeometry(1, 25, 50);
    mesh = new THREE.Mesh(geometry, materials.lambert.get("cockpit"));
    mesh.position.set(0, 0.5, 0);
    mesh.name = "Cockpit Mesh";

    ufo.add(mesh);

    // cylinder
    geometry = new THREE.CylinderGeometry(1, 1, 0.2, 50);
    mesh = new THREE.Mesh(geometry, materials.lambert.get("cylinder"));
    mesh.position.set(0, -0.5, 0);
    mesh.name = "Cylinder Mesh";

    spotlight = new THREE.SpotLight(0xffffff, 2, 100, Math.PI/8, 0, 0);
    spotlight.position.set(0, -0.5, 0);
    spotlight.target.position.set(0, -40, 0);

    mesh.add(spotlight);
    mesh.add(spotlight.target);

    ufo.add(mesh);

    addLights();

    ufo.position.set(x, y, z);
    scene.add(ufo);
}

function populateCorkOaks() {
    const nTrees = 4;
    for (let i = 0; i < nTrees; i++) {
        const oak = createCorkOak(treesPositions[i][0], treesPositions[i][1], treesPositions[i][2]);
        corkOaks.push(oak);
    }
}

function createCorkOak(x, y, z) {
    const corkOak = new THREE.Object3D();

    // stripped trunk
    var strippedHeight = THREE.MathUtils.randFloat(4, 6.5);
    geometry = new THREE.CylinderGeometry(0.9, 0.9, strippedHeight);
    mesh = new THREE.Mesh(geometry, materials.lambert.get("stripped trunk"));
    mesh.name = "Stripped Trunk Mesh";

    corkOak.add(mesh);

    // trunk
    var trunkHeight = strippedHeight * 1.5;
    geometry = new THREE.CylinderGeometry(1, 1, trunkHeight);
    mesh = new THREE.Mesh(geometry, materials.lambert.get("trunk"));
    mesh.position.set(0, strippedHeight/2 + trunkHeight/2, 0)
    mesh.name = "Trunk Mesh";

    corkOak.add(mesh);

    corkOak.rotation.z = Math.PI/12;
    corkOak.rotation.y = Math.random()*Math.PI*2;

    // branches
    addBranches(corkOak, strippedHeight);

    corkOak.position.set(x, y, z);
    scene.add(corkOak);

    return corkOak;
}

function addBranches(obj, h) {
    // lower branch
    var lowerBranch = new THREE.Object3D();
    lowerBranch.name = "Lower Branch";
    createBranch(lowerBranch);

    lowerBranch.position.set(-(Math.cos(Math.PI/4) * 2.5), h, 0); // branch distance from tree = cos pi/4 * branch height/2
    lowerBranch.rotation.z = Math.PI/4;

    var lowerLeaves = new THREE.Object3D();
    lowerLeaves.name = "Lower Leaves";
    createLeaves(lowerLeaves);

    lowerLeaves.rotation.z = -Math.PI/4;
    lowerBranch.add(lowerLeaves);

    obj.add(lowerBranch);


    // middle branch
    var middleBranch = new THREE.Object3D();
    middleBranch.name = "Middle Branch";
    createBranch(middleBranch);

    middleBranch.position.set(Math.cos(Math.PI/4) *2.5, 3*h/2, 0);
    middleBranch.rotation.z = -Math.PI/4;

    var middleLeaves = new THREE.Object3D();
    middleLeaves.name = "Middle Leaves";
    createLeaves(middleLeaves);

    middleLeaves.rotation.z = Math.PI/4;
    middleBranch.add(middleLeaves);

    obj.add(middleBranch);


    // upper branch
    var upperBranch = new THREE.Object3D();
    upperBranch.name = "Upper Branch";
    createBranch(upperBranch);

    upperBranch.position.set(Math.cos(Math.PI/4) * 2.5, 2*h + 1.5, 0);
    upperBranch.rotation.z = -Math.PI/4;

    var upperLeaves = new THREE.Object3D();
    upperLeaves.name = "Upper Leaves";
    createLeaves(upperLeaves);
    geometry.scale(2, 3, 2);                // upper Leaves are bigger
    upperLeaves.position.set(0, 4, 0)

    upperLeaves.rotation.z = Math.PI/4;
    upperBranch.add(upperLeaves);

    obj.add(upperBranch);
}

function createBranch(obj) {
    geometry = new THREE.CylinderGeometry(0.5, 0.5, 5);
    mesh = new THREE.Mesh(geometry, materials.lambert.get("trunk"));
    mesh.name = "Mesh";
    obj.add(mesh);
}

function createLeaves(obj){
    geometry = new THREE.SphereGeometry(1.25, 32, 32);
    geometry.scale(2, 1, 3);
    mesh = new THREE.Mesh(geometry, materials.lambert.get("leaves"));
    mesh.name = "Mesh";
    obj.add(mesh);
    obj.position.set(0, 2.5, 0);
}

function createHouse(x, y, z) {

    house = new THREE.Object3D();

    buildFrontAndBackWalls(x, y, z);
    buildSideWalls(x - 10, y, z + 22);

    buildWindowsAndDoor(x, y, z);

    buildRoof(x - 10, y, z);

    house.position.set(x, y, z);
    scene.add(house);
}

function buildSideWalls(x, y, z) {

    // Visible

    var wall = new THREE.Group();
    wall.name = "Close Side Wall";

    var vertices = new Float32Array([
        0, 0, 0,  // bottom left (0)
        4, 0, 0,  // bottom right (1)
        0, 10, 0,  // top left (2)
        4, 10, 0   // top right (3)
    ]);

    var indexes = [ // anti clockwise
        0, 1, 3,
        0, 3, 2
    ];

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // 3 components per vertex
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        4, 0, 0,  // bottom left (0)
        6, 0, 0,  // bottom right (1)
        4, 4, 0,  // top right (2)
        6, 4, 0   // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        4, 6, 0,  // bottom left (0)
        6, 6, 0,  // bottom right (1)
        4, 10, 0,   // top right (2)
        6, 10, 0,  // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        6, 0, 0,  // bottom left (0)
        10, 0, 0,  // bottom right (1)
        6, 10, 0,   // top right (2)
        10, 10, 0,  // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    wall.position.set(x, y, z);
    house.add(wall);

    // Not visible

    wall = new THREE.Group();
    wall.name = "Far Side Wall";

    vertices = new Float32Array([
        0, 0, 0,
        10, 0, 0,
        0, 10, 0,
        5, 10, 0
    ])

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();    

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    mesh.name = "Mesh";
    wall.add(mesh);

    wall.position.set(x, y, z - 11);
    house.add(wall);
}

function buildFrontAndBackWalls(x, y, z) {

    // Visible

    var wall = new THREE.Group();
    wall.name = "Front Wall";

    var vertices = new Float32Array([
        0, 0, 0,    // bottom right (0)
        0, 0, 4,    // bottom left (1)
        0, 10, 0,   // top right (2)
        0, 10, 4    // top left (3)
    ]);

    var indexes = [ // anti clockwise
        0, 2, 3,
        0, 3, 1
    ];

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // 3 components per vertex
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        0, 0, 4,  // bottom right (0)
        0, 0, 6,  // bottom left (1)
        0, 4, 4,  // top right (2)
        0, 4, 6   // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        0, 6, 4,    // bottom right (0)
        0, 6, 6,    // bottom left (1)
        0, 10, 4,   // top right (2)
        0, 10, 6    // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        0, 0, 6,    // bottom right (0)
        0, 0, 10,   // bottom left (1)
        0, 10, 6,   // top right (2)
        0, 10, 10   // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        0, 6, 10,   // bottom right (0)
        0, 6, 12,   // bottom left (1)
        0, 10, 10,  // top right (2)
        0, 10, 12   // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        0, 0, 12,   // bottom right (0)
        0, 0, 16,   // bottom left (1)
        0, 10, 12,  // top right (2)
        0, 10, 16   // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        0, 0, 16,  // bottom right (0)
        0, 0, 18,  // bottom left (1)
        0, 4, 16,  // top right (2)
        0, 4, 18   // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        0, 6, 16,   // bottom right (0)
        0, 6, 18,   // bottom left (1)
        0, 10, 16,  // top right (2)
        0, 10, 18   // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    vertices = new Float32Array([
        0, 0, 18,   // bottom right (0)
        0, 0, 22,   // bottom left (1)
        0, 10, 18,  // top right (2)
        0, 10, 22   // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    wall.add(mesh);

    wall.position.set(x, y, z);
    house.add(wall);

    // Not visible

    wall = new THREE.Group();
    wall.name = "Back Wall";

    vertices = new Float32Array([
        0, 0, 0,
        0, 0, 22,
        0, 10, 0,
        0, 10, 22
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("walls"));
    mesh.name = "Mesh";
    wall.add(mesh);

    wall.position.set(x - 10, y, z);
    house.add(wall);
}

function buildWindowsAndDoor(x, y, z) {

    // Side window

    var window = new THREE.Group();
    window.name = "Side Window";

    var vertices = new Float32Array([
        4, 4, 0, // bottom left (0)
        6, 4, 0, // bottom right (1)
        4, 6, 0, // top left (2)
        6, 6, 0  // top right (3)
    ]);

    var indexes = [ // anti clockwise
        0, 1, 3,
        0, 3, 2
    ];
    
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // 3 components per vertex
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("window"));
    mesh.name = "Mesh";
    window.add(mesh);

    window.position.set(x - 10, y, z + 22);
    house.add(window);

    // Front windows

    window = new THREE.Group();
    window.name = "Front Windows";


    vertices = new Float32Array([
        0, 4, 4, // bottom right (0)
        0, 4, 6, // bottom left (1)
        0, 6, 4, // top right (2)
        0, 6, 6  // top left (3)
    ]);

    indexes = [ // anti clockwise
        0, 2, 3,
        0, 3, 1
    ];

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("window"));
    mesh.name = "Front Window1 Mesh";
    window.add(mesh);

    window.position.set(x, y, z);

    vertices = new Float32Array([
        0, 4, 16, // bottom right (0)
        0, 4, 18, // bottom left (1)
        0, 6, 16, // top right (2)
        0, 6, 18  // top left (3)
    ]);

    indexes = [
        0, 3, 1,
        0, 2, 3
    ];

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("window"));
    mesh.name = "Front Window2 Mesh";
    window.add(mesh);

    window.position.set(x, y, z);

    house.add(window);

    // Front door

    var door = new THREE.Group();
    door.name = "Door";

    vertices = new Float32Array([
        0, 0, 10, // bottom right (0)
        0, 0, 12, // bottom left (1)
        0, 6, 10, // top right (2)
        0, 6, 12  // top left (3)
    ]);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("door"));
    mesh.name = "Mesh";
    door.add(mesh);

    door.position.set(x, y, z);

    house.add(door);    

}

function buildRoof(x, y, z) {

    var roof = new THREE.Group();
    roof.name = "Roof";

    // Not visible 
    var vertices = new Float32Array([
        0, 10, 0,   // bottom left (0)
        0, 10, 22,  // bottom right (1)
        5, 14, 0,   // top left (2)
        5, 14, 22   // top right (3)
    ]);

    var indexes = [ // anti clockwise
        0, 1, 3,
        0, 3, 2
    ];

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); // 3 components per vertex
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("roof"));
    roof.add(mesh);

    // Visible

    vertices = new Float32Array([
        5, 14, 0,   // bottom left (0)
        5, 14, 22,  // bottom right (1)
        10, 10, 0,  // top left (2)
        10, 10, 22  // top right (3)
    ]); 

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("roof"));
    roof.add(mesh);

    // Not visible

    vertices = new Float32Array([
        0, 10, 0,   // bottom left (0)
        5, 14, 0,   // top (1)
        10, 10, 0   // bottom right (2)
    ]);  

    indexes = [ // anti clockwise
        0, 2, 1
    ];

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("roof"));
    roof.add(mesh);

    // Visible

    vertices = new Float32Array([
        0, 10, 22,  // bottom left (0)
        5, 14, 22,  // top (1)
        10, 10, 22  // bottom right (2)
    ]);  

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();

    mesh = new THREE.Mesh(geometry, materials.lambert.get("roof"));
    roof.add(mesh);

    roof.position.set(x, y, z);
    house.add(roof);
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() { }

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() { }

////////////
/* UPDATE */
////////////
function update() {

    delta = clock.getDelta();

    handleUFOMovement();
    var tentativePos = updateUFOPositions(delta);

    ufo.position.x = tentativePos.x;
    ufo.position.z = tentativePos.z;
}

function handleUFOMovement() {

    ufo.rotation.y += 0.008; // ufo spins in constant speed

    movementVector.set(0, 0, 0);

    if (leftKey) {
        movementVector.z += 10;
    } if (upKey) {
        movementVector.x -= 10;
    } if (rightKey) {
        movementVector.z -= 10;
    } if (downKey) {
        movementVector.x += 10;
    }
}

function updateUFOPositions(delta) {

    var newPositionX = ufo.position.x + movementVector.x * delta;
    var newPositionZ = ufo.position.z + movementVector.z * delta;

    return new THREE.Vector3(newPositionX, 0, newPositionZ);
}

/////////////
/* DISPLAY */
/////////////
function render() {
    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(VRButton.createButton(renderer));
    renderer.xr.enabled = true;

    document.body.appendChild(renderer.domElement);

    createMaterials();
    createScene();
    createLights();
    createCameras();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    renderer.setAnimationLoop(() => {
        update();
        renderer.render(scene, camera);
    });
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {

    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerHeight > 0 && window.innerWidth > 0) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {

    switch (e.keyCode) {
        case 37: // left arrow
            leftKey = true;
            break;
        case 38: // up arrow
            upKey = true;
            break;
        case 39: // right arrow
            rightKey = true;
            break;
        case 40: // down arrow
            downKey = true;
            break;
        case 49: // '1' - Campo floral
            setFlowerFieldTexture();
            break;
        case 50: // '2' - Céu estrelado
            setStarSkyTexture();
            break;   
        case 55: // 7
            cameraChanges++;
            camera = cameras[cameraChanges % 2];
            break;
        case 69: // e
            updateMaterials("toon");
            break;
        case 81: // q
            updateMaterials("lambert");
            break;
        case 87: // w
            updateMaterials("phong");
            break;
        case 68: // d
            globalLight.visible = !globalLight.visible;
            break;
        case 80: // p
            updatePointlights();
            break;
        case 82: // r
            toggleShading();
            break;
        case 83: // s
            spotlight.visible = !spotlight.visible;
            break;
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
    switch (e.keyCode) {
        case 37: // left arrow
            leftKey = false;
            break;
        case 38: // up arrow
            upKey = false;
            break;
        case 39: // right arrow
            rightKey = false;
            break;
        case 40: // down arrow
            downKey = false;
            break;
    }
}

init();
animate();