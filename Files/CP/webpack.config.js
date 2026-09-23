/* eslint-disable no-var,  @typescript-eslint/no-var-requires, strict, prefer-arrow-callback */
'use strict';
process.noDeprecation = true;

var envConfig = require('./src/envConfig');

module.exports = async function (env, argv) {
  process.env.NODE_ENV = argv.mode;
  process.env.brand = process.env.brand || 'twr';
  process.env.variant = process.env.variant || '';
  process.env.brandFullName = envConfig.getBrandFullName();
  process.env.brandMetaTitle = envConfig.getBrandMetaTitle();
  process.env.brandPhone = envConfig.getBrandPhone();
  process.env.brandPhoneQ2BError = envConfig.getBrandPhoneQ2BError();
  process.env.brandPhoneQ2BSupport = envConfig.getBrandPhoneQ2BSupport();
  process.env.brandPhoneQ2BUnderwritingError = envConfig.getBrandPhoneQ2BUnderwritingError();
  process.env.brandCustomerServicePhone = envConfig.getCustomerServicePhone();
  process.env.brandPhoneClaims = envConfig.getBrandPhoneClaims();
  process.env.renewalsPhone = envConfig.getRenewalsPhone();
  process.env.brandMessengerUrl = envConfig.getBrandMessengerUrl();
  process.env.brandMessengerName = envConfig.getBrandMessengerName();
  process.env.brandContactUsEmail = envConfig.getBrandContactUsEmail();
  process.env.brandCountryName = envConfig.getBrandCountryName();
  process.env.brandWordPressUrl = envConfig.getBrandWordPressUrl();
  process.env.AUTH0_TENANT =
    env && env.auth0_tenant ? env.auth0_tenant : process.env.AUTH0_TENANT ? process.env.AUTH0_TENANT : '';

  if (process.env.template === 'hostedPage') {
    return require(`./config/templates/webpack.templates.hostedPage.js`);
  } else if (process.env.template === 'email') {
    return require(`./config/templates/webpack.templates.email.js`);
  }
  return require(`./config/webpack.${argv.mode}.js`);
};
