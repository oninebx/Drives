const path = require('path');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const portfinder = require('portfinder');

const workingDirectory = process.cwd();

const getConfig = async () => {
  // Webpack does have an 'auto' feature - but Auth0 only allows
  // callbacks from ports 8080, 9000,9001,9002 and 9003
  const port = await Promise.any([
    portfinder.getPortPromise({ port: 8080, stopPort: 8080 }),
    portfinder.getPortPromise({ startPort: 9000, stopPort: 9003 })
  ])

  return {
    mode: 'development',
    devtool: 'source-map',
    entry: {
      app: './src/index.tsx',
      shell: './src/shell/shell-entrypoint.ts'
    },
    output: {
      filename: '[name].bundle.js',
      chunkFilename: '[name].chunk.js',
      path: path.join(workingDirectory, 'dist'),
      // necessary for HMR to know where to load the hot update chunks
      publicPath: '/'
    },
    plugins: [new ReactRefreshWebpackPlugin()],
    devServer: {
      static: [
        {
          directory: path.join(workingDirectory, 'locales'),
          publicPath: '/locales'
        }
      ],
      historyApiFallback: true,
      port,
      hot: true,
      client: {
        overlay: true,
        progress: true
      }
    },
    watchOptions: {
      ignored: ['.idea', 'node_modules']
    },
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'async',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
            chunks: 'all'
          },
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }
    }
  }
};

// This is an exported promise, webpack supports this
module.exports = getConfig()