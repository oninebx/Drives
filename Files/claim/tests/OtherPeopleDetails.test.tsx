import * as React from 'react';
import { render } from '@testing-library/react';

import { OtherPeopleDetailsComponent } from './OtherPeopleDetails';
import { jumpToNextQuestionEx } from '~/common/utilities';
import {
  formPath,
  MAX_ALLOWED_OTHER_PEOPLE_COUNT,
  modelPath,
  selectors,
  thunks,
} from '~/feature/claim/car/state';
import {
  selectors as sharedSelectors,
  thunks as sharedThunks,
} from '~/feature/claim/shared/state';
import { useAppDispatch, useAppSelector } from '~/root/store';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('~/root/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('~/common/utilities', () => ({
  jumpToNextQuestionEx: jest.fn(),
}));

jest.mock('~/feature/claim/car/state', () => ({
  formPath: 'car',
  modelPath: 'claim.car',
  MAX_ALLOWED_OTHER_PEOPLE_COUNT: 5,
  selectors: {
    getOtherPeopleDetails: jest.fn(),
    getOtherPeopleDetailsCount: jest.fn(),
    hasOtherPeopleDetails: jest.fn(),
  },
  thunks: {
    addOtherPerson: jest.fn(),
    updateOtherPeople: jest.fn(),
  },
}));

jest.mock('~/feature/claim/shared/state', () => ({
  selectors: {
    getClaimType: jest.fn(),
  },
  thunks: {
    resetModelState: jest.fn(),
  },
}));

jest.mock('~/common/components/dumb', () => ({
  MultiBlock: jest.fn(() => null as React.ReactElement),
}));

jest.mock('~/feature/claim/car/components/dumb', () => ({
  OtherPersonDetails: jest.fn(() => null as React.ReactElement),
}));

jest.mock('~/feature/claim/shared/components', () => ({
  // Important: Question must render children so AddDetailsOrSkip is rendered.
  Question: jest.fn(({ children }) => <>{children}</>),
  AddDetailsOrSkip: jest.fn(
    () => null as React.ReactElement
  ),
}));

const { MultiBlock } = jest.requireMock(
  '~/common/components/dumb'
);

const { OtherPersonDetails } = jest.requireMock(
  '~/feature/claim/car/components/dumb'
);

const { Question, AddDetailsOrSkip } = jest.requireMock(
  '~/feature/claim/shared/components'
);

describe('OtherPeopleDetailsComponent', () => {
  const dispatch = jest.fn();
  const selectorValues = new Map();

  const claimType = 'Motor';

  const otherPeople = [
    {
      address: {
        addressLine1: '1 Test Street',
        suburb: 'Auckland',
      },
    },
    {
      address: {
        addressLine1: '2 Test Street',
        suburb: 'Auckland',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    selectorValues.clear();

    (useAppDispatch as jest.Mock).mockReturnValue(dispatch);

    (useAppSelector as jest.Mock).mockImplementation(
      selector => selectorValues.get(selector)
    );

    selectorValues.set(
      selectors.getOtherPeopleDetails,
      otherPeople
    );
    selectorValues.set(
      selectors.getOtherPeopleDetailsCount,
      2
    );
    selectorValues.set(
      selectors.hasOtherPeopleDetails,
      true
    );
    selectorValues.set(
      sharedSelectors.getClaimType,
      claimType
    );

    (thunks.addOtherPerson as jest.Mock).mockReturnValue({
      type: 'add-other-person',
    });

    (thunks.updateOtherPeople as jest.Mock).mockReturnValue({
      type: 'update-other-people',
    });

    (
      sharedThunks.resetModelState as jest.Mock
    ).mockReturnValue({
      type: 'reset-model-state',
    });
  });

  it('should render Question and AddDetailsOrSkip with correct props', () => {
    render(<OtherPeopleDetailsComponent />);

    expect(Question).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'questionOtherPeopleDetails',
        model: modelPath,
        translation: `claim/${claimType}:otherPeopleDetails.otherDetails`,
      }),
      expect.anything()
    );

    expect(AddDetailsOrSkip).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'addOrSkipOtherPeopleDetails',
        yesSelected: true,
        onClickYes: expect.any(Function),
        onClickNo: expect.any(Function),
      }),
      expect.anything()
    );
  });

  it('should add an other person when Yes is clicked', () => {
    render(<OtherPeopleDetailsComponent />);

    const { onClickYes } = AddDetailsOrSkip.mock.calls[0][0];

    onClickYes();

    expect(thunks.addOtherPerson).toHaveBeenCalledWith(
      `${modelPath}.otherPeopleDetails`
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: 'add-other-person',
    });
  });

  it('should reset the model and jump to the next question when No is clicked', () => {
    render(<OtherPeopleDetailsComponent />);

    const { onClickNo } = AddDetailsOrSkip.mock.calls[0][0];

    onClickNo();

    expect(
      sharedThunks.resetModelState
    ).toHaveBeenCalledWith(
      `${modelPath}.otherPeopleDetails`
    );

    expect(dispatch).toHaveBeenCalledWith({
      type: 'reset-model-state',
    });

    expect(jumpToNextQuestionEx).toHaveBeenCalledWith(
      '#addOrSkipOtherPeopleDetails'
    );
  });

  it('should render MultiBlock with correct props', () => {
    render(<OtherPeopleDetailsComponent />);

    expect(MultiBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mainHasOtherPeopleDetailsAccordion',
        headerLabel: `claim/${claimType}:otherPeopleDetails.heading`,
        model: `${modelPath}.otherPeopleDetails`,
        addLinkText: `claim/${claimType}:otherPeopleDetails.addAnotherPerson`,
        removeLinkText: 'button.remove',
        multiBlockItems: expect.any(Array),
        handleAdd: expect.any(Function),
        handleRemove: expect.any(Function),
      }),
      expect.anything()
    );
  });

  it('should pass correct props to OtherPersonDetails', () => {
    render(<OtherPeopleDetailsComponent />);
    const { multiBlockItems } = MultiBlock.mock.calls[0][0];

    expect(multiBlockItems).toHaveLength(2);
    expect(multiBlockItems[0].children.props).toEqual(
      expect.objectContaining({
        index: 0,
        modelPath: `${modelPath}.otherPeopleDetails[0]`,
        formModelPath: `${formPath}.otherPeopleDetails[0]`,
        addressState: otherPeople[0].address,
        idPrefixString: 'otherPeopleDetails',
        translationPathString: `claim/${claimType}:otherPeopleDetails`,
        isOptional: true,
      }));

    expect(multiBlockItems[1].children.props).toEqual(
      expect.objectContaining({
        index: 1,
        modelPath: `${modelPath}.otherPeopleDetails[1]`,
        formModelPath: `${formPath}.otherPeopleDetails[1]`,
        addressState: otherPeople[1].address,
        idPrefixString: 'otherPeopleDetails',
        translationPathString: `claim/${claimType}:otherPeopleDetails`,
        isOptional: true,
      })
    );
  });

  it('should update other people when adding or removing', () => {
    render(<OtherPeopleDetailsComponent />);

    const { handleAdd, handleRemove } =
      MultiBlock.mock.calls[0][0];

    handleAdd(1);

    expect(thunks.updateOtherPeople).toHaveBeenCalledWith(
      1,
      true,
      otherPeople
    );

    handleRemove(1);

    expect(thunks.updateOtherPeople).toHaveBeenCalledWith(
      1,
      false,
      otherPeople
    );

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: 'update-other-people',
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: 'update-other-people',
    });
  });

  it('should show the add link only for the last person before the maximum', () => {
    render(<OtherPeopleDetailsComponent />);

    const { multiBlockItems } =
      MultiBlock.mock.calls[0][0];

    expect(
      multiBlockItems.map((item: {showAddLink: boolean}) => item.showAddLink)
    ).toEqual([false, true]);

    expect(
      multiBlockItems.every(
        (item: {showRemoveLink: boolean}) => item.showRemoveLink === true
      )
    ).toBe(true);
  });

  it('should not render MultiBlock when there are no other people', () => {
    selectorValues.set(
      selectors.hasOtherPeopleDetails,
      false
    );
    selectorValues.set(
      selectors.getOtherPeopleDetails,
      []
    );
    selectorValues.set(
      selectors.getOtherPeopleDetailsCount,
      0
    );

    render(<OtherPeopleDetailsComponent />);

    expect(MultiBlock).not.toHaveBeenCalled();
    expect(OtherPersonDetails).not.toHaveBeenCalled();
  });

  it('should hide the add link when maximum count is reached', () => {
    const people = Array.from(
      { length: MAX_ALLOWED_OTHER_PEOPLE_COUNT },
      (_, index) => ({
        address: {
          addressLine1: `${index + 1} Test Street`,
        },
      })
    );

    selectorValues.set(
      selectors.getOtherPeopleDetails,
      people
    );
    selectorValues.set(
      selectors.getOtherPeopleDetailsCount,
      MAX_ALLOWED_OTHER_PEOPLE_COUNT
    );

    render(<OtherPeopleDetailsComponent />);

    const { multiBlockItems } =
      MultiBlock.mock.calls[0][0];

    expect(
      multiBlockItems[
        MAX_ALLOWED_OTHER_PEOPLE_COUNT - 1
      ].showAddLink
    ).toBe(false);
  });
});