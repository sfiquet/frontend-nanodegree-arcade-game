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

    this.startCol = col;
    this.startRow = row;
    this.init();
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
    this.col = this.startCol;
    this.row = this.startRow;
    this.resetMinTime = 0;
    this.resetStart = 0;
};

Player.prototype.isResetting = function(){
    return (this.resetStart !== 0);
};

Player.prototype.init = function() {
    this.finishReset();
    this.lives = 5;
    this.score = 0;
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
    for (var i = 0; i < this.player.lives; i++) {
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
    var y = 28;
    var text = 'Score: ' + this.player.score;
    ctx.save();
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "blue";
    ctx.fillStyle = "DarkSlateGray";
    ctx.font = "20pt Aclonica";
    ctx.lineWidth = 1;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
};

//*****************************************************************************
var Game = function() {
    this.state = 'playing';

    // set up component objects
    this.allEnemies =[];
    this.allEnemies.push(new Enemy(1));
    this.allEnemies.push(new Enemy(2));
    this.allEnemies.push(new Enemy(3));

    this.player = new Player(2, 5);
    this.lifeCounter = new LifeCounter(this.player);
    this.scoreCounter = new ScoreCounter(this.player);
};

Game.prototype.update = function(dt) {

    // don't update the game objects if game over
    if (this.state === 'idle') return;

    this.updateEntities(dt);
    this.checkCollisions();
};

Game.prototype.updateEntities = function(dt) {

    if (this.player.lives <= 0) {

        this.state = 'game over';

    } else {

        this.allEnemies.forEach(function(enemy) {

            enemy.update(dt);
        });

        this.player.update();        
    }
};

Game.prototype.checkCollisions = function() {

    for (var i = 0; i < this.allEnemies.length; i++) {

        if (this.allEnemies[i].collidesWith(this.player)) {

            this.player.loseLife();
            break;
        }
    }
};

Game.prototype.render = function() {

    // don't render if idle, there's nothing happening
    if (this.state === 'idle')  return;

    /* This array holds the relative URL to the image used
     * for that particular row of the game level.
     */
    var rowImages = [
            'images/water-block.png',   // Top row is water
            'images/stone-block.png',   // Row 1 of 3 of stone
            'images/stone-block.png',   // Row 2 of 3 of stone
            'images/stone-block.png',   // Row 3 of 3 of stone
            'images/grass-block.png',   // Row 1 of 2 of grass
            'images/grass-block.png'    // Row 2 of 2 of grass
        ],
        numRows = 6,
        numCols = 5,
        row, col, canvas;

    canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Loop through the number of rows and columns we've defined above
     * and, using the rowImages array, draw the correct image for that
     * portion of the "grid"
     */
    for (row = 0; row < numRows; row++) {
        for (col = 0; col < numCols; col++) {
            /* The drawImage function of the canvas' context element
             * requires 3 parameters: the image to draw, the x coordinate
             * to start drawing and the y coordinate to start drawing.
             * We're using our Resources helpers to refer to our images
             * so that we get the benefits of caching these images, since
             * we're using them over and over.
             */
            ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
        }
    }

    this.lifeCounter.render();
    this.scoreCounter.render();

    this.renderEntities();

    if (this.state === 'game over') {
        var text = 'Game Over';
        var x = canvas.width / 2;
        var y = canvas.height / 2 + 18;
        var helpText = 'Press the space bar to play again';

        ctx.save();

        ctx.textAlign = "center";
        ctx.strokeStyle = "DarkSlateGray";
        ctx.fillStyle = "white";
        ctx.font = "48pt Aclonica";
        ctx.lineWidth = 3;
        ctx.strokeText(text, x+1, y+1);
        ctx.fillText(text, x, y);

        ctx.font = "18pt Aclonica";
        ctx.lineWidth = 2;
        y = canvas.height - 90;
        ctx.strokeText(helpText, x, y);
        ctx.fillText(helpText, x, y);

        ctx.restore();
        // go into idle state so we don't refresh the screen all the time
        this.state = 'idle';
    }
};

/* This function is called by the render function and is called on each game
 * tick. It's purpose is to then call the render functions you have defined
 * on your enemy and player entities within app.js
 */
Game.prototype.renderEntities = function() {
    /* Loop through all of the objects within the allEnemies array and call
     * the render function you have defined.
     */
    this.allEnemies.forEach(function(enemy) {

        enemy.render();
    });

    this.player.render();
}

Game.prototype.handleInput = function(key){

    if (this.state === 'playing') {

        this.player.handleInput(key);

    } else  if (this.state === 'idle') {

        if (key === 'space') {

            this.reset();
        }
    }
};

Game.prototype.reset = function() {

    this.allEnemies.forEach(function(enemy) {

        enemy.reset();
    });

    this.player.init();
    this.state = 'playing';
};

//*****************************************************************************
// Helper functions
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//*****************************************************************************
// Now instantiate your objects.
var game = new Game();

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        32: 'space',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    game.handleInput(allowedKeys[e.keyCode]);
 });
