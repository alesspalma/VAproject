import * as d3 from 'd3';
import CONSTANTS from './constants';

export default class ScatterPlot {
  constructor() {
    this.dimensions = {
      margin: {
        top: 30,
        right: 30,
        bottom: 40,
        left: 75
      }
    };
    this.data = [];
  }

  initChart(sel, participantsData) {
    const { width, height } = sel.node().getBoundingClientRect();
    const { margin } = this.dimensions;
    this.dimensions.width = width;
    this.dimensions.height = height;
    this.dimensions.boundedWidth = width - margin.left - margin.right;
    this.dimensions.boundedHeight = height - margin.top - margin.bottom;

    this.wrapper = sel.append('svg')
      .attr('class', 'scatterplot_wrapper')
      .attr('width', this.dimensions.width)
      .attr('height', this.dimensions.height);

    this.scatterWrapper = this.wrapper.append('g')
      .attr('class', 'scatter_wrapper')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.xAxisContainer = this.wrapper.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top + this.dimensions.boundedHeight})`);

    this.yAxisContainer = this.wrapper.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);


    // Draw the x-axis title
    this.xAxisContainer.append('text')
      .attr("text-anchor", "middle")
      .attr('x', this.dimensions.boundedWidth / 2)
      .attr('y', this.dimensions.margin.bottom - 5)
      .attr("font-weight", 700)
      .style("font-size", "16px")
      .text('Joviality')
      .attr('fill', 'black');

    // Draw the y-axis title
    this.yAxisContainer.append('text')
      .attr('x', -this.dimensions.boundedHeight / 2)
      .attr('y', -this.dimensions.margin.left + 20)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .attr("font-weight", 700)
      .style("font-size", "16px")
      .text('Wage')
      .attr('fill', 'black');

    // Extract joviality and wage data
    this.data = participantsData.map(d => ({
      id: d.participantId,
      joviality: d.joviality,
      wage: d.wage
    }));

    const [minJoviality, maxJoviality] = d3.extent(this.data, d => d.joviality);
    const dataPaddingX = 0.01;
    const [minWage, maxWage] = d3.extent(this.data, d => d.wage);
    const dataPaddingY = 0.17 * minWage;
    // Scales
    this.xScale = d3.scaleLinear()
      .domain([0 - dataPaddingX, maxJoviality + dataPaddingX])
      .range([0, this.dimensions.boundedWidth]);

    this.yScale = d3.scaleLinear()
      .domain([minWage - dataPaddingY, maxWage + dataPaddingY])
      .range([this.dimensions.boundedHeight, 0]);

    this.xAxisContainer.call(d3.axisBottom(this.xScale));
    this.yAxisContainer.call(d3.axisLeft(this.yScale));

    // Draw the circles
    this.circles = this.scatterWrapper.selectAll('circle')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('cx', d => this.xScale(d.joviality))
      .attr('cy', d => this.yScale(d.wage))
      .attr('r', 5)
      .attr('fill', CONSTANTS.ACTIVE_COLOR)
      .attr('stroke', 'black')
      .on('mouseover', function (event, d) {
        d3.select('#tooltip').style('opacity', 1).html('ID: ' + d.id + '<br>Joviality: ' + CONSTANTS.NUMBER_FORMATTER.format(d.joviality) + '<br>Wage: ' + CONSTANTS.NUMBER_FORMATTER.format(d.wage));
      })
      .on('mouseout', function () {
        d3.select('#tooltip').style('opacity', 0);
      })
      .on('mousemove', function (event) {
        d3.select('#tooltip').style('left', (event.pageX - 85) + 'px').style('top', (event.pageY - 60) + 'px');
      })
      .on('click', function (event, d) {
        // Your click event logic here
      })
  }


  updateChart(participantsData) {
    // Update data
    this.data = participantsData.map(d => ({
      id: d.participantId,
      joviality: d.joviality,
      wage: d.wage
    }));

    // Update scales
    const [minJoviality, maxJoviality] = d3.extent(this.data, d => d.joviality);
    const dataPaddingX = 0.01;
    const [minWage, maxWage] = d3.extent(this.data, d => d.wage);
    const dataPaddingY = 0.17 * minWage;
    // Scales
    this.xScale.domain([0 - dataPaddingX, maxJoviality + dataPaddingX]);

    this.yScale.domain([minWage - dataPaddingY, maxWage + dataPaddingY])

    this.xAxisContainer
      .transition()
      .duration(CONSTANTS.TRANSITION_DURATION)
      .call(d3.axisBottom(this.xScale))
    this.yAxisContainer
      .transition()
      .duration(CONSTANTS.TRANSITION_DURATION)
      .call(d3.axisLeft(this.yScale))

    // Update circles
    let that = this;
    this.circles = this.scatterWrapper.selectAll('circle')
      .data(this.data)
      .join(
        enter => enter.append('circle')
          .attr('cx', d => this.xScale(d.joviality))
          .attr('cy', d => this.yScale(d.wage))
          .attr('fill', CONSTANTS.ACTIVE_COLOR)
          .attr('stroke', 'black')
          .attr('r', 0)
          .on('mouseover', function (event, d) {
            d3.select('#tooltip').style('opacity', 1).html('ID: ' + d.id + '<br>Joviality: ' + CONSTANTS.NUMBER_FORMATTER.format(d.joviality) + '<br>Wage: ' + CONSTANTS.NUMBER_FORMATTER.format(d.wage));
          })
          .on('mouseout', function () {
            d3.select('#tooltip').style('opacity', 0);
          })
          .on('mousemove', function (event) {
            d3.select('#tooltip').style('left', (event.pageX - 85) + 'px').style('top', (event.pageY - 60) + 'px');
          })
          .on('click', function (event, d) {
            // Your click event logic here
          })
          .transition()
          .duration(CONSTANTS.TRANSITION_DURATION)
          .attr('r', 5),
        update => update
          .transition()
          .duration(CONSTANTS.TRANSITION_DURATION)
          .attr('cx', d => this.xScale(d.joviality))
          .attr('cy', d => this.yScale(d.wage))
          .attr('r', 5),
        exit => exit.remove()
      );
  }

}
