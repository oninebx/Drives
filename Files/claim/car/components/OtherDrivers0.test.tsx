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

import {
  selectors as sharedSelectors
} from '~/feature/claim/shared/state';

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

const mockAddDetailsOrSkip = jest.fn(
  () => <div data-testid="add-or-skip" />
);

const mockMultiBlock = jest.fn(
  () => <div data-testid="multi-block" />
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

/**
 * These child components have their own unit tests.
 *
 * They are intentionally mocked without inspecting their props.
 */
jest.mock('~/feature/claim/car/components', () => ({
  OtherDriverDetails: () => (
    <div data-testid="other-driver-details" />
  )
}));

jest.mock('~/feature/claim/shared/components', () => ({
  AddDetailsOrSkip: (props: unknown) =>
    mockAddDetailsOrSkip(props),

  MultiBlock: (props: unknown) =>
    mockMultiBlock(props),

  Question: () => (
    <div data-testid="question" />
  )
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

/**
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

type SelectorOptions = {
  otherDrivers?: unknown[];
  claimType?: string;
  makes?: string[];
  hasOtherDrivers?: boolean;
  maxOtherDriversReached?: boolean;
};

const setupSelectors = ({
  otherDrivers = [otherDriver1],
  claimType = 'car',
  makes = vehicleMakes,
  hasOtherDrivers = true,
  maxOtherDriversReached = false
}: SelectorOptions = {}) => {
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

  (
    sharedSelectors.getClaimType as jest.Mock
  ).mockReturnValue(claimType);

  /**
   * Execute the selectors supplied to useSelector.
   *
   * We are testing OtherDriversComponent, not the selectors.
   */
  (useSelector as jest.Mock).mockImplementation(
    (selector: (state: unknown) => unknown) =>
      selector({})
  );
};

const renderComponent = (
  options: SelectorOptions = {}
) => {
  setupSelectors(options);

  return render(
    <OtherDriversComponent
      {...({} as OtherDriversProps)}
    />
  );
};

const getAddDetailsOrSkipProps = () =>
  mockAddDetailsOrSkip.mock
    .calls[0][0] as {
      onClickYes: () => void;
      onClickNo: () => void;
      yesSelected: boolean;
    };

const getMultiBlockProps = () =>
  mockMultiBlock.mock
    .calls[0][0] as {
      id: string;
      headerLabel: string;
      model: string;
      multiBlockItems: Array<{
        index: number;
        showAddLink: boolean;
        showRemoveLink: boolean;
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

  /**
   * -------------------------------------------------------
   * Rendering
   * -------------------------------------------------------
   */

  describe('rendering', () => {
    it('renders AddDetailsOrSkip', () => {
      renderComponent();

      expect(
        mockAddDetailsOrSkip
      ).toHaveBeenCalledTimes(1);
    });

    it('renders MultiBlock when other drivers exist', () => {
      renderComponent({
        otherDrivers: [otherDriver1]
      });

      expect(
        mockMultiBlock
      ).toHaveBeenCalledTimes(1);
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
  });

  /**
   * -------------------------------------------------------
   * AddDetailsOrSkip
   * -------------------------------------------------------
   */

  describe('AddDetailsOrSkip', () => {
    it('passes the current other driver state as yesSelected', () => {
      renderComponent({
        hasOtherDrivers: true
      });

      expect(
        getAddDetailsOrSkipProps().yesSelected
      ).toBe(true);
    });

    it('passes false as yesSelected when there are no other drivers', () => {
      renderComponent({
        hasOtherDrivers: false
      });

      expect(
        getAddDetailsOrSkipProps().yesSelected
      ).toBe(false);
    });

    it('updates the state and adds a driver when Yes is clicked', () => {
      renderComponent({
        otherDrivers: [otherDriver1]
      });

      getAddDetailsOrSkipProps().onClickYes();

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
        expect.arrayContaining([
          otherDriver1,
          expect.objectContaining({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            models: []
          })
        ])
      );
    });

    it('updates the state and clears all drivers when No is clicked', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      getAddDetailsOrSkipProps().onClickNo();

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

      getAddDetailsOrSkipProps().onClickNo();

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

  /**
   * -------------------------------------------------------
   * MultiBlock
   * -------------------------------------------------------
   */

  describe('MultiBlock', () => {
    it('passes the expected configuration', () => {
      renderComponent();

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
        props.multiBlockItems.map(
          item => item.index
        )
      ).toEqual([0, 1]);
    });

    it('shows the remove link for every driver', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      const props =
        getMultiBlockProps();

      expect(
        props.multiBlockItems.map(
          item => item.showRemoveLink
        )
      ).toEqual([true, true]);
    });
  });

  /**
   * -------------------------------------------------------
   * Add link visibility
   * -------------------------------------------------------
   */

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
        props.multiBlockItems.map(
          item => item.showAddLink
        )
      ).toEqual([false, true]);
    });

    it('does not show the add link when the maximum number of drivers is reached', () => {
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
        props.multiBlockItems.map(
          item => item.showAddLink
        )
      ).toEqual([false, false]);
    });
  });

  /**
   * -------------------------------------------------------
   * Add driver
   * -------------------------------------------------------
   */

  describe('handleAdd', () => {
    it('adds a default driver to the existing drivers', () => {
      renderComponent({
        otherDrivers: [otherDriver1]
      });

      const props =
        getMultiBlockProps();

      props.handleAdd(0);

      expect(
        getDefaultOtherDriverState
      ).toHaveBeenCalledTimes(1);

      expect(
        mockChange
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        expect.arrayContaining([
          otherDriver1,
          expect.objectContaining({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            models: []
          })
        ])
      );
    });
  });

  /**
   * -------------------------------------------------------
   * Remove driver
   * -------------------------------------------------------
   */

  describe('handleRemove', () => {
    it('removes the only driver and resets the indicator', () => {
      renderComponent({
        otherDrivers: [otherDriver1]
      });

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
});
