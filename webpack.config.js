const path = require('path');
const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// 这里存放两个版本都共用的配置
const baseConfig = {
  entry: './src/openworld.js',
  devtool: false,
  module: {
    rules: [],
  },
};

const productionConfig = {
  ...baseConfig, 
  
  mode: 'production', // 开启生产模式，进行所有优化
  
  output: {
    filename: 'vista.min.js', 
    path: path.resolve(__dirname, 'dist'),
    library: 'vista',
    libraryTarget: 'umd',
    globalObject: 'this',
  },

  optimization: {
    minimize: true, // 明确开启压缩
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            passes: 2,
          },
          mangle: true,
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },

  plugins: [
    // 版权横幅插件
    new webpack.BannerPlugin({
      banner: '/*! vista.js v1.0.0 | (c) github/kohunglee | MIT License */',
      raw: true,
      entryOnly: true,
    }),
    // Brotli 压缩插件
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.min\.js$/, // <-- 注意：只对压缩后的 .min.js 文件进行再压缩
      compressionOptions: { level: 11 },
    }),
  ],
};



const developmentConfig = {
  ...baseConfig,

  mode: 'development', // 开启开发模式，优化可读性
  output: {
    filename: 'vista.js', 
    path: path.resolve(__dirname, 'dist'),
    library: 'vista',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  
  optimization: {
    minimize: false,  // 不压缩
  },
  
  plugins: [
    new webpack.BannerPlugin({
      banner: '/*! vista.js v1.0.0 | (c) kohunglee | MIT License */',
      raw: true,
      entryOnly: true,
    }),
  ],
};


module.exports = [productionConfig, developmentConfig];

/*

npm run build  构造命令

*/