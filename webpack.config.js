const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const devMode = process.env.NODE_ENV !== 'production'
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
      },
      {
        test: /\.css$/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
          options: {
            // you can specify a publicPath here
            // by default it uses publicPath in webpackOptions.output
            publicPath: (resourcePath, context) => {
              // publicPath is the relative path of the resource to the context
              // e.g. for ./css/admin/main.css the publicPath will be ../../
              // while for ./css/main.css the publicPath will be ../
              return path.relative(path.join(__dirname, 'public-src/swagger'), context) + '/'
            },
            hmr: devMode
          }
        }, 'css-loader']
      }
    ]
  },
  resolve: { extensions: ['*', '.js', '.jsx', '.html'] },
  output: {
    path: path.resolve(__dirname, 'public/swagger'),
    publicPath: devMode ? '../../public/swagger' : '/swagger/',
    filename: '[name]-bundle.min.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'public-src/public'),
    port: 3000,
    publicPath: 'http://localhost:3000/public/swagger',
    hotOnly: true
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, 'public-src/public/index.html')
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // all options are optional
      filename: devMode ? '[name].css' : '[name].css',
      chunkFilename: devMode ? '[id].css' : '[id].css',
      ignoreOrder: false // Enable to remove warnings about conflicting order
    })
  ]
}
