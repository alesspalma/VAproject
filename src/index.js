import 'normalize.css'
import * as d3 from 'd3'
import loadedData from '../data/Datasets/Attributes/Schools.csv'
// import buildings from '../data/Datasets/Attributes/Buildings.csv'
import apartments from '../data/Datasets/Attributes/Apartments.csv'
import './styles/index.scss'
//import movement from '../movement_split00.csv'
import countBySectors from '../countBySectors.json'
import build from '../buildings.json'
import * as topojson from 'topojson-client'

window.app = (new class {
  constructor() {
    this.d3 = d3
    this.data = []
    this.movement_data = []
    this.buildings = []
    this.apartments = []
  }

  async init() {
    // Convert the array of arrays into an array of objects
    console.log(loadedData)
    this.data = loadedData.slice(1).map(row => ({
      schoolId: +row[0],
      monthlyCost: +row[1],
      maxEnrollment: +row[2],
      location: row[3],
      buildingId: +row[4]
    }))
    console.log(this.data)

    // Parse location from string to object
    this.data.forEach(d => {
      const [lon, lat] = d.location.match(/-?\d+\.\d+/g).map(Number)
      d.location = { x: lon, y: lat }
    })

    // console.log(movement.slice(0, 10))
    // this.movement_data = movement.map(row => (
    //   {
    //     time: row[0],
    //     x: +row[1],
    //     y: +row[2],
    //     id: +row[3]
    //   }
    // ))
    // console.log(this.movement_data.slice(0, 10))

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
    console.log(this.apartments)

    // Call function to create visualization
    this.createVisualization()
  }

  createVisualization() {
    // // Select the main container
    // const mainContainer = this.d3.select('#main')

    // // SVG dimensions
    // const margin = { top: 20, right: 20, bottom: 50, left: 50 }
    // const width = 800 - margin.left - margin.right
    // const height = 600 - margin.top - margin.bottom

    // // Create SVG
    // const svg = mainContainer.append('svg')
    //   .attr('width', width + margin.left + margin.right)
    //   .attr('height', height + margin.top + margin.bottom)
    //   .append('g')
    //   .attr('transform', `translate(${margin.left},${margin.top})`)

    // // Scales
    // const xScale = this.d3.scaleLinear()
    //   .domain([0, this.d3.max(this.data, d => d.monthlyCost) + 10])
    //   .range([0, width])

    // const yScale = this.d3.scaleLinear()
    //   .domain([0, this.d3.max(this.data, d => d.maxEnrollment) + 50])
    //   .range([height, 0])

    // // Draw circles
    // svg.selectAll('circle')
    //   .data(this.data)
    //   .enter().append('circle')
    //   .attr('cx', d => xScale(d.monthlyCost))
    //   .attr('cy', d => yScale(d.maxEnrollment))
    //   .attr('r', 6)

    // // Add labels
    // svg.selectAll('text')
    //   .data(this.data)
    //   .enter().append('text')
    //   .attr('x', d => xScale(d.monthlyCost) + 10)
    //   .attr('y', d => yScale(d.maxEnrollment) + 5)
    //   .text(d => `School ${d.schoolId}`)

    // // Add axes
    // const xAxis = this.d3.axisBottom(xScale)
    // const yAxis = this.d3.axisLeft(yScale)

    // svg.append('g')
    //   .attr('transform', `translate(0,${height})`)
    //   .call(xAxis)

    // svg.append('g')
    //   .call(yAxis)

    // // Add axis labels
    // svg.append('text')
    //   .attr('transform', `translate(${width / 2},${height + margin.top + 20})`)
    //   .style('text-anchor', 'middle')
    //   .text('Monthly Cost')

    // svg.append('text')
    //   .attr('transform', 'rotate(-90)')
    //   .attr('y', 0 - margin.left)
    //   .attr('x', 0 - (height / 2))
    //   .attr('dy', '1em')
    //   .style('text-anchor', 'middle')
    //   .text('Max Enrollment')

    // MAP
    // Select the main container
    // const mainContainer = this.d3.select('#main')

    // // SVG dimensions
    // const margin = { top: 20, right: 20, bottom: 50, left: 50 }
    // const width = 800 - margin.left - margin.right
    // const height = 600 - margin.top - margin.bottom

    // // Create SVG
    // const svg = mainContainer.append('svg')
    //   .attr('width', width + margin.left + margin.right)
    //   .attr('height', height + margin.top + margin.bottom)
    //   .append('g')
    //   .attr('transform', `translate(${margin.left},${margin.top})`)

    // // Scales
    // const xScale = this.d3.scaleLinear()
    //   .domain([this.d3.min(this.movement_data, d => d.x) - 50, this.d3.max(this.movement_data, d => d.x) + 50])
    //   .range([0, width])

    // const yScale = this.d3.scaleLinear()
    //   .domain([this.d3.min(this.movement_data, d => d.y) - 50, this.d3.max(this.movement_data, d => d.y) + 50])
    //   .range([height, 0])

    // // Draw circles
    // svg.selectAll('circle')
    //   .data(this.movement_data)
    //   .enter().append('circle')
    //   .attr('cx', d => xScale(d.x))
    //   .attr('cy', d => yScale(d.y))
    //   .attr('r', 2)

    // // Add axes
    // const xAxis = this.d3.axisBottom(xScale)
    // const yAxis = this.d3.axisLeft(yScale)

    // svg.append('g')
    //   .attr('transform', `translate(0,${height})`)
    //   .call(xAxis)

    // svg.append('g')
    //   .call(yAxis)

    // // Add axis labels
    // svg.append('text')
    //   .attr('transform', `translate(${width / 2},${height + margin.top + 20})`)
    //   .style('text-anchor', 'middle')
    //   .text('X')

    // svg.append('text')
    //   .attr('transform', 'rotate(-90)')
    //   .attr('y', 0 - margin.left)
    //   .attr('x', 0 - (height / 2))
    //   .attr('dy', '1em')
    //   .style('text-anchor', 'middle')
    //   .text('Y')

    // HISTOGRAM
    // Define dimensions for the plot
    // const width = 1600
    // const height = 600
    // const margin = { top: 20, right: 20, bottom: 50, left: 50 }
    // const innerWidth = width - margin.left - margin.right
    // const innerHeight = height - margin.top - margin.bottom

    // // Append SVG
    // const svg = this.d3.select('#main').append('svg')
    //   .attr('width', width + margin.left + margin.right)
    //   .attr('height', height + margin.top + margin.bottom)
    //   .append('g')
    //   .attr('transform', `translate(${margin.left},${margin.top})`)

    // // Scale for x-axis
    // const xScale = d3.scaleBand()
    //   .domain(countBySectors.map(d => d.id))
    //   .range([margin.left, innerWidth])
    //   .padding(0.1)

    // // Scale for y-axis
    // const yScale = d3.scaleLinear()
    //   .domain([0, d3.max(countBySectors, d => d.count)])
    //   .nice()
    //   .range([innerHeight, margin.top])

    // // Create the histogram bars
    // svg.selectAll('rect')
    //   .data(countBySectors)
    //   .enter().append('rect')
    //   .attr('x', d => xScale(d.id))
    //   .attr('y', d => yScale(d.count))
    //   .attr('width', xScale.bandwidth())
    //   .attr('height', d => innerHeight - yScale(d.count))
    //   .attr('fill', 'white')

    // // Add x-axis
    // svg.append('g')
    //   .attr('transform', `translate(0,${innerHeight})`)
    //   .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter(function (d, i) {
    //     return !(i % 10)
    //   })))
    //   .selectAll('text') // select all the text elements for x-axis
    //   .style('text-anchor', 'end') // set text-anchor to end
    //   .attr('dx', '-.8em') // set position of the labels
    //   .attr('dy', '.15em') // set position of the labels
    //   .attr('transform', 'rotate(-45)') // rotate labels by -45 degrees

    // // Add y-axis
    // svg.append('g')
    //   .attr('transform', `translate(${margin.left},0)`)
    //   .call(d3.axisLeft(yScale))

    const width = 8000
    const height = 8200

    const mainContainer = this.d3.select('#main')

    const zoom = d3.zoom().scaleExtent([1, 1 << 10]).extent([[0, 0], [width, height]]).translateExtent([[0, 0], [width, height]]).on('zoom', zoomed)

    const svg1 = mainContainer.append('svg')
      .attr('viewBox', [-5000, -8000, width, height])

    // Create a projection that flips the Y axis.
    const projection = d3.geoTransform({
      point: function (x, y) {
        this.stream.point(x, -y)
      }
    })

    const path = d3.geoPath().projection(projection)

    svg1.append('path')
      .datum(topojson.merge(this.buildings, this.buildings.objects.buildings.geometries))
      .attr('fill', '#ddd')
      .attr('d', path)

    svg1.append('path')
      .datum(topojson.mesh(this.buildings, this.buildings.objects.buildings))
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-linejoin', 'round')
      .attr('d', path)

    mainContainer.call(zoom)
    function zoomed(event) {
      const { transform } = event
      // apply calculated transform to the image
      svg1.attr('transform', transform.toString())
    }

    const addresses = this.apartments.map(d => [d.location.x, -d.location.y])

    svg1.append('g')
      .attr('fill', 'black')
      .attr('stroke', 'black')
      .selectAll()
      .data(addresses)
      .join('circle')
      .attr('transform', d => `translate(${d})`)
      .attr('r', 10)
  }
}())

window.app.init()
