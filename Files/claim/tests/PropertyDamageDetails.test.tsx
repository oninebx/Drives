import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { PropertyDamageDetailsComponent } from './PropertyDamageDetails';
import type { PropertyDamageDetailsProps } from './PropertyDamageDetails';
import { raiseFieldGAEvent } from '~/common/utilities';
import { selectors } from '~/feature/claim/car/state';
import * as constants from '~/feature/claim/car/state/constants';
import { actions as formActions } from 'react-redux-form';
import { MAX_LENGTH_DAMAGE_DESCRIPTION, selectors as sharedSelectors } from '~/feature/claim/shared/state';
import store from '~/root/store';

type TranslationValue = string | boolean;

const mockT = jest.fn((key: string): TranslationValue => {
  const translations: Record<string, TranslationValue> = {
    'claim:otherPropertyDamage.damageSubType.labels.property': 'Property',
    'claim:otherPropertyDamage.damageSubType.labels.contents': 'Contents',
    'claim:otherPropertyDamage.damageSubType.labels.vehicle': 'Vehicle',
    'claim:otherPropertyDamage.damageSubType': 'Damage subtype',
    'claim:otherPropertyDamage.propertyType': 'Property type',
    'claim:otherPropertyDamage.propertyType.labels.individual': 'Individual',
    'claim:otherPropertyDamage.propertyType.labels.business': 'Business',
    'claim:otherPropertyDamage.companyName.label': 'Company name',
    'button.yes': 'Yes',
    'button.no': 'No'
  };
  return translations[key] ?? key;
});

const mockQuestion = jest.fn();
const mockMDTextField = jest.fn();
const mockMDRadioButton = jest.fn();
const mockSelectionControlGroup = jest.fn();
const mockDPOPersonalDetails = jest.fn();
const mockVehicleDamageDetails = jest.fn();

jest.mock('~/common/utilities/translation', () => ({
  translate: () => (Component: React.ComponentType) => Component
}));

jest.mock('react-redux-form', () => ({
  actions: {
    setTouched: jest.fn(),
    setSubmitted: jest.fn(),
    change: jest.fn()
  }
}));

jest.mock('react-md/lib/SelectionControls/SelectionControlGroup', () => ({
  __esModule: true,
  default: (props: {
    id: string;
    name: string;
    type: string;
    defaultValue?: string;
    ariaLabel: TranslationValue;
    controls: Array<{ value: string; label: TranslationValue }>;
    onChange: (value: string) => void;
  }) => {
    mockSelectionControlGroup(props);
    return <div data-testid={props.id} />;
  }
}));

jest.mock('~/common/components/dumb', () => ({
  Question: (props: { children: React.ReactNode; id: string }) => {
    mockQuestion(props);
    return <div data-testid={props.id}>{props.children}</div>;
  }
}));

jest.mock('~/common/components/smart', () => ({
  MDTextField: (props: { id: string }) => {
    mockMDTextField(props);
    return <div data-testid={props.id} />;
  },
  MDRadioButton: (props: { id: string }) => {
    mockMDRadioButton(props);
    return <div data-testid={props.id} />;
  }
}));

jest.mock('~/common/utilities', () => ({
  raiseFieldGAEvent: jest.fn()
}));

jest.mock('~/feature/claim/car/components/dumb', () => ({
  VehicleDamageDetails: (props: { index: number; modelPath: string; formModelPath: string }) => {
    mockVehicleDamageDetails(props);
    return <div data-testid="vehicle-damage-details" />;
  }
}));

jest.mock('~/feature/claim/car/components/dumb/DPOPersonalDetails/DPOPersonalDetails', () => ({
  __esModule: true,
  default: (props: {
    index: number;
    modelPath: string;
    formModelPath: string;
    addressState: PropertyDamageDetailsProps['addressState'];
    isBusiness: boolean;
  }) => {
    mockDPOPersonalDetails(props);
    return <div data-testid="dpo-personal-details" />;
  }
}));

jest.mock('~/feature/claim/car/state', () => ({
  selectors: {
    getOtherPropertyDamage: jest.fn(),
    showOtherPeoplePropertyVehicleOption: jest.fn(),
    isPropertyDamagedSubTypeVehicle: jest.fn(),
    knowDamagedPropertyOwner: jest.fn(),
    isPropertyDamagedBusiness: jest.fn()
  }
}));

jest.mock('~/feature/claim/shared/state/constants', () => ({
  DAMAGE_SUBTYPE_3RD_PARTY_PROPERTY: 'property',
  DAMAGE_SUBTYPE_3RD_PARTY_CONTENTS: 'contents',
  DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE: 'vehicle',
  DAMAGE_PROPERTY_TYPE_IND: 'individual',
  DAMAGE_PROPERTY_TYPE_OTH: 'business'
}));

jest.mock('~/feature/claim/shared/state', () => ({
  MAX_LENGTH_DAMAGE_DESCRIPTION: 1000,
  selectors: { getClaimType: jest.fn() }
}));

jest.mock('~/root/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
    dispatch: jest.fn()
  }
}));

const mockGetOtherPropertyDamage = selectors.getOtherPropertyDamage as jest.MockedFunction<typeof selectors.getOtherPropertyDamage>;
const mockShowOtherPeoplePropertyVehicleOption = selectors.showOtherPeoplePropertyVehicleOption as jest.MockedFunction<typeof selectors.showOtherPeoplePropertyVehicleOption>;
const mockIsPropertyDamagedSubTypeVehicle = selectors.isPropertyDamagedSubTypeVehicle as jest.MockedFunction<typeof selectors.isPropertyDamagedSubTypeVehicle>;
const mockKnowDamagedPropertyOwner = selectors.knowDamagedPropertyOwner as jest.MockedFunction<typeof selectors.knowDamagedPropertyOwner>;
const mockIsPropertyDamagedBusiness = selectors.isPropertyDamagedBusiness as jest.MockedFunction<typeof selectors.isPropertyDamagedBusiness>;
const mockGetClaimType = sharedSelectors.getClaimType as jest.MockedFunction<typeof sharedSelectors.getClaimType>;
const mockStoreGetState = store.getState as jest.MockedFunction<typeof store.getState>;

const damage = {
  damageSubType: constants.DAMAGE_SUBTYPE_3RD_PARTY_PROPERTY,
  propertyType: constants.DAMAGE_PROPERTY_TYPE_IND
};

const addressState = {
  addressLine1: '123 Test Street',
  addressLine2: '',
  suburb: 'Auckland',
  city: 'Auckland',
  postcode: '1010',
  country: 'NZ'
} as PropertyDamageDetailsProps['addressState'];

const defaultProps: PropertyDamageDetailsProps = {
  t: mockT,
  index: 1,
  modelPath: 'claim.otherPropertyDamages[1]',
  formModelPath: 'forms.otherPropertyDamages[1]',
  addressState
};

const renderComponent = (overrides: Partial<PropertyDamageDetailsProps> = {}) =>
  render(<PropertyDamageDetailsComponent {...defaultProps} {...overrides} />);

const expectRendered = (testId: string) => {
  expect(screen.getByTestId(testId)).toBeInTheDocument();
};

const expectNotRendered = (testId: string) => {
  expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
};

describe('PropertyDamageDetailsComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreGetState.mockReturnValue({} as ReturnType<typeof store.getState>);
    mockGetClaimType.mockReturnValue('car');
    mockGetOtherPropertyDamage.mockReturnValue(damage);
    mockShowOtherPeoplePropertyVehicleOption.mockReturnValue(false);
    mockIsPropertyDamagedSubTypeVehicle.mockReturnValue(false);
    mockKnowDamagedPropertyOwner.mockReturnValue(false);
    mockIsPropertyDamagedBusiness.mockReturnValue(false);
  });

  describe('basic rendering', () => {
    it('renders the damage subtype question', () => {
      renderComponent();

      expectRendered('questionDamageSubType1');
      expectRendered('damageSubType1');
    });

    it('passes the expected props to damage subtype SelectionControlGroup', () => {
      renderComponent();

      expect(mockSelectionControlGroup).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'damageSubType1',
          name: 'damage-sub-type',
          type: 'radio',
          defaultValue: constants.DAMAGE_SUBTYPE_3RD_PARTY_PROPERTY,
          'aria-label': 'Damage subtype',
          controls: [
            { value: constants.DAMAGE_SUBTYPE_3RD_PARTY_PROPERTY, label: 'Property' },
            { value: constants.DAMAGE_SUBTYPE_3RD_PARTY_CONTENTS, label: 'Contents' }
          ],
          onChange: expect.any(Function)
        })
      );
    });
  });

  describe('damage subtype controls', () => {
    it('does not include vehicle option when vehicle option is disabled', () => {
      mockShowOtherPeoplePropertyVehicleOption.mockReturnValue(false);

      renderComponent();

      const props = mockSelectionControlGroup.mock.calls[0][0];
      expect(props.controls).toHaveLength(2);
      expect(props.controls).not.toContainEqual(
        expect.objectContaining({ value: constants.DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE })
      );
    });

    it('includes vehicle option when vehicle option is enabled', () => {
      mockShowOtherPeoplePropertyVehicleOption.mockReturnValue(true);

      renderComponent();

      const props = mockSelectionControlGroup.mock.calls[0][0];
      expect(props.controls).toHaveLength(3);
      expect(props.controls).toContainEqual({
        value: constants.DAMAGE_SUBTYPE_3RD_PARTY_VEHICLE,
        label: 'Vehicle'
      });
    });
  });

  describe('damage description and property owner', () => {
    it('renders damage description and property owner fields for a non-vehicle damage subtype', () => {
      renderComponent();

      expectRendered('questionDamageDescription1');
      expectRendered('damageDescription1');
      expectRendered('questionKnowPropertyOwner1');
      expectRendered('knowPropertyOwner1');
    });

    it('does not render damage description and property owner fields when damage does not exist', () => {
      mockGetOtherPropertyDamage.mockReturnValue(undefined);

      renderComponent();

      expectNotRendered('questionDamageDescription1');
      expectNotRendered('damageDescription1');
      expectNotRendered('questionKnowPropertyOwner1');
      expectNotRendered('knowPropertyOwner1');
    });

    it('does not render damage description and property owner fields when damage subtype is vehicle', () => {
      mockIsPropertyDamagedSubTypeVehicle.mockReturnValue(true);

      renderComponent();

      expectNotRendered('questionDamageDescription1');
      expectNotRendered('questionKnowPropertyOwner1');
    });

    it('passes the expected props to damage description field', () => {
      renderComponent();

      expect(mockMDTextField).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'damageDescription1',
          model: 'claim.otherPropertyDamages[1].damageDescription',
          rows: 1,
          maxLength: MAX_LENGTH_DAMAGE_DESCRIPTION
        })
      );
    });

    it('passes the expected props to property owner radio button', () => {
      renderComponent();

      expect(mockMDRadioButton).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'knowPropertyOwner1',
          model: 'claim.otherPropertyDamages[1].knowPropertyOwner',
          options: [
            { value: true, label: 'Yes' },
            { value: false, label: 'No' }
          ]
        })
      );
    });
  });

  describe('property owner details', () => {
    it('does not render property owner details when property owner is not known', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(false);

      renderComponent();

      expectNotRendered('questionPropertyType1');
      expectNotRendered('dpo-personal-details');
    });

    it('renders property owner details when property owner is known', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);

      renderComponent();

      expectRendered('questionPropertyType1');
      expectRendered('propertyType1');
      expectRendered('dpo-personal-details');
    });

    it('passes the expected props to property type SelectionControlGroup', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);

      renderComponent();

      expect(mockSelectionControlGroup).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'propertyType1',
          name: 'property-type',
          type: 'radio',
          defaultValue: constants.DAMAGE_PROPERTY_TYPE_IND,
          'aria-label': 'Property type',
          controls: [
            { value: constants.DAMAGE_PROPERTY_TYPE_IND, label: 'Individual' },
            { value: constants.DAMAGE_PROPERTY_TYPE_OTH, label: 'Business' }
          ],
          onChange: expect.any(Function)
        })
      );
    });

    it('does not render company name when damaged property is not a business', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);
      mockIsPropertyDamagedBusiness.mockReturnValue(false);

      renderComponent();

      expectNotRendered('questionDamageCompanyName1');
      expectNotRendered('damageCompanyName1');
    });

    it('renders company name when damaged property is a business', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);
      mockIsPropertyDamagedBusiness.mockReturnValue(true);

      renderComponent();

      expectRendered('questionDamageCompanyName1');
      expectRendered('damageCompanyName1');
    });

    it('passes the expected props to company name field', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);
      mockIsPropertyDamagedBusiness.mockReturnValue(true);

      renderComponent();

      expect(mockMDTextField).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'damageCompanyName1',
          model: 'claim.otherPropertyDamages[1].companyName',
          label: 'Company name',
          ariaLabel: 'Company name',
          maxLength: 255
        })
      );
    });

    it('passes the expected props to DPOPersonalDetails', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);
      mockIsPropertyDamagedBusiness.mockReturnValue(true);

      renderComponent();

      expect(mockDPOPersonalDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 1,
          modelPath: 'claim.otherPropertyDamages[1]',
          formModelPath: 'forms.otherPropertyDamages[1]',
          addressState,
          isBusiness: true
        })
      );
    });

    it('passes isBusiness false to DPOPersonalDetails for an individual', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);
      mockIsPropertyDamagedBusiness.mockReturnValue(false);

      renderComponent();

      expect(mockDPOPersonalDetails).toHaveBeenCalledWith(
        expect.objectContaining({ isBusiness: false })
      );
    });
  });

  describe('vehicle damage', () => {
    it('does not render vehicle damage details by default', () => {
      renderComponent();

      expectNotRendered('questionVehicleDamageDescription1');
      expectNotRendered('vehicleDamageDescription1');
      expectNotRendered('vehicle-damage-details');
    });

    it('renders vehicle damage details when damage subtype is vehicle', () => {
      mockIsPropertyDamagedSubTypeVehicle.mockReturnValue(true);

      renderComponent();

      expectRendered('questionVehicleDamageDescription1');
      expectRendered('vehicleDamageDescription1');
      expectRendered('vehicle-damage-details');
    });

    it('passes the expected props to vehicle damage description field', () => {
      mockIsPropertyDamagedSubTypeVehicle.mockReturnValue(true);

      renderComponent();

      expect(mockMDTextField).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'vehicleDamageDescription1',
          model: 'claim.otherPropertyDamages[1].damageDescription',
          rows: 1,
          maxLength: 399
        })
      );
    });

    it('passes the expected props to VehicleDamageDetails', () => {
      mockIsPropertyDamagedSubTypeVehicle.mockReturnValue(true);

      renderComponent();

      expect(mockVehicleDamageDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 1,
          modelPath: 'claim.otherPropertyDamages[1]',
          formModelPath: 'forms.otherPropertyDamages[1]'
        })
      );
    });
  });

  describe('damage subtype change', () => {
    it('updates the damage subtype and raises a GA event', () => {
      renderComponent();

      const damageSubTypeProps = mockSelectionControlGroup.mock.calls[0][0];
      damageSubTypeProps.onChange(constants.DAMAGE_SUBTYPE_3RD_PARTY_CONTENTS);

      const modelPath = 'claim.otherPropertyDamages[1].damageSubType';

      expect(formActions.setTouched).toHaveBeenCalledWith(modelPath);
      expect(formActions.setSubmitted).toHaveBeenCalledWith(modelPath);
      expect(formActions.change).toHaveBeenCalledWith(modelPath, constants.DAMAGE_SUBTYPE_3RD_PARTY_CONTENTS);
      expect(store.dispatch).toHaveBeenCalledTimes(3);
      expect(raiseFieldGAEvent).toHaveBeenCalledWith(
        'last_field_interacted',
        'radio',
        'questionDamageSubType1',
        constants.DAMAGE_SUBTYPE_3RD_PARTY_CONTENTS
      );
    });
  });

  describe('property type change', () => {
    it('updates the property type and raises a GA event', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);

      renderComponent();

      const propertyTypeProps = mockSelectionControlGroup.mock.calls[1][0];
      propertyTypeProps.onChange(constants.DAMAGE_PROPERTY_TYPE_OTH);

      const propertyTypeModelPath = 'claim.otherPropertyDamages[1].propertyType';

      expect(formActions.setTouched).toHaveBeenCalledWith(propertyTypeModelPath);
      expect(formActions.setSubmitted).toHaveBeenCalledWith(propertyTypeModelPath);
      expect(formActions.change).toHaveBeenCalledWith(propertyTypeModelPath, constants.DAMAGE_PROPERTY_TYPE_OTH);
      expect(store.dispatch).toHaveBeenCalledTimes(3);
      expect(raiseFieldGAEvent).toHaveBeenCalledWith(
        'last_field_interacted',
        'radio',
        'propertyType1',
        constants.DAMAGE_PROPERTY_TYPE_OTH
      );
    });
  });

  describe('index and model paths', () => {
    it('uses the provided index and model paths', () => {
      renderComponent({
        index: 3,
        modelPath: 'claim.otherPropertyDamages[3]',
        formModelPath: 'forms.otherPropertyDamages[3]'
      });

      expectRendered('questionDamageSubType3');
      expectRendered('damageSubType3');
      expect(mockSelectionControlGroup).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: 'damageSubType3' })
      );
      expect(mockMDTextField).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'damageDescription3',
          model: 'claim.otherPropertyDamages[3].damageDescription'
        })
      );
    });

    it('uses the provided index and paths for DPOPersonalDetails', () => {
      mockKnowDamagedPropertyOwner.mockReturnValue(true);

      renderComponent({
        index: 3,
        modelPath: 'claim.otherPropertyDamages[3]',
        formModelPath: 'forms.otherPropertyDamages[3]'
      });

      expect(mockDPOPersonalDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 3,
          modelPath: 'claim.otherPropertyDamages[3]',
          formModelPath: 'forms.otherPropertyDamages[3]'
        })
      );
    });
  });
});