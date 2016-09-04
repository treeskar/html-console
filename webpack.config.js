'use strict';

// webpack --json --profile > stat.json // open in http://webpack.github.io/analyse

var path = require('path'),
	rimraf = require('rimraf'),
	ExtractTextPlugin = require("extract-text-webpack-plugin"),
	HtmlWebpackPlugin = require('html-webpack-plugin'),
	FaviconsWebpackPlugin = require('favicons-webpack-plugin');
	//AssetsPlugin = require('assets-webpack-plugin');

const webpack = require('webpack');
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = 'prod' === NODE_ENV;
const SRC = path.resolve(__dirname, 'src');
const buildPath = __dirname + '/build';
const PORT = 5050;
//process.env.NODE_ENV = NODE_ENV;

module.exports = {
	context: __dirname + '/src',
	entry: {
		index: ['./index'],
		common: [
			`webpack-dev-server/client?http://localhost:${PORT}/`,
			'webpack/hot/only-dev-server',
			// 'react',
			// 'react-dom',
			// 'redux'
		]
	},
	output: {
		path: __dirname + '/build',
		publicPath: '',
		filename: '[name].js?hash=[hash]',
		chunkFilename: '[id].js?hash=[hash]',
		sourceMapFilename: '[file].map?hash=[hash]',
		devtoolModuleFilenameTemplate: function(info){
			return encodeURI(info.resourcePath);
		}
		//library: '[name]'
	},
	externals: {
		window: 'window'
	},
	stats: {
		colors: true,
		reasons: true
	},
	//displayModules: true,
	//watch: NODE_ENV === 'development',
	watchOptions: {
		aggregateTimeout: 100
	},
	devtool: 'source-map', // 'cheap-module-eval-source-map'

	resolve: {
		moduleDirectories: ['node_modules'],
		extensions: ['', '.js', '.scss', '.sass'],
		alias: {}
	},

	resolveLoader: {
		moduleDirectories: ['node_modules'],
		moduleTemplates: ['*-loader', '*'],
		extensions: ['', '.js']
	},

	plugins: [
		// remove previous build
		{
			apply: (compiler) => {
				rimraf.sync(compiler.options.output.path);
			}
		},
		new webpack.NoErrorsPlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false,
				drop_console: true,
				unsafe: true
			}
		}),

		new webpack.optimize.CommonsChunkPlugin({
			name: 'common',
			minChunks: 2
		}),

		new ExtractTextPlugin('[name].css?hash=[contenthash]'),

		new HtmlWebpackPlugin({
			title: 'HTML console',
			filename: __dirname + '/build/index.html',
			template : __dirname + '/src/index.html',
			chunks: ['common', 'index'],
			//chunksSortMode: 'auto',
			inject: true
		}),
		new webpack.HotModuleReplacementPlugin(),
		new FaviconsWebpackPlugin({
			// DOCS: https://github.com/jantimon/favicons-webpack-plugin
			logo: './logo.png',
			prefix: 'icons-[hash]/',
			emitStats: false,
			statsFilename: 'iconstats-[hash].json',
			persistentCache: true,
			inject: true,
			background: '#fff',
			title: 'HTML console',
			// which icons should be generated (see https://github.com/haydenbleasel/favicons#usage)
			icons: {
				android: true,
				appleIcon: isProd,
				appleStartup: isProd,
				coast: isProd,
				favicons: true,
				firefox: isProd,
				opengraph: isProd,
				twitter: isProd,
				yandex: isProd,
				windows: isProd
			}
		})
	],

	module: {
		// preLoaders: [
		// 	{
		// 		test: /\.js$/,
		// 		loader: 'eslint',
		// 		include: path.resolve(__dirname, 'src'),
		// 	}
		// ],
		loaders: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				include: [SRC],
				loader: 'babel',
				query: {
					presets: ['es2015'],
					plugins: ['transform-runtime']
				}
			},
			{
				test: /\.scss$/,
				loader: ExtractTextPlugin.extract('style', 'css!sass?includePaths[]=' + path.resolve(__dirname, './node_modules/compass-mixins/lib'))
			},
			{
				test: /\.(jpg|jpeg|png|gif|svg|ico)$/,
				loader: 'file',
				query: {
					name: '[1][name].[sha1:hash:base64:6].[ext]',
					//regExp: '\/([a-z,\/]+)\/[a-z,0-9]+\..*'
					regExp: '(assets/)'
				}
			},
		]
	},
	eslint: {
		configFile: '.eslintrc'
	},

	devServer: {
		host: 'localhost',
		port: PORT,
		contentBase: buildPath,
		hot: true,
		inline: true
	}
};
