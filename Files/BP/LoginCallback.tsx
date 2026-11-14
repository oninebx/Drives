import React, { useEffect } from 'react';
import { useAuth } from '~/auth/AuthProvider';
import { Spinner } from '~/common/components/base';

export const LoginCallback = () => {
    const { handleCallback, strategyType } = useAuth();
    useEffect(() => {
        const run = async () => {
            try {
                const returnTo = await handleCallback(strategyType);
                window.location.href = returnTo;
            } catch (error) {
                console.error('Error handling callback:', error);
            }
        };
        run();
    }, [handleCallback, strategyType]);
    return <Spinner fullPage={true} />;
};

export default LoginCallback;
