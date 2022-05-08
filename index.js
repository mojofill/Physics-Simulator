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
let acceleration = 400;
let jumpForce = 10;
let friction = 0.95;
let drag = 0.99;

// expressing desires
let wantJump = false;
let wantGoLeft = false;
let wantGoRight = false;

// random bullshit that might help make shit work
let takeoffHappened = false;
let isJumping = false;

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
    name;

    constructor(x, y, w, l, color, name=null) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.length = l;
        this.color = color;
        this.name = name;
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
    // instead of adding velocity in here, make a boolean (enum) and add velocity in the LOOP, not here

    document.addEventListener("keydown", (e) => {
        switch (e.code) {
            case "ArrowUp":
            case "KeyW":
                if (isGrounded() && canJump) {
                    wantJump = true;
                }
                break;
            
            case "ArrowRight":
            case "KeyD":
                wantGoRight = true;
                break;
            
            case "ArrowLeft":
            case "KeyA":
                wantGoLeft = true;
                break;
        }
    });
}

function setupAmbiguousobjects() {
    // create a sample block to test collision
    let box = new GameObject(playerPos[0], GROUND_HEIGHT - BALL_RADIUS * 5, BALL_RADIUS * 5, BALL_RADIUS * 5, "purple", "box");
    world.add(box);
}

function setupGround() {
    ground = new GameObject(0, GROUND_HEIGHT, WIDTH, HEIGHT - GROUND_HEIGHT, "green", "ground");
    world.add(ground);
}

function setupPlayer() {
    player = new GameObject(playerPos[0], playerPos[1], BALL_RADIUS, BALL_RADIUS, "red", "player");
    world.add(player);
}

function clearScreen() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function collisionDetect(obj, debug=false) {
    let border = 0.1;
    let collider = new GameObject(obj.x - border, obj.y - border, obj.width + 2 * border, obj.length + 2 * border);
    // return more than one collision
    collisions = [];
    for (i = 0; i < world.objects.length; i++) {
        comparedGameObject = world.objects[i];

        if (comparedGameObject !== obj &&
            collider.x < comparedGameObject.x + comparedGameObject.width &&
            collider.x + collider.width > comparedGameObject.x &&
            collider.y < comparedGameObject.y + comparedGameObject.length &&
            collider.length + collider.y > comparedGameObject.y) {
            
                collisions.push(comparedGameObject);
        }
    }

    if(debug) {
        // if (collisions.length === 0) {
        //     console.log('player collided with nothing');
        // }
        // else {
        //     console.log(`player collided with ${collisions.length} objects`)
        // }
        console.log(`player collided with ${collisions.length} objects`)
    }

    return collisions;
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

    collisions = [];

    if (t_collision < b_collision && t_collision < l_collision && t_collision < r_collision ) {
        //Top collision
        collisions.push("top");
    }
    if (b_collision < t_collision && b_collision < l_collision && b_collision < r_collision) {
        //bottom collision
        collisions.push("bottom");
    }
    if (l_collision < r_collision && l_collision < t_collision && l_collision < b_collision) {
        //Left collision
        collisions.push("left");
    }
    if (r_collision < l_collision && r_collision < t_collision && r_collision < b_collision ) {
        //Right collision
        collisions.push("right");
    }

    return collisions;
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

    let collidedObjects = collisionDetect(player);

    // will run for each collided object
    for (const collidedObject of collidedObjects) {
        let directions = collisionDetectDirection(player, collidedObject);

        for (const d of directions) {
            if (d == "top" || d == "bottom") {
                // if the player has not taken off from the ground yet (or they are not jumping), then you can bounce around the player
                // however, if the player is jumping, then what happens is, because the player is
                // still on the ground, therefore colling on top, the jump force then
                // gets flipped, which causes it to go into the ground
                
                // if take off has not happened yet but the player is jumping, then do not flip velocity y
                // else, flip velocity y
                if (!(!takeoffHappened && isJumping)) {
                    velocity.y *= -1;
                }
                
                // when velocty.y gets between [-1, 1], set it to 0 just because why not
                if (Math.abs(velocity.y) <= 1) {
                    velocity.y = 0;
                    canJump = true;
                }

                if (takeoffHappened && isJumping) { // if the take off has happened and the player was jumping, AND the player collided with an object on the top side, then that means everything goes back normal
                    isJumping = false;
                    takeoffHappened = false;
                }
            }
            
            if (d == "left" || d == "right") {
                velocity.x *= -1;
            }
        }
    }

    // if take off has not happened yet AND the player is jumping
    if(!takeoffHappened && isJumping) {
        if (collidedObjects.length == 0) { // if player is not colliding with anything, set takeoffHappened to true
            takeoffHappened = true;
        }
    }

    if (collidedObjects.length == 0) {
        velocity.y = velocity.y - gravity * (currTime - pastTime);
    }
    
    player.y += velocity.y;
    player.x += velocity.x;

    carryOutDesires(); // this part is the one where all the code for player wanting to get left and right go

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

function carryOutDesires() {
    if (wantJump) {
        velocity.y -= jumpForce;
        wantJump = false;
        isJumping = true;
    }

    if (wantGoLeft) {
        velocity.x -= acceleration * (currTime - pastTime);
        wantGoLeft = false;
    }

    if (wantGoRight) {
        velocity.x += acceleration * (currTime - pastTime);
        wantGoRight = false;
    }
}

function isGrounded() {
    let collidedObjects = collisionDetect(player);
    for (const obj of collidedObjects) {
        let directions = collisionDetectDirection(player, obj);
        for (const d of directions) {
            if (d === 'top') {
                return true;
            }
        }
    }
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
