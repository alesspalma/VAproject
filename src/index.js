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
    const width = 855;
    const height = 600;
    const scale = 0.095;

    // Create an SVG element
    const svg = d3.select("#main").append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", "translate(" + (-minX * scale) + "," + (maxY * scale) + ") scale(" + scale + ")");

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