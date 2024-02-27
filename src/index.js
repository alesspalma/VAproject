import 'normalize.css'
import * as d3 from 'd3'
import schools from '../data/Datasets/Attributes/Schools.csv'
// import buildings from '../data/Datasets/Attributes/Buildings.csv'
import apartments from '../data/Datasets/Attributes/Apartments.csv'
import financials from '../data/Datasets/Journals/FinancialJournal.csv'
import './styles/index.scss'
import countBySectors from '../countBySectors.json'
import build from '../buildings_mod.json'
import * as topojson from 'topojson-client'

window.app = (new class {
  constructor() {
    this.d3 = d3
    this.schools = []
    this.movement_data = []
    this.buildings = []
    this.apartments = []
    this.financials = []
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
      timestamp: new Date(row[1]),
      category: row[2],
      amount: +row[3]
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
      // .attr("width", "100%")
      // .attr("height", "100%")
      // .append("g")
      // .attr("transform", "translate(" + (-minX * scale) + "," + (maxY * scale) + ") scale(" + scale + ")")
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

    const addresses = this.apartments.map(d => [d.location.x, -d.location.y])

    // Draw where people live
    const people = svg1.append('g')
      .attr('fill', colors[6])
      .attr('stroke', 'darkgrey')
      .selectAll()
      .data(addresses)
      .join('circle')
      .attr('transform', d => `translate(${d})`)
      .attr('r', 15)

    // Create the brush behavior.
    svg1.call(d3.brush().on('start brush end', ({ selection }) => {
      let value = []
      if (selection) {
        const [[x0, y0], [x1, y1]] = selection
        value = people
          .attr('fill', colors[6])
          // d[0] is x, d[1] is y
          .filter(d => x0 <= d[0] && d[0] < x1 && y0 <= d[1] && d[1] < y1)
          .attr('fill', colors[5])
          .data()
      } else {
        people.attr('fill', colors[6])
      }

      // Inform downstream cells that the selection has changed.
      svg1.property('value', value).dispatch('input')
    }))

    // Legend for the map
    const squareSize = 140
    const legendX = -4700
    const legendY = -200

    svg1.selectAll('squares')
      .data(keys)
      .enter()
      .append('rect')
      .attr('x', legendX)
      .attr('y', function (d, i) { return legendY - i * (squareSize + 20) })
      .attr('width', squareSize)
      .attr('height', squareSize)
      .style('fill', function (d) { return color(d) })

    svg1.selectAll('mylabels')
      .data(keys)
      .enter()
      .append('text')
      .attr('x', legendX + squareSize * 1.2)
      .attr('y', function (d, i) { return legendY - i * (squareSize + 20) + (squareSize / 2) })
      .style('fill', 'black')
      .text(function (d) { return d })
      .attr('text-anchor', 'left')
      .style('alignment-baseline', 'middle')
      .attr('font-size', squareSize - 20)
    // end legend

    // HISTOGRAM
    //  dimensions for the plot
    const histogramWidth = 400
    const histogramHeight = 400
    const margin = { top: 20, right: 20, bottom: 50, left: 60 }
    const innerWidth = histogramWidth - margin.left - margin.right
    const innerHeight = histogramHeight - margin.top - margin.bottom

    // Append SVG
    const svg = this.d3.select('.right').append('svg')
      .attr('width', histogramWidth + margin.left + margin.right)
      .attr('height', histogramHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Aggregate financial for category summing the amount
    const financialByCategory = this.d3.rollup(this.financials, v => this.d3.sum(v, d => Math.abs(d.amount)), d => d.category)
    console.log(financialByCategory)

    // Scale for x-axis
    const xScale = this.d3.scaleBand()
      .domain(financialByCategory.keys().filter(d => d !== undefined))
      .range([0, innerWidth]) // margin.left
      .padding(0.1)

    // Scale for y-axis
    const yScale = this.d3.scaleLinear()
      .domain([0, this.d3.max(financialByCategory, d => d[1])])
      .nice()
      .range([innerHeight, margin.top])

    function financialColours(att) {
      switch (att) {
        case 'Wage':
          return colors[0]
        case 'Shelter':
          return colors[1]
        case 'Education':
          return colors[2]
        case 'RentAdjustment':
          return colors[3]
        case 'Food':
          return colors[4]
        case 'Recreation':
          return colors[5]
        default:
          return 'black'
      }
    }

    // Create the histogram bars
    svg.selectAll('rect')
      .data(financialByCategory)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d[0]))
      .attr('y', d => yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d[1]))
      .attr('fill', d => financialColours(d[0]))

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')

    // Add y-axis
    svg.append('g')
      .call(d3.axisLeft(yScale))
  }
}())

window.app.init()
