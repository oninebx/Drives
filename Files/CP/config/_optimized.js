var path = require('path');
var webpack = require('webpack');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var CompressionPlugin = require('compression-webpack-plugin');
var CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var TerserPlugin = require('terser-webpack-plugin');

var workingDirectory = process.cwd();

module.exports = {
  mode: 'production',
  devtool: false,
  entry: {
    app: ['core-js/stable', 'regenerator-runtime/runtime', 'react', 'react-dom', './src/index.tsx'],
    shell: path.join(workingDirectory, './src/shell/shell-entrypoint.ts')
  },
  output: {
    filename: '[name].[hash].bundle.js',
    chunkFilename: '[name].[hash].chunk.js',
    path: path.join(workingDirectory, 'dist'),
    // necessary for HMR to know where to load the hot update chunks
    publicPath: '/'
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          sourceMap: true
        }
      }),
      new CssMinimizerPlugin()
    ],
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '~',
      name: false,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'initial'
        },
        default: {
          minChunks: 2,
          chunks: 'async',
          reuseExistingChunk: true
        },
        styles: {
          name: 'styles',
          test: /\.css$|.scss$/,
          chunks: 'async',
          reuseExistingChunk: true
        }
      }
    },
    moduleIds: 'deterministic',
    emitOnErrors: true
  },
  plugins: [
    new CleanWebpackPlugin({}),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(workingDirectory, 'locales'),
          to: path.join(workingDirectory, 'dist', 'locales'),
          toType: 'dir'
        }
      ]
    }),
    // Compress (gzip)
    new CompressionPlugin({
      filename: '[path][base].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|css)$/,
      threshold: 0,
      minRatio: 1
    }),
    // environment variables...optimized config should have this set to 'production'
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    }),
    // used optionally to view bundle makeup
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle.report.html',
      defaultSizes: 'gzip',
      openAnalyzer: false
    })
  ]
};
