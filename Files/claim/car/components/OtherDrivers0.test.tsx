import * as React from 'react';
import { render } from '@testing-library/react';
import {
  useDispatch,
  useSelector
} from 'react-redux';
import {
  actions as formActions
} from 'react-redux-form';

import {
  OtherDriversComponent,
  type OtherDriversProps
} from './OtherDrivers';

import {
  getDefaultOtherDriverState,
  modelPath,
  selectors
} from '~/feature/claim/car/state';

import {
  selectors as sharedSelectors
} from '~/feature/claim/shared/state';

import { jumpToNextQuestionEx } from '~/common/utilities';

import type { OtherDriver } from '~/feature/claim/car/state';
import type { ApplicationState } from '~/root/rootReducer';

/**
 * ---------------------------------------------------------
 * Mocks
 * ---------------------------------------------------------
 */

const mockDispatch = jest.fn();

const mockAddDetailsOrSkip = jest.fn(
  (_props: AddDetailsOrSkipProps) => (
    <div data-testid="add-or-skip" />
  )
);

const mockMultiBlock = jest.fn(
  (_props: MultiBlockProps) => (
    <div data-testid="multi-block" />
  )
);

jest.mock('react-redux', () => ({
  connect:
    () =>
    (Component: React.ComponentType<OtherDriversProps>) =>
      Component,

  useDispatch: jest.fn(),
  useSelector: jest.fn()
}));

jest.mock('react-redux-form', () => ({
  actions: {
    change: jest.fn(),
    setTouched: jest.fn(),
    setSubmitted: jest.fn()
  }
}));

jest.mock('~/common/utilities', () => ({
  jumpToNextQuestionEx: jest.fn()
}));

jest.mock('~/feature/claim/car/state', () => ({
  modelPath: 'claim.car',

  getDefaultOtherDriverState: jest.fn(),

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
 * Child components have their own unit tests.
 * Their internal behaviour is intentionally not tested here.
 */
jest.mock('~/feature/claim/car/components', () => ({
  OtherDriverDetails: () => (
    <div data-testid="other-driver-details" />
  )
}));

jest.mock('~/feature/claim/shared/components', () => ({
  Question: ({
    children
  }: QuestionProps) => (
    <div data-testid="question">
      {children}
    </div>
  ),

  AddDetailsOrSkip: (
    props: AddDetailsOrSkipProps
  ) => mockAddDetailsOrSkip(props)
}));

/**
 * Include all dumb components that may be exported from
 * the barrel and mock AddonDialog as well, so its real
 * styled-component dependency is never evaluated.
 */
jest.mock('~/common/components/dumb', () => ({
  MultiBlock: (props: MultiBlockProps) =>
    mockMultiBlock(props),

  AddonDialog: () => (
    <div data-testid="addon-dialog" />
  )
}));

/**
 * ---------------------------------------------------------
 * Mock prop types
 * ---------------------------------------------------------
 */

interface QuestionProps {
  children: React.ReactNode;
}

interface AddDetailsOrSkipProps {
  id: string;
  onClickYes: () => void;
  onClickNo: () => void;
  yesSelected: boolean;
}

interface MultiBlockItem {
  index: number;
  showAddLink: boolean;
  showRemoveLink: boolean;
  children: React.ReactNode;
}

interface MultiBlockProps {
  id: string;
  headerLabel: string;
  model: string;
  multiBlockItems: MultiBlockItem[];
  addLinkText: string;
  removeLinkText: string;
  handleAdd: (index: number) => void;
  handleRemove: (index: number) => void;
}

/**
 * ---------------------------------------------------------
 * Test data
 * ---------------------------------------------------------
 */

const otherDriver1: OtherDriver = {
  firstName: 'John',
  lastName: 'Smith',
  phone: '021123456',
  email: 'john@example.com',
  address: undefined,
  make: 'Toyota',
  model: 'Corolla',
  models: ['Corolla', 'Camry']
};

const otherDriver2: OtherDriver = {
  firstName: 'Jane',
  lastName: 'Brown',
  phone: '021987654',
  email: 'jane@example.com',
  address: undefined,
  make: 'Mazda',
  model: 'Mazda 3',
  models: ['Mazda 3']
};

const defaultOtherDriver: OtherDriver = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: undefined,
  make: '',
  model: '',
  models: []
};

const vehicleMakes = [
  'Toyota',
  'Mazda'
];

const claimType = 'car';

/**
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

interface SelectorOptions {
  otherDrivers?: OtherDriver[];
  hasOtherDrivers?: boolean;
  maxOtherDriversReached?: boolean;
}

const setupSelectors = ({
  otherDrivers = [otherDriver1],
  hasOtherDrivers = true,
  maxOtherDriversReached = false
}: SelectorOptions = {}) => {
  (
    selectors.getOtherDrivers as jest.MockedFunction<
      typeof selectors.getOtherDrivers
    >
  ).mockReturnValue(otherDrivers);

  (
    selectors.getVehicleMakes as jest.MockedFunction<
      typeof selectors.getVehicleMakes
    >
  ).mockReturnValue(vehicleMakes);

  (
    selectors.hasOtherDrivers as jest.MockedFunction<
      typeof selectors.hasOtherDrivers
    >
  ).mockReturnValue(hasOtherDrivers);

  (
    selectors.maxOtherDriversReached as jest.MockedFunction<
      typeof selectors.maxOtherDriversReached
    >
  ).mockReturnValue(maxOtherDriversReached);

  (
    sharedSelectors.getClaimType as jest.MockedFunction<
      typeof sharedSelectors.getClaimType
    >
  ).mockReturnValue(claimType);

  (
    getDefaultOtherDriverState as jest.MockedFunction<
      typeof getDefaultOtherDriverState
    >
  ).mockReturnValue(defaultOtherDriver);

  (
    useSelector as jest.MockedFunction<
      typeof useSelector
    >
  ).mockImplementation(
    (
      selector: (
        state: ApplicationState
      ) => ReturnType<typeof selectors.getOtherDrivers>
    ) => selector({} as ApplicationState)
  );
};

const renderComponent = (
  options: SelectorOptions = {}
) => {
  setupSelectors(options);

  render(
    <OtherDriversComponent
      {...({} as OtherDriversProps)}
    />
  );
};

const getAddDetailsOrSkipProps = (): AddDetailsOrSkipProps =>
  mockAddDetailsOrSkip.mock.calls[0][0];

const getMultiBlockProps = (): MultiBlockProps =>
  mockMultiBlock.mock.calls[0][0];

/**
 * ---------------------------------------------------------
 * Tests
 * ---------------------------------------------------------
 */

describe('OtherDriversComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (
      useDispatch as jest.MockedFunction<
        typeof useDispatch
      >
    ).mockReturnValue(mockDispatch);

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
    it('passes hasOtherDrivers as yesSelected', () => {
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

    it('adds a new driver when Yes is clicked', () => {
      renderComponent({
        otherDrivers: [otherDriver1]
      });

      getAddDetailsOrSkipProps().onClickYes();

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
        getDefaultOtherDriverState
      ).toHaveBeenCalledTimes(1);

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [
          otherDriver1,
          defaultOtherDriver
        ]
      );

      expect(mockDispatch).toHaveBeenCalledTimes(4);
    });

    it('clears all drivers when No is clicked', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      getAddDetailsOrSkipProps().onClickNo();

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

      expect(
        jumpToNextQuestionEx
      ).toHaveBeenCalledWith(
        '#addOrSkipOtherDrivers'
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

      expect(
        getMultiBlockProps().multiBlockItems
      ).toHaveLength(2);
    });

    it('creates items with the correct indexes', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      expect(
        getMultiBlockProps()
          .multiBlockItems
          .map(item => item.index)
      ).toEqual([0, 1]);
    });

    it('shows the remove link for every item', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      expect(
        getMultiBlockProps()
          .multiBlockItems
          .map(item => item.showRemoveLink)
      ).toEqual([true, true]);
    });
  });

  /**
   * -------------------------------------------------------
   * Add link visibility
   * -------------------------------------------------------
   */

  describe('add link visibility', () => {
    it('shows the add link only on the last driver', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ],
        maxOtherDriversReached: false
      });

      expect(
        getMultiBlockProps()
          .multiBlockItems
          .map(item => item.showAddLink)
      ).toEqual([false, true]);
    });

    it('does not show the add link when maximum drivers are reached', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ],
        maxOtherDriversReached: true
      });

      expect(
        getMultiBlockProps()
          .multiBlockItems
          .map(item => item.showAddLink)
      ).toEqual([false, false]);
    });

    it('does not show the add link on a non-last driver', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ],
        maxOtherDriversReached: false
      });

      expect(
        getMultiBlockProps()
          .multiBlockItems[0]
          .showAddLink
      ).toBe(false);
    });
  });

  /**
   * -------------------------------------------------------
   * handleAdd
   * -------------------------------------------------------
   */

  describe('handleAdd', () => {
    it('adds a default other driver', () => {
      renderComponent({
        otherDrivers: [otherDriver1]
      });

      getMultiBlockProps().handleAdd(0);

      expect(
        getDefaultOtherDriverState
      ).toHaveBeenCalledTimes(1);

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [
          otherDriver1,
          defaultOtherDriver
        ]
      );

      expect(
        mockDispatch
      ).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * -------------------------------------------------------
   * handleRemove
   * -------------------------------------------------------
   */

  describe('handleRemove', () => {
    it('removes the only other driver', () => {
      renderComponent({
        otherDrivers: [otherDriver1]
      });

      getMultiBlockProps().handleRemove(0);

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

      getMultiBlockProps().handleRemove(0);

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

      expect(
        mockDispatch
      ).toHaveBeenCalledTimes(1);
    });

    it('removes the last driver when the last index is provided', () => {
      renderComponent({
        otherDrivers: [
          otherDriver1,
          otherDriver2
        ]
      });

      getMultiBlockProps().handleRemove(1);

      expect(
        formActions.change
      ).toHaveBeenCalledWith(
        `${modelPath}.otherDrivers`,
        [otherDriver1]
      );
    });
  });
});