const MOBILE = "mobile";
const DESKTOP = "desktop";

const PEN = "pen";
const ERASER = "eraser";

const ASSETS_FOLDER = "./assets/";

const deviceType = getDeviceType();

const header = document.querySelector(".header");

const sketchAreaContainer = document.querySelector(".sketch_area_container");
const sketchArea = document.querySelector("#sketch_area");
let sketch = sketchArea.getContext("2d");

const eraserButton = document.querySelector("#eraser");
const penButton = document.querySelector("#pen");
const undoButton = document.querySelector("#undo");
const resetButton = document.querySelector("#reset");
const saveButton = document.querySelector("#save");

const popupContainer = document.querySelector(".pop_up_container");
const popups = document.querySelectorAll(".pop_up");
const eraserPopup = document.querySelector("#eraser_pop_up");
const penPopup = document.querySelector("#pen_pop_up");

const eraserSlider = document.querySelector("#eraser_slider");
const penSlider = document.querySelector("#pen_slider");

const eraserSizeDisplay = document.querySelector("#eraser_size");
const penSizeDisplay = document.querySelector("#pen_size");

const penColorContainer = document.querySelector("#pen_color_container");
const penColorInput = document.querySelector("#pen_color");

let penColor = penColorInput.value;
penColorContainer.style.backgroundColor = penColor;

let eraserSize = eraserSlider.value;
let penSize = penSlider.value;

eraserSizeDisplay.textContent = eraserSize;
penSizeDisplay.textContent = penSize;

const scaleX = 0.5;
const scaleY = 0.5;
const sketchAreaMargin = 10;

let sketchStart,
  sketchEnd,
  cursorMove,
  cursorLeave = "";

setCanvasDimensions();
fillCanvas();
setEventListeners();
disableUndo();
disableReset();
disableSave();
// console.log(deviceType);

let prevCoords = [0, 0];
let nextCoords = [0, 0];
let isDrawing = false;

let lineType = PEN;

let currentCanvasState = sketch.getImageData(
  0,
  0,
  sketchArea.width,
  sketchArea.height
);

let prevCanvasState = sketch.getImageData(
  0,
  0,
  sketchArea.width,
  sketchArea.height
);

eraserButton.onclick = (e) => {
  if (lineType === ERASER) showEraserPopup();
  setLineType(ERASER);

  // console.log(lineType);
};

penButton.onclick = (e) => {
  if (lineType === PEN) showPenPopup();
  setLineType(PEN);

  // console.log(lineType);
};

undoButton.onclick = (e) => {
  restoreCanvasState(prevCanvasState);
  saveCurrentCanvasState();
  disableUndo();
};

resetButton.onclick = (e) => {
  sketch.clearRect(0, 0, sketchArea.width, sketchArea.height);
  fillCanvas();
  saveCurrentCanvasState();
  savePreviousCanvasState();
  disableUndo();
  disableReset();
  disableSave();
};

saveButton.onclick = (e) => {
  const link = document.createElement("a");
  link.download = "sketch.png";
  link.href = sketchArea.toDataURL();
  link.click();
  link.delete;
};

popupContainer.onclick = (e) => {
  hidePopups();
};

popups.forEach((popup) => {
  popup.onclick = (e) => {
    e.stopPropagation();
    // console.log("clicky");
  };
});

eraserSlider.oninput = (e) => {
  eraserSize = eraserSlider.value;
  eraserSizeDisplay.innerHTML = eraserSize;
  setCursor(lineType);
};

penSlider.oninput = (e) => {
  penSize = penSlider.value;
  penSizeDisplay.innerHTML = penSize;
};

penColorInput.onchange = (e) => {
  penColor = penColorInput.value;
  penColorContainer.style.backgroundColor = penColor;
};

sketchArea.addEventListener(sketchStart, (e) => {
  if (!isDrawing) {
    isDrawing = true;
    savePreviousCanvasState();
    sketch.beginPath();
    sketch.lineWidth = penSize;
    enableButtons();
    restoreCanvasState(currentCanvasState);
    prevCoords = getCoords(e);
  }
});

sketchArea.addEventListener(sketchEnd, (e) => {
  e.preventDefault();
  if (isDrawing) {
    // console.log("up");
    isDrawing = false;
    saveCurrentCanvasState();
  }
});

sketchArea.addEventListener(cursorLeave, (e) => {
  e.preventDefault();
  if (isDrawing) {
    // console.log("hola");
    isDrawing = false;
    saveCurrentCanvasState();
  }
});

sketchArea.addEventListener(cursorMove, (e) => {
  e.preventDefault();
  if (isDrawing) {
    // console.log(e);
    setTimeout(() => {
      nextCoords = getCoords(e);
      if (prevCoords != nextCoords) {
        draw(prevCoords, nextCoords);
        prevCoords = nextCoords;
      }
    }, 10);
  }
});

function draw(from, to) {
  if (lineType === ERASER) {
    erase(from, to);
  } else if (lineType === PEN) {
    drawLine(from, to);
  }
}

function drawLine(from, to) {
  // console.log(`drawing from ${from} to ${to}`);
  sketch.strokeStyle = penColor;
  sketch.moveTo(from[0], from[1]);
  sketch.lineTo(to[0], to[1]);
  sketch.stroke();
  if (!isDrawing) {
    saveCurrentCanvasState();
  }
  // console.log("here");
}

function erase(from, to) {
  // console.log(`erasing from ${from} to ${to}`);
  sketch.moveTo(from[0], from[1]);
  sketch.fillStyle = "white";
  sketch.fillRect(from[0], from[1], eraserSize, eraserSize);
  // console.log("here");
}

function setCanvasDimensions() {
  sketchArea.width = Math.floor(
    sketchAreaContainer.clientWidth - sketchAreaMargin * 2
  );
  sketchArea.height = Math.floor(
    sketchAreaContainer.clientHeight - sketchAreaMargin * 2
  );
}

function fillCanvas() {
  sketch.fillStyle = "white";
  sketch.fillRect(0, 0, sketchArea.width, sketchArea.height);
}

function setLineType(selectedLine) {
  // console.log(selectedLine);
  lineType = selectedLine;
  setButtonStyle(selectedLine);
  if (deviceType != MOBILE) setCursor(selectedLine);
}

function setButtonStyle(selectedLine) {
  if (selectedLine === ERASER) {
    eraserButton.classList.add("selected");
    penButton.classList.remove("selected");
  } else if (selectedLine === PEN) {
    penButton.classList.add("selected");
    eraserButton.classList.remove("selected");
  }
}

function setCursor(selectedLine) {
  if (selectedLine === ERASER) {
    let eraserIcon = getEraserIcon();
    // console.log(eraserIcon);
    sketchArea.style.cursor = `url("${eraserIcon}"), auto`;
  } else if (selectedLine === PEN) {
    sketchArea.style.cursor = "crosshair";
  }
}

function saveCurrentCanvasState() {
  currentCanvasState = sketch.getImageData(
    0,
    0,
    sketchArea.width,
    sketchArea.height
  );
}

function savePreviousCanvasState() {
  prevCanvasState = sketch.getImageData(
    0,
    0,
    sketchArea.width,
    sketchArea.height
  );
}

function restoreCanvasState(canvasState) {
  sketch.putImageData(canvasState, 0, 0);
}

function getDeviceType() {
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    return MOBILE;
  } else return DESKTOP;
}

function setEventListeners() {
  if (deviceType === MOBILE) {
    sketchStart = "touchstart";
    sketchEnd = "touchend";
    cursorMove = "touchmove";
    cursorLeave = "touchcancel";
  } else if (deviceType === DESKTOP) {
    sketchStart = "mousedown";
    sketchEnd = "mouseup";
    cursorMove = "mousemove";
    cursorLeave = "mouseleave";
  }
}

function getCoords(e) {
  let offestX = (window.innerWidth - sketchArea.width) / 2;
  let offsetY =
    window.innerHeight -
    sketchAreaContainer.clientHeight +
    sketchAreaMargin * 2;

  if (deviceType === MOBILE) {
    let x = e.touches[0].clientX - offestX;
    let y = e.touches[0].clientY - offsetY;

    return [x, y];
  } else if (deviceType === DESKTOP) {
    let x = e.clientX - offestX;
    let y = e.clientY - offsetY;
    return [x, y];
  }
}

function getEraserIcon() {
  let eraserIcon = ASSETS_FOLDER + `eraser-${eraserSize}.svg`;
  return eraserIcon;
}

function showEraserPopup() {
  showPopupContainer();
  eraserPopup.style.display = "block";
  // console.log("show eraser");
}

function showPenPopup() {
  showPopupContainer();
  penPopup.style.display = "block";
  // console.log("show pen");
}

function showPopupContainer() {
  popupContainer.style.display = "block";
}

function hidePopups() {
  const none = "none";
  eraserPopup.style.display = none;
  penPopup.style.display = none;
  popupContainer.style.display = none;
}

function disableUndo() {
  undoButton.classList.add("disabled");
}

function disableReset() {
  resetButton.classList.add("disabled");
}

function disableSave() {
  saveButton.classList.add("disabled");
}

function enableButtons() {
  undoButton.classList.remove("disabled");
  resetButton.classList.remove("disabled");
  saveButton.classList.remove("disabled");
}
