export const initialisePreStep1 =
  (flags: Computable<FeatureFlags>, enabledMotorMLOB: boolean, policyNumber?: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(formActions.reset(carConstants.modelPath));
    dispatch(formActions.reset(houseConstants.modelPath));
    dispatch(formActions.reset(contentsConstants.modelPath));
    dispatch(formActions.reset(modelPath));
    dispatch(formActions.change(`${modelPath}.loadingPolicies`, true));
    dispatch(formActions.change(`${modelPath}.loadingCatCodes`, true));
    dispatch(formActions.change(`${modelPath}.loadingClaims`, true));

    if (policyNumber) {
      dispatch(formActions.change(`${modelPath}.policyNumber`, policyNumber));
    } else {
      dispatch(formActions.change(`${modelPath}.policyNumber`, null));
    }
    try {
      dispatch(loadActiveCatCodesList());
      dispatch(loadCustomerPolicies(policyNumber, flags, enabledMotorMLOB));
      dispatch(loadCustomerClaims());
    } catch (e) {
      logError(e, 'ui-api-load-prestep1');
      history.push(routes.COMMON.ERROR);
    }
  };

jest.mock('~/feature/claim/shared/state/thunks', () => ({
  ...jest.requireActual('~/feature/claim/shared/state/thunks'),
  initialisePreStep1: (...args: any[]) => initialisePreStep1Mock(...args)
}));