/*
TODO:
    Check collision direction and bounce back accordingly
    Add mass and squishiness factor on objects to calculate better the amount of bounce to go back up
*/

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;
const FPS = 100;
const GROUND_HEIGHT = (9 / 10) * HEIGHT;
let pastTime = new Date().getTime() / 1000;
let currTime = new Date().getTime() / 1000;
const BALL_RADIUS = 30;
let canJump = false;
let playerPos = [500, 200]; // starting point
let player;

class Vector {
    x = 0;
    y = 0;
    z = 0;
}

let velocity = new Vector();

let gravity = -9.28;
let acceleration = 300;
let jumpForce = 10;
let friction = 0.95;
let drag = 0.99;

class World {
    objects = [];

    constructor() {}

    add(GameObject) {
        this.objects.push(GameObject);
    }
}

class GameObject {
    x;
    y;
    width;
    length;
    color;

    constructor(x, y, w, l, color) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.length = l;
        this.color = color;
    }
}

const world = new World();

function setup() {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.position = 'fixed';
    canvas.style.margin = 0;
    canvas.style.padding = 0;

    setupListener();
    setupGround();
    setupPlayer();
    setupAmbiguousobjects();
}

function setupListener() {
    document.addEventListener("keydown", (e) => {
        switch (e.code) {
            case "ArrowUp":
            case "KeyW":
                if (isGrounded()) {
                    canJump = true;
                }
                break;
            
            case "ArrowRight":
            case "KeyD":
                velocity.x += acceleration * (currTime - pastTime);
                break;
            
            case "ArrowLeft":
            case "KeyA":
                velocity.x -= acceleration * (currTime - pastTime);
                break;
        }
    });
}

function setupAmbiguousobjects() {
    // create a sample block to test collision
    let box = new GameObject(playerPos[0], GROUND_HEIGHT - BALL_RADIUS, BALL_RADIUS * 5, BALL_RADIUS, "green");
    world.add(box);
}

function setupGround() {
    ground = new GameObject(0, GROUND_HEIGHT, WIDTH, HEIGHT - GROUND_HEIGHT, "cyan");
    world.add(ground);
}

function setupPlayer() {
    player = new GameObject(playerPos[0], playerPos[1], BALL_RADIUS, BALL_RADIUS, "white");
    world.add(player);
}

function clearScreen() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function collisionDetect(GameObject, check = []) {
    for (i = 0; i < world.objects.length; i++) {
        comparedGameObject = world.objects[i];
        
        condition = GameObject !== comparedGameObject &&
        GameObject.x < comparedGameObject.x + comparedGameObject.width &&
        GameObject.x + GameObject.width > comparedGameObject.x &&
        GameObject.y < comparedGameObject.y + comparedGameObject.length &&
        GameObject.length + GameObject.y > comparedGameObject.y;

        for (const x of check) {
            condition = condition && comparedGameObject !== x;
        }

        if (condition) {
            return comparedGameObject;
        }
    }

    return null;
}

function drawPlayer() {
    let x = player.x;
    let y = player.y;

    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, BALL_RADIUS, BALL_RADIUS);
}

function drawGround() {
    ctx.fillStyle = 'cyan';
    ctx.fillRect(0, GROUND_HEIGHT, WIDTH, HEIGHT - GROUND_HEIGHT);
}

function drawAllObjects() {
    for (i = 0; i < world.objects.length; i++) {
        let object = world.objects[i];
        ctx.fillStyle = object.color;
        ctx.fillRect(object.x, object.y, object.width, object.length);
    }
}

function loop() {
    clearScreen();
    drawGround();
    drawPlayer();
    applyFriction();
    drawAllObjects();

    velocity.y *= drag;
    velocity.x *= drag;

    let collidedObject = collisionDetect(player);

    if (collidedObject !== null) { // player has collided with something
        if (!canJump) {
            velocity.y = -velocity.y;
            if (Math.abs(velocity.y) < 1) {
                velocity.y = 0;
            }
            // velocity.x = -velocity.x;
        }
    }

    else {
        velocity.y = velocity.y - gravity * (currTime - pastTime);
    }

    if (canJump) {
        velocity.y -= jumpForce;
        canJump = false;
    }
    
    player.y += velocity.y;
    player.x += velocity.x;

    updateTimePerFrame();

    setTimeout(loop, 1000 / FPS);
}

function applyFriction() {
    if (isGrounded()) {
        velocity.x *= friction;
    }
}

function isGrounded() {
    let border = 0.1;
    let playerCollider = new GameObject(player.x - border, player.y - border, player.width + 2 * border, player.length + 2 * border);

    return collisionDetect(playerCollider, [player]) !== null;
}

function updateTimePerFrame() {
    pastTime = currTime;
    currTime = new Date().getTime() / 1000;
}

function init() {
    setup();
    setTimeout(loop, 1000 / FPS);
}

init();
