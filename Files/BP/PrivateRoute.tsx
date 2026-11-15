import React, { useEffect } from "react";
import type { ComponentType } from "react";
import { useAuth } from "~/auth/AuthProvider";
import { useNavigate } from "react-router";
import { Spinner } from '~/common/components/base';

interface PrivateRouteProps {
  component?: ComponentType;
}

const PrivateRoute = ({ component }: PrivateRouteProps) => {

  const { hasError, isAuthenticated, isLoading, strategyType, getLoginUrl, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (strategyType === 'oidc' && !hasError) {
        login({ type: strategyType });
      } else {
        const { path, isInner } = getLoginUrl(strategyType);
        isInner ? navigate(path) : window.location.href = path;
      }
    }
  }, [isAuthenticated, hasError, login, getLoginUrl, strategyType]);

  if (isLoading || !isAuthenticated) {
    return <Spinner fullPage hideRest />
  }

  return component;
};

export { PrivateRoute };