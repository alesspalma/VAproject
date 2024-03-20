import * as d3 from 'd3'
import CONSTANTS from './constants.js';

export default class MapPlot {
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
        this.toolboxData = new Map([["Engagement, Ohio, USA", ""], ["Participants selected: ", 0], ["Avg Engel's coeff: ", 0]])
    }

    initChart(sel, buildingsData, participantsData, isActivitiesView) {
        const { width, height } = sel.node().getBoundingClientRect()
        const { margin } = this.dimensions
        this.dimensions.width = width
        this.dimensions.height = height
        this.dimensions.boundedWidth = width - margin.left - margin.right // real internal width
        this.dimensions.boundedHeight = height - margin.top - margin.bottom // real internal height

        this.wrapper = sel.append('svg')
            .attr('class', 'map_wrapper')
            // .attr('width', this.dimensions.width)
            // .attr('height', this.dimensions.height)
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
        const colorScale = d3.scaleOrdinal()
            .domain(CONSTANTS.BUILDING_TYPES)
            .range(CONSTANTS.BUILDINGS_COLORS)

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
            .attr("d", d => pathMap(d.location))
            .attr("stroke", "black")
            .attr("stroke-width", 5)
            .attr("fill", d => colorScale(d.buildingType))

        // Draw the legend
        const legendBottomY = -this.minY - margin.bottom - this.legendSquareSize - this.legendPadding
        let that = this

        let legendWrapper = this.wrapper.append('g').attr('class', 'legend_wrapper')
        legendWrapper.selectAll('.legend_square')
            .data(CONSTANTS.BUILDING_TYPES)
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
            .data(CONSTANTS.BUILDING_TYPES)
            .enter()
            .append('text')
            .attr('class', 'legend_labels')
            .attr('x', this.minX + this.legendSquareSize * 1.3)
            .attr('y', function (d, i) { return legendBottomY - i * (that.legendSquareSize + that.legendPadding) + (that.legendSquareSize / 2) })
            .attr('fill', 'black')
            .text(d => d)
            .attr("dominant-baseline", "central")
            .attr('font-size', this.legendFontSize)

        if (!isActivitiesView) {
            legendWrapper.append('circle')
                .attr('class', 'legend_circle')
                .attr('cx', this.minX + this.legendSquareSize / 2)
                .attr('cy', legendBottomY - 5 * (this.legendSquareSize + this.legendPadding) + (this.legendSquareSize / 2))
                .attr('r', (this.legendSquareSize / 2) - 5)
                .attr('fill', CONSTANTS.ACTIVE_COLOR)
                .attr('stroke', 'black')
                .attr('stroke-width', 5)

            legendWrapper.append('text')
                .attr('class', 'legend_labels')
                .attr('x', this.minX + this.legendSquareSize * 1.3)
                .attr('y', legendBottomY - 5 * (this.legendSquareSize + this.legendPadding) + (this.legendSquareSize / 2))
                .attr('fill', 'black')
                .text('Participant')
                .attr("dominant-baseline", "central")
                .attr('font-size', this.legendFontSize)

            // Draw the participants
            this.participants = this.wrapper.append("g")
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
                    // Inform dispatcher that the selection has changed
                    CONSTANTS.DISPATCHER.call('userSelection', null, { locationX: [x0, x1], locationY: [-y1, -y0] });
                } else {
                    // Inform dispatcher that the selection has changed
                    CONSTANTS.DISPATCHER.call('userSelection', null, { locationX: null, locationY: null });
                }
            }))

            // Create a toolbox group of text elements in the top right corner
            this.toolboxData.set("Participants selected: ", participantsData.length)
            this.toolboxData.set("Avg Engel's coeff: ", d3.mean(participantsData, d => d.engels).toFixed(2))
            this.toolbox = this.wrapper.append('g')
                .attr('class', 'toolbox')
                .selectAll('text')
                .data(this.toolboxData)
                .enter()
                .append('text')
                .attr('x', this.maxX - 2500)
                .attr('y', (d, i) => -this.maxY + 100 + i * 300)
                .attr('fill', 'black')
                .text(d => d[0] + d[1].toString())
                .attr('font-size', 200)
                .attr('font-weight', 700)
        }
        else {
            // legendWrapper.append('circle')
            //     .attr('class', 'legend_circle')
            //     .attr('cx', this.minX + this.legendSquareSize / 2)
            //     .attr('cy', legendBottomY - 5 * (this.legendSquareSize + this.legendPadding) + (this.legendSquareSize / 2))
            //     .attr('r', (this.legendSquareSize / 2) - 5)
            //     .attr('fill', CONSTANTS.BUILDINGS_COLORS[2])
            //     .attr('stroke', 'black')
            //     .attr('stroke-width', 5)

            // legendWrapper.append('circle')
            //     .attr('class', 'legend_circle')
            //     .attr('cx', this.minX + this.legendSquareSize / 2)
            //     .attr('cy', legendBottomY - 6 * (this.legendSquareSize + this.legendPadding) + (this.legendSquareSize / 2))
            //     .attr('r', (this.legendSquareSize / 2) - 5)
            //     .attr('fill', CONSTANTS.BUILDINGS_COLORS[3])
            //     .attr('stroke', 'black')
            //     .attr('stroke-width', 5)

            legendWrapper.append("path")
                .attr("d", d3.symbol().type(d3.symbolStar).size(6000))
                .attr("transform", `translate(${this.minX + this.legendSquareSize / 2}, ${legendBottomY - 5 * (this.legendSquareSize + this.legendPadding) + (this.legendSquareSize / 2)})`)
                .attr('fill', CONSTANTS.BUILDINGS_COLORS[2])
                .attr('stroke', 'black')
                .attr('stroke-width', 10)

            legendWrapper.append("path")
                .attr("d", d3.symbol().type(d3.symbolStar).size(6000))
                .attr("transform", `translate(${this.minX + this.legendSquareSize / 2}, ${legendBottomY - 6 * (this.legendSquareSize + this.legendPadding) + (this.legendSquareSize / 2)})`)
                .attr('fill', CONSTANTS.BUILDINGS_COLORS[3])
                .attr('stroke', 'black')
                .attr('stroke-width', 10)

            legendWrapper.append('text')
                .attr('class', 'legend_labels')
                .attr('x', this.minX + this.legendSquareSize * 1.3)
                .attr('y', legendBottomY - 5 * (this.legendSquareSize + this.legendPadding) + (this.legendSquareSize / 2))
                .attr('fill', 'black')
                .text('Pub')
                .attr("dominant-baseline", "central")
                .attr('font-size', this.legendFontSize)

            legendWrapper.append('text')
                .attr('class', 'legend_labels')
                .attr('x', this.minX + this.legendSquareSize * 1.3)
                .attr('y', legendBottomY - 6 * (this.legendSquareSize + this.legendPadding) + (this.legendSquareSize / 2))
                .attr('fill', 'black')
                .text('Restaurant')
                .attr("dominant-baseline", "central")
                .attr('font-size', this.legendFontSize)

            // Draw the participants
            this.participants = this.wrapper.append("g")
                .attr("class", "activity_wrapper")
                .selectAll("path")
                .data(buildingsData.filter(d => d.buildingType == "Pub" || d.buildingType == "Restaurant"))
                .enter()
                .append("path")
                .attr("d", d3.symbol().type(d3.symbolStar).size(5000))
                .attr("transform", d => {
                    let sumX = 0, sumY = 0, count = 0;
                    for (let i = 0; i < d.location.coordinates[0].length; i++) {
                        sumX += d.location.coordinates[0][i][0];
                        sumY -= d.location.coordinates[0][i][1];
                        count++;
                    }
                    return `translate(${sumX / count}, ${sumY / count})`;
                })
                .attr("fill", d => (d.buildingType == "Pub") ? CONSTANTS.BUILDINGS_COLORS[2] : CONSTANTS.BUILDINGS_COLORS[3])
                .attr("stroke", "black")
                .attr("stroke-width", 10);
        }

    }

    updateChart(participantsData) {

        let participantIds = participantsData.map(d => d.participantId)

        // Update the circles
        this.participants.attr('fill', CONSTANTS.INACTIVE_COLOR)
            .filter(d => participantIds.includes(d.participantId))
            .attr('fill', CONSTANTS.ACTIVE_COLOR)
            .raise()
            .attr('r', 120)
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr('r', 40)

        // Update the toolbox
        this.toolboxData.set("Participants selected: ", participantsData.length)
        this.toolboxData.set("Avg Engel's coeff: ", d3.mean(participantsData, d => d.engels).toFixed(2))
        this.toolbox.data(this.toolboxData)
            .text(d => d[0] + d[1].toString())
    }
}
