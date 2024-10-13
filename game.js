// game.js

// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Objects
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,
    speed: 5,
    health: 100,
    maxHealth: 100,
    level: 1,
    exp: 0,
    nextLevelExp: 100,
    prevLevelExp: 0,
    weapons: [],
};

let bullets = [];
let enemies = [];
let jewels = [];
let keys = {};

let score = 0;

const healthElement = document.getElementById('health');
const levelElement = document.getElementById('level');
const scoreElement = document.getElementById('score');
const expElement = document.getElementById('exp');

// Event Listeners for Key Presses
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game Loop
function gameLoop() {
    update();
    draw();
    if (player.health > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        gameOver();
    }
}

// Update Game State
function update() {
    // Move Player
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;

    // Keep Player within Canvas Bounds
    player.x = Math.max(0, Math.min(canvas.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height, player.y));

    // Update Weapons
    player.weapons.forEach((weapon) => weapon.update());

    // Update Bullets
    bullets.forEach((bullet, index) => {
        bullet.update();

        // Remove bullets that are off-screen or used
        if (bullet.used || bullet.outOfBounds()) {
            bullets.splice(index, 1);
        }
    });

    // Spawn Enemies at Intervals
    if (Math.random() < 0.02) {
        spawnEnemy();
    }

    // Update Enemies
    enemies.forEach((enemy, eIndex) => {
        enemy.update();

        // Check Collision with Player
        if (detectCollision(player, enemy)) {
            player.health -= enemy.attackStrength;
            healthElement.textContent = `Health: ${player.health}`;
            enemies.splice(eIndex, 1);
            if (player.health <= 0) {
                player.health = 0;
                healthElement.textContent = `Health: ${player.health}`;
            }
        }
    });

    // Update Jewels
    jewels.forEach((jewel, jIndex) => {
        // Move Jewel towards Player if close
        jewel.update();

        // Check collision with player
        if (detectCollision(player, jewel)) {
            jewel.collect();
            jewels.splice(jIndex, 1);
        }
    });

    // Update HUD
    healthElement.textContent = `Health: ${player.health}`;
    levelElement.textContent = `Level: ${player.level}`;
    scoreElement.textContent = `Score: ${score}`;
    expElement.textContent = `EXP: ${player.exp} / ${player.nextLevelExp}`;
}

// Draw Game Objects
function draw() {
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw Bullets
    bullets.forEach((bullet) => {
        bullet.draw();
    });

    // Draw Enemies
    enemies.forEach((enemy) => {
        enemy.draw();
    });

    // Draw Jewels
    jewels.forEach((jewel) => {
        jewel.draw();
    });
}

// Helper Functions

function spawnEnemy() {
    const size = 20;
    const speed = 1 + Math.random() * 0.5;
    const health = 5 + Math.floor(Math.random() * 5);
    const attackStrength = 10;
    let x, y;

    // Spawn enemies at random edges
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -size;
            break;
        case 1: // Right
            x = canvas.width + size;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + size;
            break;
        case 3: // Left
            x = -size;
            y = Math.random() * canvas.height;
            break;
    }

    enemies.push(new Enemy(x, y, size, speed, health, attackStrength));
}

function detectCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.hypot(dx, dy);

    return distance < obj1.size + obj2.size;
}

function resetGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    player.level = 1;
    player.exp = 0;
    player.nextLevelExp = 100;
    player.prevLevelExp = 0;
    player.weapons = [new BasicWeapon()];
    bullets = [];
    enemies = [];
    jewels = [];
    score = 0;

    // Update HUD
    healthElement.textContent = `Health: ${player.health}`;
    levelElement.textContent = `Level: ${player.level}`;
    scoreElement.textContent = `Score: ${score}`;
    expElement.textContent = `EXP: ${player.exp} / ${player.nextLevelExp}`;
}

function gameOver() {
    alert('Game Over!');
    resetGame();
    gameLoop();
}

// Classes

class Weapon {
    constructor() {
        this.attackSpeed = 1000; // ms
        this.lastAttackTime = Date.now();
    }

    update() {
        const now = Date.now();
        if (now - this.lastAttackTime >= this.attackSpeed) {
            this.fire();
            this.lastAttackTime = now;
        }
    }

    fire() {
        // To be implemented in subclasses
    }
}

class BasicWeapon extends Weapon {
    constructor() {
        super();
        this.attackSpeed = 1000;
    }

    fire() {
        bullets.push(
            new Bullet(
                player.x,
                player.y,
                5,
                7,
                Math.random() * Math.PI * 2, // Random direction
                10 // Damage
            )
        );
    }
}

class Bullet {
    constructor(x, y, size, speed, angle, damage) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.angle = angle;
        this.damage = damage;
        this.used = false;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Check collision with enemies
        enemies.forEach((enemy, eIndex) => {
            if (detectCollision(this, enemy)) {
                enemy.takeDamage(this.damage);
                this.used = true;
            }
        });
    }

    draw() {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    outOfBounds() {
        return (
            this.x < 0 ||
            this.x > canvas.width ||
            this.y < 0 ||
            this.y > canvas.height
        );
    }
}

class Enemy {
    constructor(x, y, size, speed, health, attackStrength) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.health = health;
        this.maxHealth = health;
        this.attackStrength = attackStrength;
    }

    update() {
        // Move Enemy Towards Player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // Remove enemy if health is zero or below
        if (this.health <= 0) {
            this.die();
        }
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw Health Bar
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - this.size, this.y - this.size - 10, this.size * 2, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(
            this.x - this.size,
            this.y - this.size - 10,
            (this.size * 2) * (this.health / this.maxHealth),
            5
        );
    }

    takeDamage(damage) {
        this.health -= damage;
    }

    die() {
        // Drop a jewel
        jewels.push(new Jewel(this.x, this.y));
        score += 10;
        enemies.splice(enemies.indexOf(this), 1);
    }
}

class Jewel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 8;
        this.collected = false;
    }

    update() {
        // Move towards the player if within attraction radius
        const attractionRadius = 100;
        if (detectCollision(this, { x: player.x, y: player.y, size: attractionRadius })) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * 2;
            this.y += Math.sin(angle) * 2;
        }
    }

    draw() {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    collect() {
        // Increase player's EXP
        const expGained = 20;
        player.exp += expGained;
        this.checkLevelUp();
    }

    checkLevelUp() {
        if (player.exp >= player.nextLevelExp) {
            player.level += 1;
            player.prevLevelExp = player.nextLevelExp;
            player.nextLevelExp = Math.floor(player.nextLevelExp * 1.5);
            player.health = player.maxHealth; // Restore health on level up
            player.speed += 0.5; // Increase speed
            // Optionally, add new weapons or increase stats
        }
    }
}

resetGame();
gameLoop();
