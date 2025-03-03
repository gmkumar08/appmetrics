document.addEventListener("DOMContentLoaded", function () {
  const csvDropdown = document.getElementById("csvDropdown");

  if (!csvDropdown) {
    console.error("Dropdown element (csvDropdown) not found.");
    return;
  }

  let csvFiles = ["file1.csv", "file2.csv"]; // Update with actual filenames

  if (csvFiles.length === 0) {
    console.error("No CSV files found.");
    return;
  }

  // Populate dropdown
  csvFiles.forEach((file) => {
    let option = document.createElement("option");
    option.value = file;
    option.textContent = file;
    csvDropdown.appendChild(option);
  });

  // Load first CSV by default
  loadCSV(csvFiles[0]);

  csvDropdown.addEventListener("change", function () {
    loadCSV(csvDropdown.value);
  });

  let timestamps = [],
    cpuUsage = [],
    memoryUsage = [];

  function loadCSV(filename) {
    fetch(`csv/${filename}`)
      .then((response) => response.text())
      .then((csvData) => {
        processCSV(csvData);
      })
      .catch((error) => console.error("Error fetching CSV:", error));
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
        title: "Usage (%)",
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

    let layoutCPU = { ...commonLayout, title: "CPU Usage" };
    let layoutMemory = { ...commonLayout, title: "Memory Usage" };

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

  const performanceData = [
    { metric: "Total Number of Frames", value: "10,000" },
    { metric: "Janky Frames", value: "120" },
    { metric: "95th Percentile", value: "16ms" },
    { metric: "99th Percentile", value: "24ms" },
    { metric: "Average Frame Time", value: "12ms" },
  ];

  function populatePerformanceTable() {
    let tableBody = document.querySelector("#performanceTable");
    tableBody.innerHTML = ""; // Clear existing data

    performanceData.forEach((item) => {
      let row = document.createElement("tr");
      row.innerHTML = `<td>${item.metric}</td><td>${item.value}</td>`;
      tableBody.appendChild(row);
    });
  }

  populatePerformanceTable(); // Populate table on load
});
