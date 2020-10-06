const path = require('path')

module.exports = {
	mode: 'development',
	entry: './src/index.js',
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './dist',
		proxy: {
			'/ws': {
				target: 'ws://localhost:3000',
				ws: true
			}
		}
	},
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: [
					'file-loader'
				]
			},
			{
				test: /\.worker\.js$/,
				use: { loader: 'worker-loader' }
			}
		]
	}
}
