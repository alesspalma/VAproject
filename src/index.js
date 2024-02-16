import 'normalize.css'
import * as d3 from 'd3'
import loadedData from '../data/Datasets/Attributes/Schools.csv'
import './styles/index.scss'
import movement from '../movement_split16.csv'

window.app = (new class {
  constructor() {
    this.d3 = d3
    this.data = []
    this.movement_data = []
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

    console.log(movement.slice(0, 10))
    this.movement_data = movement.map(row => (
      {
        time: row[0],
        x: +row[1],
        y: +row[2],
        id: +row[3]
      }
    ))
    console.log(this.movement_data.slice(0, 10))

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

    // Select the main container
    const mainContainer = this.d3.select('#main')

    // SVG dimensions
    const margin = { top: 20, right: 20, bottom: 50, left: 50 }
    const width = 800 - margin.left - margin.right
    const height = 600 - margin.top - margin.bottom

    // Create SVG
    const svg = mainContainer.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const xScale = this.d3.scaleLinear()
      .domain([this.d3.min(this.movement_data, d => d.x) - 50, this.d3.max(this.movement_data, d => d.x) + 50])
      .range([0, width])

    const yScale = this.d3.scaleLinear()
      .domain([this.d3.min(this.movement_data, d => d.y) - 50, this.d3.max(this.movement_data, d => d.y) + 50])
      .range([height, 0])

    // Draw circles
    svg.selectAll('circle')
      .data(this.movement_data)
      .enter().append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 2)

    // Add labels
    // svg.selectAll('text')
    //   .data(this.movement_data)
    //   .enter().append('text')
    //   .attr('x', d => xScale(d.monthlyCost) + 10)
    //   .attr('y', d => yScale(d.maxEnrollment) + 5)
    //   .text(d => `School ${d.schoolId}`)

    // Add axes
    const xAxis = this.d3.axisBottom(xScale)
    const yAxis = this.d3.axisLeft(yScale)

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)

    svg.append('g')
      .call(yAxis)

    // Add axis labels
    svg.append('text')
      .attr('transform', `translate(${width / 2},${height + margin.top + 20})`)
      .style('text-anchor', 'middle')
      .text('X')

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Y')
  }
}())

window.app.init()
