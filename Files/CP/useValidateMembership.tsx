import { XBrandId } from "~/common/state";
import { partnerService } from "~/common/state/services";
import useApi from "~/feature/quote/shared/hooks/useApi";


const useValidateMembership = (handleValidate: (success: boolean) => void) => {

  const { data, error, loading, refetch } = useApi(
    (agencyCode: string, membershipId: string) => partnerService.validateMembership(XBrandId,
      { body: { agencyCode, membershipId } }), {
    immediate: false,
    initialParams: ['', ''],
    onSuccess: (response) => {
      handleValidate(response.valid);
    },
  });
  return { data, error, loading, refetch };
};

export default useValidateMembership;