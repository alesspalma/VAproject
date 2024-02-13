import 'normalize.css'
import * as d3 from 'd3'
import loadedData from '../data/Datasets/Attributes/Schools.csv'
import './styles/index.scss'

window.app = (new class {
  constructor() {
    this.d3 = d3
    this.data = []
  }

  async init() {
    // await someFunctionThatLoadData
    // loadedData = await d3.csvParse(await d3.FileAttachment("./Apartments.csv").text())
    console.log(loadedData)
    data = d3.table(loadedData)
    console.log(loadedData.slice(1))
    // Initialize your app
  }
}())

window.app.init()
