import * as React from 'react';
import FontIcon from 'react-md/lib/FontIcons/FontIcon';
import { Form } from 'react-redux-form';
import { FormMessage, Html, LoaderButton, Spinner } from '~/common/components/base';
import { routes } from '~/common/state';
import { getFlags } from '~/common/state/selectors';
import {
  BoatDamage,
  BoatFireCause,
  BoatImpact,
  BoatNaturalDisasterCause,
  BoatSubmersion,
  BoatTheft,
  BoatTheftEntry,
  CarGlassOnlyDamage,
  CarNotCoveredMessage,
  CarRecovered,
  CauseOfLoss,
  Damage,
  DamagedWhileParkedCause,
  MultiVehicleAccident,
  NaturalDisasterCause
} from '~/feature/claim/car/components';
import {
  Damage as ContentsDamage,
  FireCause as ContentsFireCause,
  NaturalDisasterCause as ContentsNaturalDisasterCause,
  StolenFrom as ContentsStolenFrom,
  WhereLastRememberHavingItems as ContentsWhereLastRememberHavingItems
} from '~/feature/claim/contents/components';
import {
  Damage as HouseDamage,
  FireCause as HouseFireCause,
  NaturalDisasterCause as HouseNaturalDisasterCause
} from '~/feature/claim/house/components';
import {
  CatastropheEvent,
  CustomerPolicies,
  EventDate,
  EventTime,
  FloatingToolbar
} from '~/feature/claim/shared/components';
import FormFooter from '~/feature/claim/shared/components/dumb/FormFooter/FormFooter';
import { PotentialDuplicateClaim } from '~/feature/claim/shared/components/smart/PotentialDuplicateClaim/PotentialDuplicateClaim';
import { selectors, thunks } from '~/feature/claim/shared/state';
import { ClaimType, modelPath as sharedModelPath } from '~/feature/claim/shared/state/constants';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import { raiseFieldGAEvent } from '~/common/utilities';
import { modelPath as windscreenModelPath } from '~/feature/claim/windscreen/state/constants';
import { useDeconstructedParams } from '~/feature/portal/hooks/useDeconstructedParams';
import { useAppDispatch, useAppSelector } from '~/root/store';
import { usePreStep1ViewModel } from './usePreStep1ViewModel';
import { useTranslation } from 'react-i18next';
import { InformationBox, Typography } from '@tower/tui';
import * as styles from './styles';

export interface PreStep1Props {}

const PreStep1Loader: React.FC<PreStep1Props> = () => {
  const flags = useAppSelector(getFlags);
  const dispatch = useAppDispatch();
  const params = useDeconstructedParams();
  const policyNumber = params.id;
  const { t } = useTranslation();
  const isMotorMlobEnabled: boolean = t('claim:config.enabledMotorMLOB');
  React.useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(thunks.initialisePreStep1(flags, isMotorMlobEnabled, policyNumber));
  }, []);
  return <PreStep1Component />;
};

export const PreStep1Component: React.FC<PreStep1Props> = () => {
  const dispatch = useAppDispatch();
  const {
    policyDetailsLoading,
    handleContinue,
    nextLoading,
    setNextLoading,
    waterDamageInfoAcknowledged,
    setWaterDamageInfoAcknowledged
  } = usePreStep1ViewModel();
  const { t } = useTranslation();
  const claimSharedState = useAppSelector(selectors.getClaimSharedState);
  const policies = useAppSelector(selectors.getCustomerPolicies);
  const nonDigitalPolicies = useAppSelector(selectors.getNonDigitalPolicies);
  const pendingPolicies = useAppSelector(selectors.getPendingPolicies);
  const isDamagedAndBreakInHouseOrLandlord = useAppSelector(selectors.isDamagedAndBreakInHouseOrLandlord);
  const activeCatCodes = useAppSelector(selectors.getActiveCatCodes);
  const isCatEventAnswered = useAppSelector(selectors.isCatEventAnswered);
  const isPolicyNotShownSelected = useAppSelector(selectors.isPolicyNotShownSelected);
  const pacificConfig = t('claim:config.enablePacificMotor');
  const isPolicyIneligibleForSSPClaimSelected = useAppSelector((state) =>
    selectors.isPolicyIneligibleForSSPClaimSelected(state, pacificConfig)
  );
  const isEisPolicySelected = useAppSelector(selectors.isEISPolicySelected);
  const showContentsDamage = useAppSelector(selectors.showContentsDamage);
  const showContentsStolenFrom = useAppSelector(selectors.showContentsStolenFrom);
  const showContentsWhereLastRememberHavingItems = useAppSelector(selectors.showContentsWhereLastRememberHavingItems);
  const isCannotClaimOnline = useAppSelector(selectors.isCannotClaimOnline);
  const showContinuePreClaim = useAppSelector(selectors.showContinuePreClaim);
  const policyDetailsLoaded = useAppSelector(selectors.policyDetailsLoaded);
  const catEventStartDate = useAppSelector(selectors.getSelectedCatEventStartDate);
  const catEventEndDate = useAppSelector(selectors.getSelectedCatEventEndDate);
  const showMotorDamage = useAppSelector(selectors.showDamage);
  const showBoatDamage = useAppSelector(selectors.showBoatDamage);
  const showBoatImpact = useAppSelector(selectors.showBoatImpact);
  const showBoatTheft = useAppSelector(selectors.showBoatTheft);
  const showBoatTheftEntry = useAppSelector(selectors.showBoatTheftEntry);
  const showBoatSubmersion = useAppSelector(selectors.showBoatSubmersion);
  const showBoatNaturalDisaster = useAppSelector(selectors.showBoatNaturalDisaster);
  const showBoatFire = useAppSelector(selectors.showBoatFire);
  const selectedCatEvent = useAppSelector(selectors.getSelectedCatEvent);
  const showNaturalDisasterCause = useAppSelector(selectors.showNaturalDisasterCause);
  const showHouseDamage = useAppSelector(selectors.showHouseDamage);
  const showContentsNaturalDisasterCause = useAppSelector(selectors.showContentsNaturalDisasterCause);
  const showHouseNaturalDisasterCause = useAppSelector(selectors.showHouseNaturalDisasterCause);
  const isClaimPreStep1PageValid = useAppSelector(selectors.isClaimPreStep1PageValid);
  const showCarGlassOnlyDamage = useAppSelector(selectors.showCarGlassOnlyDamage);
  const hideCauseOfLossInCatEvent = useAppSelector(selectors.hideCauseOfLossInCatEvent);
  const disableContinuePreClaim = useAppSelector(selectors.disableContinuePreClaim);
  const showMultiVehicleAccident = useAppSelector(selectors.showMultiVehicleAccident);
  const showDamagedWhileParkedCause = useAppSelector(selectors.showDamagedWhileParkedCause);
  const showCarRecovered = useAppSelector(selectors.showCarRecovered);
  const showContentsFireCause = useAppSelector(selectors.showContentsFireCause);
  const showHouseFireCause = useAppSelector(selectors.showHouseFireCause);
  const isHouseKeysClaim = useAppSelector(selectors.isHouseKeysClaim);
  const isMotorKeysClaim = useAppSelector(selectors.isMotorKeysClaim);
  const isCannotClaimForPolicyOnline = useAppSelector(selectors.isCannotClaimForPolicyOnline);
  const isWindscreenClaim = useAppSelector(selectors.isWindscreenClaim);
  const potentialDuplicateClaim = useAppSelector(selectors.getPotentialDuplicateClaim);
  const potentialDuplicateClaimDialogDismissed = useAppSelector(selectors.getPotentialDuplicateClaimDialogDismissed);
  const isWaterDamageClaim = useAppSelector(selectors.isWaterDamageClaim);
  const showWaterDamageInformationBox = t('claim:config.showWaterDamageInformationBox');
  const showWaterInfoLink = t('claim:config.showWaterInfoLink');

  const claimType = claimSharedState.claimType;

  if (claimSharedState.loadingPolicies || claimSharedState.loadingCatCodes || claimSharedState.loadingClaims) {
    return <Spinner fullPage />;
  }
  return (
    <div className="container md-grid">
      <div id="PreStep1" className="claim-pre-step md-cell md-cell--12">
        <Form model={sharedModelPath} hideNativeErrors className="claim-form claim-form--page1" validateOn="change">
          <h2 className="page-heading2">{t('claim:preStep1.heading.title')}</h2>
          <div className="page-description">
            <p>{t('claim:preStep1.heading.description')}</p>
            <p>{t('claim:preStep1.heading.additionalDescription')}</p>
          </div>
          <CustomerPolicies
            modelPath={sharedModelPath}
            policies={policies}
            nonDigitalPolicies={nonDigitalPolicies}
            pendingPolicies={pendingPolicies}
          />

          {isEisPolicySelected &&
            !isPolicyNotShownSelected &&
            !isPolicyIneligibleForSSPClaimSelected &&
            !!activeCatCodes && <CatastropheEvent modelPath={sharedModelPath} claimType={claimType} />}

          {(!activeCatCodes || (!!activeCatCodes && isCatEventAnswered)) &&
            isEisPolicySelected &&
            !isPolicyNotShownSelected &&
            !isPolicyIneligibleForSSPClaimSelected && (
              <>
                <EventDate startDate={catEventStartDate} endDate={catEventEndDate} />
                <EventTime />
              </>
            )}

          {showContinuePreClaim &&
            isEisPolicySelected &&
            !isPolicyNotShownSelected &&
            !isPolicyIneligibleForSSPClaimSelected && (
              <LoaderButton
                id="btnContinue"
                className="md-btn--outline md-btn--outline-tertiary"
                disabled={disableContinuePreClaim}
                pending={policyDetailsLoading}
                type="button"
                onClick={handleContinue}>
                <label>{t('claim:button.continuePreClaim')}</label>
                <FontIcon>arrow_forward</FontIcon>
              </LoaderButton>
            )}

          {potentialDuplicateClaim && !potentialDuplicateClaimDialogDismissed && policyDetailsLoaded && (
            <PotentialDuplicateClaim />
          )}

          {!hideCauseOfLossInCatEvent && policyDetailsLoaded && (
            <CauseOfLoss modelPath={sharedModelPath} claimType={claimType} />
          )}

          {selectors.isClaimTypeMotor(claimType) && (
            <>
              {showMotorDamage && !selectedCatEvent && <Damage modelPath={sharedModelPath} />}
              {showMultiVehicleAccident && <MultiVehicleAccident />}
              {showDamagedWhileParkedCause && <DamagedWhileParkedCause modelPath={sharedModelPath} />}
              {showNaturalDisasterCause && !selectedCatEvent && <NaturalDisasterCause modelPath={sharedModelPath} />}
              {showCarRecovered && <CarRecovered claimType={claimSharedState.claimType} />}
              {showCarGlassOnlyDamage && (
                <CarGlassOnlyDamage modelPath={sharedModelPath} eventType={selectedCatEvent.type} />
              )}
              {selectedCatEvent && <CarNotCoveredMessage eventType={selectedCatEvent.type} />}
              {/* Boat specific questions */}
              {showBoatDamage && !selectedCatEvent && <BoatDamage modelPath={sharedModelPath} />}
              {showBoatImpact && <BoatImpact modelPath={sharedModelPath} />}
              {showBoatTheft && <BoatTheft modelPath={sharedModelPath} />}
              {showBoatTheftEntry && <BoatTheftEntry modelPath={sharedModelPath} />}
              {showBoatSubmersion && <BoatSubmersion modelPath={sharedModelPath} />}
              {showBoatNaturalDisaster && <BoatNaturalDisasterCause modelPath={sharedModelPath} />}
              {showBoatFire && <BoatFireCause modelPath={sharedModelPath} />}
            </>
          )}

          {claimType === ClaimType.Contents && (
            <>
              {showContentsDamage && !selectedCatEvent && <ContentsDamage modelPath={sharedModelPath} />}
              {showContentsFireCause && <ContentsFireCause modelPath={sharedModelPath} />}
              {showContentsNaturalDisasterCause && <ContentsNaturalDisasterCause modelPath={sharedModelPath} />}
              {showContentsStolenFrom && <ContentsStolenFrom modelPath={sharedModelPath} />}
              {showContentsWhereLastRememberHavingItems && (
                <ContentsWhereLastRememberHavingItems modelPath={sharedModelPath} />
              )}
            </>
          )}

          {(claimType === ClaimType.House || claimType === ClaimType.Landlord) && (
            <>
              {showHouseDamage && !selectedCatEvent && <HouseDamage modelPath={sharedModelPath} />}
              {showHouseFireCause && <HouseFireCause modelPath={sharedModelPath} />}
              {showHouseNaturalDisasterCause && !selectedCatEvent && (
                <HouseNaturalDisasterCause modelPath={sharedModelPath} />
              )}
            </>
          )}

          {(isHouseKeysClaim || isMotorKeysClaim) && (
            <FormMessage
              id="already-replaced-keys-message"
              title={t('claim:alreadyReplacedKeysMessage.title')}
              description={<Html inline rawHtml={t('claim:alreadyReplacedKeysMessage.description')} />}
              isError={false}
            />
          )}

          {isCannotClaimForPolicyOnline && (
            <FormMessage
              id="incorrect-claim-details-message-cannot-claim-for-policy"
              title={t('claim:cannotClaimForPolicyOnline.title')}
              description={<Html inline rawHtml={t('claim:cannotClaimForPolicyOnline.description')} />}
              isError={true}
            />
          )}

          {isCannotClaimOnline && (
            <FormMessage
              id="incorrect-claim-details-message-cannot-claim-online"
              title={t('claim:cannotProcessClaimOnline.title')}
              description={<Html inline rawHtml={t('claim:cannotProcessClaimOnline.description')} />}
              isError={true}
            />
          )}
          {isWaterDamageClaim && showWaterDamageInformationBox && (
            <InformationBox.Container variant="warning" border={true} aria-labelledby="infobox">
              <InformationBox.Title id="infobox">Water damage - here's what you need to do</InformationBox.Title>
              <Typography variant="body">
                If water has leaked or escaped in your home, follow these steps to help limit damage and keep your claim
                moving.
                <styles.StyledList>
                  <styles.StyledListItem>
                    <Typography variant="body">
                      <b>What you need to do now</b>
                      <br></br>Contact a plumber as soon as you can to find and fix the cause of the water damage.
                      Acting quickly can help prevent further damage. If it's safe to do so, take steps to reduce more
                      damage, like turning off the water supply.
                    </Typography>
                  </styles.StyledListItem>
                  <styles.StyledListItem>
                    <Typography variant="body">
                      <b>What's usually covered</b>
                      <br></br>Sudden and accidental water damage, like an overflow from a bath, basin, sink, or a water
                      tank such as a hot water cylinder, is usually covered under your policy.
                    </Typography>
                  </styles.StyledListItem>
                  <styles.StyledListItem>
                    <Typography variant="body">
                      <b>What's not usually covered</b>
                      <br></br>If the leak is caused by wear and tear or a plumbing failure, the cost of finding and
                      fixing the leak isn't covered. This includes plumber call-out and repair costs.
                    </Typography>
                  </styles.StyledListItem>
                  <styles.StyledListItem>
                    <Typography variant="body">
                      <b>Hidden damage</b>
                      <br></br>If the damage wasn't visible, noticeable or obvious, has developed over a period of time
                      and cannot be linked to a sudden and accidental event, you may be covered under our Hidden gradual
                      water damage benefit.{' '}
                      {showWaterInfoLink && (
                        <>
                          You can{' '}
                          <styles.StyledLink
                            href="https://www.tower.co.nz/discover/house/gradual-damage/"
                            className="bold"
                            target="_blank"
                            id="waterDamageInfoLink"
                            onClick={() => {
                              raiseFieldGAEvent('last_field_interacted', 'link', 'waterDamageInfoLink');
                            }}>
                            learn more about this benefit here
                          </styles.StyledLink>
                        </>
                      )}
                      <br></br>Acting early makes it easier for us to assess your claim and help get things sorted
                      sooner.
                    </Typography>
                  </styles.StyledListItem>
                </styles.StyledList>
                <styles.StyledLabel>
                  <styles.StyledCheckbox
                    checked={waterDamageInfoAcknowledged}
                    onCheckedChange={() => {
                      setWaterDamageInfoAcknowledged((checked) => !checked);
                    }}
                  />
                  <Typography variant="body">I understand and want to continue</Typography>
                </styles.StyledLabel>
                <br></br>
                <b>Disclaimer: </b>Please read the policy wording and cover documents to understand the terms,
                conditions, excesses, limits and exclusions that may apply.
              </Typography>
            </InformationBox.Container>
          )}
          {isDamagedAndBreakInHouseOrLandlord && (
            <FormMessage id="any-contents-stolen">
              <div className="title-container">
                <FontIcon>error_outline</FontIcon>
                <span>{t('claim:causeOfLoss.damageBreakInMessage.title')}</span>
              </div>
              <div>{t('claim:causeOfLoss.damageBreakInMessage.message')}</div>
            </FormMessage>
          )}
          {isClaimPreStep1PageValid &&
            !isCannotClaimOnline &&
            (!showWaterDamageInformationBox || !isWaterDamageClaim || waterDamageInfoAcknowledged) && (
              <FormFooter
                disabled={nextLoading}
                validating={nextLoading}
                submitButtonLabel={t('base:button.next')}
                handleSubmit={() => {
                  setNextLoading(true);
                  raiseClaimGAEvent(claimSharedState.claimNumber, claimType);
                  if (isWindscreenClaim) {
                    dispatch(thunks.handleStartWindscreenClaim(windscreenModelPath, routes.CLAIM.WINDSCREEN.PAGE1));
                  } else {
                    dispatch(thunks.handleStartProductClaim(routes.CLAIM.SHARED.PRE_STEP_2));
                  }
                }}>
                <div className="claim-form review-message">
                  <div className="review-title">
                    <i className="md-icon material-icons">information</i>
                    <h5>{t('claim:preStep1.reviewAndContinue.title')}</h5>
                  </div>
                  <p>{t('claim:preStep1.reviewAndContinue.description')}</p>
                </div>
              </FormFooter>
            )}
          <FloatingToolbar saveClaimEnabled={false} />
        </Form>
      </div>
    </div>
  );
};

export const PreStep1Container = PreStep1Loader;

export default PreStep1Container;
