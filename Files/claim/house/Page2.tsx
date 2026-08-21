import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Form } from 'react-redux-form';
import { useNavigate } from 'react-router';
import { routes } from '~/common/state';
import { selectors as commonSelectors } from '~/common/state/';
import {
  CarpetDamage,
  DamageAreaSelector,
  DamageItemsSelector,
  DryingRequired,
  EngagedWithContractor,
  GlassBrokenPaneCount,
  MouldVisible
} from '~/feature/claim/house/components';
import { modelPath, selectors } from '~/feature/claim/house/state';
import { ClaimAttachments, FloatingToolbar, FormFooter } from '~/feature/claim/shared/components';
import { ClaimNumber, DamageDescription } from '~/feature/claim/shared/components/dumb';
import { selectors as claimsSharedSelector } from '~/feature/claim/shared/state';
import { raiseClaimGAEvent } from '~/feature/claim/utils';
import { useAppSelector } from '~/root/store';

export const Page2Component = () => {
  const [nextLoading, setNextLoading] = React.useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flags = useAppSelector(commonSelectors.getFlags);
  const claimNumber = useAppSelector(selectors.getClaimNumber);
  const showDamageItems = useAppSelector(selectors.showDamageItems);
  const showDamageAreas = useAppSelector(selectors.showDamageAreas);
  const showGlassBrokenPaneCount = useAppSelector(selectors.showGlassBrokenPaneCount);
  const showCarpetDamageType = useAppSelector(selectors.showCarpetDamageType);
  const showDryingRequired = useAppSelector(selectors.showDryingRequired);
  const isDamageItemWithNoOtherDamage = useAppSelector(selectors.getIsDamageItemWithNoOtherDamage);
  const showDamageDescription = useAppSelector(selectors.showDamageDescription);
  const claimType = useAppSelector(claimsSharedSelector.getClaimType);
  const showMouldVisible = useAppSelector(selectors.showMouldVisible);
  const showEngagedWithContractor = useAppSelector(selectors.showEngagedWithContractor);

  const damageDescriptionTranslationKey = isDamageItemWithNoOtherDamage
    ? `${claimType}DamageItemsWithNoOtherDamage`
    : claimType;

  React.useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }, []);

  return (
    <div className="container md-grid">
      <div id="ContentsPage2" className="md-cell md-cell--12">
        <Form model={modelPath} hideNativeErrors className="claim-form claim-form--page2" validateOn="change">
          <ClaimNumber claimNumber={claimNumber} />
          {showDamageItems ?? <h2 className="page-heading2">{t('claim/house:headings.page2')}</h2>}

          {/* re enable to enable Special Features */}
          {/* {selectors.getHouseSpecialFeatures(state).length > 0 && (
              <Question
                id="questionSpecialFeatureDamageSelector"
                model={modelPath}
                translation="claim/house:specialFeaturesDamages">
                <SpecialFeatureSelector modelPath={modelPath} />
              </Question>
            )} */}

          {showDamageItems && <DamageItemsSelector />}

          {showGlassBrokenPaneCount && <GlassBrokenPaneCount modelPath={modelPath} />}

          {showCarpetDamageType && <CarpetDamage modelPath={modelPath} />}

          {showDryingRequired && <DryingRequired />}

          {showMouldVisible && <MouldVisible />}

          {showDamageAreas && <DamageAreaSelector />}

          {showDamageDescription && (
            <DamageDescription
              modelPath={modelPath}
              translation={`claim:page2.damages.damageDescription.${damageDescriptionTranslationKey}`}
              placeholder={t(`claim:page2.damages.damageDescription.${damageDescriptionTranslationKey}.placeholder`)}
            />
          )}
          {flags['cs-engaged-with-customer'] && showEngagedWithContractor && <EngagedWithContractor />}

          <>
            <h2 className="section-heading">{t('claim/house:headings.addAttachments')}</h2>
            <ClaimAttachments claimType={claimType} />
          </>

          <FormFooter
            disabled={nextLoading}
            validating={nextLoading}
            submitButtonLabel={t('claim:footer.nextButton.shared.contactDetails')}
            showBackButton={true}
            backUrl={routes.CLAIM.HOUSE.PAGE1}
            handleSubmit={async () => {
              setNextLoading(true);
              raiseClaimGAEvent(claimNumber, 'house');
              navigate(routes.CLAIM.SHARED.CLAIM_CONTACT_DETAILS);
            }}
          />
        </Form>

        <FloatingToolbar saveClaimEnabled={true} />
      </div>
    </div>
  );
};

export const Page2 = Page2Component;

export default Page2;
