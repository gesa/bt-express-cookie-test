const { resolve } = require('path');

module.exports = {
  mode: 'development',
  entry: './src/javascript/index.js',
  output: {
    path: resolve(__dirname, 'public'),
    filename: 'main.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
