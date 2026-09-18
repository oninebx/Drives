import { isEmpty } from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import type { ModelAction } from 'react-redux-form';
import { actions as formActions } from 'react-redux-form';
import { FormMessage, Html, Spinner } from '~/common/components/base';
import RrfConnectedRadio from '~/common/components/smart/ConnectedRadio/RrfConnectedRadio';
import { getFormValue } from '~/common/state/selectors';
import { isMobileScreenWidth, raiseFieldGAEvent } from '~/common/utilities';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import type { QuoteLandlordsState } from '~/feature/quote/landlord/state';
import type { ApplicationState } from '~/root/rootReducer';
import type { AppDispatch } from '~/root/store';
import * as QuestionV2 from '../../../../../../common/components/base/QuestionV2/QuestionV2';
import type { QuoteHouseState } from '../../../state';
import { PropertyTypesDialog } from '../../dumb/PropertyTypes/PropertyTypesDialog';
import { PropertyTypesDrawer } from '../../dumb/PropertyTypes/PropertyTypesDrawer';
import { useDeclineLinkRedirect } from './useDeclineLinkRedirect';

interface DispatchProps {
  change: (model: string, value: string) => ModelAction;
}

interface PropertyTypeComponentProps extends InjectedTranslateProps {
  change: (model: string, value: string) => ModelAction;
  handleClick: (value: string) => void;
  handleDeclineLinkClick: (event?: React.MouseEvent) => Promise<void>;
  errorType: string;
  model: string;
  value: string;
}

interface PropertyGAEvents extends InjectedTranslateProps {
  errorType: string;
  value: string;
}

export interface PropertyTypeProps extends InjectedTranslateProps, DispatchProps {
  houseState: QuoteHouseState | QuoteLandlordsState;
  modelPath: string;
  value: string;
}

const CONTENTS_DECLINE_LINK_IDS = new Set([
  'q2b-contents-link-apartment-decline',
  'q2b-contents-link-retirement-decline'
]);

const DisconnectedPropertyType = (props: PropertyTypeComponentProps) => {
  const overrideTextColor = props.t('base:overrideTextColor');
  const isScreenMobileWidth = isMobileScreenWidth();

  return (
    <QuestionV2.Root id="propertyType-typeOfProperty">
      <QuestionV2.FormTick error={!isEmpty(props.errorType)} tick show={!isEmpty(props.value)} />
      <div>
        <QuestionV2.Title variant="heading3" color={overrideTextColor} bold>
          {props.t('quote/house:propertyTypes.typeOfProperty.title')}
        </QuestionV2.Title>

        {isScreenMobileWidth ? <PropertyTypesDrawer /> : <PropertyTypesDialog />}

        <RrfConnectedRadio
          id="propertyType-typeOfProperty-radioButtons"
          model={props.model}
          change={props.change}
          value={props.value}
          overrideLabelColour={overrideTextColor}
          onChange={(value: string) => {
            props.handleClick(value);
          }}
          values={[
            {
              value: 'Freestandhouse',
              label: props.t('quote/house:propertyTypes.typeOfProperty.options.freestandHouse')
            },
            {
              value: 'Townhouse',
              label: props.t('quote/house:propertyTypes.typeOfProperty.options.townhouse')
            },
            {
              value: 'Lifestyle',
              label: props.t('quote/house:propertyTypes.typeOfProperty.options.lifestyle')
            },
            {
              value: 'Apartment',
              label: props.t('quote/house:propertyTypes.typeOfProperty.options.apartment')
            },
            {
              value: 'Retirementhome',
              label: props.t('quote/house:propertyTypes.typeOfProperty.options.retirementHome')
            },
            {
              value: 'Tinyhouse',
              label: props.t('quote/house:propertyTypes.typeOfProperty.options.tinyHouse')
            },
            {
              value: 'Campsite',
              label: props.t('quote/house:propertyTypes.typeOfProperty.options.campsite')
            },
            {
              value: 'Other',
              label: props.t('quote/house:propertyTypes.typeOfProperty.options.other')
            }
          ]}
        />
        {props.errorType && (
          <FormMessage
            id="propertyType-error"
            title={props.t(`quote/house:propertyTypes.typeOfProperty.errors.${props.value}_${props.errorType}Title`)}
            isRefer={props.errorType === 'refer'}
            isError={props.errorType === 'decline'}
            description={
              <Html
                inline
                onClick={props.handleDeclineLinkClick}
                rawHtml={props.t(`quote/house:propertyTypes.typeOfProperty.errors.${props.value}_${props.errorType}`)}
              />
            }
          />
        )}
      </div>
    </QuestionV2.Root>
  );
};

const handleErrorGAEventForPropertyType = (props: PropertyGAEvents) => {
  const prefix = props.errorType === 'refer' ? 'UWR_Property_Type_' : 'UWD_Property_Type_';
  raiseFieldGAEvent(
    'last_field_interacted',
    'message_box',
    `${props.errorType === 'refer' ? 'We require more info' : "We're sorry"} - ${props.t(
      `quote/house:propertyTypes.typeOfProperty.errors.${props.value}_${props.errorType}`
    )}`,
    prefix + props.value
  );
};

const getErrorType = (propertyType: string) => {
  if (propertyType === 'Campsite' || propertyType === 'Retirementhome' || propertyType === 'Apartment') {
    return 'decline';
  } else if (propertyType === 'Lifestyle' || propertyType === 'Other') {
    return 'refer';
  } else {
    return null;
  }
};
const RrfPropertyType = (props: PropertyTypeProps) => {
  const [errorType, setErrorType] = React.useState<string>(getErrorType(props.value));

  const { isRedirectingToContents, handleDeclineLinkClick } = useDeclineLinkRedirect({
    isValidLinkId: (linkId: string) => CONTENTS_DECLINE_LINK_IDS.has(linkId)
  });

  if (isRedirectingToContents) {
    return <Spinner fullPage hideRest />;
  }

  return (
    <DisconnectedPropertyType
      change={props.change}
      model={props.modelPath}
      errorType={errorType}
      t={props.t}
      value={props.value}
      handleDeclineLinkClick={handleDeclineLinkClick}
      handleClick={(PropertyValue: string) => {
        props.change(props.modelPath, PropertyValue);
        const errorTypeDescription = getErrorType(PropertyValue);
        setErrorType(errorTypeDescription);
        raiseFieldGAEvent('last_field_interacted', 'radio', `propertyType-${PropertyValue}`);
        if (!isEmpty(errorTypeDescription) && !isEmpty(PropertyValue)) {
          handleErrorGAEventForPropertyType({ errorType: errorTypeDescription, value: PropertyValue, t: props.t });
        }
      }}
    />
  );
};

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  change: (model: string, value: string) => dispatch(formActions.change(model, value))
});

const mapStateToProps = (state: ApplicationState, ownProps: PropertyTypeProps) => {
  const model = `${ownProps.modelPath}.houseDetails.propertyType.type`;

  return {
    modelPath: model,
    value: getFormValue(state, model)
  };
};

export const PropertyType = connect(
  mapStateToProps,
  mapDispatchToProps
)(translate(['quote', 'quote/house'])(RrfPropertyType));
