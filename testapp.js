// -----------------------------
// UI ELEMENTS
// -----------------------------
const connectBtn = document.getElementById("connectBtn");
const hrCheckbox = document.getElementById("hrCheckbox");
const accCheckbox = document.getElementById("accCheckbox");
const magCheckbox = document.getElementById("magCheckbox");
const pressureCheckbox = document.getElementById("pressureCheckbox");
const gpsCheckbox = document.getElementById("gpsCheckbox");
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
  acc: [],
  mag: [],
  pressure: [],
  gps: []
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
accCheckbox.addEventListener("change", () => {

  if (!connection) return;

  if (accCheckbox.checked) {

    connection.write("ACC_ON\n");
    statusText.textContent = "Accelerometer enabled";

  } else {

    connection.write("ACC_OFF\n");
    statusText.textContent = "Accelerometer disabled";

  }

});

// -----------------------------
// MAG CHECKBOX
// -----------------------------
magCheckbox.addEventListener("change", () => {

  if (!connection) return;

  if (magCheckbox.checked) {

    connection.write("MAG_ON\n");
    statusText.textContent = "Mag enabled";

  } else {

    connection.write("MAG_OFF\n");
    statusText.textContent = "Mag disabled";

  }

});

// -----------------------------
// pressure CHECKBOX
// -----------------------------
pressureCheckbox.addEventListener("change", () => {

  if (!connection) return;

  if (pressureCheckbox.checked) {

    connection.write("pressure_ON\n");
    statusText.textContent = "Pressure enabled";

  } else {

    connection.write("pressure_OFF\n");
    statusText.textContent = "Pressure disabled";

  }

});

// -----------------------------
// GPS CHECKBOX
// -----------------------------
gpsCheckbox.addEventListener("change", () => {

  if (!connection) return;

  if (gpsCheckbox.checked) {

    connection.write("GPS_ON\n");
    statusText.textContent = "GPS enabled";

  } else {

    connection.write("GPS_OFF\n");
    statusText.textContent = "GPS disabled";

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
    hr: [],
    acc: [],
    mag: [],
    pressure: [],
    gps: []
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


  if (line.startsWith("DATA,MAG")) {

  const parts = line.split(",");

  if (parts.length < 6) return;

  testData.mag.push({
    ms: Number(parts[2]),
    x: Number(parts[3]),
    y: Number(parts[4]),
    z: Number(parts[5])
  });

}

  if (line.startsWith("DATA,pressure")) {

  const parts = line.split(",");

  if (parts.length < 6) return;

  testData.pressure.push({
    ms: Number(parts[2]),
    pressure: Number(parts[3]),
    altitude: Number(parts[4]),
    temp: Number(parts[5])
  });

}

  if (line.startsWith("DATA,GPS")) {

  const parts = line.split(",");

  if (parts.length < 6) return;

  testData.gps.push({
    ms: Number(parts[2]),
    lat: Number(parts[3]),
    lon: Number(parts[4]),
    alt: Number(parts[5])
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
