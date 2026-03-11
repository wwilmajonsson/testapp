// -----------------------------
// UI‑element
// -----------------------------
const connectBtn = document.getElementById("connectBtn");
const hrCheckbox = document.getElementById("hrCheckbox");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
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
// Connect / Disconnect
// -----------------------------
connectBtn.addEventListener("click", () => {
  if (connection) {
    connection.close();
    connection = null;
    buffer = "";
    testRunning = false;
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

    // Ta emot data
    connection.on("data", d => {
      buffer += d;
      let lines = buffer.split("\n");
      buffer = lines.pop();
      lines.forEach(handleLine);
    });

    // Hantera disconnect
    connection.on("close", () => {
      connection = null;
      buffer = "";
      testRunning = false;
      statusText.textContent = "Disconnected";
      connectBtn.textContent = "Connect";
    });
  });
});

// -----------------------------
// HRM checkbox
// -----------------------------
hrCheckbox.addEventListener("change", () => {
  if (!connection) return;

  if (hrCheckbox.checked) {
    connection.write("HR_ON\n");
    statusText.textContent = "HRM enabled";
  } else {
    connection.write("HR_OFF\n");
    statusText.textContent = "HRM disabled";
  }
});

// -----------------------------
// Start test
// -----------------------------
startBtn.addEventListener("click", () => {
  if (!connection) return;

  testRunning = true;
  testData.hr = [];
  testData.startTs = Date.now();

  connection.write("START\n");

  statusText.textContent = "Recording...";
});

// -----------------------------
// Stop test
// -----------------------------
stopBtn.addEventListener("click", () => {
  if (!connection) return;

  testRunning = false;
  connection.write("STOP\n");

  statusText.textContent = "Stopping...";
});

// -----------------------------
// Hantera inkommande rader
// -----------------------------
function handleLine(line) {
  line = line.trim();
  if (!line) return;

  // HR‑data
  if (line.startsWith("DATA,HR")) {
    const parts = line.split(",");
    if (parts.length < 5) return;

    testData.hr.push({
      ms: Number(parts[2]),
      bpm: Number(parts[3]),
      conf: Number(parts[4])
    });
  }

  // STOPPED från klockan
  if (line === "STOPPED") {
    testData.endTs = Date.now();

    const filename = `${testNameInput.value || "hr_test"}_${Date.now()}.json`;
    const blob = new Blob([JSON.stringify(testData)], { type: "application/json" });

    saveAs(blob, filename);

    statusText.textContent = "Test finished";
  }
}
