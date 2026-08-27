import { screen } from '@testing-library/react';
import * as React from 'react';
import { KnownLossItemType } from '~/common/state/autorest/Claims/src';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { YES } from '~/feature/claim/contents/state';
import { testClaimContentsState, testClaimState } from '~/feature/claim/shared/state/claimTestData';
import type { ApplicationState } from '~/root/rootReducer';
import ItemDetailsNonSpecified from './ItemDetailsNonSpecified';

describe('ItemDetailsNonSpecified', () => {
  const props: React.ComponentProps<typeof ItemDetailsNonSpecified> = {
    index: 0,
    modelPath: 'myForms.contentsClaim.nonSpecifiedItems.0'
  };

  const initialState = {
    myForms: {
      contentsClaim: testClaimContentsState,
      sharedClaim: testClaimState
    }
  } as Partial<ApplicationState>;

  it('should render the component correctly with primary item type selected', () => {
    const testState = { ...initialState };

    const nonSpecifiedItem = testState.myForms.contentsClaim.nonSpecifiedItemDamageDetails[0];
    nonSpecifiedItem.type = KnownLossItemType.Jewelry;

    renderComponent(<ItemDetailsNonSpecified {...props} />, { initialState });
    expect(screen.getByText('nonSpecifiedItems.primaryType.title')).toBeInTheDocument();
    expect(screen.getByText('nonSpecifiedItems.itemDescription.title')).toBeInTheDocument();
  });

  it('should render the component correctly with other primary item type selected', () => {
    const testState = { ...initialState };

    const nonSpecifiedItem = testState.myForms.contentsClaim.nonSpecifiedItemDamageDetails[0];
    nonSpecifiedItem.primaryType = KnownLossItemType.Other;

    renderComponent(<ItemDetailsNonSpecified {...props} />, { initialState });
    expect(screen.getByText('nonSpecifiedItems.primaryType.title')).toBeInTheDocument();
    expect(screen.getByText('nonSpecifiedItems.type.title')).toBeInTheDocument();
    expect(screen.getByText('nonSpecifiedItems.itemDescription.title')).toBeInTheDocument();
    expect(screen.getByText('nonSpecifiedItems.itemDescription.description')).toBeInTheDocument();
  });

  it.each([
    ['clothing', 'Please include the item type, brand, age, and the original price paid.'],
    ['contentsKeys', 'Please include the age, the original price paid, and the cost to replace them.'],
    [
      'dentures',
      'Please include the age of your dentures, the original price paid, and the contact details (including the email address) of your dentist.'
    ],
    ['documents', "Please include the document type (e.g. passport or driver's licence) and the cost to replace it."],
    ['electronics', 'Please include the item type, make, model, and the original price paid.'],
    [
      'frozenFood',
      'Tell us what the food was, how much it weighed, and what you paid for it. You can type the details or upload a list below. Please also upload photos of the spoiled food and the fridge or freezer it was stored in.'
    ],
    ['furniture', 'Please include the item type, brand, age, and the original price paid.'],
    [
      'hearingAids',
      'Please include the make, model, the original price paid, and the contact details (including the email address) of your audiologist.'
    ],
    ['officeEquipment', 'Please include the item type, brand, age, and the original price paid.'],
    ['money', 'Please include the currency type and the total amount of cash.'],
    ['musicalInstruments', 'Please include the item type, brand, age, and the original price paid.'],
    ['personalEffects', 'Please include the item type, brand, age, and the original price paid.'],
    ['spectacles', 'Please include the brand, the date they were purchased, and the original price paid.'],
    ['sportingEquipment', 'Please include the item type, brand, age, and the original price paid.'],
    ['tools', 'Please include the item type, brand, age, and the original price paid.'],
    ['unspecifiedCollections', 'Please include the item type, brand, age, and the original price paid.'],
    ['unspecifiedJewellery', 'Please include the metal colour, weight, carat, and the original price paid.'],
    ['watercraft', 'Please include the make, model, and the original price paid.'],
    ['whiteware', 'Please include the make, model, and the original price paid.'],
    ['other', 'Please include the item type, brand, age, and the original price paid.']
  ] as const)('returns "%s" for value %s', (type, expected) => {
    const newState = {
      ...initialState,
      myForms: {
        contentsClaim: {
          nonSpecifiedItemDamageDetails: [{ type }]
        }
      }
    } as Partial<ApplicationState>;

    renderComponent(<ItemDetailsNonSpecified {...props} />, {
      initialState: newState,
      translationData: {
        [`claim/contents:nonSpecifiedItems.itemDescription.descriptions.${type}`]: expected
      }
    });

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('should render the component correctly for mobile phone item', () => {
    const testState = { ...initialState };

    const nonSpecifiedItem = testState.myForms.contentsClaim.nonSpecifiedItemDamageDetails[0];
    nonSpecifiedItem.type = KnownLossItemType.MobilePhones;
    nonSpecifiedItem.make = 'Apple';
    nonSpecifiedItem.model = 'iPhone 10';
    nonSpecifiedItem.color = 'Black';
    nonSpecifiedItem.storageGb = '128Gb';
    nonSpecifiedItem.repairedOrReplaced = YES;

    renderComponent(<ItemDetailsNonSpecified {...props} />, { initialState: testState });
    expect(screen.getByText('nonSpecifiedItems.messages.repairedOrReplaced.mobilePhones.title')).toBeInTheDocument();
  });

  it('should render the component correctly for spectacles item', () => {
    const testState = { ...initialState };

    const nonSpecifiedItem = testState.myForms.contentsClaim.nonSpecifiedItemDamageDetails[0];
    nonSpecifiedItem.type = KnownLossItemType.Spectacles;
    nonSpecifiedItem.repairedOrReplaced = YES;

    renderComponent(<ItemDetailsNonSpecified {...props} />, { initialState: testState });
    expect(screen.getByText('nonSpecifiedItems.messages.repairedOrReplaced.spectacles.title')).toBeInTheDocument();
  });

  it('should render the component correctly for dentures item', () => {
    const testState = { ...initialState };

    const nonSpecifiedItem = testState.myForms.contentsClaim.nonSpecifiedItemDamageDetails[0];
    nonSpecifiedItem.type = KnownLossItemType.Dentures;

    renderComponent(<ItemDetailsNonSpecified {...props} />, { initialState: testState });
    expect(screen.getByText('nonSpecifiedItems.messages.repairedOrReplaced.dentures.title')).toBeInTheDocument();
  });

  it('should render the component correctly for hearing aids item', () => {
    const testState = { ...initialState };

    const nonSpecifiedItem = testState.myForms.contentsClaim.nonSpecifiedItemDamageDetails[0];
    nonSpecifiedItem.type = KnownLossItemType.HearingAids;

    renderComponent(<ItemDetailsNonSpecified {...props} />, { initialState: testState });
    expect(screen.getByText('nonSpecifiedItems.messages.repairedOrReplaced.hearingAids.title')).toBeInTheDocument();
  });

  it('should render the component correctly for jewelery item', () => {
    const testState = { ...initialState };

    const nonSpecifiedItem = testState.myForms.contentsClaim.nonSpecifiedItemDamageDetails[0];
    nonSpecifiedItem.type = KnownLossItemType.UnspecifiedJewellery;

    renderComponent(<ItemDetailsNonSpecified {...props} />, { initialState: testState });
    expect(screen.getByText('nonSpecifiedItems.messages.jewelleryValuation.description')).toBeInTheDocument();
  });

  it('should render the component correctly for electronics item', () => {
    const testState = { ...initialState };

    const nonSpecifiedItem = testState.myForms.contentsClaim.nonSpecifiedItemDamageDetails[0];
    nonSpecifiedItem.type = KnownLossItemType.Electronics;

    renderComponent(<ItemDetailsNonSpecified {...props} />, { initialState: testState });
    expect(screen.getByText('nonSpecifiedItems.messages.electronicsAssessmentMessage.description')).toBeInTheDocument();
  });
});
