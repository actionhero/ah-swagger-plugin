const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: {
    app: ['babel-polyfill', path.join(__dirname, 'public-src', 'index.js')]
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: { presets: ['@babel/env'] }
      }
    ]
  },
  resolve: { extensions: ['*', '.js', '.jsx', '.html'] },
  output: {
    path: path.resolve(__dirname, 'public/swagger'),
    publicPath: '/public/swagger',
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'public/swagger'),
    port: 3000,
    publicPath: 'http://localhost:3000/public/swagger',
    hotOnly: true
  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
}
