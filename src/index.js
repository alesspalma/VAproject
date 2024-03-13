import 'normalize.css'
import * as d3 from 'd3'
import buildings from '../data/Datasets/Attributes/BuildingsAugmented.csv'
import participants from '../data/Datasets/Attributes/ParticipantsAugmented.csv'
import droppedOut from '../data/Datasets/Attributes/DroppedOut.csv'
import './styles/index.scss'
import ParallelPlot from './ParallelPlot.js';
import Map from './Map.js';

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
    )).map(d => {
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

      return {
        buildingId: +d.buildingId,
        location: polygon,
        buildingType: d.buildingType,
        maxOccupancy: +d.maxOccupancy,
        units: d.units ? JSON.parse(d.units) : null
      };
    });

    let listDroppedOut = droppedOut.slice(1).map(d => +d[0])

    let slicedParticipants = participants.slice(1).filter(d => (!listDroppedOut.includes(+d[0])) && d[8] !== "") // filter dropped out and participants without valid house
      .map(d => (
        {
          participantId: +d[0],
          householdSize: +d[1],
          haveKids: d[2].toLowerCase() == "true" ? true : false,
          age: +d[3],
          educationLevel: d[4],
          interestGroup: d[5],
          joviality: +d[6],
          engels: +d[7],
          apartmentId: +d[8],
          locationX: +d[9],
          locationY: +d[10]
        }
      ))

    // #############################################################################################

    const map = new Map();
    map.initChart(d3.select(".left"), slicedBuildings, slicedParticipants);
    const pp = new ParallelPlot();
    pp.initChart(d3.select(".footer"), slicedParticipants);


    d3.select('#toggleButton').on('change', function () {
      const checkbox = d3.select(this).node()
      if (checkbox.checked) {
        // do stuff for activities
        console.log('Activities view')
      } else {
        // do stuff for participant
        console.log('Participants view')
      }
    })
  }
}())

window.app.init()