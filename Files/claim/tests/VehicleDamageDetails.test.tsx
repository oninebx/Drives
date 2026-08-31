import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { VehicleDamageDetailsComponent } from './VehicleDamageDetails';
import type { VehicleDamageDetailsProps } from './VehicleDamageDetails';

import { actions as formActions } from 'react-redux-form';
import {
  getDefaultOtherDriverState,
  selectors
} from '~/feature/claim/car/state';
import store from '~/root/store';

jest.mock('react-redux', () => ({
  connect: () => (
    Component: React.ComponentType
  ) => Component
}));

jest.mock('react-redux-form', () => ({
  actions: {
    setTouched: jest.fn(),
    setSubmitted: jest.fn(),
    change: jest.fn()
  }
}));

jest.mock('~/root/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
    dispatch: jest.fn()
  }
}));

jest.mock('~/feature/claim/car/state', () => ({
  getDefaultOtherDriverState: jest.fn(),

  selectors: {
    getBaseState: jest.fn(),
    getBaseFormState: jest.fn(),

    getOtherPropertyDamage: jest.fn(),
    hasVehicleDamageDetails: jest.fn(),
    getDamageVehicleModels: jest.fn()
  },

  thunks: {
    getPropertyDamageVehicleModels: jest.fn(),
    clearPropertyDamageVehicleModels: jest.fn()
  }
}));

jest.mock(
  '~/feature/claim/shared/components',
  () => ({
    Question: ({
      children,
      id
    }: {
      children: React.ReactNode;
      id: string;
    }) => (
      <div
        data-testid="question"
        data-question-id={id}>
        {children}
      </div>
    ),

    AddDetailsOrSkip: ({
      id,
      yesSelected,
      onClickYes,
      onClickNo
    }: {
      id: string;
      yesSelected: boolean;
      onClickYes: () => void;
      onClickNo: () => void;
    }) => (
      <div
        data-testid={id}
        data-yes-selected={String(yesSelected)}>
        <button
          type="button"
          onClick={onClickYes}>
          Yes
        </button>

        <button
          type="button"
          onClick={onClickNo}>
          No
        </button>
      </div>
    )
  })
);

jest.mock(
  '~/feature/claim/car/components',
  () => ({
    OtherDriverDetails: ({
      index,
      modelPath,
      formModelPath,
      makes,
      models,
      otherDriver,
      clearVehicleModels,
      getVehicleModels
    }: {
      index: number;
      modelPath: string;
      formModelPath: string;
      makes: string[];
      models: string[];
      otherDriver: object | undefined;
      clearVehicleModels: (() => void) | undefined;
      getVehicleModels: (() => void) | undefined;
    }) => (
      <div
        data-testid="other-driver-details"
        data-index={String(index)}
        data-model-path={modelPath}
        data-form-model-path={formModelPath}
        data-makes={makes.join(',')}
        data-models={models.join(',')}
        data-has-other-driver={
          String(Boolean(otherDriver))
        }
        data-has-clear-vehicle-models={
          String(Boolean(clearVehicleModels))
        }
        data-has-get-vehicle-models={
          String(Boolean(getVehicleModels))
        }
      />
    )
  })
);

jest.mock(
  '~/common/utilities/translation',
  () => ({
    translate: () => (
      Component: React.ComponentType
    ) => Component
  })
);

/**
 * ---------------------------------------------------------
 * Mock references
 * ---------------------------------------------------------
 */

const mockSetTouched =
  formActions.setTouched as jest.Mock;

const mockSetSubmitted =
  formActions.setSubmitted as jest.Mock;

const mockChange =
  formActions.change as jest.Mock;

const mockGetState =
  store.getState as jest.Mock;

const mockDispatch =
  store.dispatch as jest.Mock;

const mockGetOtherPropertyDamage =
  selectors.getOtherPropertyDamage as jest.Mock;

const mockHasVehicleDamageDetails =
  selectors.hasVehicleDamageDetails as jest.Mock;

const mockGetDamageVehicleModels =
  selectors.getDamageVehicleModels as jest.Mock;

const mockGetDefaultOtherDriverState =
  getDefaultOtherDriverState as jest.Mock;

/**
 * ---------------------------------------------------------
 * Test data
 * ---------------------------------------------------------
 */

const state = {
  car: {
    test: true
  }
};

const vehicleMakes = [
  'Toyota',
  'Mazda'
];

const vehicleModels = [
  'Corolla',
  'Camry'
];

const damage = {
  driverDetails: {
    firstName: 'John',
    lastName: 'Smith'
  }
};

const defaultOtherDriverState = {
  firstName: '',
  lastName: ''
};

const mockGetVehicleModels = jest.fn();

const mockClearVehicleModels = jest.fn();

/**
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

const createProps = (
  overrides: Partial<VehicleDamageDetailsProps> = {}
): VehicleDamageDetailsProps => ({
  index: 1,

  modelPath:
    'claim.otherPropertyDamage[1]',

  formModelPath:
    'forms.otherPropertyDamage[1]',

  carState: {
    vehicleMakes
  } as VehicleDamageDetailsProps['carState'],

  getVehicleModels:
    mockGetVehicleModels,

  clearVehicleModels:
    mockClearVehicleModels,

  t: (key: string) => key,

  ...overrides
});

const renderComponent = (
  overrides: Partial<VehicleDamageDetailsProps> = {}
) => {
  render(
    <VehicleDamageDetailsComponent
      {...createProps(overrides)}
    />
  );
};

const expectRendered = (
  testId: string
) => {
  expect(
    screen.getByTestId(testId)
  ).toBeInTheDocument();
};

const expectNotRendered = (
  testId: string
) => {
  expect(
    screen.queryByTestId(testId)
  ).not.toBeInTheDocument();
};

/**
 * ---------------------------------------------------------
 * Tests
 * ---------------------------------------------------------
 */

describe(
  'VehicleDamageDetailsComponent',
  () => {
    beforeEach(() => {
      jest.clearAllMocks();

      mockGetState.mockReturnValue(
        state
      );

      mockGetOtherPropertyDamage.mockReturnValue(
        damage
      );

      mockHasVehicleDamageDetails.mockReturnValue(
        false
      );

      mockGetDamageVehicleModels.mockReturnValue(
        vehicleModels
      );

      mockGetDefaultOtherDriverState.mockReturnValue(
        defaultOtherDriverState
      );
    });

    describe(
      'basic rendering',
      () => {
        it(
          'renders the vehicle damage details question',
          () => {
            renderComponent();

            const question =
              screen.getByTestId(
                'question'
              );

            expect(question)
              .toBeInTheDocument();

            expect(question)
              .toHaveAttribute(
                'data-question-id',
                'questionVehicleDamageDetails'
              );
          }
        );

        it(
          'renders AddDetailsOrSkip',
          () => {
            renderComponent();

            expectRendered(
              'addOrSkipVehicleDamageDetails'
            );
          }
        );

        it(
          'does not render OtherDriverDetails by default',
          () => {
            renderComponent();

            expectNotRendered(
              'other-driver-details'
            );
          }
        );
      }
    );

    describe(
      'AddDetailsOrSkip state',
      () => {
        it(
          'sets yesSelected to false when vehicle damage details do not exist',
          () => {
            mockHasVehicleDamageDetails.mockReturnValue(
              false
            );

            renderComponent();

            expect(
              screen.getByTestId(
                'addOrSkipVehicleDamageDetails'
              )
            ).toHaveAttribute(
              'data-yes-selected',
              'false'
            );
          }
        );

        it(
          'sets yesSelected to true when vehicle damage details exist',
          () => {
            mockHasVehicleDamageDetails.mockReturnValue(
              true
            );

            renderComponent();

            expect(
              screen.getByTestId(
                'addOrSkipVehicleDamageDetails'
              )
            ).toHaveAttribute(
              'data-yes-selected',
              'true'
            );
          }
        );
      }
    );

    describe(
      'yes action',
      () => {
        it(
          'marks hasDriverDetails as touched',
          () => {
            renderComponent();

            fireEvent.click(
              screen.getByRole(
                'button',
                {
                  name: 'Yes'
                }
              )
            );

            expect(
              mockSetTouched
            ).toHaveBeenCalledWith(
              'claim.otherPropertyDamage[1].hasDriverDetails'
            );
          }
        );

        it(
          'marks hasDriverDetails as submitted',
          () => {
            renderComponent();

            fireEvent.click(
              screen.getByRole(
                'button',
                {
                  name: 'Yes'
                }
              )
            );

            expect(
              mockSetSubmitted
            ).toHaveBeenCalledWith(
              'claim.otherPropertyDamage[1].hasDriverDetails'
            );
          }
        );

        it(
          'sets hasDriverDetails to true',
          () => {
            renderComponent();

            fireEvent.click(
              screen.getByRole(
                'button',
                {
                  name: 'Yes'
                }
              )
            );

            expect(
              mockChange
            ).toHaveBeenCalledWith(
              'claim.otherPropertyDamage[1].hasDriverDetails',
              true
            );
          }
        );

        it(
          'dispatches the generated form actions',
          () => {
            mockSetTouched.mockReturnValueOnce(
              'set-touched-action'
            );

            mockSetSubmitted.mockReturnValueOnce(
              'set-submitted-action'
            );

            mockChange.mockReturnValueOnce(
              'change-action'
            );

            renderComponent();

            fireEvent.click(
              screen.getByRole(
                'button',
                {
                  name: 'Yes'
                }
              )
            );

            expect(
              mockDispatch
            ).toHaveBeenCalledWith(
              'set-touched-action'
            );

            expect(
              mockDispatch
            ).toHaveBeenCalledWith(
              'set-submitted-action'
            );

            expect(
              mockDispatch
            ).toHaveBeenCalledWith(
              'change-action'
            );
          }
        );
      }
    );

    describe(
      'no action',
      () => {
        it(
          'marks hasDriverDetails as touched',
          () => {
            renderComponent();

            fireEvent.click(
              screen.getByRole(
                'button',
                {
                  name: 'No'
                }
              )
            );

            expect(
              mockSetTouched
            ).toHaveBeenCalledWith(
              'claim.otherPropertyDamage[1].hasDriverDetails'
            );
          }
        );

        it(
          'marks hasDriverDetails as submitted',
          () => {
            renderComponent();

            fireEvent.click(
              screen.getByRole(
                'button',
                {
                  name: 'No'
                }
              )
            );

            expect(
              mockSetSubmitted
            ).toHaveBeenCalledWith(
              'claim.otherPropertyDamage[1].hasDriverDetails'
            );
          }
        );

        it(
          'sets hasDriverDetails to false',
          () => {
            renderComponent();

            fireEvent.click(
              screen.getByRole(
                'button',
                {
                  name: 'No'
                }
              )
            );

            expect(
              mockChange
            ).toHaveBeenCalledWith(
              'claim.otherPropertyDamage[1].hasDriverDetails',
              false
            );
          }
        );

        it(
          'resets driver details to the default state',
          () => {
            renderComponent();

            fireEvent.click(
              screen.getByRole(
                'button',
                {
                  name: 'No'
                }
              )
            );

            expect(
              mockGetDefaultOtherDriverState
            ).toHaveBeenCalledTimes(1);

            expect(
              mockChange
            ).toHaveBeenCalledWith(
              'claim.otherPropertyDamage[1].driverDetails',
              defaultOtherDriverState
            );
          }
        );
      }
    );

    describe(
      'OtherDriverDetails',
      () => {
        beforeEach(() => {
          mockHasVehicleDamageDetails.mockReturnValue(
            true
          );
        });

        it(
          'renders OtherDriverDetails when vehicle damage details exist',
          () => {
            renderComponent();

            expectRendered(
              'other-driver-details'
            );
          }
        );

        it(
          'passes the correct index',
          () => {
            renderComponent();

            expect(
              screen.getByTestId(
                'other-driver-details'
              )
            ).toHaveAttribute(
              'data-index',
              '1'
            );
          }
        );

        it(
          'passes the correct model paths',
          () => {
            renderComponent();

            const otherDriverDetails =
              screen.getByTestId(
                'other-driver-details'
              );

            expect(
              otherDriverDetails
            ).toHaveAttribute(
              'data-model-path',
              'claim.otherPropertyDamage[1].driverDetails'
            );

            expect(
              otherDriverDetails
            ).toHaveAttribute(
              'data-form-model-path',
              'forms.otherPropertyDamage[1].driverDetails'
            );
          }
        );

        it(
          'passes vehicle makes from carState',
          () => {
            renderComponent();

            expect(
              screen.getByTestId(
                'other-driver-details'
              )
            ).toHaveAttribute(
              'data-makes',
              'Toyota,Mazda'
            );
          }
        );

        it(
          'passes vehicle models from the selector',
          () => {
            renderComponent();

            expect(
              mockGetDamageVehicleModels
            ).toHaveBeenCalledWith(
              state,
              1
            );

            expect(
              screen.getByTestId(
                'other-driver-details'
              )
            ).toHaveAttribute(
              'data-models',
              'Corolla,Camry'
            );
          }
        );

        it(
          'passes the damaged property driver details',
          () => {
            renderComponent();

            expect(
              screen.getByTestId(
                'other-driver-details'
              )
            ).toHaveAttribute(
              'data-has-other-driver',
              'true'
            );
          }
        );

        it(
          'passes getVehicleModels',
          () => {
            renderComponent();

            expect(
              screen.getByTestId(
                'other-driver-details'
              )
            ).toHaveAttribute(
              'data-has-get-vehicle-models',
              'true'
            );
          }
        );

        it(
          'passes clearVehicleModels',
          () => {
            renderComponent();

            expect(
              screen.getByTestId(
                'other-driver-details'
              )
            ).toHaveAttribute(
              'data-has-clear-vehicle-models',
              'true'
            );
          }
        );
      }
    );

    describe(
      'damage state',
      () => {
        it(
          'passes undefined driver details when damage does not exist',
          () => {
            mockHasVehicleDamageDetails.mockReturnValue(
              true
            );

            mockGetOtherPropertyDamage.mockReturnValue(
              undefined
            );

            renderComponent();

            expect(
              screen.getByTestId(
                'other-driver-details'
              )
            ).toHaveAttribute(
              'data-has-other-driver',
              'false'
            );
          }
        );
      }
    );

    describe(
      'index',
      () => {
        it(
          'uses the provided index when getting damage state',
          () => {
            renderComponent({
              index: 3
            });

            expect(
              mockGetOtherPropertyDamage
            ).toHaveBeenCalledWith(
              state,
              3
            );

            expect(
              mockHasVehicleDamageDetails
            ).toHaveBeenCalledWith(
              state,
              3
            );
          }
        );

        it(
          'passes the provided index to OtherDriverDetails',
          () => {
            mockHasVehicleDamageDetails.mockReturnValue(
              true
            );

            renderComponent({
              index: 3,

              modelPath:
                'claim.otherPropertyDamage[3]',

              formModelPath:
                'forms.otherPropertyDamage[3]'
            });

            const otherDriverDetails =
              screen.getByTestId(
                'other-driver-details'
              );

            expect(
              otherDriverDetails
            ).toHaveAttribute(
              'data-index',
              '3'
            );

            expect(
              otherDriverDetails
            ).toHaveAttribute(
              'data-model-path',
              'claim.otherPropertyDamage[3].driverDetails'
            );

            expect(
              otherDriverDetails
            ).toHaveAttribute(
              'data-form-model-path',
              'forms.otherPropertyDamage[3].driverDetails'
            );
          }
        );
      }
    );
  }
);