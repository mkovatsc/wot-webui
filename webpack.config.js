'use strict';

const path = require('path'),
  fs = require('fs'),
  webpack = require('webpack'),
  merge = require('webpack-merge'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  ExtractTextPlugin = require('extract-text-webpack-plugin'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  DocsGeneratorPlugin = require('webpack-angular-dgeni-plugin'),
  glob = require('glob'),
  ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
//{ CheckerPlugin } = require('awesome-typescript-loader');

let TARGET = process.env.npm_lifecycle_event;

// If a reference to 'karma' is found on the process arguments, then we should launch webpack in `test` mode
let hasKarmaRef = process.argv.map((arg) => arg.includes('karma')).some((arg) => arg);
if (TARGET === undefined && hasKarmaRef) {
  TARGET = 'test';
}

// Determinate application environment
let configPath = `${__dirname}/src/config`;
let envPos = process.argv.indexOf('--env');
let docEnable = process.argv.indexOf('--docs') !== -1;
let env = (envPos !== -1 && fs.existsSync(`${configPath}/config.${process.argv[++envPos]}.json`)) ? process.argv[envPos] : 'dev';

let common = {

  entry: {
    app: path.join(__dirname, 'src/app/scripts/app.js'),
    rgraph: glob.sync(path.join(__dirname, 'other_components/rgraph/libraries/*.js'))
    // parser: path.join(__dirname, 'parser/bundle-parser.js')
  },
  module: {
    //preLoaders: [],
    rules: [{
      test: /\.js$/,
      use: [{loader: 'ng-annotate-loader'}, {loader: 'babel-loader'}],
      exclude: /node_modules/
    },
      {
        test: /\.html$/,
        use: {loader: 'raw-loader'}
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ng-annotate-loader'
          },
          {
            loader: 'babel-loader'
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      },
      /* {
        test: /\.css$/,
        use: [ {loader: 'style-loader'}, {loader: 'css-loader', options : {importLoaders: 1}}, {loader: 'postcss-loader'} ]
      }, */
      /* {
        test: /\.json$/,
        loader: 'json'
      } */
      {
        test: /\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
        use: {loader: 'file-loader'}
      }]
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'commons',
      chunks: ['rgraph', 'app']
    }),
    new webpack.ContextReplacementPlugin(/typedjson-npm/, 'typed-json.js'),
    new HtmlWebpackPlugin({
      template: './src/public/index.html',
      inject: 'body'
    }),

    new webpack.DefinePlugin({
      'process.env': {
        'ENV_NAME': JSON.stringify(env)
      }
    }),

    new CopyWebpackPlugin([
      {from: 'src/config/i18n'}
    ])/* ,

	new ForkTsCheckerWebpackPlugin() */
  ],

  devServer: {
    contentBase: './src/public',
    stats: 'minimal'
  },

  resolve: {
    alias: {
      'app.config': `${configPath}/config.${env}.json`,
      'other_components': path.join(__dirname, 'other_components')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
};

// Development
if (TARGET !== undefined && TARGET.startsWith('serve')) {
  //console.log("dev env");
  module.exports = merge.smart(common, {
    output: {
      filename: '[name].[hash].js',
      chunkFilename: '[name].[hash].js'
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [{loader: 'style-loader'}, {
            loader: 'css-loader',
            options: {importLoaders: 1}
          }, {loader: 'postcss-loader'}]
        }]
    },
    devtool: 'cheap-module-eval-source-map'
  });
}

// Production
if (TARGET !== undefined && TARGET.startsWith('build')) {
  module.exports = merge.smart(common, {
    output: {
      path: __dirname + '/dist',
      publicPath: '/',
      filename: '[name].[hash].js',
      chunkFilename: '[name].[hash].js'
    },

    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {importLoaders: 1}
              },
              {
                loader: 'postcss-loader'
              }
            ]
          })
        }
      ]
    },

    plugins: [
      new webpack.NoErrorsPlugin(),
      // new webpack.optimize.DedupePlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.optimize.UglifyJsPlugin(),
      new CopyWebpackPlugin([{
        from: __dirname + '/src/public'
      }]),
      new ExtractTextPlugin('[name].[hash].css'),

      new DocsGeneratorPlugin({
        enable       : docEnable,
        staticContent: './docs',
        sources      : {
          include : 'src/app/**/**/*.js',
          basePath: 'src/app'
        },
        output: 'dist-docs'
      })
    ],
  });
}

// Test
if (TARGET !== undefined && (TARGET === 'test' || TARGET === 'test-watch')) {
  module.exports = merge.smart(common, {
    entry: {},

    devtool: 'inline-source-map',

    module: {
      rules: [{
        test: /\.js$/,
        use: [
          {
            loader: 'ng-annotate-loader'
          },
          {
            loader: 'babel-loader',
            options: {
              presets: ['es2015'],
              plugins: ['istanbul']
            }
          }],
        exclude: /node_modules/
      }/*,
      {
        test: /\.css$/,
        use: [{loader: 'style-loader'}, {loader: 'css-loader'}, {loader: 'postcss-loader'}]
      }*/
      ]
    }
  });
}

