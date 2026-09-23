/**
 * Config for building Auth0 email templates, not part of the React app.
 *
 * Currently we need a separate html file per brand, as inline styles for colors & image URLs
 * are used directly in the html file for compatibility with old email clients.
 */
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
var HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;
var HtmlWebpackSkipAssetsPlugin = require('html-webpack-skip-assets-plugin').HtmlWebpackSkipAssetsPlugin;
var { CleanWebpackPlugin } = require('clean-webpack-plugin');

var workingDirectory = process.cwd();

module.exports = {
  entry: './src/templates/EmailCommon.css',
  output: {
    path: path.join(workingDirectory, 'src/templates/build'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new CssMinimizerPlugin(),
    new HtmlWebpackPlugin({
      filename: process.env.templateFile + '.' + process.env.brand + '.html',
      template: 'src/templates/' + process.env.templateFile + '.' + process.env.brand + '.html.liquid',
      minify: {
        collapseWhitespace: false,
        removeComments: false,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        useShortDoctype: true
      }
    }),
    new HtmlWebpackSkipAssetsPlugin({
      skipAssets: [/.js/, (asset) => asset.attributes && asset.attributes['x-skip']]
    }),
    new HTMLInlineCSSWebpackPlugin({
      replace: {
        removeTarget: true,
        target: '<!-- inline_css_plugin -->'
      }
    }),
    new CleanWebpackPlugin({
      protectWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [],
      cleanAfterEveryBuildPatterns: ['**/*.js']
    })
  ],
  devServer: {
    static: {
      directory: path.join(workingDirectory, 'src/templates/build')
    }
  }
};
