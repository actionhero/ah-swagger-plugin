'use strict'
const directoriesToSearch = [process.cwd()]
const actionHeroInstanceIndexPath = require.resolve('actionhero', {
  paths: directoriesToSearch
})
const { api, Action } = require(actionHeroInstanceIndexPath)

module.exports = class SwaggerAction extends Action {
  constructor () {
    super()
    this.name = 'swagger'
    this.description = 'I will provide the JSON that can be consumed by the swagger UI'
    this.outputExample = { swagger: '2.0' }
  }

  async run (data) {
    data.response = api.swagger.documentation
  }
}
