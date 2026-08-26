import * as React from 'react';
import { SelectionControlGroup } from 'react-md';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import { bindActionCreators } from 'redux';
import { FormMessage, Html } from '~/common/components/base';
import { Question } from '~/common/components/dumb';
import { CustomAutocomplete, MDTextField } from '~/common/components/smart';
import { KnownLossItemType, KnownLossItemType as LossItemType } from '~/common/state/autorest/Claims/src/models';
import { raiseFieldGAEvent } from '~/common/utilities';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { MobileDamageDetails, MobileDetails, SpectaclesDamageDetails } from '~/feature/claim/contents/components';
import {
  CONTENTS_ITEM_TYPE,
  CONTENTS_PRIMARY_ITEM_TYPE,
  MAX_NON_SPECIFIED_ITEM_COUNT,
  selectors,
  thunks,
  YES
} from '~/feature/claim/contents/state';
import { MAX_LENGTH_ITEM_DESCRIPTION } from '~/feature/claim/shared/state';
import type { ApplicationState } from '~/root/rootReducer';

export interface ItemDetailsNonSpecifiedProps
  extends Partial<ReturnType<typeof mapStateToProps>>,
    Partial<ReturnType<typeof mapDispatchToProps>>,
    InjectedTranslateProps {
  index: number;
  modelPath: string;
}

const mapStateToProps = (state: ApplicationState) => ({
  nonSpecifiedItemDamageDetails: selectors.getNonSpecifiedItemDamageDetails(state)
});

const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(
    {
      clearNonSpecifiedItemDetails: thunks.clearNonSpecifiedItemDetails,
      updateNonSpecifiedItemType: thunks.updateNonSpecifiedItemType
    },
    dispatch
  );

export const ItemDetailsNonSpecifiedComponent = ({
  t,
  index,
  modelPath,
  nonSpecifiedItemDamageDetails,
  updateNonSpecifiedItemType,
  clearNonSpecifiedItemDetails
}: ItemDetailsNonSpecifiedProps) => {
  const nonSpecifiedItem = nonSpecifiedItemDamageDetails[index];
  const itemTypeModelPath = `${modelPath}.type`;
  const itemDescriptionModelPath = `${modelPath}.itemDescription`;

  const itemDescriptionDescriptionTranslationKey = `nonSpecifiedItems.itemDescription.descriptions.${nonSpecifiedItem.type}`;
  const itemDescriptionDescriptionTranslation = t(`claim/contents:${itemDescriptionDescriptionTranslationKey}`);
  let overrideTranslationDescriptionKey = 'description';

  // Translation returns key if white label not found for key
  if (itemDescriptionDescriptionTranslation !== itemDescriptionDescriptionTranslationKey) {
    // Override description white label text exists so use that
    overrideTranslationDescriptionKey = `descriptions.${nonSpecifiedItem.type}`;
  }

  return (
    <>
      <Question
        id={`questionItemDetailsNonSpecifiedPrimaryType-${index}`}
        model={`${modelPath}.primaryType`}
        translation="claim/contents:nonSpecifiedItems.primaryType">
        <SelectionControlGroup
          id={`itemDetailsNonSpecifiedPrimaryType-${index}-radioButtons`}
          name={`itemDetailsNonSpecifiedPrimaryType-${index}-radioButtons`}
          type="radio"
          // aria-label="Select what best describes your situation"
          controls={CONTENTS_PRIMARY_ITEM_TYPE.map((item) => {
            return { label: item.label, value: item.value };
          })}
          defaultValue={nonSpecifiedItem.primaryType}
          onChange={(value: string) => {
            updateNonSpecifiedItemType(index, value);

            raiseFieldGAEvent('last_field_interacted', 'radio', 'itemDetailsNonSpecifiedPrimaryType', value);
          }}
        />
      </Question>

      {nonSpecifiedItem.primaryType === KnownLossItemType.Other && (
        <Question
          id={`questionItemDetailsNonSpecifiedOtherType-${index}`}
          model={itemTypeModelPath}
          translation="claim/contents:nonSpecifiedItems.type">
          <CustomAutocomplete
            id={`questionItemDetailsNonSpecifiedOtherType-${index}-autocomplete`}
            model={itemTypeModelPath}
            dataLabel="label"
            dataValue="value"
            items={CONTENTS_ITEM_TYPE.map((item) => {
              return { label: item.label, value: item.value };
            })}
            itemSelected={!!nonSpecifiedItem && nonSpecifiedItem.type !== ''}
            placeholder={t('claim/contents:nonSpecifiedItems.type.placeholder')}
            onAutocomplete={() => {
              clearNonSpecifiedItemDetails(index);
            }}
          />
        </Question>
      )}

      {nonSpecifiedItem.type === LossItemType.MobilePhones && (
        <>
          <Question id="questionMobileDetails" model={modelPath} translation="claim/contents:mobileDetails"></Question>
          <MobileDetails index={index} modelPath={modelPath} />
          <MobileDamageDetails index={index} modelPath={modelPath} specified={false} />
        </>
      )}

      {nonSpecifiedItem.type !== LossItemType.MobilePhones && (
        <Question
          id={`questionItemDetailsNonSpecifiedItemDescription-${index}`}
          model={itemDescriptionModelPath}
          translation="claim/contents:nonSpecifiedItems.itemDescription"
          overrideTranslationDescriptionKey={overrideTranslationDescriptionKey}>
          <MDTextField
            id={`itemDetailsNonSpecifiedItemDescription-${index}`}
            model={itemDescriptionModelPath}
            rows={1}
            maxLength={MAX_LENGTH_ITEM_DESCRIPTION}
          />
        </Question>
      )}

      {nonSpecifiedItem.type === LossItemType.Spectacles && (
        <SpectaclesDamageDetails index={index} modelPath={modelPath} />
      )}

      {(nonSpecifiedItem.type === LossItemType.Dentures ||
        nonSpecifiedItem.type === LossItemType.HearingAids ||
        ((nonSpecifiedItem.type === LossItemType.MobilePhones || nonSpecifiedItem.type === LossItemType.Spectacles) &&
          nonSpecifiedItem.repairedOrReplaced === YES)) && (
        <FormMessage
          id={`repairedOrReplacedMessage${index}`}
          title={t(`claim/contents:nonSpecifiedItems.messages.repairedOrReplaced.${nonSpecifiedItem.type}.title`)}
          description={
            <Html
              inline
              rawHtml={t(
                `claim/contents:nonSpecifiedItems.messages.repairedOrReplaced.${nonSpecifiedItem.type}.description`
              )}
            />
          }
        />
      )}

      {nonSpecifiedItem.type === LossItemType.UnspecifiedJewellery && (
        <FormMessage
          id={`jewelleryValuationMessage${index}`}
          title={t('claim/contents:nonSpecifiedItems.messages.jewelleryValuation.title')}
          description={
            <Html inline rawHtml={t('claim/contents:nonSpecifiedItems.messages.jewelleryValuation.description')} />
          }
        />
      )}

      {nonSpecifiedItem.type === LossItemType.Electronics && (
        <FormMessage
          id={`electronicsAssessmentMessage${index}`}
          title={t('claim/contents:nonSpecifiedItems.messages.electronicsAssessmentMessage.title')}
          description={
            <Html
              inline
              rawHtml={t('claim/contents:nonSpecifiedItems.messages.electronicsAssessmentMessage.description')}
            />
          }
        />
      )}

      {index === MAX_NON_SPECIFIED_ITEM_COUNT - 1 && (
        <FormMessage
          id="maxAllowedNonSpecifiedItemsMessage"
          title={t('claim/contents:nonSpecifiedItems.maxAllowedMessage.title')}
          description={<Html inline rawHtml={t('claim/contents:nonSpecifiedItems.maxAllowedMessage.description')} />}
        />
      )}
    </>
  );
};

export const ItemDetailsNonSpecifiedTranslated = translate(['base', 'claim', 'claim/contents'])(
  ItemDetailsNonSpecifiedComponent
);

export const ItemDetailsNonSpecified = connect(mapStateToProps, mapDispatchToProps)(ItemDetailsNonSpecifiedTranslated);

export default ItemDetailsNonSpecified;
