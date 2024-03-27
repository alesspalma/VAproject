import * as d3 from 'd3'
import CONSTANTS from './constants'
import { performPCA } from './utils.js'
import { performActivitiesPCA } from './utils.js'

export default class PCAChart {
  constructor() {
    this.dimensions = {
      margin: {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
      }
    }
    this.selectedCluster = null
    this.legendVerticalPadding = 18
  }

  async initChart(sel, data, isActivitiesView) {
    const { width, height } = sel.node().getBoundingClientRect()
    const { margin } = this.dimensions
    this.dimensions.width = width
    this.dimensions.height = height
    this.dimensions.boundedWidth = width - margin.left - margin.right
    this.dimensions.boundedHeight = height - margin.top - margin.bottom
    this.isActivitiesView = isActivitiesView

    this.svg = sel.append('svg')
      .attr('class', 'PCAChart_wrapper')
      .attr('width', this.dimensions.width)
      .attr('height', this.dimensions.height)

    this.bounds = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    this.xAxisContainer = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top + this.dimensions.boundedHeight / 2})`)
    this.yAxisContainer = this.svg.append('g')
      .attr('transform', `translate(${margin.left + this.dimensions.boundedWidth / 2}, ${margin.top})`)

    this.xScale = d3.scaleLinear()
      .range([0, this.dimensions.boundedWidth])
    this.yScale = d3.scaleLinear()
      .range([this.dimensions.boundedHeight, 0])

    if (!isActivitiesView) {
      var participantsId = data.map(d => d.participantId)
      var pcaData = await this._performPCACall(participantsId)
    } else {
      var venueId = data.map(d => d.venueId)
      var pcaData = await this._performPCACall(venueId)
    }

    const xExtent = d3.extent(pcaData, d => d.x)
    const yExtent = d3.extent(pcaData, d => d.y)

    const maxExtent = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]), Math.abs(yExtent[0]), Math.abs(yExtent[1]))
    this.xScale.domain([-maxExtent, maxExtent])
    this.yScale.domain([-maxExtent, maxExtent])

    this.xAxisContainer.call(d3.axisBottom(this.xScale))
    this.yAxisContainer.call(d3.axisLeft(this.yScale))

    this.symbolType = d3.scaleOrdinal()
      .domain(d3.range(7))
      .range(d3.symbolsFill.map(s => d3.symbol().type(s).size(150)()))
    this.symbolTypeLegend = d3.scaleOrdinal()
      .domain(d3.range(7))
      .range(d3.symbolsFill.map(s => d3.symbol().type(s).size(75)()))

    // Draw the legend
    let legendWrapper = this.svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .attr('class', 'legend_wrapper')

    legendWrapper.selectAll('.legend_symbol')
      .data(d3.range(d3.max(pcaData, d => d.c) + 1))
      .enter()
      .append('path')
      .attr('class', 'legend_symbol')
      .attr("d", d => this.symbolTypeLegend(d + 1))
      .attr('transform', (d, i) => `translate(${this.dimensions.boundedWidth - 70}, ${this.dimensions.boundedHeight - 5 - i * this.legendVerticalPadding})`)
      .attr('fill', "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)

    legendWrapper.selectAll('.legend_label')
      .data(d3.range(d3.max(pcaData, d => d.c) + 1))
      .enter()
      .append('text')
      .attr('class', 'legend_label')
      .attr('x', this.dimensions.boundedWidth - 60)
      .attr('y', (d, i) => this.dimensions.boundedHeight - i * this.legendVerticalPadding)
      .text(d => "Cluster " + (d + 1))
      .attr('font-size', '15px')

    if (!isActivitiesView) {
      let that = this
      this.circles = this.bounds.selectAll('pca_points')
        .data(pcaData, d => d.participantId)
        .enter()
        .append('path')
        .attr("d", d => this.symbolType(d.c + 1))
        .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
        .attr('fill', CONSTANTS.ACTIVE_COLOR)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        // for the tooltip
        .on('mouseover', function (event, d) {
          d3.select('#tooltip').style('opacity', 1).text('ID: ' + d.participantId)
        })
        .on('mouseout', function () {
          d3.select('#tooltip').style('opacity', 0)
        })
        .on('mousemove', function (event) {
          d3.select('#tooltip').style('left', (event.pageX - 45) + 'px').style('top', (event.pageY - 30) + 'px')
        })
        .on('click', function (event, d) {
          if (that.selectedCluster === d.c) {
            that.selectedCluster = null

            // remove highlight to everything because I just deselected the cluster
            that.circles.attr("stroke", "black")
              .attr("stroke-width", 1)

            CONSTANTS.DISPATCHER.call('userSelection', null, { participantId: null })
          }
          else {
            that.selectedCluster = d.c

            that.circles.attr("stroke", "black")
              .attr("stroke-width", 1)

            // highlight the selected cluster
            let selectedCircles = that.circles.filter(innerD => innerD.c === d.c)
            selectedCircles.attr("stroke", CONSTANTS.PCA_SELECTION_COLOR)
              .attr("stroke-width", 1.5)
              .raise()
            CONSTANTS.DISPATCHER.call('userSelection', null, { participantId: selectedCircles.data().map(d => d.participantId) })
          }
        })
    } else {
      let that = this
      this.stars = this.bounds.selectAll('pca_points')
        .data(pcaData, d => d.venueId)
        .enter()
        .append('path')
        .attr("d", d => this.symbolType(d.c + 1))
        .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
        .attr('fill', d => (d.venueType == 0) ? CONSTANTS.MAP_TO_COLOR["Pub"] : CONSTANTS.MAP_TO_COLOR["Restaurant"])
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        // for the tooltip
        .on('mouseover', function (event, d) {
          d3.select('#tooltip').style('opacity', 1).text('ID: ' + d.venueId)
        })
        .on('mouseout', function () {
          d3.select('#tooltip').style('opacity', 0)
        })
        .on('mousemove', function (event) {
          d3.select('#tooltip').style('left', (event.pageX - 45) + 'px').style('top', (event.pageY - 30) + 'px')
        })
        .on('click', function (event, d) {
          if (that.selectedCluster === d.c) {
            that.selectedCluster = null

            // remove highlight to everything because I just deselected the cluster
            that.stars.attr("stroke", "black")
              .attr("stroke-width", 1)

            CONSTANTS.DISPATCHER.call('userSelection', null, { venueId: null })
          }
          else {
            that.selectedCluster = d.c

            that.stars.attr("stroke", "black")
              .attr("stroke-width", 1)

            // highlight the selected cluster
            let selectedStars = that.stars.filter(innerD => innerD.c === d.c)
            selectedStars.attr("stroke", CONSTANTS.PCA_SELECTION_COLOR)
              .attr("stroke-width", 1.5)
              .raise()
            CONSTANTS.DISPATCHER.call('userSelection', null, { venueId: selectedStars.data().map(d => d.venueId) })
          }
        })
    }

  }

  async _performPCACall(participantsId) {
    let pcaData;
    const pcaPromise = this.isActivitiesView ? performActivitiesPCA(participantsId) : performPCA(participantsId);
    let idName = this.isActivitiesView ? 'venueId' : 'participantId';
    await pcaPromise.then(transformedData => {
      pcaData = transformedData.map(row => ({
        [idName]: +row[0],
        x: +row[1],
        y: +row[2],
        z: +row[3],
        venueType: +row[transformedData[0].length - 2],
        c: +row[transformedData[0].length - 1]
      })
      );
    });
    return pcaData;
  }

  async updateChart(participantsId) {

    let pcaData = await this._performPCACall(participantsId)

    // update scales
    const xExtent = d3.extent(pcaData, d => d.x)
    const yExtent = d3.extent(pcaData, d => d.y)

    const maxExtent = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]), Math.abs(yExtent[0]), Math.abs(yExtent[1]))
    this.xScale.domain([-maxExtent, maxExtent])
    this.yScale.domain([-maxExtent, maxExtent])

    this.xAxisContainer
      .transition()
      .duration(CONSTANTS.TRANSITION_DURATION)
      .call(d3.axisBottom(this.xScale))
    this.yAxisContainer
      .transition()
      .duration(CONSTANTS.TRANSITION_DURATION)
      .call(d3.axisLeft(this.yScale))

    if (!this.isActivitiesView) {
      // update circles
      let that = this
      this.circles = this.circles
        .data(pcaData, d => d.participantId)
        .join(
          enter => enter.append('path')
            .attr("d", d => this.symbolType(d.c + 1))
            .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
            .attr('fill', CONSTANTS.ACTIVE_COLOR)
            .attr("stroke", "black")
            // tooltip
            .on('mouseover', function (event, d) {
              d3.select('#tooltip').style('opacity', 1).text('ID: ' + d.participantId)
            })
            .on('mouseout', function () {
              d3.select('#tooltip').style('opacity', 0)
            })
            .on('mousemove', function (event) {
              d3.select('#tooltip').style('left', (event.pageX - 45) + 'px').style('top', (event.pageY - 30) + 'px')
            })
            .on('click', function (event, d) {
              if (that.selectedCluster === d.c) {
                that.selectedCluster = null

                // remove highlight to everything because I just deselected the cluster
                that.circles.attr("stroke", "black")
                  .attr("stroke-width", 1)

                CONSTANTS.DISPATCHER.call('userSelection', null, { participantId: null })
              }
              else {
                that.selectedCluster = d.c

                that.circles.attr("stroke", "black")
                  .attr("stroke-width", 1)

                // highlight the selected cluster
                let selectedCircles = that.circles.filter(innerD => innerD.c === d.c)
                selectedCircles.attr("stroke", CONSTANTS.PCA_SELECTION_COLOR)
                  .attr("stroke-width", 1.5)
                  .raise()
                CONSTANTS.DISPATCHER.call('userSelection', null, { participantId: selectedCircles.data().map(d => d.participantId) })
              }
            })
            .attr('opacity', 0)
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr('opacity', 1),
          update => update.attr('opacity', 1)
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr("d", d => this.symbolType(d.c + 1))
            .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
            .attr('opacity', 1),
          exit => exit.remove()
        )
    } else {
      // update stars
      let that = this
      this.stars = this.stars
        .data(pcaData, d => d.venueId)
        .join(
          enter => enter.append('path')
            .attr("d", d => this.symbolType(d.c + 1))
            .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
            .attr('fill', d => (d.venueType == 0) ? CONSTANTS.MAP_TO_COLOR["Pub"] : CONSTANTS.MAP_TO_COLOR["Restaurant"])
            .attr("stroke", "black")
            // tooltip
            .on('mouseover', function (event, d) {
              d3.select('#tooltip').style('opacity', 1).text('ID: ' + d.venueId)
            })
            .on('mouseout', function () {
              d3.select('#tooltip').style('opacity', 0)
            })
            .on('mousemove', function (event) {
              d3.select('#tooltip').style('left', (event.pageX - 45) + 'px').style('top', (event.pageY - 30) + 'px')
            })
            .on('click', function (event, d) {
              if (that.selectedCluster === d.c) {
                that.selectedCluster = null

                // remove highlight to everything because I just deselected the cluster
                that.stars.attr("stroke", "black")
                  .attr("stroke-width", 1)

                CONSTANTS.DISPATCHER.call('userSelection', null, { venueId: null })
              }
              else {
                that.selectedCluster = d.c

                that.stars.attr("stroke", "black")
                  .attr("stroke-width", 1)

                // highlight the selected cluster
                let selectedStars = that.stars.filter(innerD => innerD.c === d.c)
                selectedStars.attr("stroke", CONSTANTS.PCA_SELECTION_COLOR)
                  .attr("stroke-width", 1.5)
                  .raise()
                CONSTANTS.DISPATCHER.call('userSelection', null, { venueId: selectedStars.data().map(d => d.venueId) })
              }
            })
            .attr('opacity', 0)
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr('opacity', 1),
          update => update.attr('opacity', 1)
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr("d", d => this.symbolType(d.c + 1))
            .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
            .attr('fill', d => (d.venueType == 0) ? CONSTANTS.MAP_TO_COLOR["Pub"] : CONSTANTS.MAP_TO_COLOR["Restaurant"])
            .attr('opacity', 1),
          exit => exit.remove()
        )
    }
  }
}
