let data = [];
let xScale, yScale;
let rScale;
let brushSelection = null;
let isBrushEnabled = false;
let dots;
let svg;
let brush;
let zoom;

async function loadData() {
    data = await d3.csv('data/merged_subject_info.csv', (row) => ({
        ...row,
        age: Number(row.Age),
        bmi: Number(row['Body Mass Index (Kg/m2)']),
        datetime: new Date(row.datetime),
    }));

    console.log("Data loaded:", data);
    createScatterplot();
}

function createScatterplot() {
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

    xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.age))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.bmi))
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

    dots = svg.append("g")
        .attr("class", "dots")
        .attr("clip-path", "url(#clip)");

    dots.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => xScale(d.age))
        .attr("cy", d => yScale(d.bmi))
        .attr("r", 5)
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

    svg.selectAll("circle")
        .attr("cx", d => newXScale(d.age))
        .attr("cy", d => newYScale(d.bmi));

    svg.select(".x-axis").call(d3.axisBottom(newXScale));
    svg.select(".y-axis").call(d3.axisLeft(newYScale));
}
function updateSelection() {
    // Update visual state of dots based on selection
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
  }

  function brushed(event) {
    brushSelection = event.selection;
    
    if (!brushSelection) {
        // If no selection, reset all circles
        dots.selectAll("circle").classed("selected", false);
        return;
    }

    const [[x0, y0], [x1, y1]] = brushSelection;

    dots.selectAll("circle").classed("selected", d => {
        const cx = xScale(d.age);
        const cy = yScale(d.bmi);
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
    });

    updateSelectionCount();
}


function toggleBrush() {
    const button = d3.select("#toggle-brush");

    if (isBrushEnabled) {
        svg.select(".brush").remove(); // Remove the brush

        // Re-enable zoom functionality
        svg.call(zoom);

        // Reset circle colors by removing the 'selected' class
        d3.selectAll("circle").classed("selected", false);

        button.text("🖌️ Enable Brush")
              .style("background-color", "red")
              .style("color", "white");

        svg.style("cursor", "default");
        d3.selectAll("circle").style("pointer-events", "auto");
        d3.select("body").style("cursor", "default");
    } else {
        svg.append("g").attr("class", "brush").call(brush);
        svg.on(".zoom", null); // Disable zoom when brushing

        button.text("🖌️ Disable Brush")
              .style("background-color", "green")
              .style("color", "white");

        svg.style("cursor", "crosshair");
        d3.selectAll("circle").style("pointer-events", "none");
        d3.select("body").style("cursor", "crosshair");
    }
    
    isBrushEnabled = !isBrushEnabled;
}


function enableZoom() {
    svg.call(zoom);
    svg.select(".brush").remove();
}

function updateTooltipContent(d) {
    document.getElementById('tooltip-age').textContent = `${d.age}`;
    document.getElementById('tooltip-bmi').textContent = `${d.bmi.toFixed(2)}`;
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
