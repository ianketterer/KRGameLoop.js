/////////////////////////////////////////////////////////////////////////
//
// 	KRGameLoop.js: Basic sprite management for HTML5 canvas
// 
//    Copyright (C) 2014  Keny Ruyter keny@eastcoastbands.com
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
/////////////////////////////////////////////////////////////////////////

// please note this is a work in progress, and a rough draft at best.
// Constructive comments to keny@eastcoastbands.com

// Globals

var gSetGameLoop; 
// selector that initializes game loop

var gGameLoopFrequency = 16; 
//  I calculated 16 to equate to about 60 frames a second. YMMV
// seems to be accurate for small measurements but for larger 
// measurements like 20 seconds etc it is much greater.

var gObjectRegistry = [];
//  an array that registers all sprite objects created in memory

var dncX;
var dncY;
// internal var states do not calculate if longitude or latitude isn't going to change

var fillBackground = 1;
// flag to fill background with color 
// currently fixed to black but easily modifried

// gameLoop
// start: Starts Animation
// stop: Stops Animation
function gameLoop(command){

	if (command == "start"){
		start();
	}
	else if (command == "stop"){
		stop();
	}
}

function start(){
	// console.log("animaton started");
	gSetGameLoop = setInterval("setDisplay()", gGameLoopFrequency); // 60fps allegedly
}

function stop(){
	// console.log("animation stopped");
	clearInterval(gSetGameLoop);
}

// This is the main Game loop. First, check to see if bg needs to be drawn,
// then iterate through objects in registry and 
// calculate if and where they are moving to,
// then draw those who are set to visible,
// handle centering as necessary
function setDisplay(){

	// welcome to the game loop. Here everything will happen every 1/60'th of a second
	ctx.clearRect(0,0,canvas.width,canvas.height);

    if (fillBackground == 1){
    	ctx.fillStyle="#000000";
    	ctx.fillRect(0,0,canvas.width,canvas.height);

    }

    // call special user function
    gameLoopIntervalAction();

	// go through all images and display what is tagged as visible

	for (var i = 0; i < gObjectRegistry.length; i++){

		if (gObjectRegistry[i].isMoving == 1){
			gObjectRegistry[i] = calculateBearing(gObjectRegistry[i]);
		}

		if (gObjectRegistry[i].isCentered == 1 && gObjectRegistry[i].v == 1){
			drawImageAtPosition(ctx, gObjectRegistry[i], gObjectRegistry[i].x - gObjectRegistry[i].w/2, gObjectRegistry[i].y - gObjectRegistry[i].h/2)
		}
    	else if (gObjectRegistry[i].v == 1){
    		drawImage(ctx, gObjectRegistry[i]);
    	}
	}
}

// moveSprite(sprite, x, y, duration)
// sets a position for the sprite to move over duration
// duration 1 == 1 second trasition.
function moveSprite(sprite, x, y, duration){

	if (sprite.isMoving == 1){
		// console.log("Moving Already!");
		sprite.x = sprite.bearingX;
		sprite.y = sprite.bearingY;
		setDisplay();
	}
	// init settings for caculateBearing 
	sprite.isMoving = 1;
	sprite.bearingX = x;
	sprite.bearingY = y;
	sprite.duration = duration * 1000; // convert to ms

}


// centerGraphic(sprite) 
// sets a flag to tell the display method to offset the image by 
// it's .h and .w values divided by 2, respectively, up and to the left
function centerGraphic(sprite){

	sprite.isCentered = 1;
	return sprite;
}

// called during setDisplay if isMoving flag is set
function calculateBearing(sprite){

	// sprite.duration, initially set by the user,  then is recalculated by the following, later in the code
	// sprite.duration = framesLeft * gGameLoopFrequency;
	// frames left is calculated by dividing current duration (aka time left) and gLF.

	// Adjust these values in order to move sprite to position
	// calculate how many frames until destination
	var framesLeft = sprite.duration / gGameLoopFrequency; // note this is the previous duration
	var pixelsLeftX = sprite.x - sprite.bearingX;  // where i am minus where im going
	var pixelsLeftY = sprite.y - sprite.bearingY;
	var signX = "positive";
	var signY = "positive";

	// test signing of integer
	if (pixelsLeftX < 0){
		signX = "negative";
	}
	if (pixelsLeftY < 0){
		signY = "negative";
	}

	dncX = 0; // do not calculate for X
	dncY = 0;

	if (pixelsLeftX == 0){
		dncX = 1;
		// console.log("dncX");
	}
	if (pixelsLeftY == 0){
		dncY = 1;
		// console.log("dncY");
	}

	if (dncX == 0) {
		var intervalX = pixelsLeftX / framesLeft; // returns -1.234234234
		// probably need to use floor for reverse bearing objects
		var pixelsToAddX;
		sprite.accX += intervalX % 1; // get me all remainders less than 1
		if(signX == "positive"){

			pixelsToAddX = Math.floor(intervalX);

			if (sprite.accX > 1){
				sprite.accX = sprite.accX % 1; // when remainders accumulate to greater than 1, Add a pixel
				pixelsToAddX += 1;
			}
		}
		else {

			pixelsToAddX = Math.ceil(intervalX);
			if (sprite.accX < -1){
				sprite.accX = sprite.accX % 1; // when remainders accumulate to greater than 1, Add a pixel
				pixelsToAddX -= 1;
			}
		}

		sprite.x = sprite.x - pixelsToAddX; // 0,0 in upper left hand corner

	}

	if (dncY == 0) {

		var intervalY = pixelsLeftY / framesLeft;

		var pixelsToAddY;

		sprite.accY += intervalY % 1;

		if(signY == "positive"){

			pixelsToAddY = Math.floor(intervalY);

			if (sprite.accY > 1){
				sprite.accY = sprite.accY % 1;
				pixelsToAddY += 1;
			}
		} 
		else {

			pixelsToAddY = Math.ceil(intervalY)

			if (sprite.accY < -1){
				sprite.accY = sprite.accY % 1;
				pixelsToAddY -= 1;
			}
		}

		sprite.y = sprite.y - pixelsToAddY;

	}

	framesLeft -= 1;

	sprite.duration = framesLeft * gGameLoopFrequency; // here we actually calc the current duration

	// console.log("FramesLeft: %s sprite.duration: %s distance to go: %s - %s", framesLeft, sprite.duration, sprite.x, sprite.bearingX);

	// end loop
	if (framesLeft < 1){

		// console.log("x Actual: %s Planned: %s  Y Actual: %s Planned: %s",sprite.x, sprite.bearingX,sprite.y, sprite.bearingY);
		sprite.isMoving = 0;
		sprite.x = sprite.bearingX;
		sprite.y = sprite.bearingY;
	}
	
	// console.log("x: %s y: %s",sprite.x,sprite.y);

	return sprite;
}

// probably should implement prototyping for sprites as well
Array.prototype.avg = function() {
	var av = 0;
	var cnt = 0;
	var len = this.length;

	for (var i = 0; i < len; i++) {

		var e = +this[i];

		if(!e && this[i] !== 0 && this[i] !== '0') e--;

			if (this[i] == e) {
				av += e; cnt++;
			}
		}
		return av/cnt;
}

// tells the context to make image appear
function drawImage(context, sprite){

	context.drawImage(sprite.img,sprite.x, sprite.y);
	return sprite;
}

// tells the context to make image appear
function drawImageAtPosition(context, sprite, x, y){

	context.drawImage(sprite.img,x, y);
	return sprite;
}


// initialize and register Sprite object
function Sprite(file){

	var img = new Image();
	img.src = file;
	this.img = img;
	this.x = 0; // x position
	this.y = 0; // y position
	this.w = 0; // width of the image
	this.h = 0; // height of the image
	this.v = 1; // visibility

	// set sprite animation properties
	this.bearingX = 0;
	this.bearingY = 0;
	this.duration = 0;
	this.isMoving = 0;
	this.accX = 0;
	this.accY = 0;

	this.isCentered = 0;

	this.id = gObjectRegistry.length + 1;
	registerSprite(this);

}

// establish the sprite's position onstage at init, then register
function SpriteWithPosition(file, x, y){
	
	// console.log("File: %s x: %s y: %s", file, x, y);
	var img = new Image();
	img.src = file;
	this.img = img;
	this.x = 0; // x position
	this.y = 0; // y position
	this.w = 0; // width of the image
	this.h = 0; // height of the image
	this.v = 1; // visibility

	// set sprite animation properties
	this.bearingX = 0;
	this.bearingY = 0;
	this.duration = 0;
	this.isMoving = 0;
	this.accX = 0;
	this.accY = 0;

	this.isCentered = 0;

	this.id = gObjectRegistry.length + 1;
	setSpritePosition(this, x, y);
	registerSprite(this);
}

function setSpriteHW(h,w){
	sprite.h = h;
	sprite.w = w;
	return sprite;
}

function setSpritePosition(sprite, x, y){
	sprite.x = x;
	sprite.y = y;
	return sprite;
}

function registerSprite(sprite){

	// establish the sprite registry...
	// OR figure out how to access existing objects by id
	gObjectRegistry.push(sprite);

}

// courtesy function for initializing sprite images
function imgIndex(img, w, h){
  this.h = h;
  this.w = w;
  this.img = img;
}

/////////////////////////////////////////////////////////////////////////
// some utilities I used to determine frame rates

/*
// Measure selector frequency 
var selectorFrequency = 4; // local, 13 = ~60fps
var gTimes = 0; // global
var gCountTime; // global
var gStart; 

timeMe(selectorFrequency);
*/

function timeMe(selectorFrequency){
	gCountTime = setInterval("countTime()", selectorFrequency); // 60fps allegedly
	gStart = new Date().getTime();
}

function countTime(){
	gTimes +=1;
	if (gTimes == 60){
		clear();
  }
}

function clear(){
	clearInterval(gCountTime);
	var end = new Date().getTime();
	var time = end - gStart;
	var seconds = time/1000;
	console.log("Time keeps on slippin %s seconds into the future...", seconds);
}
function gameLoopIntervalAction(){
}


