let data = [];
let xScale, yScale;  // Make scales global
let rScale;
let brushSelection = null; 
let dots;

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

  const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)  // Explicit width
      .attr("height", height) // Explicit height
      .style("overflow", "visible");

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

  dots = svg.append("g").attr("class", "dots");

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

  const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

  svg.call(zoom);

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

  d3.select("#reset-zoom").on("click", () => {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
  });
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});