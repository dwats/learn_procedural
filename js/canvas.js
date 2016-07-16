/* jshint esversion:6 */
let canvasWidth, canvasHeight, drawScale, choke;
let canvasDiv = document.getElementById("canvas-shell");
let canvas = document.createElement("canvas");
let canvasGrid = document.createElement("canvas");
let ctx = canvas.getContext("2d");
let ctxg = canvasGrid.getContext("2d");
let canvasData;

let paint = false;
let drawX = [];
let drawY = [];
let drawDrag = [];
let showGrid = true;
let showFloodFill = true;

canvas.onmousedown = function(e) {
	let rect = canvas.getBoundingClientRect();
	let mouseX = Math.round((e.clientX - rect.left-2)/drawScale);
	let mouseY = Math.round((e.clientY - rect.top-2)/drawScale);

	paint = true;
	addClick(mouseX, mouseY, false);

};

canvas.onmousemove = function(e) {
	if (paint) {
		let rect = canvas.getBoundingClientRect();
		let mouseX = Math.round((e.clientX - rect.left-2)/drawScale);
		let mouseY = Math.round((e.clientY - rect.top-2)/drawScale);
		addClick(mouseX, mouseY, true);
	}
};

canvas.onmouseleave = function() {
	paint = false;
};

canvas.onmouseup = function() {
	paint = false;
};

let addClick = function(x, y, isDragging) {
	frameNow[y][x] = 1;
	frameDraw(frameNow);
	updateCanvas();
};

let drawGrid = function() {
  let gridOptions = {
      minorLines: {
          separation: 5,
					color: 'rgba(50,50,50,0.01)'
      },
      majorLines: {
          separation: 25,
          color: 'rgba(150,150,150,0.5)'
      }
  };

  drawGridLines(gridOptions.minorLines);
  drawGridLines(gridOptions.majorLines);

  return;
};

let drawGridLines = function(lineOptions) {
	let count, i, x, y;
	let width = canvasWidth * drawScale;
	let height = canvasHeight * drawScale;
	ctxg.strokeStyle = lineOptions.color;
  ctxg.strokeWidth = 1;
  ctxg.beginPath();

  count = Math.floor(width / lineOptions.separation);

  for (i = 1; i <= count; i++) {
      x = (i * lineOptions.separation);
      ctxg.moveTo(x, 0);
      ctxg.lineTo(x, height);
      ctxg.stroke();
  }

 	count = Math.floor(height / lineOptions.separation);

  for (i = 1; i <= count; i++) {
      y = (i * lineOptions.separation);
      ctxg.moveTo(0, y);
      ctxg.lineTo(width, y);
      ctxg.stroke();
  }

  ctxg.closePath();
  return;
};

canvas.addEventListener('mousemove', function(e){
	let pos = {};
	let rect = canvas.getBoundingClientRect();
	let posOut = document.getElementById("cursor-pos");
	pos.x = Math.round((e.clientX - rect.left)/drawScale);
	pos.y = Math.round((e.clientY - rect.top)/drawScale);
	posOut.innerHTML = pos.x + ", " + pos.y;
});

let redraw = function() {
	ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
	ctx.strokeStyle = "#999";
	ctx.lineJoin = "round";
	ctx.lineWidth = 1;

	for (let i = 0; i < drawX.length; i++) {
		ctx.beginPath();
		if (drawDrag[i] && i) {
			ctx.moveTo(drawX[i - 1], drawY[i - 1]);
		} else {
			ctx.moveTo(drawX[i] - 1, drawY[i] - 1);
		}
		ctx.lineTo(drawX[i], drawY[i]);
		ctx.closePath();
		ctx.stroke();
	}
};

let frameDraw = function(frame) {
	let index;

	for (let y = 0; y < gridY; y++) {
		for (let x = 0; x < gridX; x++) {
			if (frame[y][x]) {
				index = (x + y * canvasWidth) * 4;
				canvasData.data[index + 0] = 0;
				canvasData.data[index + 1] = 0;
				canvasData.data[index + 2] = 0;
				canvasData.data[index + 3] = 255;
			} else {
				index = (x + y * canvasWidth) * 4;
				canvasData.data[index + 0] = 255;
				canvasData.data[index + 1] = 255;
				canvasData.data[index + 2] = 255;
				canvasData.data[index + 3] = 255;
			}
		}
	}
};

let floodfillDraw = function(x,y) {
	return new Promise(function(resolve, reject){
		setTimeout(function(){
			let index;
			let isUpdated = false;
			index = (x + y * canvasWidth) * 4;
			canvasData.data[index + 0] = 255;
			canvasData.data[index + 1] = 0;
			canvasData.data[index + 2] = 0;
			canvasData.data[index + 3] = 125;
			updateCanvas();
			if (canvasData.data[index + 1] === 0) {
				resolve({'x':x, 'y':y});
			} else {
				reject(Error("Error in floodfillDraw"));
			}
		}, 1);
	});
};

let updateCanvas = function() {
	ctx.putImageData(canvasData, 0,0);
};

let setStartingValues = function() {
	canvasWidth=document.getElementById("width").value;
	canvasHeight=document.getElementById("height").value;
	drawScale=document.getElementById("scale").value;
	choke=document.getElementById("choke").value;
	canvasData = ctx.getImageData(0,0,canvasWidth, canvasHeight);

	canvas.setAttribute("width", canvasWidth);
	canvas.setAttribute("height", canvasHeight);
	canvas.setAttribute("id", "canvas");
	canvas.setAttribute("style", "border-style:solid; border-width: 1px; image-rendering: pixelated;" +
		"width:" + Math.round(canvasWidth*drawScale) + "px; height:" + Math.round(canvasHeight*drawScale) + "px;");
	canvasDiv.appendChild(canvas);

	canvasGrid.setAttribute("width", canvasWidth*drawScale);
	canvasGrid.setAttribute("height", canvasHeight*drawScale);
	canvasGrid.setAttribute("id", "canvasGrid");
	canvasDiv.appendChild(canvasGrid);
	canvasGrid.setAttribute("style", "pointer-events: none; position:absolute;" +
		" top: " + (canvas.offsetTop + 1) + "px;" +
		" left: " + (canvas.offsetLeft + 1) + "px;");
	if (showGrid) drawGrid();
	gridY = canvasHeight;
	gridX = canvasWidth;
};

let togGrid = function() {
	showGrid = !showGrid;
	if (showGrid) {
		canvasGrid.style.display = '';
	} else {
		canvasGrid.style.display = 'none';
	}
};

window.onload = function(){
	setStartingValues ();
	clearFrame();
};
