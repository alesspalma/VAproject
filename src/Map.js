import * as d3 from 'd3'
import CONSTANTS from './constants.js';

export default class Map {
    constructor() {
        this.dimensions = {
            margin: {
                top: 200,
                right: 200,
                bottom: 0,
                left: 200
            }
        }
        this.maxX = 2651 // Maximum x-coordinate of the building data
        this.minX = -4763 // Minimum x-coordinate of the building data
        this.maxY = 7851 // Maximum y-coordinate of the building data
        this.minY = -31 // Minimum y-coordinate of the building data
        // this.scaleConstant = 0.08 // Scaling constant for the map
        this.legendSquareSize = 150
        this.legendPadding = 50
        this.legendFontSize = 170
    }

    initChart(sel, buildingsData, participantsData) {
        const { width, height } = sel.node().getBoundingClientRect()
        const { margin } = this.dimensions
        this.dimensions.width = width
        this.dimensions.height = height
        this.dimensions.boundedWidth = width - margin.left - margin.right // real internal width
        this.dimensions.boundedHeight = height - margin.top - margin.bottom // real internal height

        this.wrapper = sel.append('svg')
            .attr('class', 'map_wrapper')
            // .attr('width', "100%") // with this.dimensions it gets buggy
            // .attr('height', "100%")
            // .append('g')
            // .attr('transform', `translate(${this.dimensions.margin.left + (-this.minX * this.scaleConstant)}, 
            //                         ${this.dimensions.margin.top + (this.maxY * this.scaleConstant)}) scale(${this.scaleConstant})`)
            .attr('viewBox', [this.minX - margin.left, -this.maxY - margin.top,
            (this.maxX - this.minX) + margin.left + margin.right,
            (this.maxY - this.minY) + margin.top + margin.bottom]) // top left point is (-4963,-8051), bottom right point is (2851,31)

        // Create an SVG element
        // const svgMap = this.wrapper.append("g")
        //     .attr("transform", "translate(" + (-this.minX * this.scaleConstant) + "," + (this.maxY * this.scaleConstant) + ") scale(" + this.scaleConstant + ")");

        // Create a color scale for the building types
        const buildingTypes = ['Residential', 'Commercial', 'Pub', 'Restaurant', 'School']
        const colors = ['rgb(255,255,153)', 'rgb(56,108,176)', 'rgb(191,91,23)', 'rgb(190,174,212)', 'rgb(253,192,134)']
        const colorScale = d3.scaleOrdinal()
            .domain(buildingTypes)
            .range(colors)

        // Define a projection (assuming the data is in a projected coordinate system) and the path generator
        const projection = d3.geoIdentity().reflectY(true);
        const pathMap = d3.geoPath().projection(projection);

        // Draw the buildings
        this.wrapper.append("g")
            .attr("class", "buildings_wrapper")
            .selectAll("path")
            .data(buildingsData)
            .enter()
            .append("path")
            .attr("d", d => pathMap(d.location)) // .attr("d", d => pathMap({ "type": d.location.type, "coordinates": d.location.coordinates }))
            .attr("stroke", "black")
            .attr("stroke-width", 5)
            .attr("fill", d => colorScale(d.buildingType))

        // Draw the legend
        const legendBottomY = -this.minY - margin.bottom - this.legendSquareSize - this.legendPadding
        let that = this

        let legendWrapper = this.wrapper.append('g').attr('class', 'legend_wrapper')
        legendWrapper.selectAll('.legend_square')
            .data(buildingTypes)
            .enter()
            .append('rect')
            .attr('class', 'legend_square')
            .attr('x', this.minX)
            .attr('y', function (d, i) { return legendBottomY - i * (that.legendSquareSize + that.legendPadding) })
            .attr('width', this.legendSquareSize)
            .attr('height', this.legendSquareSize)
            .attr('fill', d => colorScale(d))
            .attr('stroke', 'black')
            .attr('stroke-width', 5)

        legendWrapper.selectAll('.legend_labels')
            .data(buildingTypes)
            .enter()
            .append('text')
            .attr('class', 'legend_labels')
            .attr('x', this.minX + this.legendSquareSize * 1.3)
            .attr('y', function (d, i) { return legendBottomY - i * (that.legendSquareSize + that.legendPadding) + (that.legendSquareSize / 2) })
            .attr('fill', 'black')
            .text(d => d)
            .attr("dominant-baseline", "central")
            .attr('font-size', this.legendFontSize)

        // Draw the participants
        let participants = this.wrapper.append("g")
            .attr("class", "participants_wrapper")
            .selectAll("circle")
            .data(participantsData)
            .enter()
            .append("circle")
            .attr("cx", d => d.locationX)
            .attr("cy", d => -d.locationY)
            .attr("r", 40)
            .attr("fill", CONSTANTS.ACTIVE_COLOR)
            .attr("stroke", "black")
            .attr("stroke-width", 5)

        // Implement brushing on participants
        d3.select(".participants_wrapper").call(d3.brush().on('end', ({ selection }) => {
            if (selection) {
                const [[x0, y0], [x1, y1]] = selection
                participants.attr('fill', CONSTANTS.INACTIVE_COLOR)
                    .filter(d => x0 <= d.locationX && d.locationX <= x1 && y0 <= -d.locationY && -d.locationY <= y1)
                    .attr('fill', CONSTANTS.ACTIVE_COLOR)
            } else {
                participants.attr('fill', CONSTANTS.ACTIVE_COLOR)
            }

            // Inform downstream cells that the selection has changed.
            // this.wrapper.property('value', value).dispatch('input')
        }))

    }
}
