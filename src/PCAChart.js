import * as d3 from 'd3'
import CONSTANTS from './constants'

export default class PCAChart {
  constructor(htmlContainer, data) {
    this.data = data
    this.htmlContainer = htmlContainer
    this.dimensions = {
      margin: {
        top: 20,
        right: 20,
        bottom: 50,
        left: 60
      }
    }
    this.initChart()
  }

  initChart() {
    const { width, height } = this.htmlContainer.node().getBoundingClientRect()
    const { margin } = this.dimensions
    this.dimensions.width = width
    this.dimensions.height = height
    this.dimensions.boundedWidth = width - margin.left - margin.right
    this.dimensions.boundedHeight = height - margin.top - margin.bottom

    this.svg = this.htmlContainer.append('svg')
      .attr('class', 'PCAChart_wrapper')
      .attr('width', this.dimensions.width)
      .attr('height', this.dimensions.height)
    this.bounds = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    //
    this.xAxisContainer = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top + this.dimensions.boundedHeight / 2})`)
    this.yAxisContainer = this.svg.append('g')
      .attr('transform', `translate(${margin.left + this.dimensions.boundedWidth / 2}, ${margin.top})`)

    this.xScale = d3.scaleLinear()
      .range([0, this.dimensions.boundedWidth])

    this.yScale = d3.scaleLinear()
      .range([this.dimensions.boundedHeight, 0])

    this.xAxisContainer.call(d3.axisBottom(this.xScale))
    this.yAxisContainer.call(d3.axisLeft(this.yScale))

    this.updateChart(this.data)
  }

  updateChart(data) {
    const colors = ['rgb(127,201,127)', 'rgb(240,2,127)', 'rgb(191,91,23)', 'rgb(102,102,102)']

    const xExtent = d3.extent(data, d => d.x)
    const yExtent = d3.extent(data, d => d.y)

    const maxExtent = Math.max(Math.abs(xExtent[0]),
      Math.abs(xExtent[1]),
      Math.abs(yExtent[0]),
      Math.abs(yExtent[1]))
    this.xScale.domain([-maxExtent, maxExtent])
    this.yScale.domain([-maxExtent, maxExtent])

    this.xAxisContainer.call(d3.axisBottom(this.xScale))
    this.yAxisContainer.call(d3.axisLeft(this.yScale))

    const circles = this.bounds.selectAll('circle')
      .data(data)

    circles.enter().append('circle')
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))
      .attr('r', 5)
      .attr('fill', d => colors[d.c])
      .attr("stroke", "black")
      .on('mouseover', function (event, d) {
        d3.select('#tooltip').style('opacity', 1).text(d.participantId)
      })
      .on('mouseout', function () {
        d3.select('#tooltip').style('opacity', 0)
      })
      .on('mousemove', function (event) {
        d3.select('#tooltip').style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 15) + 'px')
      })

    circles.transition()
      .attr('cx', d => this.xScale(d.x))
      .attr('cy', d => this.yScale(d.y))

    circles.exit().remove()

    // this.svg.select('.x.axis')
    //   .call(this.xAxis)

    // this.svg.select('.y.axis')
    //   .call(this.yAxis)
  }
}
