document.addEventListener("DOMContentLoaded", async function () {
    const dropdown = document.getElementById("csvDropdown");
    const chartContainer = document.getElementById("chart");

    if (!dropdown) {
        console.error("Dropdown element (csvDropdown) not found.");
        return;
    }

    let csvFiles = [];

    // 🌍 Try fetching CSV files dynamically (Works Locally, but NOT on GitHub Pages)
    try {
        const response = await fetch("/csv/");
        if (response.ok) {
            const text = await response.text();
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(text, "text/html");
            const links = [...htmlDoc.querySelectorAll("a")];

            csvFiles = links
                .map(link => link.getAttribute("href"))
                .filter(href => href.endsWith(".csv"))
                .map(file => `csv/${file}`);
        } else {
            throw new Error("Fetch failed");
        }
    } catch (error) {
        console.warn("⚠️ Cannot fetch CSV files dynamically. Falling back to manual list.");
        // 🚀 Use a manual list for GitHub Pages
        csvFiles = [
            "csv/file1.csv",
            "csv/file2.csv",
            "csv/file3.csv"
        ];
    }

    if (csvFiles.length === 0) {
        console.warn("No CSV files found.");
        return;
    }

    // Populate dropdown
    dropdown.innerHTML = csvFiles
        .map(file => `<option value="${file}">${file.replace("csv/", "")}</option>`)
        .join("");

    // Load first CSV file by default
    loadCSV(csvFiles[0]);

    // Handle dropdown change
    dropdown.addEventListener("change", function () {
        loadCSV(this.value);
    });

    async function loadCSV(csvFile) {
        try {
            const response = await fetch(csvFile);
            const csvData = await response.text();

            const rows = csvData.split("\n").slice(1); // Skip header
            const timestamps = [];
            const usage = [];

            rows.forEach(row => {
                const cols = row.split(",");
                if (cols.length >= 2) {
                    timestamps.push(cols[0]); // Time
                    usage.push(parseFloat(cols[1])); // CPU Usage %
                }
            });

            plotChart(timestamps, usage);
        } catch (error) {
            console.error("Error loading CSV:", error);
        }
    }

    function plotChart(timestamps, usage) {
        const trace = {
            x: timestamps,
            y: usage,
            mode: "lines",
            name: "CPU Usage",
            line: { color: "blue" }
        };

        const layout = {
            title: "CPU Usage Over Time",
            xaxis: { title: "Time" },
            yaxis: { title: "CPU Usage (%)" },
            dragmode: "zoom", // Allows zooming like Grafana
            showlegend: true
        };

        Plotly.newPlot(chartContainer, [trace], layout);
    }
});
