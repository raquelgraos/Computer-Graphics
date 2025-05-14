import * as THREE from "three";
/*import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";*/

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

var cameras = [];
var camera, scene, renderer;

var trailer, box, append;
var wheel;

var materials = new Map();

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    'use strict';

    scene = new THREE.Scene();

    scene.background = new THREE.Color('#ffffff');

    //createRobot();
    createTrailer(0, 30, 0);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
    'use strict';
    const camera_pos = new Array(new Array(0, 0, 200), // proj. ortogonal - frontal
                                new Array(200, 0, 0), // proj. ortogonal - lateral
                                new Array(0, 250, 0), // proj. ortogonal - topo
                                new Array(500, 500, 500)); // proj. perspetiva

    for (let i = 0; i < 4; i++) {
        if (i == 3) {
            camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
        } else {
            camera = new THREE.OrthographicCamera(window.innerWidth / -5,
                                            window.innerWidth / 5,
                                            window.innerHeight / 5,
                                            window.innerHeight / -5,
                                            1,
                                            1000);
        }

        camera.position.set(camera_pos[i][0], camera_pos[i][1], camera_pos[i][2]);
        camera.lookAt(scene.position);
        cameras.push(camera);
    }
    camera = cameras[0];
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMaterials() {
    'use strict';
    materials.set("trailer", new THREE.MeshBasicMaterial({ color:0xa5a4a4, wireframe: false}));
    materials.set("append", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false }));
    materials.set("wheel", new THREE.MeshBasicMaterial({ color: 0x161717, wireframe: false }));
}

function createRobot() {

}

function createTrailer(x, y, z) {
    'use strict';

    box = new THREE.Mesh(new THREE.BoxGeometry(100, 140, 240), materials.get("trailer")); // (0.05, 0.07. 0.12) -> escala 2000:1
    box.position.set(0, 0, 0);

    append = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 10), materials.get("append")); // (0.005, 0.01, 0.005)
    append.position.set(0, -80, 105);

    trailer = new THREE.Object3D();
    trailer.add(box);
    trailer.add(append);

    scene.add(trailer);

    addWheel(trailer, 30, -85, -90); // (0.015, 0.0425, 0.045)
    addWheel(trailer, 30, -85, -45); // (0.015, 0.0425, 0.0225)
    addWheel(trailer, -30, -85, -90);
    addWheel(trailer, -30, -85, -45);

    trailer.position.set(x, y, z);
}

function addWheel(obj, x, y, z) {

    wheel = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 20), materials.get("wheel")); // radious top: 0.0075, radius bottom: 0.0075, height: 0.01
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);

    obj.add(wheel);

}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {}

////////////
/* UPDATE */
////////////
function update() {}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use_strict';
    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';
    
    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createMaterials();
    createScene();
    createCameras();

    window.addEventListener("keydown", onKeyDown);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    render();
    
    requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';

    switch (e.keyCode) {
        case 49: //1
            camera = cameras[0];
            break;
        case 50: //2
            camera = cameras[1];
            break;
        case 51: //3
            camera = cameras[2];
            break;
        case 52: //4
            camera = cameras[3];
            break;
        case 55: //7
            materials.forEach((element) => {
                element.wireframe = !element.wireframe;
            })
            break;
    }
}


///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {}

init();
animate();