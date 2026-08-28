import * as React from 'react';
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup';
import { actions as formActions } from 'react-redux-form';
import { Question } from '~/common/components/dumb';
import { MDRadioButton, MDTextField } from '~/common/components/smart';
import type { AddressState } from '~/common/state';
import { raiseFieldGAEvent } from '~/common/utilities';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { VehicleDamageDetails } from '~/feature/claim/car/components/dumb';
import DPOPersonalDetails from '~/feature/claim/car/components/dumb/DPOPersonalDetails/DPOPersonalDetails';
import { selectors } from '~/feature/claim/car/state';
import * as constants from '~/feature/claim/car/state/constants';
import { MAX_LENGTH_DAMAGE_DESCRIPTION, selectors as sharedSelectors } from '~/feature/claim/shared/state';
import store from '~/root/store';

export interface PropertyDamageDetailsProps extends InjectedTranslateProps {
  index: number;
  modelPath: string;
  formModelPath: string;
  addressState: AddressState;
}

export const PropertyDamageDetailsComponent = ({
  t,
  index,
  modelPath,
  formModelPath,
  addressState
}: PropertyDamageDetailsProps) => {
  const state = store.getState();
  const claimType = sharedSelectors.getClaimType(state);
  const damage = selectors.getOtherPropertyDamage(state, index);
  const damageSubTypeModelPath = `${modelPath}.damageSubType`;
  const propertyTypeModelPath = `${modelPath}.propertyType`;
  const controls = [
    {
      value: constants.DAMAGE_SUBTYPE_3RD_PARTY_PROPERTY,
      label: t('claim:otherPropertyDamage.damageSubType.labels.property')
    },
    {
      value: constants.DAMAGE_SUBTYPE_3RD_PARTY_CONTENTS,
      label: t('claim:otherPropertyDamage.damageSubType.labels.contents')
    }
  ];

  if (selectors.showOtherPeoplePropertyVehicleOption(state)) {
    controls.push({
      value: constants.DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE,
      label: t('claim:otherPropertyDamage.damageSubType.labels.vehicle')
    });
  }

  return (
    <>
      <Question
        id={`questionDamageSubType${index}`}
        model={damageSubTypeModelPath}
        translation="claim:otherPropertyDamage.damageSubType">
        <SelectionControlGroup
          id={`damageSubType${index}`}
          name="damage-sub-type"
          type="radio"
          defaultValue={damage && damage.damageSubType}
          aria-label={t('claim:otherPropertyDamage.damageSubType')}
          controls={controls}
          onChange={(value: string) => {
            store.dispatch(formActions.setTouched(damageSubTypeModelPath));
            store.dispatch(formActions.setSubmitted(damageSubTypeModelPath));
            store.dispatch(formActions.change(damageSubTypeModelPath, value));

            raiseFieldGAEvent('last_field_interacted', 'radio', `questionDamageSubType${index}`, value);
          }}
        />
      </Question>

      {damage && damage.damageSubType && !selectors.isPropertyDamagedSubTypeVehicle(state, index) ? (
        <>
          <Question
            id={`questionDamageDescription${index}`}
            model={`${modelPath}.damageDescription`}
            translation={`claim/${claimType}:otherPropertyDamage.damageDescription`}>
            <MDTextField
              id={`damageDescription${index}`}
              model={`${modelPath}.damageDescription`}
              rows={1}
              maxLength={MAX_LENGTH_DAMAGE_DESCRIPTION}
            />
          </Question>
          <Question
            id={`questionKnowPropertyOwner${index}`}
            model={`${modelPath}.knowPropertyOwner`}
            translation="claim:otherPropertyDamage.knowPropertyOwner">
            <MDRadioButton
              id={`knowPropertyOwner${index}`}
              model={`${modelPath}.knowPropertyOwner`}
              options={[
                { value: true, label: t('button.yes') },
                { value: false, label: t('button.no') }
              ]}
            />
          </Question>
        </>
      ) : null}

      {selectors.knowDamagedPropertyOwner(state, index) && (
        <>
          <Question
            id={`questionPropertyType${index}`}
            model={propertyTypeModelPath}
            translation="claim:otherPropertyDamage.propertyType">
            <SelectionControlGroup
              id={`propertyType${index}`}
              name="property-type"
              type="radio"
              defaultValue={damage.propertyType}
              aria-label={t('claim:otherPropertyDamage.propertyType')}
              controls={[
                {
                  value: constants.DAMAGE_PROPERTY_TYPE_IND,
                  label: t('claim:otherPropertyDamage.propertyType.labels.individual')
                },
                {
                  value: constants.DAMAGE_PROPERTY_TYPE_OTH,
                  label: t('claim:otherPropertyDamage.propertyType.labels.business')
                }
              ]}
              onChange={(value: string) => {
                store.dispatch(formActions.setTouched(propertyTypeModelPath));
                store.dispatch(formActions.setSubmitted(propertyTypeModelPath));
                store.dispatch(formActions.change(propertyTypeModelPath, value));

                raiseFieldGAEvent('last_field_interacted', 'radio', `propertyType${index}`, value);
              }}
            />
          </Question>
          {selectors.isPropertyDamagedBusiness(state, index) && (
            <Question
              id={`questionDamageCompanyName${index}`}
              model={`${modelPath}.companyName`}
              translation="claim:otherPropertyDamage.companyName">
              <MDTextField
                id={`damageCompanyName${index}`}
                model={`${modelPath}.companyName`}
                label={t('claim:otherPropertyDamage.companyName.label')}
                ariaLabel={t('claim:otherPropertyDamage.companyName.label')}
                maxLength={255}
              />
            </Question>
          )}
          <DPOPersonalDetails
            index={index}
            modelPath={modelPath}
            formModelPath={formModelPath}
            addressState={addressState}
            isBusiness={selectors.isPropertyDamagedBusiness(state, index)}
          />
        </>
      )}

      {selectors.isPropertyDamagedSubTypeVehicle(state, index) ? (
        <>
          <Question
            id={`questionVehicleDamageDescription${index}`}
            model={`${modelPath}.damageDescription`}
            translation="claim:otherPropertyDamage.vehicleDamageDescription">
            <MDTextField
              id={`vehicleDamageDescription${index}`}
              model={`${modelPath}.damageDescription`}
              rows={1}
              maxLength={399}
            />
          </Question>
          <VehicleDamageDetails index={index} modelPath={modelPath} formModelPath={formModelPath} />
        </>
      ) : null}
    </>
  );
};

export const PropertyDamageDetails = translate([
  'base',
  'claim',
  'claim/car',
  'claim/caravan',
  'claim/trailer',
  'claim/motorbike',
  'claim/motorhome',
  'claim/boat'
])(PropertyDamageDetailsComponent);

export default PropertyDamageDetails;
