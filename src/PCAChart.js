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
    this.colors = ['rgb(127,201,127)', 'rgb(240,2,127)', 'rgb(191,91,23)', 'rgb(102,102,102)']
    this.selectedCluster = null
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

    if (!isActivitiesView) {
      let that = this
      this.circles = this.bounds.selectAll('circle')
        .data(pcaData, d => d.participantId)
        .enter()
        .append('circle')
        .attr('cx', d => this.xScale(d.x))
        .attr('cy', d => this.yScale(d.y))
        .attr('r', 5)
        .attr('fill', d => this.colors[d.c])
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
            CONSTANTS.DISPATCHER.call('userSelection', null, { participantId: selectedCircles.data().map(d => d.participantId) })
          }
        })
    } else {
      let that = this
      this.stars = this.bounds.selectAll('stars')
        .data(pcaData, d => d.venueId)
        .enter()
        .append('path')
        .attr("d", d3.symbol().type(d3.symbolStar).size(100))
        .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
        .attr('fill', d => this.colors[d.c])
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
          enter => enter.append('circle')
            .attr('cx', d => this.xScale(d.x))
            .attr('cy', d => this.yScale(d.y))
            .attr('fill', d => this.colors[d.c])
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
                CONSTANTS.DISPATCHER.call('userSelection', null, { participantId: selectedCircles.data().map(d => d.participantId) })
              }
            })
            .attr('r', 0)
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr('r', 5),
          update => update
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr('cx', d => this.xScale(d.x))
            .attr('cy', d => this.yScale(d.y))
            .attr('fill', d => this.colors[d.c])
            .attr('r', 5),
          exit => exit.remove()
        )
    } else {
      // update stars
      let that = this
      this.stars = this.stars
        .data(pcaData, d => d.venueId)
        .join(
          enter => enter.append('path')
            .attr("d", d3.symbol().type(d3.symbolStar).size(100))
            .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
            .attr('fill', d => this.colors[d.c])
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
                CONSTANTS.DISPATCHER.call('userSelection', null, { venueId: selectedStars.data().map(d => d.venueId) })
              }
            })
            .attr('r', 0)
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr('r', 5),
          update => update
            .transition()
            .duration(CONSTANTS.TRANSITION_DURATION)
            .attr("transform", d => `translate(${this.xScale(d.x)}, ${this.yScale(d.y)})`)
            .attr('fill', d => this.colors[d.c]),
          exit => exit.remove()
        )
    }
  }
}
