import React from 'react';
import { logError } from '~/common/utilities';
import { loadSpecifiedItems } from '~/feature/claim/contents/state/thunks';
import { loadSpecialFeatures } from '~/feature/claim/house/state/thunks';
import { selectors, thunks } from '~/feature/claim/shared/state';
import { ClaimType, modelPath as sharedModelPath } from '~/feature/claim/shared/state/constants';
import { useAppDispatch, useAppSelector } from '~/root/store';

export const usePreStep1ViewModel = () => {
  const dispatch = useAppDispatch();
  const contentsSpecifiedItems = useAppSelector(selectors.getContentsSpecifiedItems);
  const houseSpecialFeatures = useAppSelector(selectors.getHouseSpecialFeatures);
  const claimSharedState = useAppSelector(selectors.getClaimSharedState);
  const [policyDetailsLoading, setPolicyDetailsLoading] = React.useState(false);
  const [nextLoading, setNextLoading] = React.useState(false);
  const [waterDamageInfoAcknowledged, setWaterDamageInfoAcknowledged] = React.useState(false);

  const getSpecifiedItems = () => {
    if (contentsSpecifiedItems) {
      loadSpecifiedItems(`${sharedModelPath}.contents`, contentsSpecifiedItems);
    }
  };

  const getSpecialFeatures = () => {
    if (houseSpecialFeatures) {
      dispatch(loadSpecialFeatures(`${sharedModelPath}.house`, houseSpecialFeatures));
    }
  };

  const handleContinue = async () => {
    setPolicyDetailsLoading(true);

    dispatch(thunks.resetProductSharedState(sharedModelPath));
    try {
      await dispatch(
        thunks.loadPolicyDetails(
          claimSharedState.policyNumber,
          claimSharedState.eventDate,
          claimSharedState.eventTime,
          claimSharedState.eventTimeAmPm,
          claimSharedState.claimType
        )
      );
    } catch (ex) {
      logError(ex, 'load-policy-claim-error');
    }

    if (claimSharedState.claimType === ClaimType.Contents) {
      getSpecifiedItems();
    }

    if (claimSharedState.claimType === ClaimType.House || claimSharedState.claimType === ClaimType.Landlord) {
      getSpecialFeatures();
    }

    setPolicyDetailsLoading(false);
  };

  return {
    policyDetailsLoading,
    setPolicyDetailsLoading,
    nextLoading,
    setNextLoading,
    waterDamageInfoAcknowledged,
    setWaterDamageInfoAcknowledged,
    getSpecifiedItems,
    getSpecialFeatures,
    handleContinue
  };
};
