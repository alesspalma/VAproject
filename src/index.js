import 'normalize.css'
import * as d3 from 'd3'
import buildings from '../data/Datasets/Attributes/Buildings.csv'
import participants from '../data/Datasets/Attributes/ParticipantsWithEngels.csv'
import droppedOut from '../data/Datasets/Attributes/DroppedOut.csv'
import './styles/index.scss'
import ParallelPlot from './ParallelPlot.js';

window.app = (new class {

  constructor() {
    this.d3 = d3
    this.data = {}
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

    const pp = new ParallelPlot();
    pp.initChart(d3.select(".footer"), slicedParticipants);
  }
}())

window.app.init()