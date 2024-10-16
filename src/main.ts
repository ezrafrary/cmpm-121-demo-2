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



