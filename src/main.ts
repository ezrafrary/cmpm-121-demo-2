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

// Create a centralized event dispatcher
const eventDispatcher = document.createElement("div");

if (ctx) {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  myCanvas.addEventListener("mousedown", (e) => {
    // Start a new stroke with the current line width
    currentStroke = { points: [], lineWidth: ctx.lineWidth };
    strokes.push(currentStroke);

    const startEvent = new CustomEvent("canvasStrokeStart", {
      detail: { x: e.offsetX, y: e.offsetY },
    });
    eventDispatcher.dispatchEvent(startEvent);
  });

  myCanvas.addEventListener("mousemove", (e) => {
    if (e.buttons === 1 && currentStroke) {
      const moveEvent = new CustomEvent("canvasStrokeMove", {
        detail: { x: e.offsetX, y: e.offsetY },
      });
      eventDispatcher.dispatchEvent(moveEvent);
    }
  });

  myCanvas.addEventListener("mouseup", () => {
    currentStroke = null; // Reset current stroke
    const endEvent = new CustomEvent("canvasStrokeEnd");
    eventDispatcher.dispatchEvent(endEvent);
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

// Buttons to change line width
const smallestSize = document.createElement("button");
smallestSize.innerHTML = "1px";
app.append(smallestSize);

smallestSize.onclick = () => {
  if (ctx) {
    ctx.lineWidth = 1;
  }
};

const defaultSize = document.createElement("button");
defaultSize.innerHTML = "2px";
app.append(defaultSize);

defaultSize.onclick = () => {
  if (ctx) {
    ctx.lineWidth = 2;
  }
};

const bigSize = document.createElement("button");
bigSize.innerHTML = "5px";
app.append(bigSize);

bigSize.onclick = () => {
  if (ctx) {
    ctx.lineWidth = 5;
  }
};

function redrawCanvas() {
  ctx?.clearRect(0, 0, myCanvas.width, myCanvas.height); // Clear canvas
  for (const stroke of strokes) {
    ctx.lineWidth = stroke.lineWidth; // Set the line width for this stroke
    for (let i = 0; i < stroke.points.length - 1; i++) {
      ctx?.beginPath();
      ctx?.moveTo(stroke.points[i].x, stroke.points[i].y);
      ctx?.lineTo(stroke.points[i + 1].x, stroke.points[i + 1].y);
      ctx?.stroke();
    }
  }
}