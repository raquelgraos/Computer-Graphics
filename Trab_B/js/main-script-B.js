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

const cameraPos = new Array(new Array(0, 0, 200),       // orthographic - frontal
                            new Array(200, 0, 0),       // orthographic - lateral
                            new Array(0, 250, 0),       // orthographic - top
                            new Array(500, 500, 500));  // perspective

var trailer, box, append;
var wheel;
var robot, totalHead, head, lEye, rEye, lEar, rEar, totalLArm, totalRArm, arm, pipe, 
    forearm, frontBody, backBody, abdomen, waist, thigh, totalLLeg, totalRLeg, leg, 
    rFoot, lFoot, inferiorMembers, feet;

const materials = new Map();

var coupled = false

var movementVector = new THREE.Vector3(0, 0, 0)

var clock = new THREE.Clock();

let leftKey = false, upKey = false, rightKey = false, downKey = false;
let armsMovementIn = false, armsMovementOut = false, inferiorMembersMovementIn = false, 
    inferiorMembersMovementOut = false, feetMovementIn = false, feetMovementOut = false,
    headMovementIn = false, headMovementOut = false;

var delta;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color('#ffffff');

    createRobot(100, 0, 0);
    createTrailer(-100, -5, 50);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras() {

    var len = cameraPos.length;

    for (let i = 0; i < 2; i++) {
        if (i == 1) {
            camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 1000); // fov, aspect, near, far
            camera.position.set(cameraPos[len-1][0], cameraPos[len-1][1], cameraPos[len-1][2]);
            
        } else {
            camera = new THREE.OrthographicCamera(window.innerWidth / -5,   // left
                                            window.innerWidth / 5,          // right
                                            window.innerHeight / 5,         // top
                                            window.innerHeight / -5,        // bottom
                                            1,                              // near
                                            1000);                          // far

            camera.position.set(cameraPos[i][0], cameraPos[i][1], cameraPos[i][2]); // default camera is front
        }
        camera.lookAt(scene.position);
        cameras.push(camera);
    }
    camera = cameras[0]; // default camera is ortographic
}

function changeOrtCameraPos(code) {
    camera = cameras[0];
    camera.position.set(cameraPos[code-1][0], cameraPos[code-1][1], cameraPos[code-1][2]);
    camera.lookAt(scene.position);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMaterials() {

    materials.set("trailer", new THREE.MeshBasicMaterial({ color:0xa5a4a4, wireframe: false})); // gray
    materials.set("append", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
    materials.set("wheel", new THREE.MeshBasicMaterial({ color: 0x161717, wireframe: false })); // very very dark gray almost black
    materials.set("head", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
    materials.set("eye", new THREE.MeshBasicMaterial({ color: 0xbabcbf, wireframe: false })); // light gray
    materials.set("ear", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
    materials.set("arm", new THREE.MeshBasicMaterial({ color: 0xcf0606, wireframe: false })); // dark red
    materials.set("pipe", new THREE.MeshBasicMaterial({ color: 0xbabcbf, wireframe: false })); // light gray
    materials.set("forearm", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // red
    materials.set("body", new THREE.MeshBasicMaterial({ color: 0xfa0000, wireframe: false })); // red
    materials.set("abdomen", new THREE.MeshBasicMaterial({ color: 0xe3dddc, wireframe: false })); // whitISH
    materials.set("waist", new THREE.MeshBasicMaterial({ color: 0xe3dddc, wireframe: false })); // whitISH
    materials.set("thigh", new THREE.MeshBasicMaterial({ color: 0xbabcbf, wireframe: false })); // light gray
    materials.set("leg", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
    materials.set("foot", new THREE.MeshBasicMaterial({ color: 0x152357, wireframe: false })); // dark blue
}

function createRobot(x, y, z) {

    waist = new THREE.Mesh(new THREE.BoxGeometry(80, 20, 10), materials.get("waist")); // (0.04, 0.01, 0.03)
    waist.position.set(0, 0, 0);

    abdomen = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 100), materials.get("abdomen")); // (0.02, 0.015, 0.03)
    abdomen.position.set(0, 25, -45);

    frontBody = new THREE.Mesh(new THREE.BoxGeometry(100, 70, 60), materials.get("body")); // (0.05, 0.035, 0.03)
    frontBody.position.set(0, 75, -25);

    backBody = new THREE.Mesh(new THREE.BoxGeometry(40, 70, 40), materials.get("body")); // (0.05, 0.035, 0.03)
    backBody.position.set(0, 75, -75);

    robot = new THREE.Object3D();
    robot.add(waist);
    robot.add(abdomen);
    robot.add(frontBody);
    robot.add(backBody);

    totalHead = new THREE.Object3D();
    buildHead(totalHead);
    totalHead.position.set(0,110,5);
    robot.add(totalHead);

    // Arms
    totalLArm = new THREE.Object3D();
    buildArm(totalLArm, true);
    totalLArm.position.set(65, 60, -75);
    robot.add(totalLArm);

    totalRArm = new THREE.Object3D();
    buildArm(totalRArm, false);
    totalRArm.position.set(-65, 60, -75);
    robot.add(totalRArm);

    // Feet
    feet = new THREE.Object3D();
    feet.position.set(0, -155, 5);

    // Left foot
    lFoot = new THREE.Object3D();
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), materials.get("foot"));
    mesh.position.set(25, -10, 0);
    lFoot.add(mesh);
    feet.add(lFoot);

    // Right Foot
    rFoot = new THREE.Object3D();
    mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), materials.get("foot"));
    mesh.position.set(-25, -10, 0);
    rFoot.add(mesh);
    feet.add(rFoot);

    // Legs
    inferiorMembers = new THREE.Object3D();
    inferiorMembers.position.set(0, -5, -20);

    // Left leg
    totalLLeg = new THREE.Object3D();
    buildLeg(totalLLeg, true);
    totalLLeg.position.set(25, -95, -5);
    inferiorMembers.add(totalLLeg);

    // Right leg
    totalRLeg = new THREE.Object3D();
    buildLeg(totalRLeg, false);
    totalRLeg.position.set(-25, -95, -5);
    inferiorMembers.add(totalRLeg);

    inferiorMembers.add(feet);
    robot.add(inferiorMembers);

    // Upper wheels
    addWheel(robot, 40, -5, -20);
    addWheel(robot, -40, -5, -20);

    scene.add(robot);

    robot.position.set(x, y, z);
}

function buildHead(obj) {

    // Head
    head = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 60), materials.get("head")); // (0.02, 0.015, 0.03)
    head.position.set(0, 15, -30);

    obj.add(head);

    // Eyes
    lEye = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), materials.get("eye")); // (0.0025, 0.0025, 0.0025)
    lEye.position.set(5, 15, 1);
    
    rEye = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), materials.get("eye")); // (0.0025, 0.0025, 0.0025)
    rEye.position.set(-5, 15, 1);

    obj.add(lEye);
    obj.add(rEye);

    // Ears
    lEar = new THREE.Mesh(new THREE.ConeGeometry(5, 10, 10), materials.get("ear")); // radius: 0.0025, height: 0.005
    lEar.position.set(15, 35, -55);

    rEar = new THREE.Mesh(new THREE.ConeGeometry(5, 10, 10), materials.get("ear")); // radius: 0.0025, height: 0.005
    rEar.position.set(-15, 35, -55);

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

    // Wheels
    if (left) {
        addWheel(obj, 15, -5, 5);
        addWheel(obj, 15, -45, 5);
    } else {
        addWheel(obj, -15, -5, 5);
        addWheel(obj, -15, -45, 5);
    }
    
    // Thigh
    thigh = new THREE.Mesh(new THREE.BoxGeometry(20, 50, 10), materials.get("thigh")); // (0.01, 0.025, 0.005)
    if (left) { thigh.position.set(-5, 85, 5); }
    else thigh.position.set(5, 85, 5);

    obj.add(thigh);
}

function createTrailer(x, y, z) {

    box = new THREE.Mesh(new THREE.BoxGeometry(100, 140, 240), materials.get("trailer")); // (0.05, 0.07. 0.12) -> escala 2000:1
    box.position.set(0, 85, 0);

    append = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 10), materials.get("append")); // (0.005, 0.01, 0.005)
    append.position.set(0, 5, 105);

    trailer = new THREE.Object3D();
    trailer.add(box);
    trailer.add(append);

    scene.add(trailer);

    addWheel(trailer, 30, 0, -90); // (0.015, 0.0425, 0.045)
    addWheel(trailer, 30, 0, -45); // (0.015, 0.0425, 0.0225)
    addWheel(trailer, -30, 0, -90);
    addWheel(trailer, -30, 0, -45);

    trailer.position.set(x, y, z);
}

function addWheel(obj, x, y, z) {

    wheel = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 20), materials.get("wheel")); // radious top: 0.0075, radius bottom: 0.0075, height: 0.01
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);

    obj.add(wheel);

}

//////////////////////
/* CHECK TRUCK MODE */
//////////////////////
function checkTruckMode() {
    return (
        Math.abs(totalRArm.position.x + 35) < 0.01 &&
        Math.abs(totalHead.rotation.x + Math.PI / 2) < 0.01 &&
        Math.abs(inferiorMembers.rotation.x - Math.PI / 2) < 0.01 &&
        Math.abs(feet.rotation.x - Math.PI / 2) < 0.01
    );
}


//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(tentativePos) {
    // raquel: aqui acho que é melhor fazeres so update dos AABBs e fazer aqueles testes do min/max do que estares mm a mudar a posicao

    // updateTrailerAABBs(tentativePos);

    // Guarda a posição original do trailer
    const originalPos = trailer.position.clone();

    // Move temporariamente o trailer para a posição tentativa
    trailer.position.set(tentativePos.x, tentativePos.y, tentativePos.z);

    // Cria as bounding boxes alinhadas com o mundo
    const trailerBox = new THREE.Box3().setFromObject(trailer);
    const robotBox = new THREE.Box3().setFromObject(robot);

    // Volta a pôr o trailer na posição original
    trailer.position.copy(originalPos);

    // If there is collision, returns true
    if (trailerBox.intersectsBox(robotBox)) {
        return true;
    }
    return false;
}

///////////////////////
/* HANDLE COLLISIONS */ 
///////////////////////

function handleCollisions() {
    coupled = true;
}

function coupleTrailerToTruck() {
    var TrailerTarget = new THREE.Vector3(98.99, -5, -254.86);

    trailer.position.lerp(TrailerTarget, 0.005);

    if (trailer.position.distanceTo(TrailerTarget) < 0.1) {
        trailer.position.copy(TrailerTarget);
    }
}

////////////
/* UPDATE */
////////////
function update() {

    if (coupled == false) {

        delta = clock.getDelta();

        handleRobotMovements(delta);

        handleTrailerMovements();
        var tentativePos = updateTrailerPositions(delta);

        if (checkTruckMode()) { // true -> truck mode

            if (!checkCollisions(tentativePos)) { // false -> no collision
                trailer.position.x = tentativePos.x;
                trailer.position.z = tentativePos.z;
                
            } else handleCollisions();

        } else { // false -> robot mode
            trailer.position.x = tentativePos.x;
            trailer.position.z = tentativePos.z;

            //updateTrailerAABBs(tentativePos); // TODO
        }
    } else {
        coupleTrailerToTruck();
    }
}

function handleRobotMovements(delta) {
    if (headMovementIn){
        totalHead.rotateX(-(Math.min(delta * 2, Math.PI / 2 + totalHead.rotation.x)));
        headMovementIn = false;
    }
    if (headMovementOut){
        totalHead.rotateX(Math.min(delta * 2, -totalHead.rotation.x));
        headMovementOut = false;
    }
    if (feetMovementIn){
        feet.rotateX(Math.min(delta * 2, Math.PI / 2 - feet.rotation.x));
        feetMovementIn = false;
    }
    if (feetMovementOut){
        feet.rotateX(-(Math.min(delta * 2, feet.rotation.x)));
        feetMovementOut = false;
    }
    if (inferiorMembersMovementIn) {
        inferiorMembers.rotateX(Math.min(delta * 2, Math.PI / 2 - inferiorMembers.rotation.x));
        inferiorMembersMovementIn = false;
    }
    if (inferiorMembersMovementOut) {
        inferiorMembers.rotateX(-(Math.min(delta * 2, inferiorMembers.rotation.x)));
        inferiorMembersMovementOut = false;
    }
    if (armsMovementIn) {
        totalLArm.position.x = Math.max(totalLArm.position.x - delta * 40, 35);
        totalRArm.position.x = Math.min(totalRArm.position.x + delta * 40, -35);
        armsMovementIn = false;
    } if (armsMovementOut) {
        totalLArm.position.x = Math.min(totalLArm.position.x + delta * 40, 65);
        totalRArm.position.x = Math.max(totalRArm.position.x - delta * 40, -65);
        armsMovementOut = false;
    }
}

function handleTrailerMovements() {

    movementVector.set(0, 0, 0);
    
    if (leftKey) {
        movementVector.z += 100;
    } if (upKey) {
        movementVector.x -= 100;
    } if (rightKey) {
        movementVector.z -= 100;
    } if (downKey) {
        movementVector.x += 100;
    }
}

function updateTrailerPositions(delta) {

    var newPositionX = trailer.position.x + movementVector.x * delta;
    var newPositionZ = trailer.position.z + movementVector.z * delta;

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
    document.body.appendChild(renderer.domElement);

    clock.start();

    createMaterials();
    createScene();
    createCameras();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {

    update();

    render();
    
    requestAnimationFrame(animate);
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {

    switch (e.keyCode) {
        case 49: //1
            changeOrtCameraPos(1);
            break;
        case 50: //2
            changeOrtCameraPos(2);
            break;
        case 51: //3
            changeOrtCameraPos(3);
            break;
        case 52: //4
            camera = cameras[1];
            break;
        case 55: //7
            materials.forEach((element) => {
                element.wireframe = !element.wireframe;
            })
            break;
        case 81: //q
            feetMovementIn = true;
            break;
        case 65: //a
            feetMovementOut = true;
            break;
        case 87: //w
            inferiorMembersMovementIn = true;
            break;
        case 83: //s
            inferiorMembersMovementOut = true;
            break;
        case 69: //e
            armsMovementIn = true;
            break;
        case 68: //d
            armsMovementOut = true;
            break;
        case 82: //r
            headMovementIn = true;
            break;
        case 70: //f
            headMovementOut = true;
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