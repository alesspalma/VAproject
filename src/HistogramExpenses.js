import * as d3 from 'd3'
import CONSTANTS from './constants'

export default class HistogramExpenses {
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
            .attr('class', 'histogram_wrapper')
            .attr('width', this.dimensions.width)
            .attr('height', this.dimensions.height)

        this.bars = this.wrapper.append('g')
            .attr('class', 'bars_wrapper')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
        this.xAxisContainer = this.wrapper.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top + this.dimensions.boundedHeight})`)
        this.yAxisContainer = this.wrapper.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)

        // Aggregate the data for each expense category
        let aggregatedData = new Map([['Education', 0], ['Food', 0], ['Recreation', 0], ['Shelter', 0]])
        aggregatedData.forEach((value, key) => {
            let sum = d3.sum(participantsData, d => d[key.toLowerCase() + 'Expense'])
            aggregatedData.set(key, sum)
        })
        console.log(aggregatedData)

        // Scales
        this.xScale = d3.scaleBand()
            .domain(aggregatedData.keys())
            .range([0, this.dimensions.boundedWidth])
            .padding(0.2)
        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData.values())])
            // .nice()
            .range([this.dimensions.boundedHeight, 0])

        this.xAxisContainer.call(d3.axisBottom(this.xScale))
        this.yAxisContainer.call(d3.axisLeft(this.yScale))

        // Draw the bars
        this.bars.selectAll('rect')
            .data(aggregatedData)
            .enter()
            .append('rect')
            .attr('x', d => this.xScale(d[0]))
            .attr('y', d => this.yScale(d[1]))
            .attr('width', this.xScale.bandwidth())
            .attr('height', d => this.dimensions.boundedHeight - this.yScale(d[1]))
            .attr('fill', CONSTANTS.ACTIVE_COLOR)

    }
}