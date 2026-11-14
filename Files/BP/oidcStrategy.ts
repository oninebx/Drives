import auth0 from "auth0-js";
import type { AuthAgencyBrand, AuthResult, AuthStrategy, AuthTokens } from "./types";
import { agencyCustomerKeysMap, loginUrlsMap } from "./mappers";
import { routes } from "~/common/state";

interface Auth0Config {
  domain: string;
  clientID: string;
  audience: string;
  connection?: string;
}

const nope = () => { };

const SCOPE = 'openid profile email offline_access';
const REDIRECT_URI = `${location.origin}/callback`;

const createAuth0Strategy = (brand: AuthAgencyBrand, config: Auth0Config): AuthStrategy => {
  const webAuth = new auth0.WebAuth({
    domain: config.domain,
    clientID: config.clientID,
    redirectUri: REDIRECT_URI,
    audience: config.audience,
    scope: SCOPE,
    responseType: 'code'
  });

  return {
    name: 'oidc',
    async login(correlationId, credentials): Promise<AuthResult> {
      if (credentials.type !== this.name) {
        throw new Error('Invalid credentials type');
      }
      console.log(`Logging in with Auth0 using correlationId: ${correlationId} and credentials: ${JSON.stringify(credentials)}`);

      webAuth.authorize({
        // connection: config.connection
        connection: 'twr-sit19-agent-portal-saml',
        scope: SCOPE,
        redirectUri: REDIRECT_URI,
        appState: { returnTo: window.location.href }
      });
      return new Promise(nope);
    },
    handleCallback: async (correlationId: string): Promise<AuthResult> => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (!code || !state) 
      {
        return new Promise((resolve, reject) => reject(new Error('No code or state found in callback')));
      }

      webAuth.validateAuthenticationResponse(
        {},
        {code, state},
        (err, result) => {
          if (err) {
            console.error(`Error validating authentication response: ${err}`);
            return;
          }
          const returnTo = result?.appState?.returnTo || '/';
          
          webAuth.client.oauthToken(
          {
            grantType: 'authorization_code',
            code,
            redirectUri: REDIRECT_URI
          },
          async (err, result) => {
            if (err) {
              console.error(`Error during Auth0 callback: ${err}`);
              return new Promise(nope);
            }

            console.log(`Auth0 callback result: ${JSON.stringify(result)}`);
            return new Promise(nope);
          }
        );
        }
      );
      
    },
    agencyCustomerKeys: agencyCustomerKeysMap[brand],
    loginUrl: process.env.NODE_ENV === 'development' ? routes.AUTH.LOGIN_INTERNAL : loginUrlsMap[brand]
  }
};

export {
  createAuth0Strategy
}