import 'normalize.css'
import * as d3 from 'd3'
import buildings from '../data/Datasets/Attributes/Buildings.csv'
import participants from '../data/Datasets/Attributes/ParticipantsWithEngels.csv'
import droppedOut from '../data/Datasets/Attributes/DroppedOut.csv'
import './styles/index.scss'

window.app = (new class {
  constructor() {
    this.d3 = d3
    this.data = []
  }

  async init() {
    // await someFunctionThatLoadData
    let slicedBuildings = buildings.slice(1).map(d => (
      {
        buildingId: +d[0],
        location: d[1],
        buildingType: d[2],
        maxOccupancy: +d[3],
        units: d[4]
      }
    ))
    let listDroppedOut = droppedOut.slice(1).map(d => +d[0])

    let slicedParticipants = participants.slice(1).filter(d => !(listDroppedOut.includes(+d[0]))).map(d => (
      {
        participantId: +d[0],
        householdSize: +d[1],
        haveKids: d[2] == "TRUE" ? true : false,
        age: +d[3],
        educationLevel: d[4],
        interestGroup: d[5],
        joviality: +d[6],
        engels: +d[7]
      }
    ))

    // Initialize your app
    let minX = Infinity;
    let maxY = -Infinity;

    const data = slicedBuildings.map(d => {
      // Extract the coordinates from the location string
      const coordinatesString = d.location.substring(d.location.indexOf('((') + 2, d.location.lastIndexOf('))'));
      const rings = coordinatesString.split('), (').map(coordinates => {
        return coordinates.split(',').map(point => {
          const [x, y] = point.trim().split(' ').map(parseFloat); // Convert coordinates to numbers
          return [x, y];
        });
      });

      // Create the GeoJSON-compatible format
      const polygon = {
        type: "Polygon",
        coordinates: [rings[0]] // First set of coordinates is the exterior ring
      };

      // If there are interior rings, add them to the polygon
      if (rings.length > 1) {
        polygon.coordinates.push(...rings.slice(1)); // Add interior rings (holes)
      }

      for (let i = 0; i < polygon.coordinates.length; i++) {
        minX = Math.min(minX, d3.min(polygon.coordinates[i], d => d[0]));
        maxY = Math.max(maxY, d3.max(polygon.coordinates[i], d => d[1]));
      }

      return {
        buildingId: +d.buildingId,
        location: polygon,
        buildingType: d.buildingType,
        maxOccupancy: +d.maxOccupancy,
        units: d.units ? JSON.parse(d.units) : null
      };
    });

    // Define the dimensions of the SVG container
    const widthMap = 855;
    const heightMap = 600;
    const scaleMap = 0.08;

    // Create an SVG element
    const svgMap = d3.select(".left").append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", "translate(" + (-minX * scaleMap) + "," + (maxY * scaleMap) + ") scale(" + scaleMap + ")");

    // Define a projection (assuming the data is in a projected coordinate system)
    const projection = d3.geoIdentity().reflectY(true);

    // Create a path generator
    const pathMap = d3.geoPath().projection(projection);

    // Draw the buildings
    svgMap.selectAll("path")
      .data(data)
      .enter().append("path")
      .attr("d", d => pathMap({ "type": "Polygon", "coordinates": d.location.coordinates }))
      .attr("stroke", "black")
      .attr("fill", "gray")
      .attr("opacity", 0.7);

    // #############################################################################################

    // set the dimensions and margins of the graph
    const marginPP = { top: 30, right: 10, bottom: 10, left: 10 }
    const widthPP = 1500 - marginPP.left - marginPP.right
    const heightPP = 220 - marginPP.top - marginPP.bottom

    // append the svg object to the body of the page
    const svg = d3.select(".footer")
      .append("svg")
      .attr("width", widthPP + marginPP.left + marginPP.right)
      .attr("height", heightPP + marginPP.top + marginPP.bottom)
      .append("g")
      .attr("id", "pplot")
      .attr("transform", `translate(${marginPP.left},${marginPP.top})`);


    // Extract the list of dimensions we want to keep in the plot
    let linearDimensions = ["householdSize", "age", "joviality", "engels"]
    let categoricalDimensions = ["haveKids", "interestGroup", "educationLevel"]
    let dimensions = linearDimensions.concat(categoricalDimensions)

    // For each linear dimension, I build a linear scale. I store all in a y object
    const y = {}
    for (let i in linearDimensions) {
      let attribute = linearDimensions[i]
      y[attribute] = d3.scaleLinear()
        .domain(d3.extent(slicedParticipants, function (d) { return +d[attribute]; }))
        .range([heightPP, 0])
    }
    for (let i in categoricalDimensions) {
      let attribute = categoricalDimensions[i]
      y[attribute] = d3.scalePoint()
        .domain(attribute == "educationLevel" ? ["Low", "HighSchoolOrCollege", "Bachelors", "Graduate"] : slicedParticipants.map(function (d) { return d[attribute]; }).sort())
        .range([heightPP, 0])
    }

    // Build the X scale -> it find the best position for each Y axis
    let x = d3.scalePoint()
      .range([0, widthPP])
      .padding(1)
      .domain(dimensions);

    // The path function takes a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function pathDrawer(d) {
      return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
    }

    // Draw the lines
    let linesPP = svg.selectAll("myPath")
      .data(slicedParticipants)
      .join("path")
      .attr("d", pathDrawer)
      .style("fill", "none")
      .style("stroke", "#69b3a2")
      .style("opacity", 0.5)

    // Draw the axes
    let axesPP = svg.selectAll("myAxis")
      // For each dimension of the dataset I add a 'g' element:
      .data(dimensions).enter()
      .append("g")
      // I translate this axis element to its correct position on the x axis
      .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
      // And I build the axis with the call function
      .each(function (d) { d3.select(this).call(d3.axisLeft().scale(y[d])); }) // this refers to the g tag
      // Add axis title
      .call(g => g.append("text")
        .style("text-anchor", "middle")
        .attr("y", -10)
        .text(d => d)
        .style("fill", "black"))

    // Create the brush behavior.
    const brushWidth = 50;
    const brush = d3.brushY()
      .extent([
        [-(brushWidth / 2), 0],
        [brushWidth / 2, heightPP]
      ])
      .on("start brush end", brushed);

    axesPP.call(brush);

    const selections = new Map();
    function brushed({ selection }, key) {
      if (selection === null) selections.delete(key); // if reset selection, remove key from map
      else {
        if (linearDimensions.includes(key)) selections.set(key, selection.map(y[key].invert)); // put [max, min] values of that 'key' axis in map
        else {
          let includedInFiltering = y[key].domain().filter(x => selection[0] <= y[key](x) && y[key](x) <= selection[1]);
          selections.set(key, includedInFiltering);
        }
      }
      const selected = [];
      linesPP.each(function (d) {
        const active = Array.from(selections).every(function ([key, arr]) {
          if (linearDimensions.includes(key)) return d[key] >= arr[1] && d[key] <= arr[0];
          else return arr.includes(d[key]);
        });
        d3.select(this).style("stroke", active ? "#69b3a2" : "#ddd");
        if (active) {
          // d3.select(this).raise();
          selected.push(d);
        }
      });
      // svg.property("value", selected).dispatch("input");
    }

    // ################################################################################

    // // Specify the chart’s dimensions.
    // const width = 1500;
    // const height = 220;
    // const marginTop = 30;
    // const marginRight = 10;
    // const marginBottom = 10;
    // const marginLeft = 30;

    // let keys = ["householdSize", "age", "joviality", "engels"]

    // // Create a vertical (*y*) scale for each key.
    // const y = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(slicedParticipants, d => d[key]), [height - marginBottom, marginTop])]));

    // // Create the horizontal (*x*) scale.
    // const x = d3.scalePoint(keys, [marginLeft, width - marginRight]);

    // // Create the SVG container.
    // const svg = d3.select(".footer")
    //   .append("svg")
    //   .attr("viewBox", [0, 0, width, height])
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("style", "max-width: 100%; height: auto;");

    // // Append the lines.
    // const line = d3.line()
    //   .x(([key]) => x(key))
    //   .y(([key, value]) => y.get(key)(value));

    // const path = svg.append("g")
    //   .attr("id", "pplot")
    //   .attr("fill", "none")
    //   .attr("stroke-width", 1.5)
    //   .attr("stroke-opacity", 0.4)
    //   .selectAll("path")
    //   .data(slicedParticipants)
    //   .join("path")
    //   .attr("stroke", "#69b3a2")
    //   .attr("d", d => line(d3.cross(keys, [d], (key, d) => [key, d[key]])));

    // // Append the axis for each key.
    // const axes = svg.append("g")
    //   .selectAll("g")
    //   .data(keys)
    //   .join("g")
    //   .attr("transform", d => `translate(${x(d)},0)`)
    //   .each(function (d) { d3.select(this).call(d3.axisLeft(y.get(d))); })
    //   .call(g => g.append("text")
    //     .attr("y", marginTop - 10)
    //     .attr("text-anchor", "start")
    //     .attr("fill", "currentColor")
    //     .text(d => d));

    // // Create the brush behavior.
    // const brushWidth = 50;
    // const brush = d3.brushY()
    //   .extent([
    //     [-(brushWidth / 2), marginTop],
    //     [brushWidth / 2, height - marginBottom]
    //   ])
    //   .on("start brush end", brushed);

    // axes.call(brush);

    // const selections = new Map();

    // function brushed({ selection }, key) {
    //   if (selection === null) selections.delete(key); // if reset selection, remove key from map
    //   else selections.set(key, selection.map(y.get(key).invert));
    //   const selected = [];
    //   path.each(function (d) {
    //     const active = Array.from(selections).every(([key, [max, min]]) => d[key] >= min && d[key] <= max);
    //     d3.select(this).style("stroke", active ? "#69b3a2" : "#ddd");
    //     if (active) {
    //       // d3.select(this).raise();
    //       selected.push(d);
    //     }
    //   });
    //   // svg.property("value", selected).dispatch("input");
    // }

  }
}())

window.app.init()