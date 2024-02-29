import 'normalize.css'
import * as d3 from 'd3'
import buildings from '../data/Datasets/Attributes/Buildings.csv'
import participants from '../data/Datasets/Attributes/ParticipantsWithEngels.csv'
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

    let slicedParticipants = participants.slice(1, participants.length - 1).map(d => ( // messo slice fino a participants.length - 1 perche' l'ultimo elemento e' vuoto attualmente
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
    console.log(slicedParticipants)


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
    const scale = 0.08;

    // Create an SVG element
    const svgMap = d3.select(".left").append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", "translate(" + (-minX * scale) + "," + (maxY * scale) + ") scale(" + scale + ")");

    // Define a projection (assuming the data is in a projected coordinate system)
    const projection = d3.geoIdentity().reflectY(true);

    // Create a path generator
    const path = d3.geoPath().projection(projection);

    // Draw the buildings
    svgMap.selectAll("path")
      .data(data)
      .enter().append("path")
      .attr("d", d => path({ "type": "Polygon", "coordinates": d.location.coordinates }))
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
      .attr("transform", `translate(${marginPP.left},${marginPP.top})`);


    // Extract the list of dimensions we want to keep in the plot
    // let dimensions = Object.keys(slicedParticipants[0]).filter(function (d) { return d != "participantId" })
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
        .domain(slicedParticipants.map(function (d) { return d[attribute]; }))
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
    svg.selectAll("myPath")
      .data(slicedParticipants)
      .join("path")
      .attr("d", pathDrawer)
      .style("fill", "none")
      .style("stroke", "#69b3a2")
      .style("opacity", 0.5)

    // Draw the axis:
    svg.selectAll("myAxis")
      // For each dimension of the dataset I add a 'g' element:
      .data(dimensions).enter()
      .append("g")
      // I translate this element to its right position on the x axis
      .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
      // And I build the axis with the call function
      .each(function (d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
      // Add axis title
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function (d) { return d; })
      .style("fill", "black")

  }
}())

window.app.init()