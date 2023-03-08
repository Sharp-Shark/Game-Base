// Debugging
let debug = '';
function log(txt, breakLine=true, update=true, log2Console=false) {
	debug = debug + txt;
	if(breakLine) {debug = debug + '<br>';};
	if(update && HTMLconsoleVisible) {document.getElementById('debug').innerHTML = debug;};
	if(log2Console) {console.log(txt);};
};

// General functions
function range (start, end) {
    if(end <= 0) {
        return [];
    };
    return [...Array(end).keys()];
};
function len(array) {
    return array.length;
};

// Geometry and Math functions
function sort (array) {
    let originalLen = len(array);
    let sorted = array;
    let otherCount = 0;
    let count = 0;
    while(count < originalLen) {
        current = array[count];
        for(otherCount in array) {
            if(sorted[otherCount] >= current) {
                break;
            };
        };
        sorted.splice(count, 1);
        sorted.splice(otherCount, 0, current);
        count = parseInt(count) + 1;
    };
    return sorted;
};
function arrayAnd (arrA, arrB) {
    // Get Intersection
    let intersection = arrA.filter(x => arrB.includes(x));
    // Remove Repeats
    return [...new Set(intersection)];
};
function lerp (n, min=0, max=1) {
    return min*(1-n) + max*(n);
};
function invLerp (n, min=0, max=1) {
    return (n-min)/(max-min);
};
function average (array) {
    let toReturn = 0;
    for(let i in array) {
        toReturn = toReturn + parseInt(array[i]);
    };
    return toReturn/len(array);
};
function pointTowards (p1, p2) {
    // P1 is self, P2 is target.
    return Math.atan2( (p2[0] - p1[0]), (p2[1] - p1[1]) );
};
function distance (p1, p2) {
    // P1 is self, P2 is target.
    return Math.sqrt((p1[0] - p2[0])**2 + (p1[1]-p2[1])**2);
};
function angleFix (a) {
    // 180-180 to 360
    let toReturn = a%(Math.PI*2);
    if(toReturn < 0) {
        toReturn += (Math.PI*2);
    };
    return toReturn;
};
function angleMod (a) {
    return angleFix(pointTowards([0, 0], [Math.sin(a), Math.cos(a)]));
};
function angleStuff (a1, a2) {
    let toReturn = 0;
    let a360 = Math.PI*2;
    //let answers = [Math.abs((a1-a360)-a2), Math.abs(a1-(a2-a360))];
    if(Math.abs((a1-a360)-a2) < Math.abs(a1-a2)) {
        toReturn = (a1-a360)-a2;
    } else if(Math.abs(a1-(a2-a360)) < Math.abs(a1-a2)) {
        toReturn = a1 - (a2-a360);
    } else {
        toReturn = a1 - a2;
    };
    return toReturn;
};


// Console HTML DiV Element
let HTMLdivElement = `
		<div class="debug">
            eval(<input placeholder="insert code here..." id="cheatInput" onchange="eval(document.getElementById('cheatInput').value);document.getElementById('cheatInput').value='';"></input>);
			<pre id="debug"></pre>
		</div>
`;
let HTMLconsoleVisible = false;
// Screen Vars
let screen = document.getElementById('screen');
//screen.width = document.body.clientWidth;
//screen.height = document.body.clientHeight;
let screenWidth = screen.width;
let screenHeight = screen.height;
let screenX = screen.getBoundingClientRect().left;
let screenY = screen.getBoundingClientRect().top;
let ctx = screen.getContext("2d");
// FPS & Time Variables
let continueMainLoop = true;
let windowWasOutOfFocus = true;
let timeScale = 1;
let timeScaleMult = 1;
let FPS_average = 0;
let FPS_sample = [];
let lastTime = 0;
let frame = 0;
// Actual mouse
let mouse = {x: 0, y:0, offsetX: 0, offsetY: 0}
// Mouse from last frame
let oldMouse = {x: 0, y:0, offsetX: 0, offsetY: 0}
// Mouse with its x and y translated - camToX() & camToY()
let worldMouse = {x: 0, y:0, offsetX: 0, offsetY: 0}
// Mouse button pressed
let mouseState = 0;
// Used for selecting objects
let closestObjectToMouseDistance = -1;
let closestObjectToMouseId = -1;
// Keyboard vars
let kbKeys = {};
let paused = 0;
// Selection
let actionType = 'none';
let selected = -1;
let copyPaste = -1;
// Camera object
let cam = {x: 0, y: 0, zoom: 1, velX: 0, velY: 0, velZoom: 0, target: -1};
// Environment
let dishShape = !1?'circle':'square';
let dishSize = 400;
let dishThickness = dishSize/20;
// Objects
let objectIdIndex = {};
let objectIndexesToRemove = [];
let objectsToPush = [];
let objects = [];
let oldObjects = [];
let toRender = [];
let intersections = [];
let idHighest = 0;
// Elements
let elements = [];
// Settings
let noSweepNPrune = 1;
let cheats = true;

// Drawing/screen functions
function resizeCanvas () {
    let WHICH = 2;
    if(WHICH == 1) {
        screen.width = HTMLconsoleVisible?800:document.body.clientWidth;
        screen.height = HTMLconsoleVisible?450:document.body.clientHeight;
    } else if(WHICH == 2) {
        screen.width = HTMLconsoleVisible?800:document.documentElement.clientWidth - 4;
        screen.height = HTMLconsoleVisible?450:document.documentElement.clientHeight - 4;
    } else if(WHICH == 3) {
        screen.width = HTMLconsoleVisible?800:window.innerWidth;
        screen.height = HTMLconsoleVisible?450:window.innerHeight;
    };
    screenWidth = screen.width;
    screenHeight = screen.height;
    document.getElementById('debugdiv').innerHTML = HTMLconsoleVisible?HTMLdivElement:'';
};

function circle (x, y, radius, color=null) {
    ctx.beginPath();
    if(color != null) {
        ctx.fillStyle = color;
    };
    ctx.arc(x, y, radius, 0, Math.PI*2);
    ctx.fill();
};

function xyToCam (x, y) {
    return [(x-cam.x)*cam.zoom, (y-cam.y)*cam.zoom];
};

function xToCam (x) {
    return ((x-cam.x)*cam.zoom) + screenWidth/2;
};

function yToCam (y) {
    return ((y-cam.y)*cam.zoom) + screenHeight/2;
};

function camToX (x) {
    return (((x - screenWidth/2)/cam.zoom)+cam.x);
};

function camToY (y) {
    return (((y - screenHeight/2)/cam.zoom)+cam.y);
};

function clearScreen () {
    ctx.clearRect(0, 0, screen.width, screen.height);
    ctx.beginPath();
};

function report () {
    log("Unoptimized: " + (len(objects)**2));
    n = 0;
    for(i in intersections) {
        n += (len(intersections[i])**2);
    };
    log("Sweep n' Prune: " + n);
    log("Reality: " + len(objects));
    log("Equivalent: " + Math.round(Math.sqrt(n)));
    log("Improvement: " + Math.round( ( 1 - ( n / len(objects)**2 ) ) * 1000 )/10 + '%');
};

// Misc Functions
function updateObjectIdIndex () {
    objectIdIndex = {};
    for(let countObject in objects) {
        objects[countObject].index = parseInt(countObject);
        objectIdIndex[objects[countObject].id] = objects[countObject].index;
    };
};
function resetSelected () {
    // Reset Selection Vars
    actionType = 'none';
    selected = -1;
    closestObjectToMouseId = -1;
    // Reset Mouse Offset
    mouse.offsetX = 0;
    mouse.offsetY = 0;
};
function isKeyDown (k) {
    if(!(k in kbKeys)) {
        kbKeys[k] = 0;
    };
    return kbKeys[k];
};
function updateMouse (event) {
    screenX = screen.getBoundingClientRect().left;
    screenY = screen.getBoundingClientRect().top;
    mouse.x = event.clientX - screenX;
    mouse.y = event.clientY - screenY;
};
function findElement (label) {
    for(let countElement in elements) {
        if(elements[countElement].label == label) {
            return countElement;
        };
    };
};

// Main Loop Function
function main (time) {
    // Keep FPS at ~75
    if(time - lastTime <= 12) {
        requestAnimationFrame(main);
        return;
    };
    // FPS and Delta Time
    if(windowWasOutOfFocus) {
        timeScale /= timeScaleMult;
        windowWasOutOfFocus = false;
    } else {
        timeScale = 60/(1/(time - lastTime)*1000);
    };
    FPS_sample.push(time - lastTime);
    lastTime = time;
    if(len(FPS_sample)>29) {
        FPS_average = 1/(average(FPS_sample)/1000);
        FPS_sample = [];
    };
    // Debug Clear
    debug = '';
    // If Selected Object Doesn't Exist, Unselect
    if(selected != -1 && objects[objectIdIndex[selected]] == undefined) {resetSelected();};
    if(cam.target != -1 && objects[objectIdIndex[cam.target]] == undefined) {cam.target = -1;};
    // Camera targetting
    if(cam.target != -1) {
        // Smoothly follow target
        cam.x += (objects[objectIdIndex[cam.target]].x - cam.x) / 20;
        cam.y += (objects[objectIdIndex[cam.target]].y - cam.y) / 20;
        cam.zoom += (100/objects[objectIdIndex[cam.target]].size/lerp((objects[objectIdIndex[cam.target]].velX**2 + objects[objectIdIndex[cam.target]].velY**2)**0.5/200, 1, 4) - cam.zoom) / 20;
    };
    // Mouse Position Translated into World Position
    worldMouse.x = camToX(mouse.x);
    worldMouse.y = camToY(mouse.y);
    // Stops panning Panning
    if(actionType != 'pan' || cam.target != -1) {
        // Stops panning if targeting or not panning
        oldMouse.x = worldMouse.x;
        oldMouse.y = worldMouse.y;
    };
    // Cam keyboard controls
    if(cam.target == -1) {
        // Keyboard Cam Zoom
        cam.velZoom += (cam.zoom/200) * (isKeyDown('q') - isKeyDown('e'));
        // Keyboard Cam Movement
        if(actionType != 'pan') {
            cam.velX += (2/cam.zoom) * (isKeyDown('d') - isKeyDown('a'));
            cam.velY += (2/cam.zoom) * (isKeyDown('s') - isKeyDown('w'));
        };
    };
    // Add Zoom Velocty
    cam.zoom += cam.velZoom * timeScale;
    // Cap cam.zoom
    cam.zoom = Math.max(Math.min(cam.zoom, 20), 0.2);
    // Camera Panning
    cam.x = oldMouse.x - ((mouse.x - screenWidth/2)/cam.zoom);
    cam.y =  oldMouse.y - ((mouse.y - screenHeight/2)/cam.zoom);
    //  Add Camera Velocity
    cam.x += cam.velX * timeScale;
    cam.y += cam.velY * timeScale;
    // Apply Friction
    cam.velZoom = cam.velZoom / 1.2 ** timeScale;
    cam.velX = cam.velX / 1.2 ** timeScale;
    cam.velY = cam.velY / 1.2 ** timeScale;

    // Apply Timescale Multiplier
    timeScale *= timeScaleMult

    // Clear Screen
    toRender = [];
    clearScreen();

    // Dot at (0, 0)
    circle(xToCam(0), yToCam(0), 5*cam.zoom, 'grey');

    // Actions
    if(mouseState && actionType == 'none') {
        if(closestObjectToMouseId != -1) {
            selected = closestObjectToMouseId;
            mouse.offsetX = worldMouse.x - objects[objectIdIndex[selected]].x;
            mouse.offsetY = worldMouse.y - objects[objectIdIndex[selected]].y;
            actionType = 'grab';
        } else {
            if(cam.target == -1) {
                actionType = 'pan';
            };
        };
    } else if(actionType == 'grab' && cheats) {

        objects[objectIdIndex[selected]].size = Math.max(Math.min(objects[objectIdIndex[selected]].size+(isKeyDown('f')-isKeyDown('g'))*2, dishSize*0.8), 10);
        let d = distance([0, 0], [mouse.offsetX, mouse.offsetY]) - objects[objectIdIndex[selected]].size;
        if(d > 0) {
            mouse.offsetX -= Math.cos(pointTowards([0, 0], [mouse.offsetY, mouse.offsetX])) * d;
            mouse.offsetY -= Math.sin(pointTowards([0, 0], [mouse.offsetY, mouse.offsetX])) * d;
        };
        objects[objectIdIndex[selected]].x += (worldMouse.x - mouse.offsetX - objects[objectIdIndex[selected]].x)/10;
        objects[objectIdIndex[selected]].y += (worldMouse.y - mouse.offsetY - objects[objectIdIndex[selected]].y)/10;
        if(paused) {
            objects[objectIdIndex[selected]].oldX = objects[objectIdIndex[selected]].x;
            objects[objectIdIndex[selected]].oldY = objects[objectIdIndex[selected]].y;
        };
        if(objects[objectIdIndex[selected]].size <= 0) {
            objects[objectIdIndex[selected]].die();
        };
    } else if(actionType == 'flick') {
        objects[objectIdIndex[selected]].velX = 0;
        objects[objectIdIndex[selected]].velY = 0;
        if(!isKeyDown('n')) {
            objects[objectIdIndex[selected]].velX += (objects[objectIdIndex[selected]].x - worldMouse.x)/5;
            objects[objectIdIndex[selected]].velY += (objects[objectIdIndex[selected]].y - worldMouse.y)/5;
            actionType = 'wait';
            selected = -1;
        };
    };
    closestObjectToMouseId = -1;
    closestObjectToMouseDistance = -1;

    // Make Inside of Petridish White
    if(dishShape == 'circle') {
        circle(xToCam(0), yToCam(0), dishSize*cam.zoom, 'white')
    } else {
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.fillRect(xToCam(0-dishSize), yToCam(0-dishSize), dishSize*2*cam.zoom, dishSize*2*cam.zoom)
    };

    // Objects
    objects.sort(function(a, b) {
        return a.x - b.x;
    });
    updateObjectIdIndex();
    oldObjects = structuredClone(objects);
    let leftMost = 0;
    let rightMost = 0;
    // Sweep N' Prune by Finding X Axis Intersections
    intersections = [[]];
    for(let countObject in objects) {
        if(!objects[countObject].layers.includes(1)) {
            intersections[0].push([countObject]);
            continue;
        };
        // Current Object X Position
        let x = objects[countObject].x;
        // Current Object Radius
        let size = objects[countObject].size;
        if(len(intersections) == 0) {
            intersections.push([countObject]);
            leftMost = x - size;
            rightMost = x + size;
            continue;
        };
        if(x + size >= leftMost &&
        x - size <= rightMost) {
            intersections[len(intersections)-1].push(countObject);
            if(x - size < leftMost) {
                leftMost = x - size;
            };
            if(x + size > rightMost) {
                rightMost = x + size;
            };
        } else {
            intersections.push([countObject]);
            leftMost = x - size;
            rightMost = x + size;
        };
    };
    // Physics Initial Step
    for(let countObject in objects) {
        if(!paused) {objects[countObject].physicsStart();};
    };
    // Physics Final Step
    for(let countObject in objects) {
        if(!paused) {objects[countObject].physicsEnd();};
    };
    // Non-Physics Related Logic
    for(let countObject in objects) {
        if(!paused) {
            try {
                objects[countObject].process();
            } catch {
                objects[countObject].output = '!!!';
            };
        };
    };
    // Rendering
    for(let countObject in objects) {
        while(objects[countObject].zIndex > len(toRender)-1) {
            toRender.push([]);
        };
        toRender[objects[countObject].zIndex].push(objects[countObject]);
        objects[countObject].updateClosestObjectToMouse();
    };
    toRender.reverse();
    for(let countLayer in toRender) {
        for(let countObject in toRender[countLayer]) {
            toRender[countLayer][countObject].render();
        };
    };
    // Objects to Remove
    while(len(objectIndexesToRemove) > 0) {
        // Update Other Object's ID
        if(selected == objects[objectIndexesToRemove[0]].id) {
            resetSelected();
            actionType = 'wait';
        };
        if(cam.target == objects[objectIndexesToRemove[0]].id) {
            cam.target = -1;
        };
        for(let objectIndexToRemoveCount in objectIndexesToRemove) {
            if(objectIndexesToRemove[objectIndexToRemoveCount] > objectIndexesToRemove[0]) {
                objectIndexesToRemove[objectIndexToRemoveCount] -= 1;
            };
        };
        // Remove Object
        objects.splice(objectIndexesToRemove[0], 1);
        // "Increment" "Counter"
        objectIndexesToRemove.shift()
    };
    updateObjectIdIndex();

    // World Border
    if(dishShape == 'circle') {
        ctx.beginPath();
        ctx.strokeStyle = 'grey';
        ctx.lineWidth = dishThickness*cam.zoom;
        ctx.arc(xToCam(0), yToCam(0), dishSize*cam.zoom, 0, Math.PI*2);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.strokeStyle = 'grey';
        ctx.lineWidth = dishThickness*cam.zoom;
        ctx.strokeRect(xToCam(0-dishSize), yToCam(0-dishSize), dishSize*2*cam.zoom, dishSize*2*cam.zoom);
    };

    // Outline for grabbed Object
    if(actionType == 'grab') {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.arc(xToCam(objects[objectIdIndex[selected]].x), yToCam(objects[objectIdIndex[selected]].y), objects[objectIdIndex[selected]].size*cam.zoom+5, 0, Math.PI*2);
        ctx.stroke();
    } else if(actionType == 'flick') {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 10*cam.zoom;
        ctx.strokeStyle = 'rgb(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(xToCam(objects[objectIdIndex[selected]].x), yToCam(objects[objectIdIndex[selected]].y))
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
    } else if(actionType == 'pan') {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI*2);
        ctx.stroke();
    };
    // Outline for targeted Object
    if(cam.target != -1 && cheats) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        for(let i = 0; i < 30; i++) {
            ctx.beginPath();
            ctx.arc(xToCam(objects[objectIdIndex[cam.target]].x), yToCam(objects[objectIdIndex[cam.target]].y), objects[objectIdIndex[cam.target]].size*cam.zoom+8, Math.PI/8*i-Math.PI/32, Math.PI/8*i+Math.PI/32);
            ctx.stroke();
        };
    };

    // Cursor
    if(selected == -1) {circle(mouse.x, mouse.y, 5, 'black');};

    // Physical Text
    ctx.fillStyle = 'black';
    ctx.font = (24*cam.zoom)+'px "Lucida Console", "Courier New", monospace';
    ctx.textAlign = 'left';
    // Show Info about Selected Object
    if(selected != -1) {
        // Info for Objects
        ctx.fillText('Type '+objects[objectIdIndex[selected]].objType, xToCam(objects[objectIdIndex[selected]].x+objects[objectIdIndex[selected]].size+10), yToCam(objects[objectIdIndex[selected]].y+(25*-0.25)));
        ctx.fillText('Size '+Math.round(objects[objectIdIndex[selected]].size*10)/10, xToCam(objects[objectIdIndex[selected]].x+objects[objectIdIndex[selected]].size+10), yToCam(objects[objectIdIndex[selected]].y+(25*0.75)));
    };
    // Display Copied Object
    if(copyPaste != -1 && (isKeyDown('c') || isKeyDown('v')) && cheats) {
        // Set copyPaste Pos to Mouse Po
        copyPaste.x = worldMouse.x;
        copyPaste.y = worldMouse.y;
        // Render copyPaste
        copyPaste.render();
        // Render Outline
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.arc(xToCam(copyPaste.x), yToCam(copyPaste.y), copyPaste.size*cam.zoom+5, 0, Math.PI*2);
        ctx.stroke();
    };

    // GUI Text
    ctx.fillStyle = 'black';
    ctx.font = '24px "Lucida Console", "Courier New", monospace';
    // Paused
    ctx.textAlign = 'center';
    ctx.font = '48px "Lucida Console", "Courier New", monospace';
    ctx.fillText(paused?'PAUSED':'', screenWidth/2, screenHeight/2);

    // Update Text from GUI Element "info"
    elements[findElement('info')].x = 10 + elements[findElement('info')].width/2;
    elements[findElement('info')].y = 10 + elements[findElement('info')].height/2;
    elements[findElement('info')].txt[1] = noSweepNPrune?'Unoptimized':'Sweep&Prune';
    elements[findElement('info')].txt[2] = cheats?'Cheats On':'No Cheats';
    elements[findElement('info')].txt[3] = actionType;
    elements[findElement('info')].txt[4] = Math.round(FPS_average);
    elements[findElement('info')].height = paused?180:130;
    elements[findElement('mapSize')].hide = !paused;
    dishSize = lerp(elements[findElement('mapSize')].slidePos, elements[findElement('mapSize')].slideMin, elements[findElement('mapSize')].slideMax);

    elements[findElement('helpEng')].hide = elements[findElement('help')].hide;
    elements[findElement('helpPTBR')].hide = elements[findElement('help')].hide;
    if(!elements[findElement('help')].hide) {
        // Help Bg
        elements[findElement('help')].x = screenWidth/2;
        elements[findElement('help')].y = screenHeight/2;
        elements[findElement('help')].width = screenWidth - 10;
        elements[findElement('help')].height = screenHeight - 10;
        // Help English
        elements[findElement('helpEng')].x = screenWidth * 1/4;
        elements[findElement('helpEng')].y = screenHeight/2;
        elements[findElement('helpEng')].width = screenWidth/2;
        elements[findElement('helpEng')].height = screenHeight;
        // Help2 PT-BR
        elements[findElement('helpPTBR')].x = screenWidth * 3/4;
        elements[findElement('helpPTBR')].y = screenHeight/2;
        elements[findElement('helpPTBR')].width = screenWidth/2;
        elements[findElement('helpPTBR')].height = screenHeight;
    };

    for(let countElement in elements) {
        elements[countElement].tick();
    };

    frame += 1;
    frame = frame * (frame < 9999);

    screenWidth = screen.width;
    screenHeight = screen.height;

    report();
    if(isKeyDown('r')) {
        objects.push(new object(15, 15));
        objects[len(objects)-1].size = 75;
    };

    if(continueMainLoop) {
        requestAnimationFrame(main);
    };
};

// User Input
window.addEventListener('click', (event) => {
});

window.addEventListener('contextmenu', (event) => {
});

window.addEventListener('keypress', (event) => {
});

window.onresize = () => {
    resizeCanvas();
};

window.addEventListener('keydown', (event) => {
    if(event.code == 'Space' && !isKeyDown('Space')) {
        paused = !paused;
    };
    if (event.key == 'z' && !isKeyDown('z') && cheats) {
        cam.target = -1;
        resetSelected();
        objects = [];
    };
    if(event.key == 'x' && selected != -1 && !isKeyDown('x') && cheats) {
        objects[objectIdIndex[selected]].die();
    };
    if(event.key == 'c' && selected != -1 && !isKeyDown('c') && cheats) {
        copyPaste = objects[objectIdIndex[selected]].clone();
    };
    if(event.key == 'v' && copyPaste != -1 && !isKeyDown('v') && cheats) {
        copyPaste.index = len(objects)-1;
        copyPaste.x = worldMouse.x;
        copyPaste.y = worldMouse.y;
        copyPaste.oldX = copyPaste.x;
        copyPaste.oldY = copyPaste.y;
        objects.push(copyPaste);
        copyPaste = copyPaste.clone();
    };
    if(event.key == 'b' && !isKeyDown('b')) {
        cam.x = 0; cam.y = 0; cam.zoom = 1;
    };
    if(event.key == '1' && !isKeyDown('1') && cheats) {
        objects.push(new object(worldMouse.x, worldMouse.y));
    };
    if(event.key == '2' && !isKeyDown('2') && cheats) {
        objects.push(new player(worldMouse.x, worldMouse.y));
    };
    if(event.key == 'n' && !isKeyDown('n') && actionType=='grab' && cheats) {
        actionType = 'flick';
    };
    if(event.key == 'h' && !isKeyDown('h')) {
        elements[findElement('help')].hide = !elements[findElement('help')].hide;
    };
    if(event.key == '0' && !isKeyDown('0') && cheats) {
        HTMLconsoleVisible = !HTMLconsoleVisible;
        resizeCanvas();
    };
    if(event.key == 'j' && !isKeyDown('j')) {
        cheats = !cheats;
    };
    if(event.key == 't' && !isKeyDown('t') && cheats) {
        
        if(cam.target == closestObjectToMouseId) {
            cam.target = -1;
        } else {
            cam.target = closestObjectToMouseId;
        };
    };
    // Update kbKeys
    if(event.code == 'Space') {
        kbKeys['space'] = 1;
    };
    kbKeys[event.key] = 1;
});

window.addEventListener('keyup', (event) => {
    if(event.code == 'Space') {
        kbKeys['space'] = 0;
    };
    kbKeys[event.key] = 0;
});

window.addEventListener('wheel', (event) => {
    if(cam.target == -1) {
        cam.velZoom += (cam.zoom/200) * event.deltaY * -0.02;
    };

    updateMouse(event);
});

window.addEventListener('mousemove', (event) => {
    updateMouse(event);
});

window.addEventListener('mousedown', (event) => {
    mouseState = 1;
    // Iterate over Elements in Reverse Order
    for(let countElement in elements) {
        currentElement = elements[len(elements)-countElement-1];
        if(currentElement.isMouseOver() && currentElement.clickable && !currentElement.hide && actionType == 'none') {
            currentElement.clicked = 1;
            currentElement.onClick();
            actionType = 'wait';
        };
    };

    updateMouse(event);
});

window.addEventListener('mouseup', (event) => {
    mouseState = 0;
    resetSelected();
    // Iterate over Elements
    for(let countElement in elements) {
        if(elements[countElement].isMouseOver() && elements[countElement].clicked && elements[countElement].clickable) {
            elements[countElement].clicked = 0;
            elements[countElement].onRelease();
        }
    };

    updateMouse(event);
});

window.addEventListener("visibilitychange", (event) => {
    if(document.hidden) {
        continueMainLoop = false;
    } else {
        continueMainLoop = true;
        windowWasOutOfFocus = true;
        requestAnimationFrame(main);
    };
});

// Info Button Element
elements.push(new button('info', 10, 10, 280, 130));
elements[len(elements)-1].color = 'rgb(200, 200, 200, 0.5)';
elements[len(elements)-1].align = 'topleft';
elements[len(elements)-1].txt = ['Click for Help Menu', 'Sweep&Prune', 'Cheats On', 'none', 0];
elements[len(elements)-1].txtAlign = 'left';
elements[len(elements)-1].padding = 20;
elements[len(elements)-1].onClick = function () {
    //tutorialPopup();
    elements[findElement('help')].hide = !elements[findElement('help')].hide;
};

// Size Slider Element
elements.push(new slider('mapSize', 265/2 + 15, 170, 265, 25));
elements[len(elements)-1].align = 'abovecenter';
elements[len(elements)-1].txt = ['Map Size'];
elements[len(elements)-1].slideMin = 200;
elements[len(elements)-1].slideMax = 800;
elements[len(elements)-1].slidePos = invLerp(dishSize, elements[len(elements)-1].slideMin, elements[len(elements)-1].slideMax);
elements[len(elements)-1].setSnapInterval(25);

// Help Element
elements.push(new element('help', screenWidth/2, screenHeight/2, screenWidth, screenHeight));
elements[len(elements)-1].color = 'black';
elements[len(elements)-1].txtColor = 'white';
elements[len(elements)-1].txt = [];
elements[len(elements)-1].clickable = true;
elements[len(elements)-1].hide = true;
elements[len(elements)-1].padding = 20;
elements[len(elements)-1].onClick = function () {
    this.hide = true;
};

// Help Engish Element
elements.push(new element('helpEng', screenWidth * 1/4, screenHeight/2, screenWidth/2, screenHeight));
elements[len(elements)-1].color = 'rgb(0, 0 , 0, 0)';
elements[len(elements)-1].txtColor = 'white';
elements[len(elements)-1].align = 'centerright';
elements[len(elements)-1].txtAlign = 'right';
elements[len(elements)-1].txt = [
'|| Welcome to Game -',
'WASD to Move Camera -',
'Space to Pause -',
'Mouse to Grab -',
'Q and E to Zoom -',
'Z to Remove All -',
'X to Delete Selected -',
'C to Copy Selected -',
'V to Paste Copy -',
'B to Reset Camera -',
'N for continuous Slider -',
'T to Control/Spectate -',
'1 to Spawn Object -',
'2 to Spawn Player -',
'H for Help Menu -',
'J to Toggle Cheats -',
'0 for Fullscreen -'
];

// Help PT-BR Element
elements.push(new element('helpPTBR', screenWidth * 3/4, screenHeight/2, screenWidth/2, screenHeight));
elements[len(elements)-1].color = 'rgb(0, 0 , 0, 0)';
elements[len(elements)-1].txtColor = 'white';
elements[len(elements)-1].align = 'centerleft';
elements[len(elements)-1].txtAlign = 'left';
elements[len(elements)-1].txt = [
'- Bem Vindo a Jogo ||',
'- WASD para Mover a Camera',
'- Espaço para Pausar',
'- Mouse para Segurar',
'- Q e E para Zoom',
'- Z para Remover Tudo',
'- X para Deletar Selecionado',
'- C para Copiar Selecionado',
'- V para Colar Copia',
'- B para Resetar a Camera',
'- N para Slider Continuo',
'- T para Controlar/Espectar',
'- 1 para Spawnar Objeto',
'- 2 para SpawnarJogador',
'- H para Menu de Ajuda',
'- J para Ativar/Desativar Trapaças',
'- 0 para Tela Cheia'
];

// Pre-Loop
resizeCanvas();
HTMLconsoleVisible = !true;

// Setup world
cheats = true;

if(!cheats) {
    objects.push(new object(15, 15));
    objects[len(objects)-1].size = 75;

    objects.push(new object(-15, 15));
    objects[len(objects)-1].size = 50;

    objects.push(new object(15, -15));
    objects[len(objects)-1].size = 25;

    objects.push(new player(-15, -15));

    elements[findElement('help')].hide = false;
};

// Loop
requestAnimationFrame(main);

/*
TO-DO LIST
    -Implement Quadtrees
*/