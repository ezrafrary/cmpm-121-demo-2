import "./style.css";

const APP_NAME = "Ezra's game";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const titleText = document.createElement("h1");
titleText.innerHTML = `Ezra's Canvas`;
app.append(titleText);


const myCanvas = document.createElement("canvas");
myCanvas.id = "myCanvas";
app.append(myCanvas);

const ctx = myCanvas.getContext("2d");

if(ctx){

    ctx.strokeStyle = "black"; // Set the color for the strokes
    ctx.lineWidth = 2;         // Set the width of the line
    const cursor = { active: false, x: 0, y: 0 };

    myCanvas.addEventListener("mousedown", (e) => {
        cursor.active = true;
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    });

    myCanvas.addEventListener("mousemove", (e) => {
        if(cursor.active){
            ctx.beginPath();
            ctx.moveTo(cursor.x, cursor.y);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            cursor.x = e.offsetX;
            cursor.y = e.offsetY;
        }
    });

    myCanvas.addEventListener("mouseup", (e) => {
        cursor.active = false;
    });
}else{
    console.log("error");   
}


const clearbutton = document.createElement("button");
clearbutton.innerHTML = `clear`;
app.append(clearbutton);

clearbutton.onclick = () => {
    ctx?.clearRect(0, 0, myCanvas.width, myCanvas.height);
}




