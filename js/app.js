// Rectangle class
var Rect = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
};
Rect.prototype.intersects = function(otherRect){
    if (this.x < otherRect.x + otherRect.width &&
            this.x + this.width > otherRect.x &&
            this.y < otherRect.y + otherRect.height &&
            this.height + this.y > otherRect.y) {
        return true;
    }
    return false;
};

//*****************************************************************************
// Sprite superclass
// rect is the collision rect. Its position should be relative to (x, y).
var Sprite = function(x, y, url, rect){
    this.x = x;
    this.y = y;
    // The image file for this sprite, this uses
    // a helper we've provided to easily load images
    this.sprite = url;
    this.rect = rect; // collision rect
};
// Draw the sprite on the screen, required method for game
Sprite.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    // debug
    //ctx.strokeStyle = "red";
    //ctx.strokeRect(this.x + this.rect.x, this.y + this.rect.y, this.rect.width, this.rect.height);
};

Sprite.prototype.collisionRect = function() {
    return new Rect(this.x + this.rect.x, this.y + this.rect.y, this.rect.width, this.rect.height);
};

Sprite.prototype.collidesWith = function(otherSprite) {
    var curRect = this.collisionRect();
    var otherRect = otherSprite.collisionRect();
    return curRect.intersects(otherRect);
};

//*****************************************************************************
// Enemies our player must avoid
// row is the row in the grid from the top
// enemies should be in rows 1-3
var Enemy = function(row) {
    Sprite.call(this, this.START_X, 83 * row - 25, 'images/enemy-bug.png', new Rect(12, 88, 77, 44));

    this.reset();
};
Enemy.prototype = Object.create(Sprite.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.START_X = -101;

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x += this.speed * dt;

    // if out of the canvas, recycle the enemy
    if (this.x > ctx.canvas.width) {
        this.reset();
    }
};

Enemy.prototype.reset = function() {
    this.x = this.START_X;
    this.speed = getRandomIntInclusive(150, 300);
};

//*****************************************************************************
// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function(col, row){
    Sprite.call(this, 0, 0, 'images/char-boy.png', new Rect(28, 73, 45, 55));
    this.col = col;
    this.row = row;
    this.update();
    this.resetMinTime = 0;
    this.resetStart = 0;
    this.lives = 5;
    this.score = 0;
};
Player.prototype = Object.create(Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.MAX_COLS = 5;
Player.prototype.MAX_ROWS = 6;

Player.prototype.update = function(){
    if (this.resetMinTime && Date.now() - this.resetStart > this.resetMinTime) {
        this.finishReset();
    }
    this.x = this.col * 101;
    this.y = this.row * 83 - 35;
};

Player.prototype.handleInput = function(key){
    // don't process input if we are in the process of resetting
    if (this.isResetting()) return;

    if (key === 'left' && this.col > 0) {
        this.col -= 1;
    } else if (key === 'up' && this.row > 0) {
        this.row -= 1;
    } else if (key === 'right' && this.col < this.MAX_COLS - 1) {
        this.col += 1;
    } else if (key === 'down' && this.row < this.MAX_ROWS - 1) {
        this.row += 1;
    }

    if (this.row === 0) {
        this.score += 1;
        this.startReset(200);
    }
};

Player.prototype.loseLife = function() {
    this.lives -= 1;
    this.startReset(10);
};

// set up delayed reset. The player will only be really reset by the update method.
Player.prototype.startReset = function(resetTime) {
    this.resetMinTime = resetTime;
    this.resetStart = Date.now();
};

Player.prototype.finishReset = function(){
    this.col = 2;
    this.row = 5;
    this.resetMinTime = 0;
    this.resetStart = 0;
};

Player.prototype.isResetting = function(){
    return (this.resetStart !== 0);
};

//*****************************************************************************

var LifeCounter = function(player) {
    this.player = player;
};

LifeCounter.prototype.render = function(){
    // tiny player images as life counters
    var img = Resources.get(this.player.sprite);
    var xOffset = 10;
    var yOffset = -5;
    var ratio = 0.3;
    var width = img.width * ratio;
    var height = img.height * ratio;
    for (var i = 0; i < player.lives; i++) {
        ctx.drawImage(img, xOffset, yOffset, width, height);
        xOffset += width;
    }
};

//*****************************************************************************

var ScoreCounter = function(player) {
    this.player = player;
};

ScoreCounter.prototype.render = function(){
    var x = ctx.canvas.width - 10;
    var y = 24;
    var text = 'Score: ' + this.player.score;
    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.font = "24pt Impact";
    ctx.lineWidth = 2;
    ctx.fillText(text, x, y);
    ctx.strokeText(text, x, y);
    ctx.restore();
};

//*****************************************************************************
// Helper functions
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//*****************************************************************************
// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies =[];
allEnemies.push(new Enemy(1));
allEnemies.push(new Enemy(2));
allEnemies.push(new Enemy(3));

var player = new Player(2, 5);
var lifeCounter = new LifeCounter(player);
var scoreCounter = new ScoreCounter(player);

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    if (player.lives > 0) {
        player.handleInput(allowedKeys[e.keyCode]);
    }
});
