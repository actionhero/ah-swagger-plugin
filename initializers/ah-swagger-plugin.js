'use strict'

const { Initializer, api } = require('actionhero')

module.exports = class SwaggerPlugin extends Initializer {
  constructor () {
    super()
    this.name = 'swaggerJson'
    this.loadPriority = 1000
    this.startPriority = 1000
  }

  async initialize () {
    api.swagger = {}
    api.swagger.documentation = {}
    api.swagger.generateDoc = async () => ({})
  }

  async start () {
    await api.swagger.generateDoc()
  }
}
