import 'normalize.css'
import * as d3 from 'd3'
import schools from '../data/Datasets/Attributes/Schools.csv'
// import buildings from '../data/Datasets/Attributes/Buildings.csv'
import apartments from '../data/Datasets/Attributes/Apartments.csv'
import home from '../atHome.csv'
import financials from '../AggregatedFinancialJournal.csv'
import './styles/index.scss'
import countBySectors from '../countBySectors.json'
import build from '../buildings_mod.json'
import * as topojson from 'topojson-client'
import BarChart from './BarChart'
import PCAChart from './PCAChart'
import pca from '../PCA.csv'

window.app = (new class {
  constructor() {
    this.d3 = d3
    this.schools = []
    this.movement_data = []
    this.buildings = []
    this.apartments = []
    this.financials = []
    this.homes = []
    this.pca_data = []
  }

  async init() {
    // Convert the array of arrays into an array of objects
    this.schools = schools.slice(1).map(row => ({
      schoolId: +row[0],
      monthlyCost: +row[1],
      maxEnrollment: +row[2],
      location: row[3],
      buildingId: +row[4]
    }))

    // Parse location from string to object
    this.schools.forEach(d => {
      const [lon, lat] = d.location.match(/-?\d+\.\d+/g).map(Number)
      d.location = { x: lon, y: lat }
    })

    this.buildings = build

    this.homes = home.slice(1).map(row => ({
      date: row[0],
      participantId: +row[2],
      apartmentId: +row[6]
    }))

    this.apartments = apartments.slice(1).map(row => ({
      apartmentId: +row[0],
      rentalCost: +row[1],
      maxOccupancy: +row[2],
      numberOfRooms: +row[3],
      location: row[4],
      buildingId: +row[5]
    }))

    this.apartments.forEach(d => {
      const [lon, lat] = d.location.match(/-?\d+\.\d+/g).map(Number)
      d.location = { x: lon, y: lat }
    })

    this.financials = financials.slice(1).map(row => ({
      participantId: +row[0],
      category: row[1],
      amount: +row[2]
    })).filter(d => d.category !== 'Wage')

    console.log(this.financials)

    this.pca_data = pca.slice(1).map(row => ({
      participantId: +row[0],
      x: +row[1],
      y: +row[2],
      z: +row[3]
    }))

    console.log('init done!')

    // Call function to create visualization
    this.createVisualization()
  }

  createVisualization() {
    const width = 8000
    const height = 8200

    const keys = ['Commercial', 'Residential', 'School', 'Pub', 'Restaurant']
    const colors = ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(255,127,0)', 'rgb(152,78,163)', 'rgb(77,175,74)', 'rgb(255,255,51)', 'rgb(166,86,40)']
    const color = d3.scaleOrdinal()
      .domain(keys)
      .range(colors)

    function buildingColours(att) {
      switch (att) {
        case 'Commercial':
          return colors[0]
        case 'Residential':
          return colors[1]
        case 'School':
          return colors[2]
        case 'Pub':
          return colors[3]
        case 'Restaurant':
          return colors[4]
        default:
          return 'black'
      }
    }

    const mainContainer = this.d3.select('.left')

    const zoom = d3.zoom().scaleExtent([1, 1 << 3]).extent([[0, 0], [width, height]]).translateExtent([[0, 0], [width, height]]).on('zoom', zoomed)

    const minX = -5000
    const maxY = -8000
    // const scale = 0.095

    const svg1 = mainContainer.append('svg')
      // .attr('width', '100%')
      // .attr('height', '100%')
      // .append('g')
      // .attr('transform', 'translate(' + (-minX * scale) + ',' + (maxY * scale) + ') scale(' + scale + ')')
      .attr('viewBox', [minX, maxY, width, height])

    // Create a projection that flips the Y axis.
    const projection = d3.geoTransform({
      point: function (x, y) {
        this.stream.point(x, -y)
      }
    })

    const path = d3.geoPath().projection(projection)

    // Set the buildings colors
    svg1.append('g')
      .selectAll('path')
      .data(topojson.feature(this.buildings, this.buildings.objects.buildings).features)
      .join('path')
      .attr('fill', d => buildingColours(d.properties.buildingType))
      .attr('d', path)

    // Draw the buildings
    svg1.append('path')
      .datum(topojson.merge(this.buildings, this.buildings.objects.buildings.geometries))
      .attr('fill', 'none')
      .attr('d', path)

    // Draw the edge of the buildings
    svg1.append('path')
      .datum(topojson.mesh(this.buildings, this.buildings.objects.buildings))
      .attr('fill', 'none')
      .attr('stroke', 'darkgrey')
      .attr('stroke-linejoin', 'round')
      .attr('d', path)

    // zooming stuff
    mainContainer.call(zoom)
    function zoomed(event) {
      const { transform } = event
      // apply calculated transform to the image
      svg1.attr('transform', transform.toString())
    }

    // Legend for the map
    const squareSize = 140
    const legendX = -4700
    const legendY = -200
    const legendPad = 20

    svg1.selectAll('squares')
      .data(keys)
      .enter()
      .append('rect')
      .attr('x', legendX)
      .attr('y', function (d, i) { return legendY - i * (squareSize + legendPad) })
      .attr('width', squareSize)
      .attr('height', squareSize)
      .style('fill', function (d) { return color(d) })

    svg1.selectAll('mylabels')
      .data(keys)
      .enter()
      .append('text')
      .attr('x', legendX + squareSize * 1.2)
      .attr('y', function (d, i) { return legendY - i * (squareSize + legendPad) + (squareSize / 2) })
      .style('fill', 'black')
      .text(function (d) { return d })
      .attr('text-anchor', 'left')
      .style('alignment-baseline', 'middle')
      .attr('font-size', squareSize - legendPad)
    // end legend

    // Create a tooltip SVG text element
    const tooltip = d3.select('body').append('div')
      .attr('id', 'tooltip')
      .attr('style', 'position: absolute; opacity: 0;')

    // join the apartmentId from apartments with the apartmentId of the homes
    this.homes.filter(d => ((!isNaN(d.apartmentId)) && (d.apartmentId !== 0))).forEach(d => {
      const apartment = this.apartments.find(a => a.apartmentId === d.apartmentId)
      d.location = { x: apartment.location.x, y: -apartment.location.y }
    })

    // Draw where people live
    const people = svg1.append('g')
      .attr('fill', colors[6])
      .attr('stroke', 'darkgrey')
      .selectAll()
      .data(this.homes.filter(d => d.location !== undefined))
      .join('circle')
      .attr('transform', d => `translate(${d.location.x},${d.location.y})`)
      .attr('r', 15)
    // .on('mouseover', function (event, d) {
    //   console.log(d)
    //   d3.select('#tooltip').transition().duration(200).style('opacity', 1).text(d.participantId)
    // })
    // .on('mouseout', function () {
    //   d3.select('#tooltip').style('opacity', 0)
    // })
    // .on('mousemove', function (event) {
    //   d3.select('#tooltip').style('left', (event.pageX + 10) + 'px').style('top', (event.pageY + 10) + 'px')
    // })

    console.log(people)

    // HISTOGRAM
    // Aggregate financial for category summing the amount
    let financialByCategory = this.d3.rollup(this.financials, v => this.d3.sum(v, d => Math.abs(d.amount)), d => d.category)

    const bc = new BarChart()
    bc.initChart(d3.select('.right'), financialByCategory)

    // PCA Chart
    const pcaChart = new PCAChart(d3.select('.right'), this.pca_data)

    // Create the brush behavior.
    svg1.call(d3.brush().on('end', ({ selection }) => {
      let value = []
      if (selection) {
        const [[x0, y0], [x1, y1]] = selection
        value = people
          .attr('fill', colors[6])
          .filter(d => x0 <= d.location.x && d.location.x <= x1 && y0 <= d.location.y && d.location.y <= y1)
          .attr('fill', colors[5])
        // filter financials by participantId and aggregate by category summing the amount for the selected people
        financialByCategory = this.d3.rollup(this.financials.filter(p => value.data().map(d => d.participantId).includes(p.participantId)), v => this.d3.sum(v, d => Math.abs(d.amount)), d => d.category)
        console.log(financialByCategory)
        // bc.updateChart(financialByCategory)
        // pcaChart.updateChart(this.pca_data.filter(p => value.data().map(d => d.participantId).includes(p.participantId)))
        setTimeout(() => {
          financialByCategory = this.d3.rollup(this.financials.filter(p => value.data().map(d => d.participantId).includes(p.participantId)), v => this.d3.sum(v, d => Math.abs(d.amount)), d => d.category)
          bc.updateChart(financialByCategory)
          pcaChart.updateChart(this.pca_data.filter(p => value.data().map(d => d.participantId).includes(p.participantId)))
        }, 200)
      } else {
        people.attr('fill', colors[6])
        financialByCategory = this.d3.rollup(this.financials, v => this.d3.sum(v, d => Math.abs(d.amount)), d => d.category)
        bc.updateChart(financialByCategory)
        pcaChart.updateChart(this.pca_data)
      }

      // Inform downstream cells that the selection has changed.
      svg1.property('value', value).dispatch('input')
    }))
  }
}())

window.app.init()
