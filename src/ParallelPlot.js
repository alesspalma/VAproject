import * as d3 from 'd3'
import CONSTANTS from './constants.js';

export default class ParallelPlot {
  constructor() {
    this.dimensions = {
      margin: {
        top: 30,
        right: 10,
        bottom: 15,
        left: 10
      }
    }
  }

  initChart(sel, data, isActivitiesView) {
    const { width, height } = sel.node().getBoundingClientRect()
    const { margin } = this.dimensions
    this.dimensions.width = width
    this.dimensions.height = height
    this.dimensions.boundedWidth = width - margin.left - margin.right // real internal width
    this.dimensions.boundedHeight = height - margin.top - margin.bottom // real internal height
    this.isActivitiesView = isActivitiesView

    this.wrapper = sel.append('svg')
      .attr('class', 'parallelPlot_wrapper')
      .attr('width', this.dimensions.width)
      .attr('height', this.dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // Extract the list of dimensions we want to keep in the plot
    if (!isActivitiesView) {
      var linearDimensions = ["age", "joviality", "engels", "householdSize"]
      var categoricalDimensions = ["haveKids", "interestGroup", "educationLevel"]
    }
    else {
      var linearDimensions = ["cost", "maxOccupancy", "totalVisits", "totalEarnings"]
      var categoricalDimensions = ["venueType"]
    }
    let dimensions = linearDimensions.concat(categoricalDimensions)

    // For each linear dimension, I build a linear scale. I store all in a y object
    const y = {}
    for (let i in linearDimensions) {
      let attribute = linearDimensions[i]
      y[attribute] = d3.scaleLinear()
        .domain(d3.extent(data, function (d) { return +d[attribute]; }))
        .range([this.dimensions.boundedHeight, 0])
    }
    for (let i in categoricalDimensions) {
      let attribute = categoricalDimensions[i]
      y[attribute] = d3.scalePoint()
        .domain(attribute == "educationLevel" ? ["Low", "HighSchoolOrCollege", "Bachelors", "Graduate"] : data.map(function (d) { return d[attribute]; }).sort())
        .range([this.dimensions.boundedHeight, 0])
    }

    // Build the X scale -> it find the best position for each Y axis
    let x = d3.scalePoint()
      .range([0, this.dimensions.boundedWidth])
      .padding(1)
      .domain(dimensions);

    // The path function takes a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function pathDrawer(d) {
      return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
    }

    // Draw the lines
    this.linesPP = this.wrapper.append("g")
      .selectAll("myPath")
      .data(data)
      .join("path")
      .attr("d", pathDrawer)
      .style("fill", "none")
      .style("stroke", CONSTANTS.ACTIVE_COLOR)
      .style("stroke-width", this.isActivitiesView ? 2 : 1)
      .style("opacity", 0.8)

    if (isActivitiesView) {
      this.linesPP.style("stroke", d => CONSTANTS.MAP_TO_COLOR[d.venueType])
    }

    // Draw the axes
    let axesPP = this.wrapper.selectAll("myAxis")
      // For each dimension of the dataset I add a 'g' element:
      .data(dimensions)
      .enter()
      .append("g")
      // I translate this axis element to its correct position on the x axis
      .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
      // And I build the axis with the call function
      .each(function (d) { // "this" refers to the g tag
        d3.select(this).call((d == dimensions[dimensions.length - 1]) ? d3.axisRight().scale(y[d]) : d3.axisLeft().scale(y[d]));
      })
      // Add axis title
      .call(g => g.append("text")
        .style("text-anchor", "middle")
        .attr("y", -10)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1))
        .style("fill", "black")
        .attr("font-weight", 700)
        .style("font-size", "14px"))

    // Create the brush behavior.
    const brushWidth = 50;
    const brush = d3.brushY()
      .extent([
        [-(brushWidth / 2), 0],
        [brushWidth / 2, this.dimensions.boundedHeight]
      ])
      .on("end", brushed);

    axesPP.call(brush);

    function brushed({ selection }, key) {
      if (selection === null) {
        CONSTANTS.DISPATCHER.call('userSelection', null, { [key]: null });
      }
      else {
        if (linearDimensions.includes(key)) {
          let min = y[key].invert(selection[1]);
          let max = y[key].invert(selection[0]);
          CONSTANTS.DISPATCHER.call('userSelection', null, { [key]: [min, max] });
        }
        else {
          let includedInFiltering = y[key].domain().filter(x => selection[0] <= y[key](x) && y[key](x) <= selection[1]);
          CONSTANTS.DISPATCHER.call('userSelection', null, { [key]: includedInFiltering });
        }
      }
    }
  }

  updateChart(participantIds) {
    this.linesPP.style("stroke", CONSTANTS.INACTIVE_COLOR)
      .filter(d => participantIds.includes(this.isActivitiesView ? d.venueId : d.participantId))
      .style("stroke", this.isActivitiesView ? (d => CONSTANTS.MAP_TO_COLOR[d.venueType])
        : CONSTANTS.ACTIVE_COLOR)
      .raise()
  }
}