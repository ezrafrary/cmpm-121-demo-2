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
let currentStroke: { points: { x: number; y: number }[]; lineWidth: number } | null = null;

// Add a redoStack to store undone actions
const redoStack: { points: { x: number; y: number }[]; lineWidth: number }[] = [];

// Array to track stickers
const stickers: { emoji: string; x: number; y: number }[] = [];

// Track whether the sticker tool is active
let stickerMode = false;
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
    if (!stickerMode) {
      // Start a new stroke if not in sticker mode
      currentStroke = { points: [], lineWidth: ctx.lineWidth };
      strokes.push(currentStroke);

      const startEvent = new CustomEvent("canvasStrokeStart", {
        detail: { x: e.offsetX, y: e.offsetY },
      });
      eventDispatcher.dispatchEvent(startEvent);
    }
  });

  myCanvas.addEventListener("mousemove", (e) => {
    if (e.buttons === 1 && currentStroke && !stickerMode) {
      const moveEvent = new CustomEvent("canvasStrokeMove", {
        detail: { x: e.offsetX, y: e.offsetY },
      });
      eventDispatcher.dispatchEvent(moveEvent);
    }

    // Update the sticker preview if the sticker tool is active
    if (stickerMode) {
      stickerPreview.style.opacity = "1"; // Make the preview visible
      stickerPreview.style.left = `${e.clientX}px`; // Center the emoji (adjust -12 for alignment)
      stickerPreview.style.top = `${e.clientY - 24}px`; // Center the emoji
    } else {
      stickerPreview.style.opacity = "0"; // Hide the preview if not in sticker mode
    }
  });

  myCanvas.addEventListener("mouseup", () => {
    if (!stickerMode) {
      currentStroke = null; // Reset current stroke
      const endEvent = new CustomEvent("canvasStrokeEnd");
      eventDispatcher.dispatchEvent(endEvent);
    }
  });

  // Add a listener for placing stickers
  myCanvas.addEventListener("click", (e) => {
    if (stickerMode) {
      // Add a sticker to the sticker array when the tool is active
      const rect = myCanvas.getBoundingClientRect();
      stickers.push({
        emoji: selectedEmoji,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
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
  currentStroke?.points.push({ x, y });
});

eventDispatcher.addEventListener("canvasStrokeMove", (e: Event) => {
  const { x, y } = (e as CustomEvent).detail;
  currentStroke?.points.push({ x, y });

  const lastPoint = currentStroke?.points[currentStroke.points.length - 2];
  if (lastPoint) {
    ctx?.beginPath();
    ctx?.moveTo(lastPoint.x, lastPoint.y);
    ctx?.lineTo(x, y);
    ctx?.stroke();
  }
});

eventDispatcher.addEventListener("canvasStrokeEnd", () => {
  currentStroke = null;
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
  redoStack.length = 0; // Clear redo stack to prevent restoring cleared strokes
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
      redoStack.push(undoneStroke); // Save it in the redo stack for potential redo
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
  if (redoStack.length > 0) {
    const restoredStroke = redoStack.pop(); // Get the last undone stroke
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
  stickerMode = true;
  deselectAllButtons();
  sticker1Button.style.background = "green";
};

const sticker2Button = document.createElement("button");
sticker2Button.innerHTML = "😃";
app.append(sticker2Button);

sticker2Button.onclick = () => {
  selectedEmoji = "😃";
  stickerPreview.innerHTML = selectedEmoji;
  stickerMode = true;
  deselectAllButtons();
  sticker2Button.style.background = "green";
};

const sticker3Button = document.createElement("button");
sticker3Button.innerHTML = "😆";
app.append(sticker3Button);

sticker3Button.onclick = () => {
  selectedEmoji = "😆";
  stickerPreview.innerHTML = selectedEmoji;
  stickerMode = true;
  deselectAllButtons();
  sticker3Button.style.background = "green";
};

app.append(document.createElement("br"));
const smallestSize = document.createElement("button");
smallestSize.innerHTML = "1px";
app.append(smallestSize);

smallestSize.onclick = () => {
  stickerMode = false;
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
  stickerMode = false;
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
  stickerMode = false;
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

  // Redraw stickers
  for (const sticker of stickers) {
    ctx.font = "24px sans-serif"; // Adjust font size as needed
    ctx?.fillText(sticker.emoji, sticker.x, sticker.y);
  }
}

// Export Button
const exportButton = document.createElement("button");
exportButton.innerHTML = "Export as PNG";
app.append(exportButton);

exportButton.onclick = () => {
  if (myCanvas) {
    
    // Create an anchor element to trigger the download
    const downloadLink = document.createElement("a");
    downloadLink.href = myCanvas.toDataURL("image/png");;
    downloadLink.download = "sketchpad.png"; // Default file name
    downloadLink.click();
  } else {
    console.error("Canvas export failed: Canvas element not found.");
  }
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

