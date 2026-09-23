/**
 * Config for building Auth0 hosted pages, not part of the React app.
 */
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
var HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;
var HtmlWebpackSkipAssetsPlugin = require('html-webpack-skip-assets-plugin').HtmlWebpackSkipAssetsPlugin;
var { CleanWebpackPlugin } = require('clean-webpack-plugin');

var workingDirectory = process.cwd();
var pageTitle = 'Insurance';
if (process.env.brand === 'twr') {
  pageTitle = 'Tower Insurance';
}

module.exports = {
  entry: './src/templates/' + process.env.templateFile + '.scss',
  output: {
    path: path.join(workingDirectory, 'src/templates/build'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader',
            options: {
              additionalData: `$brand: ${process.env.brand};`
            }
          }
        ]
      },
      {
        test: /\.(jpg|png|webp|gif|ani)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 50000
          }
        },
        generator: {
          filename: '[name].[hash:20][ext]'
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new CssMinimizerPlugin(),
    new HtmlWebpackPlugin({
      filename: process.env.templateFile + '.' + process.env.brand + '.html',
      template: 'src/templates/' + process.env.templateFile + '.' + process.env.brand + '.html.liquid',
      title: pageTitle,
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
