// Physical Object Class
class player extends object {
    constructor (x=0, y=0, a=0) {
        super(object);
        this.objType = 'player';
        this.index = len(objects);
        this.id = idHighest++;
        this.x = x;
        this.y = y;
        this.a = a;
        this.velX = 0;
        this.velY = 0;
        this.velA = 0;
        this.oldX = this.x;
        this.oldY = this.y;
        this.oldA = this.a;
        this.size = 35;
        this.layers = [1, 1];
        this.zIndex = 0;
    };
    clone () {
        let toReturn = new player;
        toReturn.a = this.a;
        toReturn.oldA = this.oldA;
        return toReturn;
    };
    physicsStart () {
        // Inherited from Object parent class
        // Fix Velocity
        this.velX += this.x - this.oldX;
        this.velY += this.y - this.oldY;
        this.velA += this.a - this.oldA;
        // Collide
        this.collide();
        // Border
        if(dishShape == 'circle') {
            let a = pointTowards([this.y, this.x], [0, 0]);
            let d = distance([this.x, this.y], [0, 0]);
            let r = dishSize-this.size-dishThickness/2;
            if(d > r) {
                let velScaler = Math.sqrt(this.velX**2+this.velY**2);
                d = d - r;
                this.x += Math.cos(a) * d;
                this.y += Math.sin(a) * d;
                this.velX = velScaler * Math.cos(a);
                this.velY = velScaler * Math.sin(a);
                this.a = this.a + angleStuff(angleFix(pointTowards([this.oldY, this.oldX], [this.y, this.x])), angleMod(this.a)) * distance([this.oldX, this.oldY], [this.x, this.y])/100;
            };
        } else {
            let r = dishSize-this.size-dishThickness/2;
            if(Math.abs(this.x) > r) {
                this.x += this.x>=0?r-this.x:r*-1-this.x;
                this.velX *= -1;
            };
            if(Math.abs(this.y) > r) {
                this.y += this.y>=0?r-this.y:r*-1-this.y;
                this.velY *= -1;
            };
        };
        // Unique to Player class
        if(cam.target == this.id) {
            let force = {x: isKeyDown('d') - isKeyDown('a'), y: isKeyDown('s') - isKeyDown('w')};
            let velScaler = (force.x**2 + force.y**2)**0.5;
            if(velScaler != 0) {
                force.x = force.x / velScaler * 0.5;
                force.y = force.y / velScaler * 0.5;
            } else {
                force.x = 0;
                force.y = 0;
            };
            this.velX += force.x * timeScale;
            this.velY += force.y * timeScale;
        };
    };
    process () {
    };
    render () {
        circle(xToCam(this.x), yToCam(this.y), this.size*cam.zoom, 'rgb(200, 100, 100, 1.0)');
        circle(xToCam(this.x+this.size*0.5), yToCam(this.y+this.size*-0.25), this.size*0.3*cam.zoom, 'rgb(255, 255, 255, 1.0)');
        circle(xToCam(this.x+this.size*-0.5), yToCam(this.y+this.size*-0.25),this.size*0.3*cam.zoom, 'rgb(255, 255, 255, 1.0)');
        circle(xToCam(this.x+this.size*0.5), yToCam(this.y+this.size*-0.25), this.size*0.15*cam.zoom, 'rgb(55, 55, 55, 1.0)');
        circle(xToCam(this.x+this.size*-0.5), yToCam(this.y+this.size*-0.25),this.size*0.15*cam.zoom, 'rgb(55, 55, 55, 1.0)');
    };
};