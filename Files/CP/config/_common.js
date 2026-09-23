var webpack = require('webpack');
var path = require('path');
var autoprefixer = require('autoprefixer');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var postCssFlexbugsFixes = require('postcss-flexbugs-fixes');
var MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');
var HtmlWebpackInjectPreload = require('@principalstudio/html-webpack-inject-preload');

var envConfig = require('../src/envConfig');
var { DefinePlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

var workingDirectory = process.cwd();
var devMode = process.env.NODE_ENV !== 'production';

module.exports = {
  context: workingDirectory,
  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        loader: require.resolve('babel-loader'),
        options: {
          plugins: [devMode && require.resolve('react-refresh/babel')].filter(Boolean)
        }
      },
      {
        test: /\.(jpg|png|webp|gif|ani)$/,
        type: 'asset'
      },
      {
        test: /\.(woff2?|ttf|otf|eot|svg)$/,
        exclude: [/node_modules/, path.join(workingDirectory, 'src/assets/svg')],
        type: 'asset/resource'
      },
      {
        test: /\.svg(\?.*)?$/, // match img.svg and img.svg?param=value
        exclude: [/node_modules/, path.join(workingDirectory, 'src/assets/fonts')],
        type: 'asset/inline',
        use: ['svg-transform-loader']
      },
      {
        test: /\.(scss?|css)$/,
        use: [
          devMode
            ? {
                loader: 'style-loader',
                options: {
                  singleton: true
                }
              }
            : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1,
              minimize: devMode ? false : true,
              root: path.resolve(__dirname)
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              sourceMap: true,
              plugins: () => [postCssFlexbugsFixes, autoprefixer()]
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              additionalData: `$brand: ${process.env.brand};`,
              sassOptions: {
                silenceDeprecations: [
                  'legacy-js-api',
                  'import',
                  'mixed-decls',
                  'slash-div',
                  'global-builtin',
                  'color-functions',
                  'elseif'
                ]
              }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new MomentTimezoneDataPlugin({
      matchZones: 'Pacific/Auckland'
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    }),
    new HtmlWebpackPlugin({
      title: process.env.brandFullName,
      favicon: './src/assets/favicon/' + process.env.brand + '-favicon.ico',
      template: './src/index.html',
      filename: './index.html',
      chunksSortMode: 'none',
      zopimKey: envConfig.getZopimKey(),
      gtmCode: envConfig.getGtmKey(),
      preload: ['**/*.*']
    }),
    new DefinePlugin({
      'process.env': JSON.stringify(process.env)
    }),
    new HtmlWebpackInjectPreload({
      files: [
        {
          match: /.*shell.*$/,
          attributes: { as: 'script' }
        }
      ]
    }),
    new CopyPlugin({
      patterns: [{ from: 'src/assets/tmp-cdn', to: 'assets' }]
    })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      react: path.resolve(workingDirectory, 'node_modules/react'),
      'react-dom': path.resolve(workingDirectory, 'node_modules/react-dom'),
      '~': path.join(workingDirectory, 'src'),
      '~/': path.join(workingDirectory, 'src'),
      // required for moment to work properly
      moment: 'moment/moment.js'
    },
    modules: ['node_modules', 'src']
  },
  performance: {
    assetFilter: function (filename) {
      return filename.endsWith('.js');
    },
    maxAssetSize: 2500000,
    maxEntrypointSize: 3500000,
    hints: devMode ? false : 'warning'
  }
};
