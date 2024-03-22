import 'normalize.css'
import * as d3 from 'd3'
import crossfilter from 'crossfilter2';
import buildings from '../data/Datasets/Attributes/BuildingsAugmented.csv'
import participants from '../data/Datasets/Attributes/ParticipantsAugmented.csv'
import './styles/index.scss'
import ParallelPlot from './ParallelPlot.js';
import MapPlot from './MapPlot.js';
import HistogramPlot from './HistogramPlot.js';
import CONSTANTS from './constants.js';
import PCAChart from './PCAChart.js';
import ScatterPlot from './ScatterPlot.js';
import LinePlot from './LinePlot.js';
import activities from '../data/Datasets/Attributes/ActivitiesAugmented.csv'
import visitsPerParticipant from '../data/Datasets/Attributes/VisitsLog.csv'
import monthlyLog from '../preprocessing/MonthlyLog.csv'


window.app = (new class {

  constructor() {
    this.d3 = d3
    this.data = {}
    this.filters = new Map() // it will be a map like { 'age': [min, max], 'educationLevel': ['Low', 'HighSchoolOrCollege', 'Bachelors'], ... }
  }

  cleanScreen() {
    // clean the screen and the filters from previous charts

    d3.select('.left').select('.map_wrapper').remove()
    d3.select('.center').select('.top').selectAll('*').remove()
    d3.select('.center').select('.down').selectAll('*').remove()
    d3.select('.pca-plot').selectAll('*').remove()
    d3.select('.footer').selectAll('*').remove()
    this.filters = new Map()
  }

  initParticipants(slicedBuildings, slicedParticipants, isActivitiesView) {
    // clean screen
    this.cleanScreen()

    // init screen
    const map = new MapPlot();
    map.initChart(d3.select(".left"), slicedBuildings, slicedParticipants, isActivitiesView);
    const pp = new ParallelPlot();
    pp.initChart(d3.select(".footer"), slicedParticipants, isActivitiesView);
    const hist = new HistogramPlot();
    hist.initChart(d3.select(".center").select(".top"), slicedParticipants, isActivitiesView);
    const sc = new ScatterPlot();
    sc.initChart(d3.select(".center").select(".down"), slicedParticipants, isActivitiesView);
    const pca = new PCAChart();
    pca.initChart(d3.select('.pca-plot'), slicedParticipants, isActivitiesView);

    // Add an event listener for the custom event dispatcher
    let that = this;
    CONSTANTS.DISPATCHER.on('userSelection', function (event) {
      // iterate over event and update filters
      for (let key in event) {
        if (event[key] === null) that.filters.delete(key);
        else that.filters.set(key, event[key])
      }

      // filter data
      let crossfilterParticipants = crossfilter(slicedParticipants)

      that.filters.forEach((value, key) => {
        if (key == "participantId") crossfilterParticipants.dimension(d => d[key]).filterFunction(d => value.includes(d))
        else if (typeof value[0] === 'number') crossfilterParticipants.dimension(d => d[key]).filter([value[0], value[1] + 0.0001])
        else crossfilterParticipants.dimension(d => d[key]).filterFunction(d => value.includes(d))
      })

      // update charts
      let newSelected = crossfilterParticipants.allFiltered()
      let newIds = newSelected.map(d => d.participantId)
      map.updateChart(newSelected)
      pp.updateChart(newIds)
      hist.updateChart(newSelected)
      sc.updateChart(newSelected)
      if (!that.filters.has("participantId")) pca.updateChart(newIds)
    });

  }

  initActivities(slicedBuildings, slicedActivities, slicedVisitsPerParticipant, slicedMonthlyLog, isActivitiesView) {
    // clean screen
    this.cleanScreen()

    // init screen
    const map = new MapPlot();
    map.initChart(d3.select(".left"), slicedBuildings, slicedActivities, isActivitiesView);
    const pp = new ParallelPlot();
    pp.initChart(d3.select(".footer"), slicedActivities, isActivitiesView);
    const hist = new HistogramPlot();
    hist.initChart(d3.select(".center").select(".top"), slicedVisitsPerParticipant, isActivitiesView);
    const lp = new LinePlot();
    lp.initChart(d3.select(".center").select(".down"), slicedMonthlyLog);
    const pca = new PCAChart()
    pca.initChart(d3.select('.pca-plot'), slicedActivities, isActivitiesView)

    // Add an event listener for the custom event dispatcher
    let that = this;
    CONSTANTS.DISPATCHER.on('userSelection', function (event) {
      // iterate over event and update filters
      for (let key in event) {
        if (event[key] === null) that.filters.delete(key);
        else that.filters.set(key, event[key])
      }

      // filter data
      let crossfilterActivities = crossfilter(slicedActivities)

      that.filters.forEach((value, key) => {
        if (key == "venueId") crossfilterActivities.dimension(d => d[key]).filterFunction(d => value.includes(d))
        else if (typeof value[0] === 'number') crossfilterActivities.dimension(d => d[key]).filter([value[0], value[1] + 0.0001])
        else crossfilterActivities.dimension(d => d[key]).filterFunction(d => value.includes(d))
      })

      // update charts
      let newSelected = crossfilterActivities.allFiltered()
      let newIds = newSelected.map(d => d.venueId)
      map.updateChart(newSelected)
      pp.updateChart(newIds)
      hist.updateChart(slicedVisitsPerParticipant.filter(d => newIds.includes(d.venueId)))
      lp.updateChart(slicedMonthlyLog.filter(d => newIds.includes(d.venueId)))
      if (!that.filters.has("venueId")) pca.updateChart(newIds)
    });
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
      .attr('style', 'position: absolute; opacity: 0; box-sizing: border-box; top: 0; left: -100000000px; padding: 4px 4px; font-family: sans-serif; font-size: 12px; color: #333; background-color: #eee; border: 1px solid #333; border-radius: 4px; pointer-events: none; z-index: 1;');

    let slicedParticipants = participants.slice(1) // map the data to the correct types
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

    let slicedVisitsPerParticipant = visitsPerParticipant.slice(1).map(d => (
      {
        participantId: +d[0],
        venueId: +d[1],
        venueType: d[2],
        count: +d[3],
        distance: +d[4]
      }
    ))

    let slicedMonthlyLog = monthlyLog.slice(1).map(d => (
      {
        venueId: +d[0],
        venueType: d[1],
        timestamp: d[2],
        earnings: +d[3],
        visits: +d[4]
      }
    ))

    let slicedActivities = activities.slice(1).map(d => (
      {
        venueId: +d[0],
        cost: +d[1],
        maxOccupancy: +d[2],
        locationX: +d[3],
        locationY: +d[4],
        venueType: d[5],
        totalVisits: +d[6],
        totalEarnings: +d[7]
      }
    ))

    // Now that data is ready, initialize the charts

    this.initParticipants(slicedBuildings, slicedParticipants, false) // at the beginning, the view is participants view

    d3.select('#toggleButton').on('change', (event) => {
      if (event.target.checked) {
        // do stuff for activities
        this.initActivities(slicedBuildings, slicedActivities, slicedVisitsPerParticipant, slicedMonthlyLog, event.target.checked)
      } else {
        // do stuff for participants
        this.initParticipants(slicedBuildings, slicedParticipants, event.target.checked)
      }
    })

  }
}())

window.app.init()