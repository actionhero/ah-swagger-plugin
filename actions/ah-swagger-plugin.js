'use strict'
const { api, Action } = require('actionhero')

module.exports = class SwaggerAction extends Action {
  constructor () {
    super()
    this.name = 'swaggerJson'
    this.description = 'I will provide the JSON that can be consumed by the swagger UI'
    this.outputExample = { swagger: '2.0' }
  }

  async run (data) {
    data.response = api.swagger.documentation
  }
}
