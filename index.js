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
                if (isGrounded() && canJump) {
                    velocity.y -= jumpForce;
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
    let box = new GameObject(playerPos[0], GROUND_HEIGHT - BALL_RADIUS * 5, BALL_RADIUS * 5, BALL_RADIUS * 5, "green");
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

function collisionDetectDirection(obj1, obj2) {
    // gets direction of obj1 hitting obj2

    obj1_bottom = obj1.y + obj1.length;
    obj2_bottom = obj2.y + obj2.length;
    obj1_right = player.x + player.width;
    obj2_right = obj2.x + obj2.width;

    b_collision = obj2_bottom - player.y;
    t_collision = obj1_bottom - obj2.y;
    l_collision = obj1_right - obj2.x;
    r_collision = obj2_right - player.x;

    if (t_collision < b_collision && t_collision < l_collision && t_collision < r_collision ) {
        //Top collision
        return "top"
    }
    if (b_collision < t_collision && b_collision < l_collision && b_collision < r_collision) {
        //bottom collision
        obj1.color = "red";
        return "bottom"
    }
    if (l_collision < r_collision && l_collision < t_collision && l_collision < b_collision) {
        //Left collision
        return "left"
    }
    if (r_collision < l_collision && r_collision < t_collision && r_collision < b_collision ) {
        //Right collision
        return "right"
    }
}
function drawPlayer() {
    let x = player.x;
    let y = player.y;

    ctx.fillStyle = player.color;
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

    let border = 0.1;
    let playerCollider = new GameObject(player.x - border, player.y - border, player.width + 2 * border, player.length + 2 * border);
    let collidedObject = collisionDetect(playerCollider, [player]);

    if (collidedObject !== null) { // player has collided with something
        if (!canJump) {
            let d = collisionDetectDirection(player, collidedObject);
            if (d == "top" || d == "bottom") {
                // else velocity.y *= -1;
                velocity.y *= -1;
                if (Math.abs(velocity.y) < 1) {
                    canJump = true;
                }
            }
            
            if (d == "left" || d == "right") {
                // if (Math.abs(velocity.x) < 1) {
                //     velocity.x = 0;
                // }
                velocity.x *= -1
            }
        }
    }

    else {
        velocity.y = velocity.y - gravity * (currTime - pastTime);
    }

    // if (canJump) {
    //     velocity.y -= jumpForce;
    //     canJump = false;
    // }
    
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

function applyPhysicsAllObjects() {
    // apply physics to all objects in the world space
    for (const obj of world.objects) {
        
    }
}

function isGrounded() {
    let border = 1;
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
