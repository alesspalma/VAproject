import * as d3 from 'd3'

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
    this.dimensions.innerWidth = width - margin.left - margin.right
    this.dimensions.innerHeight = height - margin.top - margin.bottom
    this.svg = this.htmlContainer.append('svg')
      .attr('class', 'PCAChart_wrapper')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    this.bounds = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    //
    this.xAxisContainer = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top + this.dimensions.innerHeight / 2})`)
    this.yAxisContainer = this.svg.append('g')
      .attr('transform', `translate(${margin.left + this.dimensions.innerWidth / 2}, ${margin.top})`)

    this.xScale = d3.scaleLinear()
      .range([0, this.dimensions.innerWidth])

    this.yScale = d3.scaleLinear()
      .range([this.dimensions.innerHeight, 0])

    this.xAxisContainer.call(d3.axisBottom(this.xScale))
    this.yAxisContainer.call(d3.axisLeft(this.yScale))

    this.updateChart(this.data)
  }

  updateChart(data) {
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
      .attr('fill', 'steelblue')

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
