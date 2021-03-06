'use strict'

import webpack from 'webpack'
import base from './base.config.js'
import { each, uniq } from 'lodash'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

/*
|--------------------------------------------------------------------------
| Webpack Server Config
|--------------------------------------------------------------------------
*/
export default function () {
  let config = base.call(this, { isServer: true })

  // env object defined in nuxt.config.js
  let env = {}
  each(this.options.env, (value, key) => {
    env['process.env.' + key] = (typeof value === 'string' ? JSON.stringify(value) : value)
  })

  config = Object.assign(config, {
    target: 'node',
    devtool: false,
    entry: resolve(this.dir, '.nuxt', 'server.js'),
    output: Object.assign({}, config.output, {
      path: resolve(this.dir, '.nuxt', 'dist'),
      filename: 'server-bundle.js',
      libraryTarget: 'commonjs2'
    }),
    plugins: (config.plugins || []).concat([
      new webpack.DefinePlugin(Object.assign(env, {
        'process.env.NODE_ENV': JSON.stringify(this.dev ? 'development' : 'production'),
        'process.BROWSER_BUILD': false,
        'process.SERVER_BUILD': true
      }))
    ])
  })

  // Externals
  const nuxtPackageJson = require('../../package.json')
  const projectPackageJsonPath = resolve(this.dir, 'package.json')
  config.externals = Object.keys(nuxtPackageJson.dependencies || {})
  if (existsSync(projectPackageJsonPath)) {
    try {
      const projectPackageJson = JSON.parse(readFileSync(projectPackageJsonPath))
      config.externals = config.externals.concat(Object.keys(projectPackageJson.dependencies || {}))
    } catch (e) {}
  }
  config.externals = uniq(config.externals)

  // Extend config
  if (typeof this.options.build.extend === 'function') {
    this.options.build.extend(config, {
      dev: this.dev,
      isServer: true
    })
  }
  return config
}
