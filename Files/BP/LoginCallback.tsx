import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useCustomerResolution } from '~/auth/AuthProvider';
import { Spinner } from '~/common/components/base';
import routes from '~/common/state/routes';

const showGenericError = () => {
  const errorPath = `${window.location.origin}${routes.COMMON.ERROR}`
  window.location.replace(errorPath);
};

export const LoginCallback = () => {
  const { handleCallback } = useAuth();
  const { matchCustomer } = useCustomerResolution();
  const navigate = useNavigate();
  const calledRef = useRef(false);
  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    const run = async () => {
      try {
        const returnTo = await handleCallback();
        console.log('Return to URL:', returnTo);
        const customerNumber = await matchCustomer();
        console.log('Customer number:', customerNumber);
        if(!customerNumber) {
          showGenericError();
        } else {

        }
        navigate(returnTo, { replace: true });
      } catch (error) {
        // We simply log the error, and the global error dialog is also considered.
        console.error('Error handling callback:', error);
      }
    };
    run();
  }, [handleCallback, matchCustomer, navigate]);
  return <Spinner fullPage={true} />;
};

export default LoginCallback;
