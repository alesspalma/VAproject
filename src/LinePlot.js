import * as d3 from 'd3';
import CONSTANTS from './constants';

export default class LinePlot {
  constructor() {
    this.dimensions = {
      margin: {
        top: 30,
        right: 30,
        bottom: 55,
        left: 80
      }
    };
  }

  initChart(sel, data) {
    const { width, height } = sel.node().getBoundingClientRect();
    const { margin } = this.dimensions;
    this.dimensions.width = width;
    this.dimensions.height = height;
    this.dimensions.boundedWidth = width - margin.left - margin.right;
    this.dimensions.boundedHeight = height - margin.top - margin.bottom;

    this.wrapper = sel.append('svg')
      .attr('class', 'lineplot_wrapper')
      .attr('width', this.dimensions.width)
      .attr('height', this.dimensions.height);

    this.lineWrapper = this.wrapper.append('g')
      .attr('class', 'line_wrapper')
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
      .text('Month')
      .attr('fill', 'black');

    // Draw the y-axis title
    this.yAxisContainer.append('text')
      .attr('x', -this.dimensions.boundedHeight / 2)
      .attr('y', -this.dimensions.margin.left + 20)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .attr("font-weight", 700)
      .style("font-size", "16px")
      .text('Earnings ($)') //count
      .attr('fill', 'black');

    const parsedData = this.parseData(data);

    // Scales
    this.xScale = d3.scaleTime()
      .domain(d3.extent(parsedData[0].values, d => d.timestamp))
      .range([0, this.dimensions.boundedWidth]);

    this.yScale = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d3.max(d.values, v => v.earnings))])
      .range([this.dimensions.boundedHeight, 0]);

    this.xAxisContainer.call(d3.axisBottom(this.xScale).tickFormat(d3.timeFormat("%b '%y")))
      .selectAll(".tick text")
      .attr("transform", "rotate(30)")
      .style("text-anchor", "start");
    this.yAxisContainer.call(d3.axisLeft(this.yScale));

    // Draw the lines
    this.line = d3.line()
      .x(d => this.xScale(d.timestamp))
      .y(d => this.yScale(d.earnings));

    this.lineWrapper.selectAll(".line")
      .data(parsedData, d => d.key)
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", d => this.line(d.values))
      .attr("stroke", d => CONSTANTS.MAP_TO_COLOR[d.values[0].venueType])
      .attr("stroke-width", 2)
      .attr("fill", "none");
  }

  parseData(data) {
    const parseDate = d3.timeParse("%Y-%m");
    const mapResult = d3.rollup(
      data,
      v => v.map(d => ({ timestamp: parseDate(d.timestamp), earnings: d.earnings, venueType: d.venueType })), //count
      d => d.venueId
    );

    return Array.from(mapResult, ([key, values]) => ({ key, values })); // array of objects { key: venueId, values: [{month}, ...] }
  }

  updateChart(data) {
    const parsedData = this.parseData(data);

    this.yScale.domain([0, d3.max(parsedData, d => d3.max(d.values, v => v.earnings))]);
    this.yAxisContainer
      .transition()
      .duration(CONSTANTS.TRANSITION_DURATION)
      .call(d3.axisLeft(this.yScale));

    // Draw the lines
    this.line = d3.line()
      .x(d => this.xScale(d.timestamp))
      .y(d => this.yScale(d.earnings));

    this.lineWrapper.selectAll(".line")
      .data(parsedData, d => d.key)
      .join(
        enter => enter.append("path")
          .attr("class", "line")
          .attr("d", d => this.line(d.values))
          .attr("stroke", d => CONSTANTS.MAP_TO_COLOR[d.values[0].venueType])
          .attr("fill", "none")
          .attr("stroke-width", 0)
          .transition()
          .duration(CONSTANTS.TRANSITION_DURATION)
          .attr("stroke-width", 2),
        update => update
          .transition()
          .duration(CONSTANTS.TRANSITION_DURATION)
          .attr("d", d => this.line(d.values))
          .attr("stroke-width", 2),
        exit => exit.remove()
      );
  }
}
