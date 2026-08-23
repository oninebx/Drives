import * as React from 'react';
import { AddressManual, CustomAutocomplete, MDTextField } from '~/common/components/smart';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { InsuranceDetails, ThridPartyAtFault } from '~/feature/claim/car/components';
import type { OtherDriver } from '~/feature/claim/car/state';
import { Question } from '~/feature/claim/shared/components';
import { ClaimType } from '~/feature/claim/shared/state';
import './OtherDriverDetails.scss';
export interface OtherDriverDetailsProps extends InjectedTranslateProps {
  index: number;
  modelPath: string;
  formModelPath: string;
  claimType: ClaimType;
  makes: string[];
  models: string[];
  otherDriver: OtherDriver;
  clearVehicleModels: (index: number) => void;
  getVehicleModels: (index: number, make: string) => void;
}

export const OtherDriverDetailsComponent: React.FunctionComponent<OtherDriverDetailsProps> = ({
  t,
  index,
  modelPath,
  formModelPath,
  claimType,
  makes,
  models,
  otherDriver,
  clearVehicleModels,
  getVehicleModels
}: OtherDriverDetailsProps) => (
  <div className={`other-driver-container other-driver-${index}`} key={`other-driver-${index}`}>
    <Question
      id={`questionOtherDriverName-${index}`}
      model={`${modelPath}.firstName`}
      translation="claim/car:otherDrivers.name"
      subQuestion={true}
      noTick={true}>
      <MDTextField
        id={`otherDriver-${index}-firstName`}
        model={`${modelPath}.firstName`}
        label={t('claim/car:otherDrivers.name.firstNameLabel')}
        validateOn={['blur', 'change']}
        maxLength={40}
        showValidationTickIcon={true}
      />

      <MDTextField
        id={`otherDriver-${index}-lastName`}
        model={`${modelPath}.lastName`}
        label={t('claim/car:otherDrivers.name.lastNameLabel')}
        validateOn={['blur', 'change']}
        maxLength={40}
        showValidationTickIcon={true}
      />
    </Question>

    <Question
      id={`questionOtherDriverContactDetails-${index}`}
      model={`${modelPath}.phone`}
      translation="claim/car:otherDrivers.contactDetails"
      subQuestion={true}
      noTick={true}>
      <MDTextField
        id={`otherDriver-${index}-phone`}
        model={`${modelPath}.phone`}
        type="number"
        label={t('claim/car:otherDrivers.contactDetails.phoneNumberLabel')}
        validateOn={['blur', 'change']}
        showValidationTickIcon={true}
        placeholder={t('claim/car:otherDrivers.contactDetails.phoneNumberLabel')}
        isPhone={true}
        defaultCountry={t('claim:phone.defaultCountry')}
      />

      <MDTextField
        id={`otherDriver-${index}-email`}
        model={`${modelPath}.email`}
        type="email"
        label={t('claim/car:otherDrivers.contactDetails.emailLabel')}
        validateOn={['blur', 'change']}
        maxLength={60}
        showValidationTickIcon={true}
      />
      {t('claim:config.hidePartyAddress') !== true && (
        <AddressManual
          id={`otherDriver-${index}-address`}
          fullPathModel={`${modelPath}.address`}
          fullPathFormModel={`${formModelPath}.address`}
          addressState={otherDriver.address}
          isOptional={true}
          label={t('claim/car:otherDrivers.contactDetails.addressLabel')}
        />
      )}
    </Question>

    {claimType !== ClaimType.Boat && (
      <Question
        id={`questionOtherDriverRegistrationNumber-${index}`}
        model={`${modelPath}.rego`}
        translation="claim/car:otherDrivers.rego"
        subQuestion={true}
        noTick={true}>
        <div className="capitalize">
          <MDTextField
            id={`otherDriver-${index}-rego`}
            model={`${modelPath}.rego`}
            maxLength={6}
            label={t('claim/car:otherDrivers.rego.regoLabel')}
            validateOn={['blur', 'change']}
            showValidationTickIcon={true}
          />
        </div>
      </Question>
    )}

    {claimType !== ClaimType.Boat && (
      <Question
        id={`questionOtherDriverVehicleMake-${index}`}
        model={`${modelPath}.make`}
        translation="claim/car:otherDrivers.make"
        subQuestion={true}
        noTick={true}>
        <CustomAutocomplete
          id={`carMakes-${index}`}
          model={`${modelPath}.make`}
          dataLabel="label"
          dataValue="value"
          items={makes.map((value) => {
            return { label: value, value: value };
          })}
          onChange={(value: string) => {
            if (value !== otherDriver.make) {
              clearVehicleModels(index);
            }
          }}
          onAutocomplete={async (value: string) => {
            clearVehicleModels(index);
            await getVehicleModels(index, value);
          }}
        />
      </Question>
    )}

    {claimType !== ClaimType.Boat && models && models.length > 0 && (
      <Question
        id={`questionOtherDriverVehicleModel-${index}`}
        model={`${modelPath}.model`}
        translation="claim/car:otherDrivers.model"
        noTick={true}>
        <CustomAutocomplete
          id={`carModels-${index}`}
          model={`${modelPath}.model`}
          dataLabel="label"
          dataValue="value"
          items={models.map((value) => {
            return { label: value, value: value };
          })}
        />
      </Question>
    )}

    <ThridPartyAtFault
      modelPath={`${modelPath}.thirdPartyAtFault`}
      translation="claim/car:otherDrivers.thirdPartyAtFault"
      index={index}
    />

    <InsuranceDetails
      modelPath={modelPath}
      translation="claim/car:otherDrivers.insuranceDetails"
      placeholder={t('claim/car:otherDrivers.insuranceDetails.placeholder')}
    />
  </div>
);

export const OtherDriverDetails = translate(['base', 'claim', 'claim/car'])(OtherDriverDetailsComponent);

export default OtherDriverDetails;
