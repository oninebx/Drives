import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ItemDetailsNonSpecifiedComponent } from './ItemDetailsNonSpecified';
import { KnownLossItemType } from '~/common/state/autorest/Claims/src/models';
import { raiseFieldGAEvent } from '~/common/utilities';
import { MAX_NON_SPECIFIED_ITEM_COUNT, YES } from '~/feature/claim/contents/state';

const mockQuestion = jest.fn();
const mockSelectionControlGroup = jest.fn();
const mockCustomAutocomplete = jest.fn();
const mockMDTextField = jest.fn();
const mockMobileDetails = jest.fn();
const mockMobileDamageDetails = jest.fn();
const mockSpectaclesDamageDetails = jest.fn();
const mockFormMessage = jest.fn();
const mockHtml = jest.fn();

jest.mock('react-md', () => ({
  SelectionControlGroup: (props: any) => {
    mockSelectionControlGroup(props);
    return <button data-testid="SelectionControlGroup" onClick={() => props.onChange('Other')}>SelectionControlGroup</button>;
  }
}));

jest.mock('~/common/components/dumb', () => ({
  Question: (props: any) => {
    mockQuestion(props);
    return <div data-testid={`Question-${props.id}`}>{props.children}</div>;
  }
}));

jest.mock('~/common/components/smart', () => ({
  CustomAutocomplete: (props: any) => {
    mockCustomAutocomplete(props);
    return <button data-testid={props.id} onClick={() => props.onAutocomplete()}>CustomAutocomplete</button>;
  },
  MDTextField: (props: any) => {
    mockMDTextField(props);
    return <div data-testid={props.id}>MDTextField</div>;
  }
}));

jest.mock('~/common/components/base', () => ({
  FormMessage: (props: any) => {
    mockFormMessage(props);
    return <div data-testid={props.id}>{props.title}{props.description}</div>;
  },
  Html: (props: any) => {
    mockHtml(props);
    return <span data-testid="Html">{props.rawHtml}</span>;
  }
}));

jest.mock('~/feature/claim/contents/components', () => ({
  MobileDetails: (props: any) => {
    mockMobileDetails(props);
    return <div data-testid="MobileDetails" />;
  },
  MobileDamageDetails: (props: any) => {
    mockMobileDamageDetails(props);
    return <div data-testid="MobileDamageDetails" />;
  },
  SpectaclesDamageDetails: (props: any) => {
    mockSpectaclesDamageDetails(props);
    return <div data-testid="SpectaclesDamageDetails" />;
  }
}));

jest.mock('~/common/utilities', () => ({
  raiseFieldGAEvent: jest.fn()
}));

jest.mock('~/feature/claim/contents/state', () => ({
  CONTENTS_ITEM_TYPE: [
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Spectacles', value: 'Spectacles' }
  ],
  CONTENTS_PRIMARY_ITEM_TYPE: [
    { label: 'Other', value: 'Other' },
    { label: 'Jewellery', value: 'Jewellery' }
  ],
  MAX_NON_SPECIFIED_ITEM_COUNT: 5,
  YES: 'YES',
  selectors: { getNonSpecifiedItemDamageDetails: jest.fn() },
  thunks: {
    clearNonSpecifiedItemDetails: jest.fn(),
    updateNonSpecifiedItemType: jest.fn()
  }
}));

describe('ItemDetailsNonSpecifiedComponent', () => {
  const mockUpdateNonSpecifiedItemType = jest.fn();
  const mockClearNonSpecifiedItemDetails = jest.fn();
  const mockT = jest.fn((key: string) => key);

  const defaultProps = {
    t: mockT,
    index: 0,
    modelPath: 'claim.contents.nonSpecifiedItems[0]',
    nonSpecifiedItemDamageDetails: [
      { primaryType: KnownLossItemType.Other, type: '', repairedOrReplaced: '', itemDescription: '' }
    ],
    updateNonSpecifiedItemType: mockUpdateNonSpecifiedItemType,
    clearNonSpecifiedItemDetails: mockClearNonSpecifiedItemDetails
  };

  const renderComponent = (props: Partial<typeof defaultProps> = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return render(<ItemDetailsNonSpecifiedComponent {...mergedProps} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockT.mockImplementation((key: string) => key);
  });

  describe('primary item type', () => {
    it('renders the primary type question', () => {
      renderComponent();

      expect(screen.getByTestId('Question-questionItemDetailsNonSpecifiedPrimaryType-0')).toBeInTheDocument();
    });

    it('passes the correct props to SelectionControlGroup', () => {
      renderComponent();

      expect(mockSelectionControlGroup).toHaveBeenCalledWith(expect.objectContaining({
        id: 'itemDetailsNonSpecifiedPrimaryType-0-radioButtons',
        name: 'itemDetailsNonSpecifiedPrimaryType-0-radioButtons',
        type: 'radio',
        defaultValue: KnownLossItemType.Other
      }));
    });

    it('updates item type and raises GA event when primary type changes', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('SelectionControlGroup'));

      expect(mockUpdateNonSpecifiedItemType).toHaveBeenCalledWith(0, 'Other');
      expect(raiseFieldGAEvent).toHaveBeenCalledWith('last_field_interacted', 'radio', 'itemDetailsNonSpecifiedPrimaryType', 'Other');
    });
  });

  describe('other item type', () => {
    it('renders CustomAutocomplete when primary type is Other', () => {
      renderComponent();

      expect(screen.getByTestId('questionItemDetailsNonSpecifiedOtherType-0-autocomplete')).toBeInTheDocument();
    });

    it('does not render CustomAutocomplete when primary type is not Other', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Jewelry, type: '', repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(screen.queryByTestId('questionItemDetailsNonSpecifiedOtherType-0-autocomplete')).not.toBeInTheDocument();
    });

    it('passes the correct item selected state to CustomAutocomplete', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.Electronics, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(mockCustomAutocomplete).toHaveBeenCalledWith(expect.objectContaining({
        id: 'questionItemDetailsNonSpecifiedOtherType-0-autocomplete',
        model: 'claim.contents.nonSpecifiedItems[0].type',
        itemSelected: true
      }));
    });

    it('clears item details when autocomplete is used', () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('questionItemDetailsNonSpecifiedOtherType-0-autocomplete'));

      expect(mockClearNonSpecifiedItemDetails).toHaveBeenCalledWith(0);
    });
  });

  describe('mobile phone', () => {
    it('renders mobile details when item type is MobilePhones', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.MobilePhones, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(screen.getByTestId('MobileDetails')).toBeInTheDocument();
      expect(screen.getByTestId('MobileDamageDetails')).toBeInTheDocument();
    });

    it('passes the correct props to mobile components', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.MobilePhones, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(mockMobileDetails).toHaveBeenCalledWith(expect.objectContaining({
        index: 0,
        modelPath: 'claim.contents.nonSpecifiedItems[0]'
      }));

      expect(mockMobileDamageDetails).toHaveBeenCalledWith(expect.objectContaining({
        index: 0,
        modelPath: 'claim.contents.nonSpecifiedItems[0]',
        specified: false
      }));
    });

    it('does not render item description for MobilePhones', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.MobilePhones, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(screen.queryByTestId('itemDetailsNonSpecifiedItemDescription-0')).not.toBeInTheDocument();
    });
  });

  describe('item description', () => {
    it('renders item description for non-mobile items', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.Electronics, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(screen.getByTestId('itemDetailsNonSpecifiedItemDescription-0')).toBeInTheDocument();
    });

    it('passes the correct model to MDTextField', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.Electronics, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(mockMDTextField).toHaveBeenCalledWith(expect.objectContaining({
        id: 'itemDetailsNonSpecifiedItemDescription-0',
        model: 'claim.contents.nonSpecifiedItems[0].itemDescription',
        rows: 1
      }));
    });

    it('uses default description translation key when override translation does not exist', () => {
      const type = KnownLossItemType.Electronics;
      const itemDescriptionDescriptionTranslationKey = `nonSpecifiedItems.itemDescription.descriptions.${type}`;
      const itemDescriptionKey = `claim/contents:nonSpecifiedItems.itemDescription.descriptions.${type}`;

      mockT.mockImplementation((key: string) => {
        if (key === itemDescriptionKey) return itemDescriptionDescriptionTranslationKey;
        return key;
      });

      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.Electronics, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      const questionCall = mockQuestion.mock.calls.find(
        ([props]) => props.id === 'questionItemDetailsNonSpecifiedItemDescription-0'
      );

      expect(questionCall?.[0]).toEqual(expect.objectContaining({
        overrideTranslationDescriptionKey: 'description'
      }));
    });

    it('uses white label description translation key when override exists', () => {
      mockT.mockImplementation((key: string) => {
        if (key === 'claim/contents:nonSpecifiedItems.itemDescription.descriptions.Electronics') {
          return 'Custom electronics description';
        }
        return key;
      });

      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.Electronics, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      const questionCall = mockQuestion.mock.calls.find(
        ([props]) => props.id === 'questionItemDetailsNonSpecifiedItemDescription-0'
      );

      expect(questionCall?.[0]).toEqual(expect.objectContaining({
        overrideTranslationDescriptionKey: 'descriptions.electronics'
      }));
    });
  });

  describe('spectacles', () => {
    it('renders SpectaclesDamageDetails for Spectacles', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.Spectacles, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(screen.getByTestId('SpectaclesDamageDetails')).toBeInTheDocument();
      expect(mockSpectaclesDamageDetails).toHaveBeenCalledWith(expect.objectContaining({
        index: 0,
        modelPath: 'claim.contents.nonSpecifiedItems[0]'
      }));
    });
  });

  describe('repaired or replaced message', () => {
    it.each([
      [KnownLossItemType.Dentures, ''],
      [KnownLossItemType.HearingAids, ''],
      [KnownLossItemType.MobilePhones, YES],
      [KnownLossItemType.Spectacles, YES]
    ])('renders repaired or replaced message for %s', (type, repairedOrReplaced) => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type, repairedOrReplaced, itemDescription: '' }
        ]
      });

      expect(screen.getByTestId('repairedOrReplacedMessage0')).toBeInTheDocument();
    });

    it('does not render repaired or replaced message for other item types', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.Electronics, repairedOrReplaced: YES, itemDescription: '' }
        ]
      });

      expect(screen.queryByTestId('repairedOrReplacedMessage0')).not.toBeInTheDocument();
    });
  });

  describe('jewellery message', () => {
    it('renders jewellery valuation message for UnspecifiedJewellery', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.UnspecifiedJewellery, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(screen.getByTestId('jewelleryValuationMessage0')).toBeInTheDocument();
    });
  });

  describe('electronics message', () => {
    it('renders electronics assessment message for Electronics', () => {
      renderComponent({
        nonSpecifiedItemDamageDetails: [
          { primaryType: KnownLossItemType.Other, type: KnownLossItemType.Electronics, repairedOrReplaced: '', itemDescription: '' }
        ]
      });

      expect(screen.getByTestId('electronicsAssessmentMessage0')).toBeInTheDocument();
    });
  });

  describe('maximum item count message', () => {
    it('renders max allowed message for the last allowed item', () => {
      const lastIndex = MAX_NON_SPECIFIED_ITEM_COUNT - 1;

      renderComponent({
        index: lastIndex,
        modelPath: `claim.contents.nonSpecifiedItems[${lastIndex}]`,
        nonSpecifiedItemDamageDetails: Array.from({ length: MAX_NON_SPECIFIED_ITEM_COUNT }, (_, index) => ({
          primaryType: KnownLossItemType.Other,
          type: index === lastIndex ? KnownLossItemType.Electronics : '',
          repairedOrReplaced: '',
          itemDescription: ''
        }))
      });

      expect(screen.getByTestId('maxAllowedNonSpecifiedItemsMessage')).toBeInTheDocument();
    });

    it('does not render max allowed message for other items', () => {
      renderComponent({ index: 0 });

      expect(screen.queryByTestId('maxAllowedNonSpecifiedItemsMessage')).not.toBeInTheDocument();
    });
  });
});