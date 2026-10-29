import { XBrandId } from "~/common/state";
import { getDefaultRequestOptions, partnerService } from "~/common/state/services";
import { logApiError } from "~/common/utilities";
import useApi from "~/feature/quote/shared/hooks/useApi";
import type { RawResponseCallback } from "@azure/core-client";

const isEmptyObject = (obj: any) => obj && Object.keys(obj).length === 0 && obj.constructor === Object;

const useValidateMembership = (handleValidate: (success: boolean, membershipId: string) => void) => {

  const requestOptions = getDefaultRequestOptions();
  const { data, error, loading, refetch } = useApi(
    (rawResponse: RawResponseCallback, agencyCode: string, membershipId: string) => partnerService.validateMembership(XBrandId,
      { 
        requestOptions: requestOptions,
        body: { agencyCode, membershipId },
        onResponse: rawResponse
      }), {
    immediate: false,
    initialParams: ['', ''],
    checkData: (response) => !isEmptyObject(response),
    onSuccess: (response, params) => {
      const membershipId = params[1];
      handleValidate(response.valid, membershipId);
    },
    onError: (error) => {
      if (error instanceof Error) {
        logApiError(error as Error, 'ui-api-membership-validation', requestOptions);
        // throw new Error('There was an error validating membership', { cause: error });
      }
    }
  });
  return { data, error, loading, refetch };
};

export default useValidateMembership;