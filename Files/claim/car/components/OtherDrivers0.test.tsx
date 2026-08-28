import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  OtherDriversComponent,
  type OtherDriversProps
} from './OtherDrivers';

import { formActions } from 'react-redux-form';
import { useDispatch, useSelector } from 'react-redux';

import {
  getDefaultOtherDriverState,
  modelPath,
  selectors
} from '~/feature/claim/car/state';

import { jumpToNextQuestionEx } from '~/common/utilities';

/**
 * ---------------------------------------------------------
 * Mocks
 * ---------------------------------------------------------
 */

const mockDispatch = jest.fn();

const mockQuestion = jest.fn();
const mockAddDetailsOrSkip = jest.fn();
const mockMultiBlock = jest.fn();
const mockOtherDriverDetails = jest.fn();

jest.mock('react-redux', () => ({
  connect: jest.fn(
    (_mapStateToProps: unknown, _mapDispatchToProps: unknown) =>
      (Component: React.ComponentType<any>) => Component
  ),
  useDispatch: jest.fn(),
  useSelector: jest.fn()
}));

jest.mock('react-redux-form', () => ({
  actions: {
    change: jest.fn((model: string, value: unknown) => ({
      type: 'CHANGE',
      model,
      value
    })),
    setTouched: jest.fn((model: string) => ({
      type: 'SET_TOUCHED',
      model
    })),
    setSubmitted: jest.fn((model: string) => ({
      type: 'SET_SUBMITTED',
      model
    }))
  }
}));

jest.mock('~/common/utilities', () => ({
  jumpToNextQuestionEx: jest.fn()
}));

jest.mock('~/feature/claim/car/state', () => ({
  modelPath: 'claim.car',

  getDefaultOtherDriverState: jest.fn(() => ({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: undefined,
    vehicleMake: '',
    vehicleModel: ''
  })),

  selectors: {
    getOtherDrivers: jest.fn(),
    getVehicleMakes: jest.fn(),
    hasOtherDrivers: jest.fn(),
    maxOtherDriversReached: jest.fn()
  },

  thunks: {
    getOtherDriverVehicleModels: jest.fn(),
    clearOtherDriverVehicleModels: jest.fn()
  }
}));

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getClaimType: jest.fn()
  }
}));

jest.mock('~/feature/claim/car/components', () => ({
  OtherDriverDetails: (props: unknown) =>
    mockOtherDriverDetails(props)
}));

jest.mock('~/feature/claim/shared/components', () => ({
  AddDetailsOrSkip: (props: unknown) =>
    mockAddDetailsOrSkip(props),

  Question: (props: {
    children: React.ReactNode;
  }) => mockQuestion(props),

  MultiBlock: (props: unknown) =>
    mockMultiBlock(props)
}));

/**
 * ---------------------------------------------------------
 * Test data
 * ---------------------------------------------------------
 */

const otherDriver1 = {
  firstName: 'John',
  lastName: 'Smith',
  models: ['Corolla', 'Camry']
};

const otherDriver2 = {
  firstName: 'Jane',
  lastName: 'Brown',
  models: ['Mazda 3']
};

const vehicleMakes = ['Toyota', 'Mazda'];

const defaultState = {
  otherDrivers: [otherDriver1],
  claimType: 'car',
  vehicleMakes,
  hasOtherDrivers: true,
  maxOtherDriversReached: false
};

/**
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

const mockSelectorValues = (
  overrides: Partial<typeof defaultState> = {}
) => {
  const state = {
    ...defaultState,
    ...overrides
  };

  (useSelector as jest.Mock).mockImplementation(
    (selector: unknown) => {
      if (selector === selectors.getOtherDrivers) {
        return state.otherDrivers;
      }

      if (selector === selectors.getVehicleMakes) {
        return state.vehicleMakes;
      }

      if (selector === selectors.hasOtherDrivers) {
        return state.hasOtherDrivers;
      }

      return state.claimType;
    }
  );

  (
    selectors.maxOtherDriversReached as jest.Mock
  ).mockReturnValue(state.maxOtherDriversReached);
};

const renderComponent = (
  props: Partial<OtherDriversProps> = {}
) => {
  mockSelectorValues();

  return render(
    <OtherDriversComponent
      {...props}
    />
  );
};

const getMultiBlockProps = () =>
  mockMultiBlock.mock.calls[0][0] as {
    id: string;
    headerLabel: string;
    model: string;
    multiBlockItems: Array<{
      index: number;
      showAddLink: boolean;
      showRemoveLink: boolean;
      children: React.ReactNode;
    }>;
    addLinkText: string;
    removeLinkText: string;
    handleAdd: (index: number) => void;
    handleRemove: (index: number) => void;
  };

const getAddDetailsOrSkipProps = () =>
  mockAddDetailsOrSkip.mock.calls[0][0] as {
    id: string;
    onClickYes: () => void;
    onClickNo: () => void;
    yesSelected: boolean;
  };

/**
 * ---------------------------------------------------------
 * Tests
 * ---------------------------------------------------------
 */

describe('OtherDriversComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useDispatch as jest.Mock).mockReturnValue(
      mockDispatch
    );

    mockSelectorValues();

    (
      selectors.maxOtherDriversReached as jest.Mock
    ).mockReturnValue(false);
  });

  describe('basic rendering', () => {
    it('renders the Question', () => {
      renderComponent();

      expect(mockQuestion).toHaveBeenCalledTimes(1);

      const props =
        mockQuestion.mock.calls[0][0];

      expect(props).toEqual(
        expect.objectContaining({
          id: 'questionOtherDrivers',
          model: modelPath,
          translation: 'claim/car:otherDrivers',
          noTick: true
        })
      );
    });

    it('renders AddDetailsOrSkip', () => {
      renderComponent();

      expect(mockAddDetailsOrSkip).toHaveBeenCalledTimes(1);

      const props =
        getAddDetailsOrSkipProps();

      expect(props.id).toBe(
        'addOrSkipOtherDrivers'
      );

      expect(props.yesSelected).toBe(true);
    });
  });

  describe('MultiBlock rendering', () => {
    it('renders MultiBlock when there are other drivers', () => {
      renderComponent();

      expect(mockMultiBlock).toHaveBeenCalledTimes(1);

      const props =
        getMultiBlockProps();

      expect(props.id).toBe(
        'otherDriversAccordion'
      );

      expect(props.headerLabel).toBe(
        'Other driver/vehicle'
      );

      expect(props.model).toBe(
        `${modelPath}.otherDrivers`
      );

      expect(props.addLinkText).toBe(
        "I'd like to add another driver or vehicle"
      );

      expect(props.removeLinkText).toBe(
        'Remove'
      );
    });

    it('does not render MultiBlock when there are no other drivers', () => {
      mockSelectorValues({
        otherDrivers: []
      });

      render(
        <OtherDriversComponent />
      );

      expect(mockMultiBlock).not.toHaveBeenCalled();
    });

    it('creates one MultiBlock item for each other driver', () => {
      mockSelectorValues({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      render(
        <OtherDriversComponent />
      );

      const props =
        getMultiBlockProps();

      expect(
        props.multiBlockItems
      ).toHaveLength(2);

      expect(
        props.multiBlockItems[0]
      ).toEqual(
        expect.objectContaining({
          index: 0,
          showRemoveLink: true
        })
      );

      expect(
        props.multiBlockItems[1]
      ).toEqual(
        expect.objectContaining({
          index: 1,
          showRemoveLink: true
        })
      );
    });
  });

  describe('MultiBlock items', () => {
    it('shows Add link only for the last driver when maximum has not been reached', () => {
      mockSelectorValues({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ],
        maxOtherDriversReached: false
      });

      render(
        <OtherDriversComponent />
      );

      const props =
        getMultiBlockProps();

      expect(
        props.multiBlockItems[0].showAddLink
      ).toBe(false);

      expect(
        props.multiBlockItems[1].showAddLink
      ).toBe(true);
    });

    it('does not show Add link when maximum number of drivers has been reached', () => {
      mockSelectorValues({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ],
        maxOtherDriversReached: true
      });

      render(
        <OtherDriversComponent />
      );

      const props =
        getMultiBlockProps();

      expect(
        props.multiBlockItems[0].showAddLink
      ).toBe(false);

      expect(
        props.multiBlockItems[1].showAddLink
      ).toBe(false);
    });

    it('always shows Remove link for each driver', () => {
      mockSelectorValues({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      render(
        <OtherDriversComponent />
      );

      const props =
        getMultiBlockProps();

      props.multiBlockItems.forEach(
        item => {
          expect(
            item.showRemoveLink
          ).toBe(true);
        }
      );
    });
  });

  describe('OtherDriverDetails', () => {
    it('passes the expected props to OtherDriverDetails', () => {
      renderComponent();

      const props =
        getMultiBlockProps();

      const children =
        props.multiBlockItems[0].children;

      render(
        <>{children}</>
      );

      expect(
        mockOtherDriverDetails
      ).toHaveBeenCalledTimes(1);

      const detailsProps =
        mockOtherDriverDetails.mock.calls[0][0];

      expect(detailsProps).toEqual(
        expect.objectContaining({
          index: 0,
          modelPath:
            `${modelPath}.otherDrivers[0]`,
          formModelPath:
            `${modelPath}.otherDrivers[0]`,
          claimType: 'car',
          makes: vehicleMakes,
          models: otherDriver1.models,
          otherDriver: otherDriver1
        })
      );
    });

    it('passes the correct index and model paths to each driver', () => {
      mockSelectorValues({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      render(
        <OtherDriversComponent />
      );

      const props =
        getMultiBlockProps();

      render(
        <>
          {
            props.multiBlockItems.map(
              item => (
                <React.Fragment
                  key={item.index}
                >
                  {item.children}
                </React.Fragment>
              )
            )
          }
        </>
      );

      expect(
        mockOtherDriverDetails
      ).toHaveBeenCalledTimes(2);

      const firstProps =
        mockOtherDriverDetails.mock.calls[0][0];

      const secondProps =
        mockOtherDriverDetails.mock.calls[1][0];

      expect(firstProps.index).toBe(0);
      expect(firstProps.modelPath).toBe(
        `${modelPath}.otherDrivers[0]`
      );

      expect(secondProps.index).toBe(1);
      expect(secondProps.modelPath).toBe(
        `${modelPath}.otherDrivers[1]`
      );
    });
  });

  describe('AddDetailsOrSkip', () => {
    it('dispatches the expected actions when Yes is clicked', () => {
      renderComponent();

      const props =
        getAddDetailsOrSkipProps();

      props.onClickYes();

      expect(
        formActions.setTouched
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`
      );

      expect(
        formActions.setSubmitted
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`
      );

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`,
        true
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('adds a new driver when Yes is clicked', () => {
      renderComponent();

      const props =
        getAddDetailsOrSkipProps();

      props.onClickYes();

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [
          otherDriver1,
          getDefaultOtherDriverState()
        ]
      );
    });

    it('dispatches the expected actions when No is clicked', () => {
      renderComponent();

      const props =
        getAddDetailsOrSkipProps();

      props.onClickNo();

      expect(
        formActions.setTouched
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`
      );

      expect(
        formActions.setSubmitted
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`
      );

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`,
        true
      );

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        []
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('jumps to the next question when No is clicked', () => {
      renderComponent();

      const props =
        getAddDetailsOrSkipProps();

      props.onClickNo();

      expect(
        jumpToNextQuestionEx
      ).toHaveBeenCalledTimes(1);

      expect(
        jumpToNextQuestionEx
      ).toHaveBeenCalledWith(
        '#addOrSkipOtherDrivers'
      );
    });
  });

  describe('MultiBlock handlers', () => {
    it('adds a new driver when handleAdd is called', () => {
      renderComponent();

      const props =
        getMultiBlockProps();

      props.handleAdd(0);

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [
          otherDriver1,
          getDefaultOtherDriverState()
        ]
      );

      expect(mockDispatch).toHaveBeenCalled();
    });

    it('removes the only driver when handleRemove is called', () => {
      renderComponent();

      const props =
        getMultiBlockProps();

      props.handleRemove(0);

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        []
      );

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`,
        false
      );

      expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('removes the selected driver when multiple drivers exist', () => {
      mockSelectorValues({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      render(
        <OtherDriversComponent />
      );

      const props =
        getMultiBlockProps();

      props.handleRemove(0);

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [otherDriver2]
      );

      expect(
        formActions.change
      ).not.toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`,
        false
      );
    });

    it('removes the last driver when its index is provided', () => {
      mockSelectorValues({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      render(
        <OtherDriversComponent />
      );

      const props =
        getMultiBlockProps();

      props.handleRemove(1);

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [otherDriver1]
      );
    });
  });

  describe('yesSelected', () => {
    it('sets yesSelected to true when there are other drivers', () => {
      mockSelectorValues({
        otherDrivers: [otherDriver1],
        hasOtherDrivers: true
      });

      render(
        <OtherDriversComponent />
      );

      expect(
        getAddDetailsOrSkipProps().yesSelected
      ).toBe(true);
    });

    it('sets yesSelected to false when there are no other drivers', () => {
      mockSelectorValues({
        otherDrivers: [],
        hasOtherDrivers: false
      });

      render(
        <OtherDriversComponent />
      );

      expect(
        getAddDetailsOrSkipProps().yesSelected
      ).toBe(false);
    });
  });
});