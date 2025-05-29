const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
const env = dotenv.config().parsed || {};

// Create a new object with all environment variables prefixed with REACT_APP_
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

// Add default environment variables for browser compatibility
envKeys['process.env.NODE_ENV'] = JSON.stringify(process.env.NODE_ENV || 'development');
envKeys['process.env.REACT_APP_VOICE_RECORDING_SERVICE_URL'] = JSON.stringify(
  env.REACT_APP_VOICE_RECORDING_SERVICE_URL || 'http://localhost:8013'
);
envKeys['process.env.REACT_APP_USE_MOCK_SERVICES'] = JSON.stringify(
  env.REACT_APP_USE_MOCK_SERVICES || 'false'
);

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      components: path.resolve(__dirname, 'src/components/'),
      pages: path.resolve(__dirname, 'src/pages/'),
      assets: path.resolve(__dirname, 'src/assets/'),
      utils: path.resolve(__dirname, 'src/utils/'),
      store: path.resolve(__dirname, 'src/store/'),
      types: path.resolve(__dirname, 'src/types/'),
      hooks: path.resolve(__dirname, 'src/hooks/'),
      services: path.resolve(__dirname, 'src/services/')
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  devServer: {
    historyApiFallback: true,
    port: process.env.PORT || 3000, // Use PORT environment variable or default to 3000
    host: '0.0.0.0', // Allow external connections
    hot: true,
    open: false, // Don't automatically open browser in Docker
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
      logging: 'verbose', // More detailed logging
    },
    // Add static content
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },
  },
  // Use polling to avoid file descriptor limit issues
  watchOptions: {
    poll: 1000,
    aggregateTimeout: 300,
    ignored: /node_modules/,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      // Inject environment variables into the HTML
      templateParameters: {
        env: JSON.stringify(env),
      },
    }),
    // Define environment variables for the client-side code
    new webpack.DefinePlugin(envKeys),
  ],
};
