let data = [];
let xScale, yScale;  // Make scales global
let rScale;
let brushSelection = null; 
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

    console.log("Data loaded:", data); // Log loaded data

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
      .attr("width", width)  // Explicit width
      .attr("height", height) // Explicit height
      .style("overflow", "visible");

  // Define clipping path
  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("x", usableArea.left)
      .attr("y", usableArea.top)
      .attr("width", usableArea.width)
      .attr("height", usableArea.height);

  // Define scales
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

  const gridlines = svg.append("g")
      .attr("class", "gridlines")
      .attr("transform", `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width));

  dots = svg.append("g")
      .attr("class", "dots")
      .attr("clip-path", "url(#clip)"); // Apply clipping path

  dots.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => xScale(d.age))
      .attr("cy", d => yScale(d.bmi))
      .attr("r", 5) 
      .attr("fill", "steelblue")
      .style("fill-opacity", 0.7)
      .on("mouseenter", function (event, d) {
          d3.select(event.currentTarget).style("fill-opacity", 1); 
          updateTooltipContent(d);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
      })
      .on("mouseleave", function () {
          d3.select(event.currentTarget).style("fill-opacity", 0.7);
          updateTooltipVisibility(false);
      });

  zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

  brush = d3.brush()
      .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
      .on("start brush end", brushed);

  // Initially enable zoom
  enableZoom();

  d3.select("#reset-zoom").on("click", () => {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
  });

  d3.select("#enable-zoom").on("click", enableZoom);
  d3.select("#enable-brush").on("click", enableBrush);
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

function enableBrush() {
  svg.call(brush);
  svg.on(".zoom", null);
}

function updateTooltipContent(d) {
  const age = document.getElementById('tooltip-age');
  const bmi = document.getElementById('tooltip-bmi');

  age.textContent = `Age: ${d.age}`;
  bmi.textContent = `BMI: ${d.bmi.toFixed(2)}`;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('tooltip');
  tooltip.hidden = !isVisible;
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const selectedCommits = brushSelection
    ? data.filter(isCommitSelected)
    : [];

  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } dots selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  const selectedCommits = brushSelection
    ? data.filter(isCommitSelected)
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : data;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}

function isCommitSelected(commit) {
  if (!brushSelection) {
    return false;
  }

  const [[x0, y0], [x1, y1]] = brushSelection; // Get bounds of selection
  const x = xScale(commit.age);
  const y = yScale(commit.bmi);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});