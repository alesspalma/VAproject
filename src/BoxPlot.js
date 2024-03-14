import * as d3 from 'd3'
import CONSTANTS from './constants'

export default class BoxPlot {
  constructor() {
    this.dimensions = {
      margin: {
        top: 30,
        right: 30,
        bottom: 30,
        left: 60
      }
    }
  }

  initChart(sel, participantsData) {
    const { width, height } = sel.node().getBoundingClientRect()
    const { margin } = this.dimensions
    this.dimensions.width = width
    this.dimensions.height = height
    this.dimensions.boundedWidth = width - margin.left - margin.right
    this.dimensions.boundedHeight = height - margin.top - margin.bottom

    this.wrapper = sel.append('svg')
      .attr('class', 'boxplot_wrapper')
      .attr('width', this.dimensions.width)
      .attr('height', this.dimensions.height)

    this.plot = this.wrapper.append('g')
      .attr('class', 'plot_wrapper')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // Extract joviality values for each interest group
    let dataByGroup = []
    CONSTANTS.EDUCATION_LEVEL.forEach(group => {
      let groupData = participantsData.filter(d => d.educationLevel === group)
        .map(d => d.wage)
      dataByGroup.push(groupData)
    })

    // Create histogram bins
    const histogram = d3.histogram()
      .value(d => d)
      .domain([0, d3.max(dataByGroup.flat())])
      .thresholds(10) // Adjust number of bins as needed
    const bins = dataByGroup.map(groupData => histogram(groupData))

    // Calculate domain of y scale based on minimum and maximum values
    const yMin = d3.min(dataByGroup.flat())
    const yMax = d3.max(dataByGroup.flat())

    // Scales
    this.xScale = d3.scaleBand()
      .domain(CONSTANTS.EDUCATION_LEVEL)
      .range([0, this.dimensions.boundedWidth])
      .padding(0.2)

    this.yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([this.dimensions.boundedHeight, 0])

    // Draw the x axis
    this.plot.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.dimensions.boundedHeight})`)
      .call(d3.axisBottom(this.xScale))

    // Draw the y axis
    this.plot.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale))

    // Draw boxplots
    const boxplotWidth = 30

    const boxplot = this.plot.selectAll('.boxplot')
      .data(bins)
      .enter().append('g')
      .attr('class', 'boxplot')
      .attr('transform', (d, i) => `translate(${this.xScale(CONSTANTS.EDUCATION_LEVEL[i]) + this.xScale.bandwidth() / 2}, 0)`)

    // Define a new y scale for boxplot components

    const boxplotYScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([this.dimensions.boundedHeight, 0])

    // Draw boxplot components
    boxplot.each(function (binData, i) {
      const groupData = dataByGroup[i]
      const q1 = d3.quantile(groupData.sort(d3.ascending), 0.25)
      const q3 = d3.quantile(groupData.sort(d3.ascending), 0.75)
      const iqr = q3 - q1
      const min = q1 - 1.5 * iqr
      const max = q3 + 1.5 * iqr
      const outliers = groupData.filter(d => d < min || d > max)
      const whiskerMin = d3.min(groupData.filter(d => d >= min))
      const whiskerMax = d3.max(groupData.filter(d => d <= max))
      // console.log(outliers)

      d3.select(this).selectAll('.box')
        .data([binData])
        .enter().append('rect')
        .attr('class', 'box')
        .attr('x', -boxplotWidth / 2)
        .attr('y', boxplotYScale(q3))
        .attr('width', boxplotWidth)
        .attr('height', Math.abs(boxplotYScale(q1) - boxplotYScale(q3)))
        .attr('fill', CONSTANTS.ACTIVE_COLOR)
        .attr('stroke', 'black')

      d3.select(this).append('line')
        .attr('class', 'median-line')
        .attr('x1', -boxplotWidth / 2)
        .attr('y1', boxplotYScale(d3.median(groupData)))
        .attr('x2', boxplotWidth / 2)
        .attr('y2', boxplotYScale(d3.median(groupData)))
        .attr('stroke', 'black')


      d3.select(this).append('line')
        .attr('class', 'top-whisker')
        .attr('x1', 0)
        .attr('y1', boxplotYScale(q3))
        .attr('x2', 0)
        .attr('y2', boxplotYScale(whiskerMax))
        .attr('stroke', 'black')

      d3.select(this).append('line')
        .attr('class', 'bottom-whisker')
        .attr('x1', 0)
        .attr('y1', boxplotYScale(q1))
        .attr('x2', 0)
        .attr('y2', boxplotYScale(whiskerMin))
        .attr('stroke', 'black')

      d3.select(this).append('line')
        .attr('class', 'min-line')
        .attr('x1', -boxplotWidth / 2)
        .attr('y1', boxplotYScale(whiskerMin))
        .attr('x2', boxplotWidth / 2)
        .attr('y2', boxplotYScale(whiskerMin))
        .attr('stroke', 'black')

      d3.select(this).append('line')
        .attr('class', 'max-line')
        .attr('x1', -boxplotWidth / 2)
        .attr('y1', boxplotYScale(whiskerMax))
        .attr('x2', boxplotWidth / 2)
        .attr('y2', boxplotYScale(whiskerMax))
        .attr('stroke', 'black')

      d3.select(this).selectAll('.outlier')
        .data(outliers)
        .enter().append('circle')
        .attr('class', 'outlier')
        .attr('cx', 0)
        .attr('cy', d => boxplotYScale(d))
        .attr('r', 3)
        .attr('fill', CONSTANTS.INACTIVE_COLOR)
        .attr('stroke', 'black')
    })


  }
}
