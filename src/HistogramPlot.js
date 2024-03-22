import * as d3 from 'd3'
import CONSTANTS from './constants'

export default class HistogramPlot {
    constructor() {
        this.dimensions = {
            margin: {
                top: 30,
                right: 30,
                bottom: 40,
                left: 80
            }
        }
        this.aggregatedData = new Map([['Education', 0], ['Food', 0], ['Recreation', 0], ['Shelter', 0]])
        this.distanceData = new Map([['<1.25 Km', 0], ['<2.55 Km', 0], ['>2.55 Km', 0]])
        this.lowDistance = 1250.0 //1269.067;
        this.highDistance = 2550.0 //2562.569;        
    }

    initChart(sel, data, isActivitiesView) {
        const { width, height } = sel.node().getBoundingClientRect()
        const { margin } = this.dimensions
        this.dimensions.width = width
        this.dimensions.height = height
        this.dimensions.boundedWidth = width - margin.left - margin.right
        this.dimensions.boundedHeight = height - margin.top - margin.bottom
        this.isActivitiesView = isActivitiesView

        this.wrapper = sel.append('svg')
            .attr('class', 'histogram_wrapper')
            .attr('width', this.dimensions.width)
            .attr('height', this.dimensions.height)

        let bars_wrapper = this.wrapper.append('g')
            .attr('class', 'bars_wrapper')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
        this.xAxisContainer = this.wrapper.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top + this.dimensions.boundedHeight})`)
        this.yAxisContainer = this.wrapper.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)

        // Draw the x-axis title
        this.xAxisContainer.append('text')
            .attr("text-anchor", "middle")
            .attr('x', this.dimensions.boundedWidth / 2)
            .attr('y', this.dimensions.margin.bottom - 5)
            .attr("font-weight", 700)
            .style("font-size", "16px")
            .text(isActivitiesView ? 'Distance Traveled' : 'Expense Categories')
            .attr('fill', 'black');

        // Draw the y-axis title
        this.yAxisContainer.append('text')
            .attr('x', -this.dimensions.boundedHeight / 2) // it actually sets the y position because of the rotation
            .attr('y', -this.dimensions.margin.left + 20) // it actually sets the x position because of the rotation
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .attr("font-weight", 700)
            .style("font-size", "16px")
            .text(isActivitiesView ? 'Number of Visits' : 'Total Expense ($)')
            .attr('fill', 'black');

        if (!isActivitiesView) {
            // Aggregate the data for each expense category
            this.aggregatedData.forEach((value, key) => {
                let sum = d3.sum(data, d => d[key.toLowerCase() + 'Expense'])
                this.aggregatedData.set(key, sum)
            })

            // Scales
            this.xScale = d3.scaleBand()
                .domain(this.aggregatedData.keys())
                .range([0, this.dimensions.boundedWidth])
                .padding(0.6) // change padding value to make bars thinner or thicker

            const maxExpense = d3.max(this.aggregatedData.values())
            this.yScale = d3.scaleLinear()
                .domain([0, maxExpense + 0.1 * maxExpense])
                .range([this.dimensions.boundedHeight, 0])

            this.xAxisContainer.call(d3.axisBottom(this.xScale))
            this.yAxisContainer.call(d3.axisLeft(this.yScale))

            // Draw the bars
            this.bars = bars_wrapper.selectAll('rect')
                .data(this.aggregatedData)
                .enter()
                .append('rect')
                .attr('x', d => this.xScale(d[0]))
                .attr('y', d => this.yScale(d[1]))
                .attr('width', this.xScale.bandwidth())
                .attr('height', d => this.dimensions.boundedHeight - this.yScale(d[1]))
                .attr('fill', CONSTANTS.ACTIVE_COLOR)
                .attr("stroke", "black")

            this.barsText = bars_wrapper.selectAll('.bar-value')
                .data(this.aggregatedData)
                .enter()
                .append('text')
                .attr('class', 'bar-value')
                .attr('x', d => this.xScale(d[0]) + this.xScale.bandwidth() / 2)
                .attr('y', d => this.yScale(d[1]) - 5)
                .attr('text-anchor', 'middle')
                .text(d => CONSTANTS.NUMBER_FORMATTER.format(d[1]))
                .style('fill', 'black');
        } else {
            // Process the data and add a new column
            data.forEach((entry) => {
                entry.distanceCategory = this.categorizeDistance(entry.distance);
            });

            // Aggregate the data for each distance category, summing on count
            this.distanceData.forEach((value, key) => {
                let sum = d3.sum(data, d => d.distanceCategory === key ? d.count : 0)
                this.distanceData.set(key, sum)
            })

            // Scales
            this.xScale = d3.scaleBand()
                .domain(this.distanceData.keys())
                .range([0, this.dimensions.boundedWidth])
                .padding(0.6) // change padding value to make bars thinner or thicker

            const maxCount = d3.max(this.distanceData.values())
            this.yScale = d3.scaleLinear()
                .domain([0, maxCount + 0.1 * maxCount])
                .range([this.dimensions.boundedHeight, 0])

            this.xAxisContainer.call(d3.axisBottom(this.xScale))
            this.yAxisContainer.call(d3.axisLeft(this.yScale))

            // Draw the bars
            this.bars = bars_wrapper.selectAll('rect')
                .data(this.distanceData)
                .enter()
                .append('rect')
                .attr('x', d => this.xScale(d[0]))
                .attr('y', d => this.yScale(d[1]))
                .attr('width', this.xScale.bandwidth())
                .attr('height', d => this.dimensions.boundedHeight - this.yScale(d[1]))
                .attr('fill', CONSTANTS.ACTIVE_COLOR)
                .attr("stroke", "black")

            this.barsText = bars_wrapper.selectAll('.bar-value')
                .data(this.distanceData)
                .enter()
                .append('text')
                .attr('class', 'bar-value')
                .attr('x', d => this.xScale(d[0]) + this.xScale.bandwidth() / 2)
                .attr('y', d => this.yScale(d[1]) - 5)
                .attr('text-anchor', 'middle')
                .text(d => CONSTANTS.NUMBER_FORMATTER.format(d[1]))
                .style('fill', 'black');
        }
    }

    categorizeDistance(distance) {
        if (distance <= this.lowDistance) {
            return "<1.25 Km";
        } else if (distance > this.lowDistance && distance <= this.highDistance) {
            return "<2.55 Km";
        } else {
            return ">2.55 Km";
        }
    }

    updateChart(participantsData) {
        if (!this.isActivitiesView) {
            this.aggregatedData.forEach((value, key) => {
                let sum = d3.sum(participantsData, d => d[key.toLowerCase() + 'Expense'])
                this.aggregatedData.set(key, sum)
            })

            const maxExpense = d3.max(this.aggregatedData.values())
            this.yScale.domain([0, maxExpense + 0.1 * maxExpense])
            this.yAxisContainer
                .transition()
                .duration(CONSTANTS.TRANSITION_DURATION)
                .call(d3.axisLeft(this.yScale))

            this.bars.data(this.aggregatedData)
                .transition()
                .duration(CONSTANTS.TRANSITION_DURATION)
                .attr('y', d => this.yScale(d[1]))
                .attr('height', d => this.dimensions.boundedHeight - this.yScale(d[1]))

            // Update the text values and their positions
            this.barsText.data(this.aggregatedData)
                .text(d => CONSTANTS.NUMBER_FORMATTER.format(d[1]))
                .transition()
                .duration(CONSTANTS.TRANSITION_DURATION)
                .attr('x', d => this.xScale(d[0]) + this.xScale.bandwidth() / 2)
                .attr('y', d => this.yScale(d[1]) - 5);
        }
        else {
            participantsData.forEach((entry) => {
                entry.distanceCategory = this.categorizeDistance(entry.distance);
            });

            this.distanceData.forEach((value, key) => {
                let sum = d3.sum(participantsData, d => d.distanceCategory === key ? d.count : 0)
                this.distanceData.set(key, sum)
            })

            // Update the scales
            const maxCount = d3.max(this.distanceData.values())
            this.yScale.domain([0, maxCount + 0.1 * maxCount])
            this.yAxisContainer
                .transition()
                .duration(CONSTANTS.TRANSITION_DURATION)
                .call(d3.axisLeft(this.yScale))

            this.bars.data(this.distanceData)
                .transition()
                .duration(CONSTANTS.TRANSITION_DURATION)
                .attr('y', d => this.yScale(d[1]))
                .attr('height', d => this.dimensions.boundedHeight - this.yScale(d[1]))

            // Update the text values and their positions
            this.barsText.data(this.distanceData)
                .text(d => CONSTANTS.NUMBER_FORMATTER.format(d[1]))
                .transition()
                .duration(CONSTANTS.TRANSITION_DURATION)
                .attr('x', d => this.xScale(d[0]) + this.xScale.bandwidth() / 2)
                .attr('y', d => this.yScale(d[1]) - 5);
        }
    }
}