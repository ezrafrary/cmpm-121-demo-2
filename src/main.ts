import "./style.css";

const APP_NAME = "Ezra's game";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const titleText = document.createElement("h1");
titleText.innerHTML = `Ezra's Canvas`;
app.append(titleText);

const myCanvas = document.createElement("canvas");
myCanvas.id = "myCanvas";

// Set explicit dimensions for the canvas
myCanvas.width = 300;
myCanvas.height = 256;
app.append(myCanvas);

const ctx = myCanvas.getContext("2d");

// Array to store strokes, now includes line width
const strokes: { points: { x: number; y: number }[]; lineWidth: number }[] = [];
let activeStroke: { points: { x: number; y: number }[]; lineWidth: number } | null = null;

// Add a undoneStrokes to store undone actions
const undoneStrokes: { points: { x: number; y: number }[]; lineWidth: number }[] = [];

// Array to track stickers
const stickers: { emoji: string; x: number; y: number; rotation: number }[] = [];

// Track whether the sticker tool is active
let isStickerToolActive = false;
let selectedEmoji = "😊"; // Default emoji


// Create a centralized event dispatcher
const eventDispatcher = document.createElement("div");

// Emoji Preview Element
const stickerPreview = document.createElement("div");
stickerPreview.style.position = "absolute";
stickerPreview.style.pointerEvents = "none"; // Ensure it doesn't interfere with mouse events
stickerPreview.style.fontSize = "24px"; // Match the emoji font size
stickerPreview.style.opacity = "0"; // Start hidden
stickerPreview.innerHTML = selectedEmoji;
document.body.append(stickerPreview);


if (ctx) {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  myCanvas.addEventListener("mousedown", (e) => {
    if (!isStickerToolActive) {
      // Start a new stroke if not in sticker mode
      activeStroke = { points: [], lineWidth: ctx.lineWidth };
      strokes.push(activeStroke);

      const startEvent = new CustomEvent("canvasStrokeStart", {
        detail: { x: e.offsetX, y: e.offsetY },
      });
      eventDispatcher.dispatchEvent(startEvent);
    }
  });

  myCanvas.addEventListener("mousemove", (e) => {
    if (e.buttons === 1 && activeStroke && !isStickerToolActive) {
      const moveEvent = new CustomEvent("canvasStrokeMove", {
        detail: { x: e.offsetX, y: e.offsetY },
      });
      eventDispatcher.dispatchEvent(moveEvent);
    }

    // Update the sticker preview if the sticker tool is active
    if (isStickerToolActive) {
      stickerPreview.style.opacity = "1"; // Make the preview visible
      stickerPreview.style.left = `${e.clientX}px`; // Center the emoji (adjust -12 for alignment)
      stickerPreview.style.top = `${e.clientY - 24}px`; // Center the emoji
    } else {
      stickerPreview.style.opacity = "0"; // Hide the preview if not in sticker mode
    }
  });

  myCanvas.addEventListener("mouseup", () => {
    if (!isStickerToolActive) {
      activeStroke = null; // Reset current stroke
      const endEvent = new CustomEvent("canvasStrokeEnd");
      eventDispatcher.dispatchEvent(endEvent);
    }
  });

  // Add a listener for placing stickers
  myCanvas.addEventListener("click", (e) => {
    if (isStickerToolActive) {
      // Add a sticker to the sticker array when the tool is active
      const rect = myCanvas.getBoundingClientRect();
      stickers.push({
        emoji: selectedEmoji,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        rotation: currentStickerRotation * Math.PI/180,
      });

      redrawCanvas(); // Redraw everything, including stickers
    }
  });

  myCanvas.addEventListener("mouseleave", () => {
    stickerPreview.style.opacity = "0"; // Hide the emoji preview when the mouse leaves the canvas
  });
} else {
  console.log("Error: Canvas context not available");
}

eventDispatcher.addEventListener("canvasStrokeStart", (e: Event) => {
  const { x, y } = (e as CustomEvent).detail;
  activeStroke?.points.push({ x, y });
});

eventDispatcher.addEventListener("canvasStrokeMove", (e: Event) => {
  const { x, y } = (e as CustomEvent).detail;
  activeStroke?.points.push({ x, y });

  const lastPoint = activeStroke?.points[activeStroke.points.length - 2];
  if (lastPoint) {
    ctx?.beginPath();
    ctx?.moveTo(lastPoint.x, lastPoint.y);
    ctx?.lineTo(x, y);
    ctx?.stroke();
  }
});

eventDispatcher.addEventListener("canvasStrokeEnd", () => {
  activeStroke = null;
});
app.append(document.createElement("br"));
// "Clear" Button
const clearButton = document.createElement("button");
clearButton.innerHTML = `Clear`;
app.append(clearButton);

clearButton.onclick = () => {
  const clearEvent = new CustomEvent("canvasClear");
  eventDispatcher.dispatchEvent(clearEvent);
};

eventDispatcher.addEventListener("canvasClear", () => {
  ctx?.clearRect(0, 0, myCanvas.width, myCanvas.height);
  strokes.length = 0; // Clear saved strokes
  undoneStrokes.length = 0; // Clear redo stack to prevent restoring cleared strokes
  stickers.length = 0; // Clear added stickers
});

// Undo Button
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);

undoButton.onclick = () => {
  const undoEvent = new CustomEvent("canvasUndo");
  eventDispatcher.dispatchEvent(undoEvent);
};

eventDispatcher.addEventListener("canvasUndo", () => {
  if (strokes.length > 0) {
    const undoneStroke = strokes.pop(); // Remove the last stroke
    if (undoneStroke) {
      undoneStrokes.push(undoneStroke); // Save it in the redo stack for potential redo
    }
    redrawCanvas(); // Redraw the canvas to reflect the change
  }
});

// Redo Button
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);

redoButton.onclick = () => {
  const redoEvent = new CustomEvent("canvasRedo");
  eventDispatcher.dispatchEvent(redoEvent);
};

eventDispatcher.addEventListener("canvasRedo", () => {
  if (undoneStrokes.length > 0) {
    const restoredStroke = undoneStrokes.pop(); // Get the last undone stroke
    if (restoredStroke) {
      strokes.push(restoredStroke); // Re-add the stroke to the strokes array
      redrawCanvas(); // Redraw the canvas to include the restored stroke
    }
  }
});

app.append(document.createElement("br"));
//drawing buttons

const customStickerButton = document.createElement("button");
customStickerButton.innerHTML = "custom sticker";
app.append(customStickerButton);

customStickerButton.onclick = () => {
  selectedEmoji = prompt("Custom sticker text","🧽");
  stickerPreview.innerHTML = selectedEmoji;
  deselectAllButtons();
  customStickerButton.style.background = "green";
};


const sticker1Button = document.createElement("button");
sticker1Button.innerHTML = "😊";
app.append(sticker1Button);

sticker1Button.onclick = () => {
  selectedEmoji = "😊";
  stickerPreview.innerHTML = selectedEmoji;
  isStickerToolActive = true;
  deselectAllButtons();
  sticker1Button.style.background = "green";
};

const sticker2Button = document.createElement("button");
sticker2Button.innerHTML = "😃";
app.append(sticker2Button);

sticker2Button.onclick = () => {
  selectedEmoji = "😃";
  stickerPreview.innerHTML = selectedEmoji;
  isStickerToolActive = true;
  deselectAllButtons();
  sticker2Button.style.background = "green";
};

const sticker3Button = document.createElement("button");
sticker3Button.innerHTML = "😆";
app.append(sticker3Button);

sticker3Button.onclick = () => {
  selectedEmoji = "😆";
  stickerPreview.innerHTML = selectedEmoji;
  isStickerToolActive = true;
  deselectAllButtons();
  sticker3Button.style.background = "green";
};

app.append(document.createElement("br"));
const smallestSize = document.createElement("button");
smallestSize.innerHTML = "1px";
app.append(smallestSize);

smallestSize.onclick = () => {
  isStickerToolActive = false;
  if (ctx) {
    ctx.lineWidth = 1;
  }
  deselectAllButtons();
  smallestSize.style.background = "green";
};

const defaultSize = document.createElement("button");
defaultSize.innerHTML = "2px";
app.append(defaultSize);

defaultSize.onclick = () => {
  isStickerToolActive = false;
  if (ctx) {
    ctx.lineWidth = 2;
  }
  deselectAllButtons();
  defaultSize.style.background = "green";
};



const bigSize = document.createElement("button");
bigSize.innerHTML = "10px";
app.append(bigSize);

bigSize.onclick = () => {
  isStickerToolActive = false;
  if (ctx) {
    ctx.lineWidth = 10;
  }
  deselectAllButtons();
  bigSize.style.background = "green";
};

app.append(document.createElement("br"));

function redrawCanvas() {
  ctx?.clearRect(0, 0, myCanvas.width, myCanvas.height); // Clear canvas
  
  // Redraw strokes
  for (const stroke of strokes) {
    ctx.lineWidth = stroke.lineWidth; // Set the line width for this stroke
    for (let i = 0; i < stroke.points.length - 1; i++) {
      ctx?.beginPath();
      ctx?.moveTo(stroke.points[i].x, stroke.points[i].y);
      ctx?.lineTo(stroke.points[i + 1].x, stroke.points[i + 1].y);
      ctx?.stroke();
    }
  }

  // Redraw stickers with rotation
  for (const sticker of stickers) {
    ctx.save(); // Save the current state
    ctx.translate(sticker.x, sticker.y); // Translate to sticker position
    ctx.rotate(sticker.rotation); // Apply rotation
    ctx.font = "24px sans-serif"; // Maintain font size
    ctx?.fillText(sticker.emoji, 0, 0); // Draw emoji at the origin
    ctx.restore(); // Restore the original state
  }
}


// Create a hidden high-resolution canvas
const hdCanvas = document.createElement("canvas");
const hdCtx = hdCanvas.getContext("2d")!;
hdCanvas.width = 1024; // High resolution width
hdCanvas.height = 1024; // High resolution height

// Export Button
const exportButton = document.createElement("button");
exportButton.innerHTML = "Export as High-Res PNG";
app.append(exportButton);

exportButton.onclick = () => {
  if (myCanvas && hdCtx) {
    // Clear the high-resolution canvas
    hdCtx.clearRect(0, 0, hdCanvas.width, hdCanvas.height);

    // Scale the HD canvas
    const scaleX = hdCanvas.width / myCanvas.width;
    const scaleY = hdCanvas.height / myCanvas.height;
    hdCtx.scale(scaleX, scaleY);

    // Redraw everything at the high resolution
    redrawHDCanvas(hdCtx);

    // Create a data URL from the high-resolution canvas
    const downloadLink = document.createElement("a");
    downloadLink.href = hdCanvas.toDataURL("image/png");
    downloadLink.download = "sketchpad_highres.png"; // High-resolution PNG file
    downloadLink.click();

    // Reset the HD canvas transformation after export
    hdCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformations
  } else {
    console.error("High-resolution canvas export failed!");
  }
};

// High-resolution redraw
function redrawHDCanvas(ctx: CanvasRenderingContext2D) {
  // Redraw strokes
  for (const stroke of strokes) {
    ctx.lineWidth = stroke.lineWidth; // Set the line width for this stroke
    ctx.strokeStyle = "black"; // Default pen color
    for (let i = 0; i < stroke.points.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(stroke.points[i].x, stroke.points[i].y);
      ctx.lineTo(stroke.points[i + 1].x, stroke.points[i + 1].y);
      ctx.stroke();
    }
  }

  // Redraw stickers with rotation
  for (const sticker of stickers) {
    ctx.save(); // Save the current state
    ctx.translate(sticker.x, sticker.y); // Translate to sticker position
    ctx.rotate(sticker.rotation); // Apply rotation
    ctx.font = "24px sans-serif"; // Maintain font size
    ctx.fillText(sticker.emoji, 0, 0); // Draw emoji at the origin
    ctx.restore(); // Restore the original state
  }
}


app.append(document.createElement("br"));


const rotateButton = document.createElement("button");
rotateButton.innerHTML = "Current Rotation: 0";
app.append(rotateButton);
let currentStickerRotation = 0;

rotateButton.onclick = () => {
  currentStickerRotation = currentStickerRotation + 90;
  if(currentStickerRotation >= 360){
    currentStickerRotation = 0;
  }
  rotateButton.innerHTML = 'Current Rotation: ' + currentStickerRotation;
};



//when the program starts, deselect all buttons and select the default button
deselectAllButtons();
defaultSize.style.background = "green";




function deselectAllButtons(){

  // Query all buttons
  const allButtons = Array.from(document.querySelectorAll("button"));

  // Change text color to blue
  allButtons.forEach((button) => {
    button.style.background = "black";
  });

}

