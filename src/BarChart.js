import * as d3 from 'd3'

export default class BarChart {
  constructor() {
    this.dimensions = {
      margin: {
        top: 20,
        right: 20,
        bottom: 50,
        left: 60
      }
    }
    this.colors = ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(255,127,0)', 'rgb(152,78,163)', 'rgb(77,175,74)', 'rgb(255,255,51)', 'rgb(166,86,40)']
  }

  initChart(sel, financialByCategory) {
    const { width, height } = sel.node().getBoundingClientRect()
    const { margin } = this.dimensions
    this.dimensions.width = width
    this.dimensions.height = height
    this.dimensions.innerWidth = width - margin.left - margin.right
    this.dimensions.innerHeight = height - margin.top - margin.bottom
    // wrapper = svg // Append SVG
    this.wrapper = sel.append('svg')
      .attr('class', 'barChart_wrapper')
      .attr('width', this.dimensions.width)
      .attr('height', this.dimensions.height)
    this.bounds = this.wrapper.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    //
    this.xAxisContainer = this.wrapper.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top + this.dimensions.innerHeight})`)
    this.yAxisContainer = this.wrapper.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // Scale for x-axis
    this.xScale = d3.scaleBand()
      .domain(d3.sort(financialByCategory.keys().filter(d => d !== undefined), d => d[0]))
      .range([0, this.dimensions.innerWidth]) // margin.left
      .padding(0.1)

    // Scale for y-axis
    this.yScale = d3.scaleLinear()
      .domain([0, d3.max(financialByCategory, d => d[1])])
      .nice()
      .range([this.dimensions.innerHeight, margin.top])

    //
    this.xAxisContainer.call(d3.axisBottom(this.xScale))
    this.yAxisContainer.call(d3.axisLeft(this.yScale).ticks(4))
    //
    this.bar = this.bounds.selectAll('rect')
      .data(financialByCategory)
      .enter()
      .append('rect')
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(d[1]))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.dimensions.innerHeight - this.yScale(d[1]))
      .attr('fill', d => this.financialColours(d[0]))
  }

  financialColours(att) {
    switch (att) {
      case 'Wage':
        return this.colors[0]
      case 'Shelter':
        return this.colors[1]
      case 'Education':
        return this.colors[2]
      case 'RentAdjustment':
        return this.colors[3]
      case 'Food':
        return this.colors[4]
      case 'Recreation':
        return this.colors[5]
      default:
        return 'black'
    }
  }

  updateChart(financialByCategory) {
    this.xScale.domain(d3.sort(financialByCategory.keys().filter(d => d !== undefined), d => d[0]))
    console.log(financialByCategory)
    this.yScale.domain([0, d3.max(financialByCategory, d => d[1])])
    this.xAxisContainer.call(d3.axisBottom(this.xScale))
    this.yAxisContainer.call(d3.axisLeft(this.yScale))
    this.bounds.selectAll('rect')
      .data(financialByCategory)
      .join('rect')
      .transition()
      .duration(1000)
      .attr('x', d => this.xScale(d[0]))
      .attr('y', d => this.yScale(d[1]))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => this.dimensions.innerHeight - this.yScale(d[1]))
      .attr('fill', d => this.financialColours(d[0]))
  }
}
