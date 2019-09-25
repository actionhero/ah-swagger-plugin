'use strict'
const directoriesToSearch = [process.cwd()]
const actionHeroInstanceIndexPath = require.resolve('actionhero', {
  paths: directoriesToSearch
})
const { Initializer, api } = require(actionHeroInstanceIndexPath)

module.exports = class SwaggerPlugin extends Initializer {
  constructor () {
    super()
    this.name = 'swagger'
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
