'use strict'
const directoriesToSearch = [process.cwd()]
const actionHeroInstanceIndexPath = require.resolve('actionhero', {
  paths: directoriesToSearch
})
const { Initializer, api } = require(actionHeroInstanceIndexPath)

const buildPath = (route, action, parameters, tags) => {
  const operationId = route ? route.action : action.name
  const info = {
    summary: action.summary || '',
    description: action.description || '',
    operationId: operationId,
    parameters: parameters,
    tags: (Array.isArray(tags) && tags.length > 0 ? tags : undefined)
  }

  if (action.responseSchemas) {
    // TODO: We'll assign the whole thing, but there are swagger bugs/limitations with inline
    // schemas so we'll have to think of an elegant way to reference schemas instead if we
    // want to demonstrate multiple types of responses e.g. 300's, 400's, etc.
    info.responses = action.responseSchemas
  }
  return info
}

module.exports = class SwaggerPlugin extends Initializer {
  constructor () {
    super()
    this.name = 'swagger'
    this.loadPriority = 1000
    this.startPriority = 1000
  }

  async initialize () {
    const config = api.config
    const actions = api.actions.actions

    let actionUrl = 'api'
    let serverIp = api.utils.getExternalIPAddress()
    let serverPort = null

    if (config.servers.web) {
      actionUrl = config.servers.web.urlPathForActions
      serverPort = config.servers.web.port
    }

    if (config.swagger.hostOverride) {
      serverIp = config.swagger.hostOverride
    }

    if (config.swagger.portOverride) {
      serverPort = config.swagger.portOverride
    }

    api.swagger = {
      documentation: {
        openapi: '3.0.0',
        info: {
          title: config.general.serverName,
          description: config.general.welcomeMessage,
          version: '' + config.general.apiVersion
        },

        host: config.swagger.baseUrl || (serverIp + ':' + serverPort),
        // actionPath: '/' + (actionUrl || 'swagger'),
        basePath: '/' + (actionUrl || 'swagger'),
        schemes: ['http'],
        consumes: ['application/json', 'multipart/form-data'],
        produces: ['application/json'],
        paths: {},
        definitions: {},
        parameters: {
          apiVersion: {
            name: 'apiVersion',
            in: 'path',
            required: true,
            type: 'string'
          }
        }
      },
      build: () => {
        const verbs = api.routes.verbs

        for (const actionName in actions) {
          for (const version in actions[actionName]) {
            const action = actions[actionName][version]
            const parameters = []
            const required = []
            const tags = action.tags || []
            // let params = {}

            var definition = api.swagger.documentation.definitions[action.name] = {
              properties: {}
            }

            if (config.swagger.documentSimpleRoutes === false) {
              continue
            }

            // TODO: Should leverage some stuff done below.

            for (const key in action.inputs) {
              if (key === 'required' || key === 'optional') {
                continue
              }
              const input = action.inputs[key]
              api.swagger.documentation.parameters['action_' + action.name + version + '_' + key] = {
                name: key,
                in: input.paramType || 'query',
                type: input.dataType || 'string',
                enum: input.enum || undefined,
                description: input.description || undefined,
                required: input.required
              }
              parameters.push({
                $ref: '#/parameters/action_' + action.name + version + '_' + key
              })
              definition.properties[key] = {
                type: 'string'
              }
              if (input.required) {
                required.push(key)
              }
            }

            if (required.length > 0) {
              definition.required = required
            }

            for (const key in action.headers) {
              const input = action.headers[key]
              api.swagger.documentation.parameters['action_' + action.name + version + '_' + key] = {
                name: key,
                in: 'header',
                type: 'string',
                enum: input.enum || undefined,
                description: input.description || undefined,
                required: input.required
              }
              parameters.push({
                $ref: '#/parameters/action_' + action.name + version + '_' + key
              })
              definition.properties[key] = {
                type: 'string'
              }
              if (input.required) {
                required.push(key)
              }
            }

            if (required.length > 0) {
              definition.required = required
            }

            if (config.swagger.groupBySimpleActionTag) {
              tags.push('actions')
            }

            if (config.swagger.groupByVersionTag) {
              tags.push(version)
            }

            api.swagger.documentation.definitions[action.name + version] = {
              type: 'object',
              properties: action.modelSchema
            }

            if (!api.swagger.documentation.paths['/' + action.name]) {
              api.swagger.documentation.paths['/' + action.name] = {}
            }

            for (let k = 0, len = verbs.length; k < len; k++) {
              const method = verbs[k]

              const params = []
              parameters.forEach(function (p) {
                params.push(p)
              })

              switch (method.toLowerCase()) {
                case 'put':
                case 'post':
                  if (action.modelSchema) {
                    params.push({
                      name: 'body',
                      in: 'body',
                      description: 'Body of the post/put action',
                      schema: {
                        $ref: '#/definitions/action_' + action.name + version
                      }
                    })
                  } else {
                    params.push({
                      name: 'body',
                      in: 'body',
                      description: 'Body of the post/put action',
                      schema: {
                        type: 'object'
                      }
                    })
                  }
                  break
                default:
                  break
              }

              api.swagger.documentation.paths['/' + action.name][method] = buildPath(null, action, params, tags)
            }
          }
        }

        if (config.routes && config.swagger.documentConfigRoutes !== false) {
          for (const method in config.routes) {
            const routes = config.routes[method]
            for (let l = 0, len1 = routes.length; l < len1; l++) {
              const route = routes[l]

              let shouldSkip = false
              for (let i = 0; i < config.swagger.ignoreRoutes.length; ++i) {
                shouldSkip = (route.path.indexOf(config.swagger.ignoreRoutes[i]) >= 0)
                if (shouldSkip) { break }
              }
              if (shouldSkip) { continue }

              const actionByVersion = actions[route.action]
              for (const version in actionByVersion) {
                const action = actionByVersion[version]
                const parameters = []
                const required = []

                const tags = action.tags || []
                for (const i in config.swagger.routeTags) {
                  for (const r in config.swagger.routeTags[i]) {
                    if (route.path.indexOf(config.swagger.routeTags[i][r]) > 0) {
                      tags.push(i)
                      break
                    }
                  }
                }

                if (config.swagger.groupByVersionTag) {
                  tags.push(version)
                }

                // This works well for simple query paths etc, but we need some additional checks
                // for any routes since a lot of parameters may overlap.

                const params = {}

                const path = route.path.replace(/\/:([\w]*)/g, function (match, p1) {
                  if (p1 === 'apiVersion') {
                    return '/' + version
                  }
                  // If p1 (the parameter) is already included in the path, skip it since it'll
                  // be handled in the route-centric format anyway.
                  if (typeof action.inputs[p1] !== 'undefined' && action.inputs[p1] !== null) {
                    params[p1] = true
                    return '/{' + p1 + '}'
                  }

                  parameters.push({
                    $ref: '#/parameters/' + route.action + version + '_' + p1 + '_path'
                  })
                  api.swagger.documentation.parameters[route.action + version + '_' + p1 + '_path'] = {
                    name: p1,
                    in: 'path',
                    type: 'string'
                  }
                  return '/{' + p1 + '}'
                })

                if (!api.swagger.documentation.paths['' + path]) {
                  api.swagger.documentation.paths['' + path] = {}
                }

                for (const key in action.inputs) {
                  if (key === 'required' || key === 'optional') {
                    continue
                  }
                  const input = action.inputs[key]

                  // Unlike simple routes above, we'll need to distinguish between a path type
                  // (param for url portion) and then a query type (param for query string).

                  const paramType = input.paramType || (params[key] ? 'path' : 'query')
                  const paramStr = route.action + version + '_' + paramType + '_' + key
                  if (input.paramType !== 'body') {
                    api.swagger.documentation.parameters[paramStr] = {
                      name: key,
                      in: input.paramType || (params[key] ? 'path' : 'query'),
                      type: input.dataType || 'string',
                      enum: input.enum || undefined,
                      description: input.description || undefined,
                      required: input.required
                    }
                    parameters.push({
                      $ref: '#/parameters/' + paramStr
                    })
                    definition.properties[key] = {
                      type: 'string'
                    }
                    if (input.required) {
                      required.push(key)
                    }
                  }
                }

                if (required.length > 0) {
                  definition.required = required
                }

                for (const key in action.headers) {
                  const input = action.headers[key]
                  api.swagger.documentation.parameters[route.action + version + '_' + key] = {
                    name: key,
                    in: 'header',
                    type: 'string',
                    enum: input.enum || undefined,
                    description: input.description || undefined,
                    required: input.required
                  }
                  parameters.push({
                    $ref: '#/parameters/' + route.action + version + '_' + key
                  })
                  definition.properties[key] = {
                    type: 'string'
                  }
                  if (input.required) {
                    required.push(key)
                  }
                }

                if (required.length > 0) {
                  definition.required = required
                }

                api.swagger.documentation.definitions[action.name + version] = {
                  type: 'object',
                  properties: action.modelSchema
                }

                switch (method.toLowerCase()) {
                  case 'put':
                  case 'post':
                    if (action.modelSchema) {
                      parameters.push({
                        name: 'body',
                        in: 'body',
                        description: 'Body of the post/put action',
                        schema: {
                          $ref: '#/definitions/' + action.name + version
                        }
                      })
                    } else {
                      parameters.push({
                        name: 'body',
                        in: 'body',
                        description: 'Body of the post/put action',
                        schema: {
                          type: 'object'
                        }
                      })
                    }
                    break
                  default:
                    break
                }

                if (method.toLowerCase() === 'all') {
                  var verbsLength = verbs.length
                  for (let m = 0; m < verbsLength; m++) {
                    api.swagger.documentation.paths['' + path][verbs[m]] = buildPath(route, action, parameters, tags)
                  }
                } else {
                  api.swagger.documentation.paths['' + path][method] = buildPath(route, action, parameters, tags)
                }
              }
            }
          }
        }
      }
    }
  }

  async start () {
    api.swagger.build()
  }
}
