import 'normalize.css'
import * as d3 from 'd3'
import crossfilter from 'crossfilter2';
import buildings from '../data/Datasets/Attributes/BuildingsAugmented.csv'
import participants from '../data/Datasets/Attributes/ParticipantsAugmented.csv'
import droppedOut from '../data/Datasets/Attributes/DroppedOut.csv'
import './styles/index.scss'
import ParallelPlot from './ParallelPlot.js';
import MapPlot from './MapPlot.js';
import HistogramExpenses from './HistogramExpenses.js';
import CONSTANTS from './constants.js';
import PCAChart from './PCAChart.js';
import performPCA from './utils.js'


window.app = (new class {

  constructor() {
    this.d3 = d3
    this.data = {}
    this.filters = new Map() // it will be a map like { 'age': [min, max], 'educationLevel': ['Low', 'HighSchoolOrCollege', 'Bachelors'], ... }
  }

  async init() {

    // TODO: Implement data cleaning functions in utils.js and here just call them before initializing charts
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

    // Create a tooltip SVG text element
    const tooltip = d3.select('body').append('div')
      .attr('id', 'tooltip')
      .attr('style', 'position: absolute; opacity: 0;')

    // let listDroppedOut = droppedOut.slice(1).map(d => +d[0])

    let slicedParticipants = participants.slice(1) //.filter(d => (!listDroppedOut.includes(+d[0])) && d[8] !== "") // filter dropped out and participants without valid house
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
          locationY: +d[10],
          educationExpense: +d[11],
          foodExpense: +d[12],
          recreationExpense: +d[13],
          shelterExpense: +d[14],
          wage: +d[15],
          rentAdjustment: +d[16]
        }
      ))

    // Now that data is ready, initialize the charts

    const map = new MapPlot();
    map.initChart(d3.select(".left"), slicedBuildings, slicedParticipants);
    const pp = new ParallelPlot();
    pp.initChart(d3.select(".footer"), slicedParticipants);
    const hist = new HistogramExpenses();
    hist.initChart(d3.select(".center"), slicedParticipants);

    // Add an event listener for the custom event dispatcher
    let that = this;
    CONSTANTS.DISPATCHER.on('userSelection', function (event) {
      // iterate over event and update filters
      for (let key in event) {
        if (event[key] === null) that.filters.delete(key);
        else that.filters.set(key, event[key])
      }
      console.log('actual filters:', that.filters);

      // filter data
      let crossfilterParticipants = crossfilter(slicedParticipants)

      that.filters.forEach((value, key) => {
        if (typeof value[0] === 'number') crossfilterParticipants.dimension(d => d[key]).filter(value)
        else crossfilterParticipants.dimension(d => d[key]).filterFunction(d => value.includes(d))
      })

      console.log(crossfilterParticipants.allFiltered())
      console.log(crossfilterParticipants.allFiltered().length)

      // update charts
      // pp.updateChart(crossfilterParticipants.allFiltered())
      // hist.updateChart(crossfilterParticipants.allFiltered())
      // map.updateChart(crossfilterParticipants.allFiltered())
    });

    const future_filtered_ids = [];
    let pcaData;
    const pcaPromise = performPCA(future_filtered_ids);
    await pcaPromise.then(transformedData => {
      // console.log('Transformed data in index.js:', transformedData);
      pcaData = transformedData.map(row => ({
        participantId: +row[0],
        x: +row[1],
        y: +row[2],
        z: +row[3],
        c: +row[transformedData[0].length - 1]
      }));

    });

    const pcaChart = new PCAChart(d3.select('.right'), pcaData)


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