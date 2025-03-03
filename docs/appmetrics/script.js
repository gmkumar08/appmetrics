document.addEventListener("DOMContentLoaded", function () {
  const csvDropdown = document.getElementById("csvDropdown");

  if (!csvDropdown) {
    console.error("Dropdown element (csvDropdown) not found.");
    return;
  }

  // Load available entries from index.json
  fetch('/appmetrics/docs/appmetrics/files.json')
    .then((response) => response.json())
    .then((entries) => {
      if (entries.length === 0) {
        console.error("No data directories found.");
        return;
      }

      // Populate dropdown
      entries.forEach((entry) => {
        let option = document.createElement("option");
        option.value = entry;
        option.textContent = entry;
        csvDropdown.appendChild(option);
      });

      // Load the first entry by default
      loadData(entries[0]);
    })
    .catch((error) => console.error("Error fetching index.json:", error));

  csvDropdown.addEventListener("change", function () {
    loadData(csvDropdown.value);
  });

  let timestamps = [],
    cpuUsage = [],
    memoryUsage = [];

  function loadData(selectedEntry) {
    const csvPath = `data/${selectedEntry}/cpu_mem_usage.csv`;
    const txtPath = `data/${selectedEntry}/framestats.txt`;

    // Load CSV for charts
    fetch(csvPath)
      .then((response) => response.text())
      .then((csvData) => processCSV(csvData))
      .catch((error) => console.error("Error fetching CSV:", error));

    // Load frame stats for the table
    fetch(txtPath)
      .then((response) => response.text())
      .then((txtData) => processFrameStats(txtData))
      .catch((error) => console.error("Error fetching framestats.txt:", error));
  }

  function processCSV(csvData) {
    let rows = csvData
      .trim()
      .split("\n")
      .map((row) => row.split(","));

    if (rows.length < 2) {
      console.error("CSV file is empty or invalid.");
      return;
    }

    timestamps = [];
    cpuUsage = [];
    memoryUsage = [];

    rows.slice(1).forEach((row) => {
      timestamps.push(row[0]);
      cpuUsage.push(parseFloat(row[1]));
      memoryUsage.push(parseFloat(row[2]));
    });

    plotCharts();
  }

  function plotCharts() {
    let cpuTrace = {
      x: timestamps,
      y: cpuUsage,
      mode: "lines",
      name: "CPU Usage",
      line: { color: "blue" },
    };

    let memoryTrace = {
      x: timestamps,
      y: memoryUsage,
      mode: "lines",
      name: "Memory Usage",
      line: { color: "green" },
    };

    let commonLayout = {
      xaxis: {
        title: "Timestamp",
        showspikes: true,
        spikemode: "across",
        spikesnap: "cursor",
        spikedash: "solid",
        spikecolor: "black",
        spikethickness: 1.5,
      },
      yaxis: {
        showspikes: true,
        spikemode: "across",
        spikesnap: "cursor",
        spikedash: "solid",
        spikecolor: "black",
        spikethickness: 1.5,
      },
      hovermode: "x unified", // Disable default rectangular tooltip
      dragmode: false, // Completely disable zooming
    };

    let layoutCPU = JSON.parse(JSON.stringify(commonLayout));
    layoutCPU.yaxis.title = "Usage (%)";

    let layoutMemory = JSON.parse(JSON.stringify(commonLayout));
    layoutMemory.yaxis.title = "Usage (KB)";

    Plotly.newPlot("cpuChart", [cpuTrace], layoutCPU, {
      displayModeBar: false,
    });
    Plotly.newPlot("memoryChart", [memoryTrace], layoutMemory, {
      displayModeBar: false,
    });

    // Sync tooltips between both charts
    syncHover("cpuChart", "memoryChart");
    syncHover("memoryChart", "cpuChart");
  }

  function syncHover(sourceId, targetId) {
    let sourceChart = document.getElementById(sourceId);
    let targetChart = document.getElementById(targetId);

    if (!sourceChart || !targetChart) {
      console.error(`Chart elements not found: ${sourceId}, ${targetId}`);
      return;
    }

    sourceChart.on("plotly_hover", function (eventData) {
      let pointNumber = eventData.points[0].pointNumber;

      Plotly.Fx.hover(targetChart, [
        { curveNumber: 0, pointNumber: pointNumber },
      ]);
    });

    sourceChart.on("plotly_unhover", function () {
      Plotly.Fx.unhover(targetChart);
    });
  }

  function processFrameStats(txtData) {
    const statsTable = document.getElementById("framestats-table");
    if (!statsTable) return;

    statsTable.innerHTML = ""; // Clear existing data

    let lines = txtData.trim().split("\n");

    lines.forEach((line) => {
      let [key, value] = line.split(":").map((item) => item.trim());
      if (key && value !== undefined) {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${key}</td><td>${value}</td>`;
        statsTable.appendChild(row);
      }
    });
  }
});
