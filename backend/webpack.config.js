const path = require('path');

module.exports = (options, webpack) => {
  return {
    ...options,
    externals: [],
    module: {
      rules: [
        ...(options.module?.rules || []),
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
    resolve: {
      ...options.resolve,
      extensionAlias: {
        '.js': ['.ts', '.js'],
        '.mjs': ['.mts', '.mjs'],
      },
    },
    output: {
      ...options.output,
      path: path.join(__dirname, 'dist'),
      filename: 'main.js',
    },
  };
};
