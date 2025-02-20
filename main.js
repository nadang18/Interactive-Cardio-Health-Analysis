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
        bmi: Number(row['alcohol consumption (standard units)']),
        datetime: new Date(row.datetime),
        causeOfDeath: row['Cause of death'],
        survival: row['Cause of death'] === "0" ? 'Survivor' :
                  row['Cause of death'] === "1" ? 'Non-cardiac death' :
                  row['Cause of death'] === "3" ? 'SCD (Sudden Cardiac Death)' :
                  (row['Cause of death'] === "6" || row['Cause of death'] === "7") ? 'Pump-failure death' :
                  'Unknown'
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
        .domain(d3.extent(data, d => isNaN(d.age) ? undefined : d.age)) // Ignore NaN values
        .range([usableArea.left, usableArea.right])
        .nice();
    
    yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => isNaN(d.bmi) ? undefined : d.bmi)) // Ignore NaN values
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
        .attr("fill", d => d.causeOfDeath === "0" ? "steelblue" : "red") // 🔹 Color: Cyan if survived, Orange if not
        .style("fill-opacity", 0.9)
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


    // 🔹 Add X-Axis Label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom + 50)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "black")
        .text("Age (Years)");

    // 🔹 Add Y-Axis Label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -height / 2)
        .attr("y", margin.left - 60)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "black")
        .text("Alcohol Consumption (Standard Units)");
}
function updateScatterplot(filteredData = data) {
    dots.selectAll("circle")
        .data(filteredData, d => d.age)
        .join(
            enter => enter.append("circle")
                .attr("cx", d => xScale(d.age))
                .attr("cy", d => yScale(d.bmi))
                .attr("r", 5)
                .attr("fill", d => d.survival === "Survivor" ? "cyan" :
                                 (d.survival === "Non-cardiac death" || 
                                  d.survival === "SCD (Sudden Cardiac Death)" ||
                                  d.survival === "Pump-failure death") ? "orange" : "gray")
                .style("fill-opacity", 0.7),
            update => update
                .attr("fill", d => d.survival === "Survivor" ? "cyan" :
                                 (d.survival === "Non-cardiac death" || 
                                  d.survival === "SCD (Sudden Cardiac Death)" ||
                                  d.survival === "Pump-failure death") ? "orange" : "gray"),
            exit => exit.remove()
        );
}

function filterDeaths() {
    const selectedType = document.getElementById("death-filter").value;

    if (selectedType === "All") {
        createScatterplot();; // 🔹 Reset to full scatterplot (including survivors)
        return;
    }

    // Filter only selected death type (remove Survivors)
    const filteredData = data.filter(d => d.survival !== "Survivor" && d.survival === selectedType);

    dots.selectAll("circle")
        .data(filteredData, d => d.age) // Bind only the filtered data (no survivors)
        .join(
            enter => enter.append("circle")
                .attr("cx", d => xScale(d.age))
                .attr("cy", d => yScale(d.bmi))
                .attr("r", 5)
                .attr("fill", "purple") // 🔹 Keep only filtered deaths in purple
                .style("fill-opacity", 0.7),
            update => update
                .attr("fill", "purple"),
            exit => exit.remove() // 🔹 Remove survivors from the plot
        );
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

function updateSelectionCount() {
    const selectedDots = d3.selectAll('circle.selected').data();

    if (selectedDots.length === 0) {
        document.getElementById('selection-count').textContent = 'No dots selected';
        return;
    }

    const count = selectedDots.length;
    const ages = selectedDots.map(d => d.age).sort((a, b) => a - b);
    const medianAge = ages[Math.floor(ages.length / 2)];
    const averageAlcohol = (selectedDots.reduce((sum, d) => sum + d.bmi, 0) / count).toFixed(2);

    document.getElementById('selection-count').textContent = 
        `Selected: ${count}, Median Age: ${medianAge}, Avg Alcohol Consumption: ${averageAlcohol}`;
}

function brushed(event) {
    brushSelection = event.selection;
    
    if (!brushSelection) {
        // If no selection, reset all circles
        dots.selectAll("circle").classed("selected", false)
            .classed("brushed-survivor", false)
            .classed("brushed-death", false)
            .attr("fill", d => d.causeOfDeath === "0" ? "steelblue" : "red"); // Reset colors
        updateSelectionCount();
        return;
    }

    const [[x0, y0], [x1, y1]] = brushSelection;

    dots.selectAll("circle").classed("selected", d => {
        const cx = xScale(d.age);
        const cy = yScale(d.bmi);
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
    }).classed("brushed-survivor", d => {
        const cx = xScale(d.age);
        const cy = yScale(d.bmi);
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1 && d.causeOfDeath === "0";
    }).classed("brushed-death", d => {
        const cx = xScale(d.age);
        const cy = yScale(d.bmi);
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1 && d.causeOfDeath !== "0";
    });

    updateSelectionCount();
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('toggle-brush');

    // Set initial styles
    button.style.transition = 'transform 0.2s ease, background-color 0.2s ease';
    button.style.backgroundColor = isBrushEnabled ? 'green' : '#64B5F6'; // Initial color based on state

    // Event listener for mouse entering the button
    button.addEventListener('mouseover', () => {
        button.style.transform = 'scale(1.05)'; // Slightly enlarge the button
        button.style.backgroundColor = isBrushEnabled ? '#006400' : '#42A5F5'; // Darker shades
    });

    // Event listener for mouse leaving the button
    button.addEventListener('mouseout', () => {
        button.style.transform = 'scale(1)'; // Reset to original size
        button.style.backgroundColor = isBrushEnabled ? 'green' : '#64B5F6'; // Original colors
    });
});
function toggleBrush() {
    const button = document.getElementById('toggle-brush');

    if (isBrushEnabled) {
        svg.select(".brush").remove(); // Remove the brush

        // Re-enable zoom functionality
        svg.call(zoom);

        // Reset selection but **keep filtered colors**
        d3.selectAll("circle").classed("selected", false)
            .classed("brushed-survivor", false)
            .classed("brushed-death", false);

        button.textContent = "🖌️ Enable Brush";
        button.style.backgroundColor = '#64B5F6'; // Light blue
        button.style.color = 'white';

        svg.style.cursor = "default";
        d3.selectAll("circle").style("pointer-events", "auto");
        document.body.style.cursor = "default";

        // Reset selection count text
        document.getElementById('selection-count').textContent = 'No dots selected';
    } else {
        svg.append("g").attr("class", "brush").call(brush);
        svg.on(".zoom", null); // Disable zoom when brushing

        button.textContent = "🖌️ Disable Brush";
        button.style.backgroundColor = 'green';
        button.style.color = 'white';

        svg.style.cursor = "crosshair";
        d3.selectAll("circle").style("pointer-events", "none");
        document.body.style.cursor = "crosshair";
    }

    isBrushEnabled = !isBrushEnabled;
}


function enableZoom() {
    svg.call(zoom);
    svg.select(".brush").remove();
}

function updateTooltipContent(d) {
    document.getElementById('tooltip-age').textContent = d.age ?? "N/A"; // Use "N/A" if undefined
    document.getElementById('tooltip-bmi').textContent = d.bmi ? d.bmi.toFixed(2) : "N/A"; // Avoid NaN errors
    document.getElementById('tooltip-death').textContent = d.survival ? d.survival : "Unknown"; // Handle missing survival data
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
        .style("background-color", '#64B5F6') // Default color
        .style("color", "white");
});


//FILTER
// Function to filter data based on BMI input
function applyBMIFilter() {
    const maxBMI = parseFloat(document.getElementById("bmi-filter").value);

    if (isNaN(maxBMI)) {
        alert("Please enter a valid number for BMI filtering.");
        return;
    }

    // Filter data
    const filteredData = data.filter(d => d.bmi <= maxBMI);

    // Update scatterplot with filtered data
    updateScatterplot(filteredData);
}

// Function to reset the filter
function resetBMIFilter() {
    document.getElementById("bmi-filter").value = ""; // Clear input field
    updateScatterplot(data); // Show all data again
}

function updateScatterplot(filteredData = data) {
    dots.selectAll("circle")
        .data(filteredData, d => d.age)
        .join(
            enter => enter.append("circle")
                .attr("cx", d => xScale(d.age))
                .attr("cy", d => yScale(d.alcohol))
                .attr("r", 5)
                .attr("fill", d => d.survival === "Survivor" ? "cyan" :
                                 (d.survival === "Non-cardiac death" || 
                                  d.survival === "SCD (Sudden Cardiac Death)" ||
                                  d.survival === "Pump-failure death") ? "orange" : "gray") // Default
                .style("fill-opacity", 0.7),
            update => update
                .attr("fill", d => d.survival === "Survivor" ? "cyan" :
                                 (d.survival === "Non-cardiac death" || 
                                  d.survival === "SCD (Sudden Cardiac Death)" ||
                                  d.survival === "Pump-failure death") ? "orange" : "gray"),
            exit => exit.remove()
        );
}

// Attach event listener to filter dropdown
document.getElementById("death-filter").addEventListener("change", filterDeaths);


document.addEventListener('DOMContentLoaded', () => {
    const deathFilter = document.getElementById('death-filter');

    // Event listener for when the dropdown value changes
    deathFilter.addEventListener('change', () => {
        // Reset background color to light blue after selection
        deathFilter.style.backgroundColor = '#E3F2FD';
    });

    // Event listener for when the dropdown gains focus
    deathFilter.addEventListener('focus', () => {
        // Change background color to a slightly darker blue when focused
        deathFilter.style.backgroundColor = '#BBDEFB';
    });

    // Event listener for when the dropdown loses focus
    deathFilter.addEventListener('blur', () => {
        // Reset background color to light blue when focus is lost
        deathFilter.style.backgroundColor = '#E3F2FD';
    });
});