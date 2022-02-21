const canvas = document.getElementById("cw");
const context = canvas.getContext("2d");
let particlesArray = [];

const cursor = {
    x: innerWidth / 2,
    y: innerHeight / 2,
};

const nP = 1000
const dt = 0.7
const dthmax = 0.2
const edgeWidth = 0.2
const darkFillStyle = "rgba(0,0,0,1.000)"
const lightFillStyle = "rgba(255,255,255,0.050)"
const alpha = 10
const overscan = 20

let lastTouch = new Date().getTime();
let mouseDown = false
let lightBG = false
let bgFillStyle = darkFillStyle
let showGuide = false

function toggleBG() {
    if (lightBG) {
        lightBG = false
        // document.body.style.backgroundColor = "black";
        bgFillStyle = darkFillStyle
    }
    else {
        lightBG = true
        // document.body.style.backgroundColor = "white";
        bgFillStyle = lightFillStyle
    }
}


class Particle {
    constructor() {
        this.V=Math.random()*5+2
        this.theta=Math.random()*2*Math.PI
        this.x = cursor.x + randn_bm() * 100;
        this.y = cursor.y + randn_bm() * 100;
        this.u = this.V*Math.sin(this.theta);
        this.v = this.V*Math.cos(this.theta);
        this.size = 20;
        this.alpha = alpha * Math.PI / 180;
        this.fillColor = 0;
        this.theta = Math.atan2(this.v,this.u);
    }

    updateVelocityComponents(){
        this.u = this.V * Math.sin(this.theta);
        this.v = this.V * Math.cos(this.theta);
    }

    move()  {
        this.x = this.x + this.u * dt;
        this.y = this.y + this.v * dt;
        this.theta = Math.atan2(this.u,this.v)
    }

    draw() {
        let L=this.size
        let a=this.alpha
        let th=this.theta
        context.beginPath();
        context.fillStyle = this.fillColor;
        context.moveTo(this.x, this.y);
        context.lineTo(this.x - L*Math.sin(th-a), this.y - L*Math.cos(th-a));
        context.lineTo(this.x - L*Math.sin(th+a), this.y - L*Math.cos(th+a));
        context.fill();
    }

    periodicUD() {
        if (this.y > innerHeight + overscan) {
            this.y = this.y - innerHeight - overscan
        }
        if (this.y < 0 - overscan) {
            this.y = this.y + innerHeight + overscan
        }
    }

    periodicLR() {
        if (this.x > innerWidth + overscan) {
            this.x = this.x - innerWidth - overscan
        }
        if (this.x < 0 - overscan) {
            this.x = this.x + innerWidth + overscan
        }
    }

    turnTowards(targetDir){
        this.theta=this.theta-(this.theta-targetDir)*0.05
        this.updateVelocityComponents()
    }
   
    detectEdgeRotate() {
        let x = this.x
        let y = this.y
        let x2 = this.u
        let y2 = this.v
        let x1 = innerWidth/2-x
        let y1 = innerHeight/2-y

        if ( 
            x > innerWidth * (1 - edgeWidth) ||  
            x < innerWidth * edgeWidth || 
            y > innerHeight * (1 - edgeWidth) || 
            y < innerHeight * edgeWidth
            ) 
        {
            let Dth=Math.atan2(x1*y2-y1*x2,x1*x2+y1*y2)
            let dth=0.01*Dth
            if (Math.abs(dth) > dthmax) {
                // console.log('exceed!')
                dth=dthmax*Math.sign(dth)
            }
            this.theta=this.theta+dth
            this.u = this.V*Math.sin(this.theta);
            this.v = this.V*Math.cos(this.theta);
        }
}
    trackCursor() {
        let x2 = this.u
        let y2 = this.v
        let x1 = cursor.x-this.x
        let y1 = cursor.y-this.y
        let dth=Math.atan2(x1*y2-y1*x2,x1*x2+y1*y2)
        this.theta=this.theta+dth*0.03
        this.u = this.V*Math.sin(this.theta);
        this.v = this.V*Math.cos(this.theta);
    }
    scatter() {
        this.theta=Math.random()*2*Math.PI
        this.u = this.V*Math.sin(this.theta);
        this.v = this.V*Math.cos(this.theta);
    }
    setColor(newColor) {
        this.fillColor=newColor
    }
}

function generateParticles(amount) {
    for (let i = 0; i < amount; i++) {
        particlesArray[i] = new Particle();
    }
}
function generateHSLColor(hueWidth, hueStart, valueWidth, valueStart) {
    // return 'hsl(' + Math.random()*360 + ' , 100%, 50%)';
    let colorString = 'hsl(' + (Math.random() * hueWidth + hueStart) + ' , 100%, ' + (Math.random() ** 2 * valueWidth + valueStart) + '%)'
    // console.log(colorString)
    return colorString;
}

function setColors() {
    let hueWidth = Math.random() ** 2 * 360
    let hueStart = Math.random() * 360
    let valueStart = 50 + Math.random() ** 2 * 50
    let valueWidth = Math.random() ** 2 * 50
    particlesArray.forEach((particle) => particle.setColor(
        generateHSLColor(hueWidth, hueStart, valueWidth, valueStart)))
}

function setSize() {
    canvas.height = innerHeight;
    canvas.width = innerWidth;
}

// Standard Normal variate using Box-Muller transform.
function randn_bm() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function anim() {
    requestAnimationFrame(anim);
    context.fillStyle = bgFillStyle;
    context.fillRect(0, 0, canvas.width, canvas.height);

    particlesArray.forEach((particle) => particle.move())
    particlesArray.forEach((particle) => particle.draw())
    particlesArray.forEach((particle) => particle.periodicUD())
    particlesArray.forEach((particle) => particle.periodicLR())
    particlesArray.forEach((particle) => particle.turnTowards(0))
    // console.log(particlesArray[0].theta)
    // particlesArray.forEach((particle) => particle.detectEdgeRotate())
    if (mouseDown) {
        let now = new Date().getTime();
        if (now - lastTouch > 300) {
            particlesArray.forEach((particle) => particle.trackCursor())
        }
    }
    if (showGuide){
        drawGuide()
    }
}

addEventListener('mousedown', e => {
    showGuide = false
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    mouseDown = true;
    noDouble = false;
    lastTouch = new Date().getTime();
});
  
addEventListener('mousemove', e => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    x = e.offsetX;
    y = e.offsetY;
});
  
addEventListener('mouseup', e => {
    mouseDown = false;
});

addEventListener('dblclick', e => {
   
    if (e.offsetY < innerHeight / 4 & e.offsetX > 3*innerWidth/4) {
       setColors()
    } else if (e.offsetY < innerHeight / 4 & e.offsetX < 1 * innerWidth / 4){
        toggleBG()
    }
     else {
        particlesArray.forEach((particle) => particle.scatter())    
    }

});

addEventListener(
    "touchstart",
    (e) => {
        e.preventDefault();
        let now = new Date().getTime();
        let timeSince = now - lastTouch;
 
        if (timeSince < 300) { 
            //double touch
            if (e.touches[0].clientX > innerWidth * 0.75 && e.touches[0].clientY < innerHeight * 0.25){   
                setColors()
            }
            else if (e.touches[0].clientX < innerWidth * 0.25 && e.touches[0].clientY < innerHeight * 0.25){
                toggleBG()
            }
            
            else{
                particlesArray.forEach((particle) => particle.scatter()) 
            }
            
        }
        showGuide=false
        lastTouch = new Date().getTime()
        cursor.x = e.touches[0].clientX;
        cursor.y = e.touches[0].clientY;
        mouseDown = true;
    },
    { passive: false }
);

addEventListener(
    "touchmove",
    (e) => {
        e.preventDefault();
        cursor.x = e.touches[0].clientX;
        cursor.y = e.touches[0].clientY;
    },
    { passive: false }
);

addEventListener(
    "touchend",
    (e) => {
        e.preventDefault();
        mouseDown = false;
    },
    { passive: false }
);

addEventListener("resize", () => setSize());

// function drawGuide(){
//     context.beginPath()

//     context.moveTo(innerWidth / 4, 0)
//     context.lineTo(innerWidth / 4, innerHeight /4)
//     context.lineTo(0, innerHeight / 4)

//     context.moveTo(3*innerWidth / 4, 0)
//     context.lineTo(3*innerWidth / 4, innerHeight / 4)
//     context.lineTo(innerWidth, innerHeight / 4)
//     context.font = '48px sans-serif';
//     context.textAlign = 'center'
//     context.textBaseline = 'middle'
//     context.strokeStyle = '#ffffff'
//     context.fillStyle = '#ffffff'
//     context.fillText('Double-tap', innerWidth/2, innerHeight*5/16);
//     context.fillText('Touch + hold', innerWidth / 2, innerHeight * 13 / 16);
//     context.lineWidth = 3
//     context.strokeStyle = '#ffffff'
//     context.setLineDash([10])
//     context.stroke()
// }

generateParticles(nP);
setColors()
setSize();
context.fillStyle = lightFillStyle;
context.fillRect(0, 0, canvas.width, canvas.height);
anim();