import 'normalize.css'
import * as d3 from 'd3'
import loadedData from '../data/Attributes/Buildings.csv'
import './styles/index.scss'

window.app = (new class {
  constructor() {
    this.d3 = d3
    this.data = []
  }

  async init() {
    // await someFunctionThatLoadData
    let slicedData = loadedData.slice(1);
    slicedData = slicedData.map(d => (
      {
        buildingId: +d[0],
        location: d[1],
        buildingType: d[2],
        maxOccupancy: +d[3],
        units: d[4]
      }
    ))
    console.log(slicedData)
    // Initialize your app
    let minX = Infinity;
    let maxY = -Infinity;

    const data = slicedData.map(d => {
      // Extract the coordinates from the location string
      const coordinatesString = d.location.substring(d.location.indexOf('((') + 2, d.location.indexOf('))'));
      const coordinatesArray = coordinatesString.split(',').map(point => {
        const [x, y] = point.trim().split(' ');
        return [+x, +y]; // Convert coordinates to numbers
      });

      // Update the min and max values
      const x = d3.min(coordinatesArray, d => d[0]);
      if (x < minX) minX = x;
      const y = d3.max(coordinatesArray, d => d[1]);
      if (y > maxY) maxY = y;

      // Create the GeoJSON-compatible format
      return {
        buildingId: +d.buildingId,
        location: {
          type: "Polygon",
          coordinates: [coordinatesArray]
        },
        buildingType: d.buildingType,
        maxOccupancy: +d.maxOccupancy,
        units: d.units ? JSON.parse(d.units) : null
      };
    });

    // Define the dimensions of the SVG container
    const width = 855;
    const height = 600;
    const scale = 0.1;

    // Create an SVG element
    const svg = d3.select("#main").append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", "translate(" + (-1 * minX * scale) + "," + (-1 * -maxY * scale) + ") scale(" + scale + ")");

    // Define a projection (assuming the data is in a projected coordinate system)
    const projection = d3.geoIdentity().reflectY(true);

    // Create a path generator
    const path = d3.geoPath().projection(projection);

    // Draw the buildings
    svg.selectAll("path")
      .data(data)
      .enter().append("path")
      .attr("d", d => path({ "type": "Polygon", "coordinates": d.location.coordinates }))
      .attr("stroke", "black")
      .attr("fill", "gray")
      .attr("opacity", 0.7);
  }
}())

window.app.init()