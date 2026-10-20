import { Typography } from '@tower/tui';
import * as lodash from 'lodash';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import Skeleton from 'react-loading-skeleton';
import FontIcon from 'react-md/lib/FontIcons/FontIcon';
import type { FieldState } from 'react-redux-form';
import { Form, actions as formActions } from 'react-redux-form';
import { useLocation } from 'react-router';
import stickybits from 'stickybits';
import { FormMessage, LoaderButton } from '~/common/components/base';
import { LoginDialog } from '~/common/components/dumb';
import { selectors as commonSelectors, getDefaultCoverageState, XBrandId } from '~/common/state';
import type { TestimonialResponse } from '~/common/state/autorest/ContentTestimonials/src/models';
import { KnownBrandType } from '~/common/state/autorest/Policy/src';
import { getActiveCampaign, getActiveNoPromocodeCampaign, getAgency, getAgencyCampaignsFlag, getAgent, getCustomerCampaignsFlag, getFlags, getPrePopulated, isAuthenticated, isBrand, isPacific } from '~/common/state/selectors';
import { contentTestimonialsService, getDefaultRequestOptions } from '~/common/state/services';
import {
  isOldIE,
  logApiError,
  raiseFieldGAEvent,
  setAgentCodeToLocalStorage,
  setPartnerCodeToLocalStorage
} from '~/common/utilities';
import { translate } from '~/common/utilities/translation';
import { modelPath as boatModelPath } from '~/feature/quote/boat/state/paths';
import { modelPath as carModelPath } from '~/feature/quote/car/state/paths';
import { modelPath as contentsModelPath } from '~/feature/quote/contents/state/paths';
import { modelPath as houseModelPath } from '~/feature/quote/house/state/paths';
import { modelPath as landlordModelPath } from '~/feature/quote/landlord/state/paths';
import {
  BenefitPanel,
  BundleBuilderBanner,
  BundleBuilderBannerType,
  BundleBuilderMyTowerLogin,
  CampaignBundleBuilderBanner,
  ConversationDetails,
  ExistingCustomer,
  MemberDiscount,
  NumberOfPolicies,
  Testimonials,
  Trustpilot
} from '~/feature/quote/shared/components';
import { modelPath as sharedModelPath } from '~/feature/quote/shared/state';
import type { QuoteState } from '~/feature/quote/state';
import {
  actions,
  BundleBuilderLoginType,
  getProductTypes,
  getQuoteState,
  getTotalBundledItems,
  getTotalPoliciesBundleBuilder,
  ProductUIType,
  productUITypes
} from '~/feature/quote/state';
import { actionTypes } from '~/feature/quote/state/types';
import { useAppDispatch, useAppSelector } from '~/root/store';
import { useBannerConfig } from '../campaigns/hooks';
import { CampaignWSPBanner } from '../components/dumb/CampaignWSPBanner/CampaignWSPBanner';
import { MultiOfferBanner } from '../components/dumb/MultiOfferBanner/MultiOfferBanner';
import { ProductPicker } from '../components/dumb/ProductPicker/ProductPicker';
import './BundleBuilder.scss';
import * as Styles from './BundleBuilder.styles';
import MembershipValidation from './MembershipValidation/MembershipValidation';
import { getAnonymousUserInfo, getQuoteSharedFormState, getQuoteSharedState } from '../state/selectors';

type QuoteStateKey = keyof Pick<QuoteState, 'cars' | 'houses' | 'contents' | 'landlords' | 'boats' | 'ctps'>;

type ProductKey = Exclude<ProductUIType, ProductUIType.Motorbike>;

const productKeyToStateKey: Record<Exclude<ProductUIType, ProductUIType.Motorbike>, QuoteStateKey> = {
  car: 'cars',
  house: 'houses',
  contents: 'contents',
  landlord: 'landlords',
  boat: 'boats',
  compulsoryThirdParty: 'ctps'
} as const;

type URLProductKey = Exclude<ProductKey, ProductUIType.Ctp>;

type FormValue = string | string[] | boolean | number | ReturnType<typeof getDefaultCoverageState>;

const addProductActionTypes: Record<ProductKey, string> = {
  [ProductUIType.Car]: actionTypes.ADD_CAR,
  [ProductUIType.House]: actionTypes.ADD_HOUSE,
  [ProductUIType.Contents]: actionTypes.ADD_CONTENTS,
  [ProductUIType.Landlord]: actionTypes.ADD_LANDLORD,
  [ProductUIType.Boat]: actionTypes.ADD_BOAT,
  [ProductUIType.Ctp]: actionTypes.ADD_CTP
};

const removeProductActionTypes: Record<ProductKey, string> = {
  [ProductUIType.Car]: actionTypes.REMOVE_CAR,
  [ProductUIType.House]: actionTypes.REMOVE_HOUSE,
  [ProductUIType.Contents]: actionTypes.REMOVE_CONTENTS,
  [ProductUIType.Landlord]: actionTypes.REMOVE_LANDLORD,
  [ProductUIType.Boat]: actionTypes.REMOVE_BOAT,
  [ProductUIType.Ctp]: actionTypes.REMOVE_CTP
};

const fetchTestimonials = async () => {
  const requestOptions = getDefaultRequestOptions();
  const testimonials = await contentTestimonialsService.getTestimonials(XBrandId, {
    requestOptions: requestOptions,
    onResponse: (response) => {
      if (response.status !== 200) {
        logApiError(new Error(response.bodyAsText), 'ui-api-get-testimonial', requestOptions);
      }
    }
  });

  return testimonials;
};

const BundleBuilderMessage = ({ totalPolicies }: { totalPolicies: number }) => {
  const { t } = useTranslation();

  let discountCls = '';
  let bundleMessageDesc = '';
  let bundleMessageTitle = '';

  if (totalPolicies === 1) {
    discountCls = 'upsellSingle';
    bundleMessageDesc = t('quote:bundleMessaging.upsellSingle');
    bundleMessageTitle = t('quote:bundleMessaging.upsellSingleTitle');
  } else if (totalPolicies === 2) {
    discountCls = 'upsellDouble';
    bundleMessageDesc = t('quote:bundleMessaging.upsellDouble');
    bundleMessageTitle = t('quote:bundleMessaging.upsellDoubleTitle');
  } else if (totalPolicies > 2) {
    discountCls = 'upsellMultiple';
    bundleMessageDesc = t('quote:bundleMessaging.upsellMultiple');
    bundleMessageTitle = t('quote:bundleMessaging.upsellMultipleTitle');
  }

  return (
    <div className={`bundle-builder-messaging-container ${totalPolicies > 0 ? 'visible' : 'hidden'} ${discountCls}`}>
      <div className="bundle-builder-messaging-wrapper">
        <div className="bundle-builder-messaging">
          <p className="bold">{bundleMessageTitle}</p>
          <p
            dangerouslySetInnerHTML={{
              __html: bundleMessageDesc
            }}
          />
        </div>
      </div>
    </div>
  );
};

const stickyPanel = () => {
  const bundleBuilder = document.querySelector('.bundle-builder-messaging-container');
  if (bundleBuilder) {
    stickybits('.bundle-builder-messaging-container', { useStickyClasses: true, stickyBitStickyOffset: 0 });
  } else {
    /* istanbul ignore next */
    setTimeout(() => {
      /* istanbul ignore next */
      stickyPanel();
    }, 100);
  }
};

const initStickyPanel = () => {
  if (!isOldIE()) {
    stickyPanel();
  } else {
    const panel = document.querySelector('.bundle-builder-messaging-container') as HTMLElement;
    if (panel) {
      panel.className += ' fixed';
    }
  }
};

const useProductsFromURl = () => {
  const params = new URLSearchParams(useLocation().search).get('pt') as string | null;
  const pt: URLProductKey[] = params ? (params.split('-') as URLProductKey[]) : null;

  // remove duplicates
  return Array.from(new Set(pt));
};


const BundleBuilderComponent = () => {
  const flags = useAppSelector(getFlags);
  const campaign = useAppSelector(getActiveCampaign);
  const noPromocodeCampaign = useAppSelector(getActiveNoPromocodeCampaign);
  const agencyCampaignsFlag = useAppSelector(getAgencyCampaignsFlag);
  const customerCampaignsFlag = useAppSelector(getCustomerCampaignsFlag);
  const agency = useAppSelector(getAgency);
  const agent = useAppSelector(getAgent);
  const authenticated = useAppSelector(isAuthenticated);
  const prePopulatedPolicyDetails = useAppSelector(getPrePopulated);
  const quoteState = useAppSelector(getQuoteState);
  const { policyCount, existingCustomer, numberOfPolicies } = useAppSelector(getQuoteSharedState);
  const sharedFormState = useAppSelector(getQuoteSharedFormState);
  const productTypes = useAppSelector(getProductTypes);
  const totalPoliciesBundleBuilder = useAppSelector(getTotalPoliciesBundleBuilder);
  const totalBundleItemsSelected = useAppSelector(getTotalBundledItems);
  const anonymousUserInfo = useAppSelector(getAnonymousUserInfo);
  const isCustomerStaff = useAppSelector(commonSelectors.isCustomerStaff);

  const dispatch = useAppDispatch();

  const changeFormValue = (path: string, value: FormValue) => dispatch(formActions.change(path, value));
  const resetFormValue = (path: string) => dispatch(formActions.reset(path));
  const clearActiveQuoteIndex = () => dispatch(actions.clearActiveQuoteIndex(true));
  const loadProductTypes = () => dispatch(actions.loadProductTypes());
  const clearQuoteState = () => dispatch(actions.clearQuoteState());
  const addProduct = (key: ProductKey) => dispatch({ type: addProductActionTypes[key] });
  const removeProduct = (key: ProductKey) => dispatch({ type: removeProductActionTypes[key] });
  const handleSubmit = () => dispatch(actions.submitBundleBuilder());


  // local state
  const [testimonials, setTestimonials] = React.useState<TestimonialResponse[]>([]);
  const [showWelcomeBackMessage, setShowWelcomeBackMessage] = React.useState(false);
  const [hasSkippedLogin, setHasSkippedLogin] = React.useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = React.useState(false);
  const [loading, setIsLoading] = React.useState(false);
  const [isConversationalUISkipped, setIsConversationalUISkipped] = React.useState(false);
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);

  const [promoLoading, setIsPromoLoading] = React.useState(false);
  const [membershipValidationSuccess, setMembershipValidationSuccess] = React.useState(false);

  // membership validation state
  const { membershipId } = agency?.features || {};
  const onMembershipValidate = (success: boolean) => {
    setMembershipValidationSuccess(success);
  };

  const hasCompletedMembershipCheck = (!membershipId?.enabled || (membershipId?.enabled && membershipValidationSuccess))

  const { t } = useTranslation();
  const urlProducts = useProductsFromURl();
  const bannerConfig = useBannerConfig();

  const ShowMPDSideBanner = t('quote:config.showMPDSideBanner');
  const isWSPBrand = isBrand(KnownBrandType.WSP); //TRUE only for WSP brand
  // used to check for updates
  const prevPolicyCountRef = React.useRef<number>(policyCount);


  const { cars, houses, contents, landlords, boats, bundleBuilderLogin } = quoteState;
  const productSelected =
    cars.length > 0 || houses.length > 0 || contents.length > 0 || landlords.length > 0 || boats.length > 0;

  const isConversationalUIEnabled = flags['conversational-ui'] && !isConversationalUISkipped;
  const conversationalGenderIsComplete = cars?.length === 0 || anonymousUserInfo.gender;
  const conversationalUIIsComplete =
    !isConversationalUIEnabled ||
    (anonymousUserInfo.firstName &&
      anonymousUserInfo.lastName &&
      anonymousUserInfo.dateOfBirth &&
      anonymousUserInfo.email &&
      conversationalGenderIsComplete &&
      anonymousUserInfo.privacyPolicyAccepted);
  const sspQuotesEnabled = commonSelectors.isSspQuoteEnabled();

  const showBenefits = t('quote:config.bundleBuilderBenefits') === true;
  const toastEnabled = t('quote:config.bundleBuilderToast') === true;
  const testimonialsEnabled = t('quote:config.showTestimonials') === true;
  const bundleBuilderLoginEnabled = flags['bundle-builder-login'] === true && sspQuotesEnabled;
  const showBundleBuilderBanner = t('quote:config.showBundleBuilderBanner') === true;
  const preventUnauthenticated = t('quote:config.preventUnauthenticated') === true;
  const trustpilotEnabled = flags['q2b-trustpilot-widget'] === true;
  const showDisclaimer = t('quote:config.showDisclosure') === true;
  const currentCampaign = campaign ? campaign : noPromocodeCampaign;
  const hidePolicyCountQuestion = t('base:config.hidePolicyCountQuestion') === true;
  const showCampaignBanner =
    currentCampaign &&
    agencyCampaignsFlag !== false &&
    customerCampaignsFlag !== false &&
    isCustomerStaff === false;

  // Do not show existing customer question for authenticated  and WSP Brand
  const showExistingCustomer = !isWSPBrand && !(sspQuotesEnabled && authenticated);

  const showBundleBuilderLogin =
    !isWSPBrand &&
    bundleBuilderLoginEnabled &&
    productSelected &&
    existingCustomer === true &&
    !authenticated &&
    bundleBuilderLogin !== BundleBuilderLoginType.SKIP;

  const showNumberOfPolicies =
    !isWSPBrand &&
    !hidePolicyCountQuestion &&
    productSelected &&
    existingCustomer === true &&
    (!bundleBuilderLoginEnabled ||
      (bundleBuilderLoginEnabled && bundleBuilderLogin === BundleBuilderLoginType.SKIP) ||
      (sspQuotesEnabled && authenticated));
  const policyCountFormField = sharedFormState.numberOfPolicies as FieldState;

  const showConversationalUI =
    !authenticated &&
    isConversationalUIEnabled &&
    productSelected &&
    showExistingCustomer &&
    existingCustomer === false;

  const awaitingLoginDecision = showBundleBuilderLogin && bundleBuilderLogin !== BundleBuilderLoginType.SKIP;

  const showNextButton =
    !awaitingLoginDecision &&
    (showConversationalUI
      ? conversationalUIIsComplete
      : (showNumberOfPolicies && policyCountFormField.value !== null) ||
      (hidePolicyCountQuestion && existingCustomer === true && productSelected) ||
      (existingCustomer === false && productSelected) ||
      (preventUnauthenticated && productSelected));

  const showWspLoadingButton = isWSPBrand && productSelected;
  let bannerType = isBrand(KnownBrandType.TWR) ? BundleBuilderBannerType.Flick : BundleBuilderBannerType.Circles;

  if (isBrand(KnownBrandType.TMI)) {
    bannerType = BundleBuilderBannerType.Basic;
  }

  if (isWSPBrand) {
    bannerType = BundleBuilderBannerType.WSP;
  }

  const chooseProductTitle = t('quote:chooseProducts.title');

  const memberDiscountAvailable =
    t('quote:memberDiscount.title') && t('quote:memberDiscount.description') && t('quote:memberDiscount.tooltip');

  const handleAddProduct = (key: ProductKey) => {
    addProduct(key);
    raiseFieldGAEvent('last_field_interacted', 'button', `product-picker-item-${key}-add-button`, key);
  };

  const getTestimonials = async () => {
    const testimonials = await fetchTestimonials();

    setTestimonials(
      (testimonials && lodash.isArray(testimonials) ? testimonials : [])
        .filter(
          (t) =>
            !lodash.isEmpty(t.title) && !lodash.isEmpty(t.content) && !lodash.isEmpty(t.date) && !lodash.isEmpty(t.icon)
        )
        .slice(0, 3)
    );
  };

  const handleSkipLogin = () => {
    setHasSkippedLogin(true);
    setShowWelcomeBackMessage(false);
  };

  const initFormValues = () => {
    resetFormValue(carModelPath);
    resetFormValue(houseModelPath);
    resetFormValue(landlordModelPath);
    resetFormValue(contentsModelPath);
    resetFormValue(boatModelPath);
    resetFormValue(sharedModelPath);

    changeFormValue('myForms.carQuote.coverages', getDefaultCoverageState());
    changeFormValue('myForms.carQuote.optionalCoverages', []);
    changeFormValue('myForms.sharedQuote.numberOfPolicies', policyCount);

    if (memberDiscountAvailable) {
      changeFormValue('myForms.sharedQuote.memberDiscount', true);
    }

    if (sspQuotesEnabled && authenticated) {
      changeFormValue(`myForms.sharedQuote.existingCustomer`, true);

      if (prePopulatedPolicyDetails) {
        // Update policy count so we know policy count already
        changeFormValue(`myForms.sharedQuote.policyCount`, prePopulatedPolicyDetails.existingPolicyCount);
      }
    }
  };

  const loadActiveCampaign = async () => {
    setIsPromoLoading(true);
    await dispatch(actions.getActiveCampaign());
    setIsPromoLoading(false);
  };

  const onMount = () => {
    initStickyPanel();

    window.scrollTo(0, 0);

    clearActiveQuoteIndex();
    clearQuoteState();
    loadActiveCampaign();
    loadProductTypes();

    initFormValues();

    if (urlProducts?.length > 0) {
      const validOptions = Object.keys(productKeyToStateKey) as URLProductKey[];

      urlProducts.forEach((name) => {
        if (validOptions.includes(name) && quoteState[productKeyToStateKey[name]]) {
          handleAddProduct(name);
        }
      });
    }

    if (testimonialsEnabled) {
      getTestimonials();
    }

    if (bundleBuilderLoginEnabled && bundleBuilderLogin === BundleBuilderLoginType.LOGIN && authenticated) {
      const customerNumber = commonSelectors.getCustomerNumberFromJwt();
      if (window.dataLayer && customerNumber) {
        window.dataLayer.push({ event: 'loggedIn', userId: customerNumber });
      }
    }
  };

  const onPolicyCountUpdate = () => {
    if (prevPolicyCountRef.current !== policyCount) {
      changeFormValue('myForms.sharedQuote.numberOfPolicies', policyCount);
    }
    prevPolicyCountRef.current = policyCount;
  };

  React.useEffect(() => {
    onMount();
  }, []);

  React.useEffect(() => {
    onPolicyCountUpdate();
  }, [policyCount, changeFormValue]);

  React.useEffect(() => {
    const successKey = 'isLoginSuccessVisible';

    if (authenticated) {
      if (sessionStorage.getItem(successKey) === null) {
        setShowLoginSuccess(true);
        sessionStorage.setItem(successKey, 'yes');
      }
    } else {
      // Reset on logout
      sessionStorage.removeItem(successKey);
      setShowLoginSuccess(false);
    }
  }, [authenticated]);

  const renderCompaignBanner = (bannerType: BundleBuilderBannerType) => {
    if (bannerConfig?.bannerType === 'multi') {
      const { bannerType, ...config } = bannerConfig;

      return (
        <Styles.CampaignBannerContainer>
          <MultiOfferBanner {...config} />
        </Styles.CampaignBannerContainer>
      );
    }

    return bannerType === BundleBuilderBannerType.WSP ? (
      <CampaignWSPBanner campaign={currentCampaign} />
    ) : (
      <CampaignBundleBuilderBanner campaign={currentCampaign} />
    );
  };

  return (
    <>
      {isBrand(KnownBrandType.TWR) && (
        <Helmet>
          <title>Quote Bundle Builder for your insurance needs – Tower</title>
          <meta
            name="description"
            content="Looking for insurance? We’ve got you covered. Bundle your policies with ease. Keep things simple by having all your policies in one place."
          />
        </Helmet>
      )}
      {promoLoading && <Skeleton height={12} width={12} />}
      {!promoLoading && showBundleBuilderBanner && !showCampaignBanner && (
        <BundleBuilderBanner bannerType={bannerType} />
      )}
      {!promoLoading && showBundleBuilderBanner && showCampaignBanner && renderCompaignBanner(bannerType)}

      <div
        id="BundleBuilder"
        className={`md-cell md-cell--12 ${showBenefits ? 'promo-panel-enabled' : ''} ${testimonialsEnabled ? 'testimonials-enabled' : ''
          }`}>
        <Form
          model={sharedModelPath}
          hideNativeErrors
          validateOn="change"
          className="quote-form quote-form-bundlebuilder">
          {!isWSPBrand && ShowMPDSideBanner && !toastEnabled && totalBundleItemsSelected > 0 && (
            <BundleBuilderMessage totalPolicies={totalPoliciesBundleBuilder} />
          )}

          <div className="bundle-builder-side-panel">
            {showBenefits && <BenefitPanel tKey="quote:bundleBenefits" />}
            {trustpilotEnabled && (
              <div className="trustpilot-wrapper">
                <Trustpilot />
              </div>
            )}
            {testimonialsEnabled && testimonials.length > 0 && (
              <div className="testimonials-wrapper" data-testid="testimonials-wrapper">
                <Testimonials testimonials={testimonials} />
              </div>
            )}
          </div>

          <div className="bundle-builder-content">
            <h2 className="heading5">{chooseProductTitle}</h2>
            <br />
            <Styles.Description $isPacific={isPacific()}>
              <Trans i18nKey="quote:chooseProducts.description" components={{ b: <b /> }} />
            </Styles.Description>
            <ProductPicker
              productTypes={productTypes}
              productUITypes={productUITypes}
              getValue={(type: ProductKey) => quoteState[productKeyToStateKey[type]].length}
              totalSelected={totalBundleItemsSelected}
              addProduct={handleAddProduct}
              removeProduct={(key: ProductKey) => {
                removeProduct(key);
                raiseFieldGAEvent('last_field_interacted', 'button', `product-picker-item-${key}-remove-button`, key);
              }}
              pageLoading={loading}
            />

            {memberDiscountAvailable && productSelected && <MemberDiscount pageLoading={loading} />}

            {productSelected && membershipId?.enabled && (<MembershipValidation copy={membershipId} agencyCode={agency?.agencyCode} onValidate={onMembershipValidate} />)}

            {/* <MembershipValidation copy={{ title: "test", helperText: "test", label: "test" }} agencyCode={agency?.agencyCode} onValidate={onMembershipValidate} /> */}
            {productSelected && !authenticated && !preventUnauthenticated && hasCompletedMembershipCheck && (
              <ExistingCustomer
                showWelcomeBackMessage={() => setShowWelcomeBackMessage(true)}
                hideWelcomeBackMessage={() => setShowWelcomeBackMessage(false)}
                isConversationalUIEnabled={isConversationalUIEnabled}
                pageLoading={loading}
                shouldShowWelcomeBackMessage={showWelcomeBackMessage}
                hasSkippedLogin={hasSkippedLogin}
              />
            )}

            {showBundleBuilderLogin && (
              <BundleBuilderMyTowerLogin
                handleClick={() => {
                  setShowLoginDialog(true);
                }}
                hideWelcomeBackMessage={() => setShowWelcomeBackMessage(false)}
                onSkipLogin={handleSkipLogin}
              />
            )}

            {bundleBuilderLoginEnabled && bundleBuilderLogin === BundleBuilderLoginType.LOGIN && showLoginSuccess && (
              <FormMessage id="bundle-builder-login-successful" title="Success!" isSuccess={true}>
                {t('quote:myTowerBundleBuilderLogin.loginSuccessMessage')}
              </FormMessage>
            )}

            {showNumberOfPolicies && (
              <NumberOfPolicies
                showAuthenticatedPolicyChange={!showExistingCustomer}
                policies={numberOfPolicies}
                subQuestion={!authenticated}
                pageLoading={loading}
                hideWelcomeBackMessage={() => setShowWelcomeBackMessage(false)}
              />
            )}

            {!!showConversationalUI && (
              <ConversationDetails
                anonymousUserInfo={sharedFormState.anonymousUserInfo}
                isCarInBundle={!lodash.isEmpty(cars)}
                onSkip={() => {
                  setIsConversationalUISkipped(true);
                  resetFormValue(`${sharedModelPath}.anonymousUserInfo`);
                }}
              />
            )}

            {(showNextButton || showWspLoadingButton) && (
              <Styles.Container>
                {showDisclaimer && (
                  <Styles.DisclaimerContainer>
                    <Typography variant="body" bold>
                      {t('quote:disclosure.title')}
                    </Typography>

                    <Typography variant="body">{t('quote:disclosure.description')}</Typography>
                  </Styles.DisclaimerContainer>
                )}
                <LoaderButton
                  id="btnSubmitPage"
                  className="md-btn--outline md-btn--outline-tertiary"
                  disabled={loading}
                  pending={loading}
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setShowLoginSuccess(false);
                    handleSubmit();
                  }}>
                  {t('quote:button.beginQuote')}
                  <FontIcon>arrow_forward</FontIcon>
                </LoaderButton>
              </Styles.Container>
            )}
          </div>

          {testimonialsEnabled && testimonials.length > 0 && (
            <div className="testimonials-mobile-wrapper">
              <Testimonials testimonials={testimonials} />
            </div>
          )}
        </Form>
        <LoginDialog
          hideForgotPasswordButton={false}
          hideCreateAccountButton={false}
          openCreateAccountNewWindow={true}
          visible={showLoginDialog}
          onHide={() => {
            setShowLoginDialog(false);
          }}
          onCreateAccount={() => {
            setPartnerCodeToLocalStorage(agency?.partnerCode);
            setAgentCodeToLocalStorage(agent?.agentCode);
          }}
          onForgotPassword={() => {
            setPartnerCodeToLocalStorage(agency?.partnerCode);
            setAgentCodeToLocalStorage(agent?.agentCode);
          }}
          ariaLabel={t('login.logInDialogAriaLabel')}
        />
      </div>
    </>
  );
};

export const BundleBuilderContainer = translate(['base', 'quote'])(BundleBuilderComponent);
