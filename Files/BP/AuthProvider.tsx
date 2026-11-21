import React, { createContext, useCallback, useMemo } from "react";
import type { AuthManager } from "./createAuthManager";
import type { AuthResult, AuthStrategyName, LoginCredentials, AuthStatus } from "./types";
import { customerService, getDefaultRequestOptions } from "~/common/state/services";
import { XBrandId } from "~/common/state";
import { logError } from "~/common/utilities/logger";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresLoginPage: boolean;
  login: (strategy?: AuthStrategyName, credentials?: LoginCredentials) => Promise<AuthResult>;
  handleCallback: () => Promise<string>;
  getCustomerId: () => string | null;
  getLoginUrl: () => string;
  getAccessToken: () => string;
  matchCustomer: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  manager: AuthManager;
  children: React.ReactNode;
}

const AuthProvider = ({ manager, children }: AuthProviderProps) => {
  const capturedStrategy = manager.captureAgencyCustomer();
  const [authStatus, setAuthStatus] = React.useState<AuthStatus>('idle');
  const [strategyType, setStrategyType] = React.useState<AuthStrategyName>(capturedStrategy);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  const login = useCallback(async (strategy: AuthStrategyName = 'oidc', credentials?: LoginCredentials): Promise<AuthResult> => {
    try {
      setAuthStatus('authenticating');
      if (strategyType !== strategy) {
        setStrategyType(strategy);
      }
      const result = await manager.login(strategy, credentials);
      return result;
    } catch (error) {
      setAuthStatus('failed');
      throw error;
    }
  }, [manager]);

  const handleCallback = useCallback(async (): Promise<string> => {
    const { tokens, returnTo } = await manager.handleCallback(strategyType);
    if (tokens?.accessToken) {
      setAccessToken(tokens.accessToken);
      console.log('Setting access token:', tokens.accessToken);
      setAuthStatus('authenticated');
    }
    return returnTo;
  }, [manager, strategyType]);

  const getCustomerId = useCallback((): string | null => {
    return manager.getCustomerId();
  }, [manager]);

  const getLoginUrl = useCallback((): string => manager.getLoginUrl(strategyType), [manager, strategyType]);
  const getAccessToken = useCallback((): string | null => {
    console.log('Access token:', accessToken);
    return accessToken;
  }, [accessToken, strategyType]);

  const matchCustomer = useCallback(async (): Promise<string | null> => {

    const correlationId = manager.getCorrelationId();
    const requestOptions = getDefaultRequestOptions({ correlationId });

    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('Access token is not available');
    }

    try {
      const { customerNumber } = await customerService(accessToken).matchCustomer(XBrandId, {
        body: {
          externalReferences: [
            {
              externalId: getCustomerId(),
              referenceType: 'Westpac'
            }
          ]
        },
        requestOptions: requestOptions,
        onResponse: (response: {status: number, bodyAsText: string}) => {
          if (response.status !== 200) {
            throw new Error(response.bodyAsText);
          }
        }
      });
      
      return customerNumber;
    } catch (ex) {
      logError(ex, 'authOIDC.isAuthenticated', '', correlationId);
      // TODO: Logout
      // clearSessionTokens();
      return null;
    }

    // westpac.setKNumber(matchedCustomer.customerNumber);
  }, [manager, getAccessToken]);

  const value = useMemo<AuthContextValue>(() => (
    {
      isAuthenticated: !!accessToken,
      isLoading: authStatus === 'authenticating' || authStatus === 'initializing',
      login,
      handleCallback,
      getCustomerId,
      getLoginUrl,
      matchCustomer,
      getAccessToken,
      requiresLoginPage: strategyType === 'legacy' || authStatus === 'failed'
    }
  ), [strategyType, authStatus, login, handleCallback, getCustomerId, getLoginUrl, getAccessToken, matchCustomer]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const useAuth = () => {
  const { isAuthenticated, isLoading, login, handleCallback, getCustomerId, getLoginUrl, getAccessToken, requiresLoginPage } = useAuthContext();
  return {
    isAuthenticated,
    isLoading,
    requiresLoginPage,
    login,
    handleCallback,
    getCustomerId,
    getLoginUrl,
    getAccessToken
  };
}

const useCustomerResolution = () => {
  const { matchCustomer } = useAuthContext();
  return {
    matchCustomer
  };
};

export {
  AuthProvider,
  useAuth,
  useCustomerResolution
}