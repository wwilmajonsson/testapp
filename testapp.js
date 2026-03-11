// -----------------------------
// UI‑element
// -----------------------------
const connectBtn = document.getElementById("connectBtn");
const hrCheckbox = document.getElementById("hrCheckbox");
const startBtn = document.getElementById("startBtn");
const statusText = document.getElementById("statusText");
const testNameInput = document.getElementById("testName");

// -----------------------------
// Variabler
// -----------------------------
let connection = null;
let buffer = "";
let testRunning = false;

let testData = {
  startTs: null,
  endTs: null,
  hr: []
};

// -----------------------------
// Connect
// -----------------------------
connectBtn.addEventListener("click", () => {
  if (connection) {
    connection.close();
    connection = null;
    statusText.textContent = "Disconnected";
    connectBtn.textContent = "Connect";
    return;
  }

  Puck.connect(c => {
    if (!c) {
      statusText.textContent = "Failed to connect";
      return;
    }

    connection = c;
    statusText.textContent = "Connected";
    connectBtn.textContent = "Disconnect";

    connection.on("data", d => {
      buffer += d;
      let lines = buffer.split("\n");
      buffer = lines.pop();
      lines.forEach(handleLine);
    });
  });
});

// -----------------------------
// HRM checkbox
// -----------------------------
hrCheckbox.addEventListener("change", () => {
  if (!connection) return;

  if (hrCheckbox.checked) connection.write("HR_ON\n");
  else connection.write("HR_OFF\n");
});

// -----------------------------
// Start/Stop
// -----------------------------
startBtn.addEventListener("click", () => {
  if (!connection) return;

  if (!testRunning) {
    testRunning = true;
    testData.hr = [];
    testData.startTs = Date.now();
    connection.write("START\n");
    startBtn.textContent = "Stop";
    statusText.textContent = "Recording...";
  } else {
    testRunning = false;
    connection.write("STOP\n");
    startBtn.textContent = "Start";
    statusText.textContent = "Stopping...";
  }
});

// -----------------------------
// Handle incoming data
// -----------------------------
function handleLine(line) {
  if (line.startsWith("DATA,HR")) {
    let parts = line.split(",");
    testData.hr.push({
      ms: parseInt(parts[2]),
      bpm: parseInt(parts[3]),
      conf: parseInt(parts[4])
    });
  }

  if (line === "STOPPED") {
    testData.endTs = Date.now();

    const filename = `${testNameInput.value || "hr_test"}_${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(testData)], { type: "application/json" });
    saveAs(blob, filename);

    statusText.textContent = "Test finished";
  }
}

