var webpack = require('webpack');
var devConfig = require('./_dev');
var commonConfig = require('./_common');
var { merge } = require('webpack-merge');

var enviromentalVariables = {
  NODE_ENV: 'development',
  ENABLE_REDUX_DEVTOOLS: true,
  API_ENV: process.env.API_ENV || 'dev1',
  brand: process.env.brand || 'twr',
  variant: process.env.variant || '',
  brandFullName: process.env.brandFullName || '',
  brandPhone: process.env.brandPhone || '',
  brandPhoneQ2BError: process.env.brandPhoneQ2BError || '',
  brandPhoneQ2BSupport: process.env.brandPhoneQ2BSupport || '',
  brandPhoneQ2BUnderwritingError: process.env.brandPhoneQ2BUnderwritingError || '',
  brandCustomerServicePhone: process.env.brandCustomerServicePhone || '',
  brandPhoneClaims: process.env.brandPhoneClaims || '',
  brandMessengerUrl: process.env.brandMessengerUrl || '',
  brandMessengerName: process.env.brandMessengerName || '',
  brandContactUsEmail: process.env.brandContactUsEmail || '',
  brandWordPressUrl: process.env.brandWordPressUrl || '',
  renewalsPhone: process.env.renewalsPhone || '',
  AUTH0_TENANT: process.env.AUTH0_TENANT || ''
};

console.debug('Webpack environment variables: ' + JSON.stringify(enviromentalVariables));

// Define config specific for environment
var config = {
  plugins: [new webpack.EnvironmentPlugin(enviromentalVariables)]
};

// Merge configs and export
const getConfig = async () => {
  return merge(commonConfig, await devConfig, config);
};

// This is an exported promise, webpack supports this
module.exports = getConfig();
