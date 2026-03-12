// -----------------------------
// UI ELEMENTS
// -----------------------------
const connectBtn = document.getElementById("connectBtn");
const hrCheckbox = document.getElementById("hrCheckbox");
const accelCheckbox = document.getElementById("accelCheckbox");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusText = document.getElementById("statusText");
const testNameInput = document.getElementById("testName");

// -----------------------------
// VARIABLES
// -----------------------------
let connection = null;
let buffer = "";
let testRunning = false;

let testData = {
  startTs: null,
  endTs: null,
  hr: [],
  accel: []
};

// -----------------------------
// CONNECT / DISCONNECT
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
      statusText.textContent = "Connection failed";
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
// HRM CHECKBOX
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
// ACCEL CHECKBOX
// -----------------------------
accelCheckbox.addEventListener("change", () => {

  if (!connection) return;

  if (accelCheckbox.checked) {

    connection.write("ACC_ON\n");
    statusText.textContent = "Accelerometer enabled";

  } else {

    connection.write("ACC_OFF\n");
    statusText.textContent = "Accelerometer disabled";

  }

});


// -----------------------------
// START TEST
// -----------------------------
startBtn.addEventListener("click", () => {

  if (!connection) return;
  if (testRunning) return;

  testRunning = true;

  testData = {
    startTs: Date.now(),
    endTs: null,
    hr: []
  };

  connection.write("START\n");

  statusText.textContent = "Recording...";

});

// -----------------------------
// STOP TEST
// -----------------------------
stopBtn.addEventListener("click", () => {

  if (!connection) return;
  if (!testRunning) return;

  connection.write("STOP\n");

  statusText.textContent = "Stopping...";

});

// -----------------------------
// HANDLE INCOMING DATA
// -----------------------------
function handleLine(line) {

  line = line.trim();
  if (!line) return;

  console.log("RX:", line);

  if (line.startsWith("DATA,HR")) {

    const parts = line.split(",");

    if (parts.length < 5) return;

    testData.hr.push({

      ms: Number(parts[2]),
      bpm: Number(parts[3]),
      conf: Number(parts[4])

    });

  }

  if (line.startsWith("DATA,ACC")) {

  const parts = line.split(",");

  if (parts.length < 6) return;

  testData.acc.push({
    ms: Number(parts[2]),
    x: Number(parts[3]),
    y: Number(parts[4]),
    z: Number(parts[5])
  });

}

  if (line === "STOPPED") {

    testRunning = false;

    testData.endTs = Date.now();

    const filename =
      (testNameInput.value || "hr_test") +
      "_" +
      Date.now() +
      ".json";

    const blob = new Blob(
      [JSON.stringify(testData, null, 2)],
      { type: "application/json" }
    );

    saveAs(blob, filename);

    statusText.textContent = "Test finished";

  }

}
