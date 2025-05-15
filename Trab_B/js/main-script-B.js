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
var robot, totalHead, head, lEye, rEye, lEar, rEar, totalLArm, totalRArm, arm, pipe, 
    forearm, body, abdomen, waist, thigh, totalLLeg, totalRLeg, leg, lowerLeg, upperLeg, foot;

var materials = new Map();

let leftKey = false, upKey = false, rightKey = false, downKey = false;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color('#ffffff');

    createRobot(100, 0, -150);
    createTrailer(-100, 0, 50);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {

    const cameraPos = new Array(new Array(0, 0, 200), // proj. ortogonal - frontal
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

        camera.position.set(cameraPos[i][0], cameraPos[i][1], cameraPos[i][2]);
        camera.lookAt(scene.position);
        cameras.push(camera);
    }
    camera = cameras[0]; // default camera is Front
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMaterials() {

    materials.set("trailer", new THREE.MeshBasicMaterial({ color:0xa5a4a4, wireframe: false})); // gray
    materials.set("append", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
    materials.set("wheel", new THREE.MeshBasicMaterial({ color: 0x161717, wireframe: false })); // very very dark gray almost black
    materials.set("head", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
    materials.set("eye", new THREE.MeshBasicMaterial({ color: 0xa5a4a4, metalness: 1.0, wireframe: false })); // metallic gray
    materials.set("ear", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
    materials.set("arm", new THREE.MeshBasicMaterial({ color: 0xcf0606, wireframe: false })); // dark red
    materials.set("pipe", new THREE.MeshBasicMaterial({ color: 0xa5a4a4, metalness: 1.0, wireframe: false })); // metallic gray
    materials.set("forearm", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // red
    materials.set("body", new THREE.MeshBasicMaterial({ color: 0xfa0000, wireframe: false })); // red
    materials.set("abdomen", new THREE.MeshBasicMaterial({ color: 0xe3dddc, wireframe: false })); // whitISH
    materials.set("waist", new THREE.MeshBasicMaterial({ color: 0xe3dddc, wireframe: false })); // whitISH
    materials.set("thigh", new THREE.MeshBasicMaterial({ color: 0xa5a4a4, metalness: 1.0, wireframe: false })); // metallic gray
    materials.set("leg", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
    materials.set("foot", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
}

function createRobot(x, y, z) {

    waist = new THREE.Mesh(new THREE.BoxGeometry(80, 20, 100), materials.get("waist")); // (0.04, 0.01, 0.03)
    waist.position.set(0, 0, 0);

    abdomen = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 100), materials.get("abdomen")); // (0.02, 0.015, 0.03)
    abdomen.position.set(0, 25, 0);

    body = new THREE.Mesh(new THREE.BoxGeometry(100, 70, 100), materials.get("body")); // (0.05, 0.035, 0.03)
    body.position.set(0, 75, 0);

    robot = new THREE.Object3D();
    robot.add(waist);
    robot.add(abdomen);
    robot.add(body);

    totalHead = new THREE.Object3D();
    buildHead(totalHead);
    totalHead.position.set(0,125,20);
    robot.add(totalHead);

    // Arms
    totalLArm = new THREE.Object3D();
    buildArm(totalLArm, true);
    totalLArm.position.set(65, 60, -30);
    robot.add(totalLArm);

    totalRArm = new THREE.Object3D();
    buildArm(totalRArm, false);
    totalRArm.position.set(-65, 60, -30);
    robot.add(totalRArm)

    // Legs
    totalLLeg = new THREE.Object3D();
    buildLeg(totalLLeg, true);
    totalLLeg.position.set(25, -100, 30);
    robot.add(totalLLeg);

    totalRLeg = new THREE.Object3D();
    buildLeg(totalRLeg, false);
    totalRLeg.position.set(-25, -100, 30);
    robot.add(totalRLeg);

    scene.add(robot);

    robot.position.set(x, y, z);
}

function buildHead(obj) {

    // Head
    head = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 60), materials.get("head")); // (0.02, 0.015, 0.03)
    head.position.set(0, 0, 0);

    obj.add(head);

    // Eyes
    lEye = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), materials.get("eye")); // (0.0025, 0.0025, 0.0025)
    lEye.position.set(5, 0, 31);
    
    rEye = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), materials.get("eye")); // (0.0025, 0.0025, 0.0025)
    rEye.position.set(-5, 0, 31);

    obj.add(lEye);
    obj.add(rEye);

    // Ears
    lEar = new THREE.Mesh(new THREE.ConeGeometry(5, 10, 10), materials.get("ear")); // radius: 0.0025, height: 0.005
    lEar.position.set(15, 20, -25);

    rEar = new THREE.Mesh(new THREE.ConeGeometry(5, 10, 10), materials.get("ear")); // radius: 0.0025, height: 0.005
    rEar.position.set(-15, 20, -25);

    obj.add(lEar);
    obj.add(rEar);
}

function buildArm(obj, left) {

    // Arm
    arm = new THREE.Mesh(new THREE.BoxGeometry(30, 100, 40), materials.get("arm")); // (0.015, 0.035, 0.02)
    arm.position.set(0, 0, 0);

    obj.add(arm);

    // Forearm
    forearm = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 60), materials.get("forearm")); // (0.015, 0.015, 0.03)
    forearm.position.set(0, -35, 50);

    obj.add(forearm);

    // Pipe
    pipe = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 90), materials.get("pipe")); // radius top: 0.0025, radius bottom: 0.0025, height: 0.045
    if (left) { pipe.position.set(20, 25, -15); }
    else pipe.position.set(-20, 25, -15);

    obj.add(pipe);
}

function buildLeg(obj, left) {

    // Leg
    leg = new THREE.Mesh(new THREE.BoxGeometry(30, 120, 20), materials.get("leg")); // (0.015, 0.06, 0.01)
    leg.position.set(0, 0, 0);

    obj.add(leg);

    // Foot 
    foot = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 20), materials.get("foot"));
    if (left) { foot.position.set(5, -50, 20); }
    else foot.position.set(-5, -50, 20);

    if (left) {
        addWheel(obj, 15, -5, -5);
        addWheel(obj, 15, -45, -5);
    } else {
        addWheel(obj, -15, -5, -5);
        addWheel(obj, -15, -45, -5);
    }

    obj.add(foot);
    
    // Thigh
    thigh = new THREE.Mesh(new THREE.BoxGeometry(20, 50, 10), materials.get("thigh")); // (0.01, 0.025, 0.005)
    if (left) { thigh.position.set(-5, 85, -5); }
    else thigh.position.set(5, 85, -5);

    if (left) addWheel(obj, 15, 95, -5);
    else addWheel(obj, -15, 95, -5);

    obj.add(thigh);
}

function createTrailer(x, y, z) {

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
function update() {

}

function handleTrailerMovements() {
    
    if (leftKey) {
        //TODO
    } if (upKey) {
        //TODO
    } if (rightKey) {
        //TODO
    } if (downKey) {
        //TODO
    }
}

function handleRobotMovements() {

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
        case 81: //Q
            break;
        case 65: //a
            break;
        case 87: //w
            break;
        case 83: //s
            break;
        case 69: //e
            break;
        case 68: //d
            break;
        case 82: //r
            break;
        case 70: //f
            break;
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
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {}

init();
animate();