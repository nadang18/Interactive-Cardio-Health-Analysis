let data = [];
let xScale, yScale;
let brushSelection = null;
let isBrushEnabled = false;
let bars;
let svg;
let brush;
let zoom;

async function loadData() {
    data = await d3.csv('data/merged_subject_info.csv', (row) => ({
        ...row,
        age: Number(row['alcohol consumption (standard units)']),
        cigarettes_per_day: Number(row['daily smoking (cigarretes/day)']) // Renamed here
    }));

    console.log("Data loaded:", data);
    createBarChart();
}

function createBarChart() {
    const width = 1000, height = 600;
    const margin = { top: 50, right: 50, bottom: 60, left: 80 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    d3.select("#chart").html(""); // Clear previous chart before appending new

    svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("overflow", "visible");

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("x", usableArea.left)
        .attr("y", usableArea.top)
        .attr("width", usableArea.width)
        .attr("height", usableArea.height);

    xScale = d3.scaleBand()
        .domain(data.map(d => d.age))
        .range([usableArea.left, usableArea.right])
        .padding(0.1);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.cigarettes_per_day)])
        .range([usableArea.bottom, usableArea.top])
        .nice();

    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(10);

    svg.append("g")
        .attr("transform", `translate(0, ${usableArea.bottom})`)
        .call(xAxis)
        .attr("class", "x-axis");

    svg.append("g")
        .attr("transform", `translate(${usableArea.left}, 0)`)
        .call(yAxis)
        .attr("class", "y-axis");

    svg.append("g")
        .attr("class", "gridlines")
        .attr("transform", `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width));

    bars = svg.append("g")
        .attr("class", "bars")
        .attr("clip-path", "url(#clip)");

    bars.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => xScale(d.age))
        .attr("y", d => yScale(d.cigarettes_per_day))
        .attr("width", xScale.bandwidth())
        .attr("height", d => usableArea.bottom - yScale(d.cigarettes_per_day))
        .attr("fill", "steelblue")
        .style("fill-opacity", 0.7)
        .on("mouseenter", function (event, d) {
            if (!isBrushEnabled) { // Prevent hover effects when brush is enabled
                d3.select(event.currentTarget).style("fill-opacity", 1);
                updateTooltipContent(d);
                updateTooltipVisibility(true);
                updateTooltipPosition(event);
            }
        })
        .on("mouseleave", function () {
            if (!isBrushEnabled) {
                d3.select(event.currentTarget).style("fill-opacity", 0.7);
                updateTooltipVisibility(false);
            }
        });

    zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    brush = d3.brush()
        .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
        .on("start brush end", brushed);

    enableZoom();

    d3.select("#reset-zoom").on("click", () => {
        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    });

    d3.select("#toggle-brush").on("click", toggleBrush);
}

function zoomed(event) {
    const transform = event.transform;
    const newXScale = transform.rescaleX(xScale);
    const newYScale = transform.rescaleY(yScale);

    svg.selectAll("rect")
        .attr("x", d => newXScale(d.age))
        .attr("y", d => newYScale(d.cigarettes_per_day))
        .attr("width", newXScale.bandwidth())
        .attr("height", d => usableArea.bottom - newYScale(d.cigarettes_per_day));

    svg.select(".x-axis").call(d3.axisBottom(newXScale));
    svg.select(".y-axis").call(d3.axisLeft(newYScale));
}

function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
}

function enableZoom() {
    svg.call(zoom);
    svg.select(".brush").remove();
}

function toggleBrush() {
    const button = d3.select("#toggle-brush");

    if (isBrushEnabled) {
        svg.select(".brush").remove(); // Remove the brush

        // Re-enable zoom functionality
        svg.call(zoom);

        // Reset bar colors by removing the 'selected' class
        d3.selectAll("rect").classed("selected", false);

        button.text("🖌️ Enable Brush")
              .style("background-color", "red")
              .style("color", "white");

        svg.style("cursor", "default");
        d3.selectAll("rect").style("pointer-events", "auto");
        d3.select("body").style("cursor", "default");
    } else {
        svg.append("g").attr("class", "brush").call(brush);
        svg.on(".zoom", null); // Disable zoom when brushing

        button.text("🖌️ Disable Brush")
              .style("background-color", "green")
              .style("color", "white");

        svg.style("cursor", "crosshair");
        d3.selectAll("rect").style("pointer-events", "none");
        d3.select("body").style("cursor", "crosshair");
    }
    
    isBrushEnabled = !isBrushEnabled;
}

function updateTooltipContent(d) {
    document.getElementById('tooltip-age').textContent = `${d.age}`;
    document.getElementById('tooltip-bmi').textContent = `${d.cigarettes_per_day.toFixed(2)}`;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function updateTooltipVisibility(isVisible) {
    document.getElementById('tooltip').hidden = !isVisible;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    d3.select("#toggle-brush")
        .style("background-color", "red") // Default color
        .style("color", "white");
});

//FILTER// Function to apply both Age & BMI filters as a range
function applyFilters() {
    const minAge = parseFloat(document.getElementById("age-min").value);
    const maxAge = parseFloat(document.getElementById("age-max").value);
    const minBMI = parseFloat(document.getElementById("bmi-min").value);
    const maxBMI = parseFloat(document.getElementById("bmi-max").value);

    // Filter data based on input values (ignoring empty fields)
    const filteredData = data.filter(d =>
        (isNaN(minAge) || d.age >= minAge) && (isNaN(maxAge) || d.age <= maxAge) &&
        (isNaN(minBMI) || d.cigarettes_per_day >= minBMI) && (isNaN(maxBMI) || d.cigarettes_per_day <= maxBMI)
    );

    // Update bar chart with filtered data
    updateBarChart(filteredData);
}

// Function to reset both filters
function resetFilters() {
    document.getElementById("age-min").value = "";
    document.getElementById("age-max").value = "";
    document.getElementById("bmi-min").value = "";
    document.getElementById("bmi-max").value = "";
    updateBarChart(data); // Show all data again
}

// Function to update bar chart dynamically
function updateBarChart(filteredData) {
    bars.selectAll("rect")
        .data(filteredData, d => d.age) // Bind new filtered data
        .join(
            enter => enter.append("rect")
                .attr("x", d => xScale(d.age))
                .attr("y", d => yScale(d.cigarettes_per_day))
                .attr("width", xScale.bandwidth())
                .attr("height", d => usableArea.bottom - yScale(d.cigarettes_per_day))
                .attr("fill", "steelblue")
                .style("fill-opacity", 0.7),
            update => update, // Keep existing bars
            exit => exit.remove() // Remove bars not in new dataset
        );
}

// Attach event listeners to buttons
document.getElementById("apply-filter").addEventListener("click", applyFilters);
document.getElementById("reset-filter").addEventListener("click", resetFilters);