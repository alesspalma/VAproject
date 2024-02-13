import 'normalize.css'
import * as d3 from 'd3'

import './styles/index.scss'

window.app = (new class {
  constructor () {
    this.d3 = d3
    this.data = []
  }

  async init () {
    // await someFunctionThatLoadData
    // Initialize your app
  }
}())

window.app.init()
