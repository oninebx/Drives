import * as React from 'react';
import { render } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';

import { OtherDriversComponent } from './OtherDrivers';
import type { OtherDriversProps } from './OtherDrivers';

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

const mockChange = jest.fn(
  (model: string, value: unknown) => ({
    type: 'CHANGE',
    model,
    value
  })
);

const mockSetTouched = jest.fn(
  (model: string) => ({
    type: 'SET_TOUCHED',
    model
  })
);

const mockSetSubmitted = jest.fn(
  (model: string) => ({
    type: 'SET_SUBMITTED',
    model
  })
);

const mockQuestion = jest.fn(
  ({
    children
  }: {
    children: React.ReactNode;
  }) => <>{children}</>
);

const mockAddDetailsOrSkip = jest.fn(
  () => <div data-testid="add-or-skip" />
);

const mockMultiBlock = jest.fn(
  () => <div data-testid="multi-block" />
);

const mockOtherDriverDetails = jest.fn(
  () => <div data-testid="other-driver-details" />
);

jest.mock('react-redux', () => ({
  connect:
    () =>
    (Component: React.ComponentType<any>) =>
      Component,

  useDispatch: jest.fn(),
  useSelector: jest.fn()
}));

jest.mock('react-redux-form', () => ({
  actions: {
    change: mockChange,
    setTouched: mockSetTouched,
    setSubmitted: mockSetSubmitted
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
    models: []
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

  MultiBlock: (props: unknown) =>
    mockMultiBlock(props),

  Question: (props: {
    children: React.ReactNode;
  }) => mockQuestion(props)
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

const defaultOtherDrivers = [
  otherDriver1
];

/**
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

const setupSelectors = ({
  otherDrivers = defaultOtherDrivers,
  claimType = 'car',
  makes = vehicleMakes,
  hasOtherDrivers = true,
  maxOtherDriversReached = false
}: {
  otherDrivers?: unknown[];
  claimType?: string;
  makes?: string[];
  hasOtherDrivers?: boolean;
  maxOtherDriversReached?: boolean;
} = {}) => {
  (
    selectors.getOtherDrivers as jest.Mock
  ).mockReturnValue(otherDrivers);

  (
    selectors.getVehicleMakes as jest.Mock
  ).mockReturnValue(makes);

  (
    selectors.hasOtherDrivers as jest.Mock
  ).mockReturnValue(hasOtherDrivers);

  (
    selectors.maxOtherDriversReached as jest.Mock
  ).mockReturnValue(maxOtherDriversReached);

  const sharedSelectors =
    require('~/feature/claim/shared/state').selectors;

  (
    sharedSelectors.getClaimType as jest.Mock
  ).mockReturnValue(claimType);

  /**
   * useSelector receives inline selector functions.
   *
   * Execute the selector instead of comparing function
   * references.
   */
  (useSelector as jest.Mock).mockImplementation(
    (selector: (state: unknown) => unknown) =>
      selector({})
  );
};

const renderComponent = (
  overrides: {
    otherDrivers?: unknown[];
    claimType?: string;
    makes?: string[];
    hasOtherDrivers?: boolean;
    maxOtherDriversReached?: boolean;
  } = {}
) => {
  setupSelectors(overrides);

  return render(
    <OtherDriversComponent
      {...({} as OtherDriversProps)}
    />
  );
};

const getAddDetailsOrSkipProps = () =>
  mockAddDetailsOrSkip.mock.calls[0][0] as {
    id: string;
    onClickYes: () => void;
    onClickNo: () => void;
    yesSelected: boolean;
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

    setupSelectors();
  });

  describe('basic rendering', () => {
    it('renders the Question', () => {
      renderComponent();

      expect(mockQuestion).toHaveBeenCalledTimes(1);

      const props =
        mockQuestion.mock.calls[0][0];

      expect(props.id).toBe(
        'questionOtherDrivers'
      );

      expect(props.model).toBe(modelPath);

      expect(props.translation).toBe(
        'claim/car:otherDrivers'
      );

      expect(props.noTick).toBe(true);
    });

    it('renders AddDetailsOrSkip', () => {
      renderComponent();

      expect(
        mockAddDetailsOrSkip
      ).toHaveBeenCalledTimes(1);

      const props =
        getAddDetailsOrSkipProps();

      expect(props.id).toBe(
        'addOrSkipOtherDrivers'
      );

      expect(props.yesSelected).toBe(true);
    });
  });

  describe('MultiBlock', () => {
    it('renders MultiBlock when other drivers exist', () => {
      renderComponent();

      expect(
        mockMultiBlock
      ).toHaveBeenCalledTimes(1);

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
      renderComponent({
        otherDrivers: [],
        hasOtherDrivers: false
      });

      expect(
        mockMultiBlock
      ).not.toHaveBeenCalled();
    });

    it('creates one item for each other driver', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      const props =
        getMultiBlockProps();

      expect(
        props.multiBlockItems
      ).toHaveLength(2);

      expect(
        props.multiBlockItems[0].index
      ).toBe(0);

      expect(
        props.multiBlockItems[1].index
      ).toBe(1);
    });

    it('always shows the remove link for each driver', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      const props =
        getMultiBlockProps();

      expect(
        props.multiBlockItems[0].showRemoveLink
      ).toBe(true);

      expect(
        props.multiBlockItems[1].showRemoveLink
      ).toBe(true);
    });
  });

  describe('add link visibility', () => {
    it('shows the add link only for the last driver', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ],
        maxOtherDriversReached: false
      });

      const props =
        getMultiBlockProps();

      expect(
        props.multiBlockItems[0].showAddLink
      ).toBe(false);

      expect(
        props.multiBlockItems[1].showAddLink
      ).toBe(true);
    });

    it('does not show the add link when maximum drivers are reached', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ],
        maxOtherDriversReached: true
      });

      const props =
        getMultiBlockProps();

      expect(
        props.multiBlockItems[0].showAddLink
      ).toBe(false);

      expect(
        props.multiBlockItems[1].showAddLink
      ).toBe(false);
    });
  });

  describe('OtherDriverDetails', () => {
    it('passes the expected props for the driver', () => {
      renderComponent();

      const props =
        getMultiBlockProps();

      /**
       * OtherDriverDetails is a child component.
       * Render the captured child only to inspect the
       * props created by OtherDriversComponent.
       */
      render(
        <>
          {props.multiBlockItems[0].children}
        </>
      );

      expect(
        mockOtherDriverDetails
      ).toHaveBeenCalledTimes(1);

      const detailsProps =
        mockOtherDriverDetails.mock.calls[0][0];

      expect(detailsProps.index).toBe(0);

      expect(detailsProps.modelPath).toBe(
        `${modelPath}.otherDrivers[0]`
      );

      expect(detailsProps.formModelPath).toBe(
        `${modelPath}.otherDrivers[0]`
      );

      expect(detailsProps.claimType).toBe(
        'car'
      );

      expect(detailsProps.makes).toEqual(
        vehicleMakes
      );

      expect(detailsProps.models).toEqual(
        otherDriver1.models
      );

      expect(detailsProps.otherDriver).toBe(
        otherDriver1
      );
    });
  });

  describe('AddDetailsOrSkip - Yes', () => {
    it('sets the other drivers indicator when Yes is clicked', () => {
      renderComponent();

      const props =
        getAddDetailsOrSkipProps();

      props.onClickYes();

      expect(
        mockSetTouched
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`
      );

      expect(
        mockSetSubmitted
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`
      );

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`,
        true
      );
    });

    it('adds a default other driver when Yes is clicked', () => {
      const defaultDriver =
        getDefaultOtherDriverState();

      renderComponent();

      const props =
        getAddDetailsOrSkipProps();

      props.onClickYes();

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [
          otherDriver1,
          defaultDriver
        ]
      );
    });
  });

  describe('AddDetailsOrSkip - No', () => {
    it('clears other drivers when No is clicked', () => {
      renderComponent();

      const props =
        getAddDetailsOrSkipProps();

      props.onClickNo();

      expect(
        mockSetTouched
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`
      );

      expect(
        mockSetSubmitted
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`
      );

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`,
        true
      );

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        []
      );
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

  describe('MultiBlock - add', () => {
    it('adds a default driver when handleAdd is called', () => {
      const defaultDriver =
        getDefaultOtherDriverState();

      renderComponent();

      const props =
        getMultiBlockProps();

      props.handleAdd(0);

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [
          otherDriver1,
          defaultDriver
        ]
      );
    });
  });

  describe('MultiBlock - remove', () => {
    it('removes the only driver and resets the indicator', () => {
      renderComponent();

      const props =
        getMultiBlockProps();

      props.handleRemove(0);

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        []
      );

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`,
        false
      );

      expect(
        mockDispatch
      ).toHaveBeenCalledTimes(2);
    });

    it('removes the selected driver when multiple drivers exist', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      const props =
        getMultiBlockProps();

      props.handleRemove(0);

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [otherDriver2]
      );

      expect(
        mockChange
      ).not.toHaveBeenCalledWith(
        `${modelPath}.otherDriversInd`,
        false
      );
    });

    it('removes the last driver when its index is provided', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      const props =
        getMultiBlockProps();

      props.handleRemove(1);

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [otherDriver1]
      );
    });
  });

  describe('yesSelected', () => {
    it('passes true when other drivers exist', () => {
      renderComponent({
        otherDrivers: [otherDriver1],
        hasOtherDrivers: true
      });

      expect(
        getAddDetailsOrSkipProps().yesSelected
      ).toBe(true);
    });

    it('passes false when there are no other drivers', () => {
      renderComponent({
        otherDrivers: [],
        hasOtherDrivers: false
      });

      expect(
        getAddDetailsOrSkipProps().yesSelected
      ).toBe(false);
    });
  });
});