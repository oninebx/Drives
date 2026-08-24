import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';

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
  useTranslation: () => ({ t: (key: string) => key }),
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
  selectors: { getClaimType: jest.fn() },
  thunks: { resetModelState: jest.fn() },
}));

jest.mock('~/common/components/dumb', () => ({
  MultiBlock: jest.fn(() => null as React.ReactElement),
}));

jest.mock('~/feature/claim/car/components/dumb', () => ({
  OtherPersonDetails: jest.fn(() => null as React.ReactElement),
}));

jest.mock('~/feature/claim/shared/components', () => ({
  Question: jest.fn(() => null as React.ReactElement),
  AddDetailsOrSkip: jest.fn(() => null as React.ReactElement),
}));

const { MultiBlock } = jest.requireMock('~/common/components/dumb');
const { OtherPersonDetails } = jest.requireMock(
  '~/feature/claim/car/components/dumb'
);
const { Question, AddDetailsOrSkip } = jest.requireMock(
  '~/feature/claim/shared/components'
);

describe('OtherPeopleDetailsComponent', () => {
  const dispatch = jest.fn();
  const claimType = 'Motor';
  const otherPeopleState = [
    { address: { addressLine1: '1 Test Street', suburb: 'Auckland' } },
    { address: { addressLine1: '2 Test Street', suburb: 'Auckland' } },
  ];
  const selectorValues = new Map();

  beforeEach(() => {
    jest.clearAllMocks();
    selectorValues.clear();

    (useAppDispatch as jest.Mock).mockReturnValue(dispatch);
    (useAppSelector as jest.Mock).mockImplementation(
      selector => selectorValues.get(selector)
    );

    selectorValues.set(selectors.getOtherPeopleDetails, otherPeopleState);
    selectorValues.set(selectors.getOtherPeopleDetailsCount, 2);
    selectorValues.set(selectors.hasOtherPeopleDetails, true);
    selectorValues.set(sharedSelectors.getClaimType, claimType);

    (thunks.addOtherPerson as jest.Mock).mockReturnValue({
      type: 'add-other-person',
    });
    (thunks.updateOtherPeople as jest.Mock).mockReturnValue({
      type: 'update-other-people',
    });
    (sharedThunks.resetModelState as jest.Mock).mockReturnValue({
      type: 'reset-model-state',
    });
  });

  describe('rendering', () => {
    it('should render child components', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(Question).toHaveBeenCalledTimes(1);
      expect(AddDetailsOrSkip).toHaveBeenCalledTimes(1);
      expect(MultiBlock).toHaveBeenCalledTimes(1);
      expect(OtherPersonDetails).toHaveBeenCalledTimes(2);
    });

    it('should not render MultiBlock or OtherPersonDetails when there are no people', () => {
      selectorValues.set(selectors.hasOtherPeopleDetails, false);
      selectorValues.set(selectors.getOtherPeopleDetails, []);
      selectorValues.set(selectors.getOtherPeopleDetailsCount, 0);

      render(<OtherPeopleDetailsComponent />);

      expect(MultiBlock).not.toHaveBeenCalled();
      expect(OtherPersonDetails).not.toHaveBeenCalled();
    });
  });

  describe('Question', () => {
    it('should pass the correct props', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(Question).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'questionOtherPeopleDetails',
          model: modelPath,
          translation: `claim/${claimType}:otherPeopleDetails.otherDetails`,
        }),
        expect.anything()
      );
    });
  });

  describe('AddDetailsOrSkip', () => {
    it('should pass hasOtherPeopleDetails as yesSelected', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(AddDetailsOrSkip).toHaveBeenCalledWith(
        expect.objectContaining({ yesSelected: true }),
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
      expect(dispatch).toHaveBeenCalledWith({ type: 'add-other-person' });
    });

    it('should reset the model and jump to the next question when No is clicked', () => {
      render(<OtherPeopleDetailsComponent />);
      const { onClickNo } = AddDetailsOrSkip.mock.calls[0][0];

      onClickNo();

      expect(sharedThunks.resetModelState).toHaveBeenCalledWith(
        `${modelPath}.otherPeopleDetails`
      );
      expect(dispatch).toHaveBeenCalledWith({ type: 'reset-model-state' });
      expect(jumpToNextQuestionEx).toHaveBeenCalledWith(
        '#addOrSkipOtherPeopleDetails'
      );
    });
  });

  describe('OtherPersonDetails', () => {
    it('should pass the correct props', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(OtherPersonDetails).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          index: 0,
          modelPath: `${modelPath}.otherPeopleDetails[0]`,
          formModelPath: `${formPath}.otherPeopleDetails[0]`,
          addressState: otherPeopleState[0].address,
          idPrefixString: 'otherPeopleDetails',
          translationPathString: `claim/${claimType}:otherPeopleDetails`,
          isOptional: true,
        })
      );

      expect(OtherPersonDetails).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          index: 1,
          modelPath: `${modelPath}.otherPeopleDetails[1]`,
          formModelPath: `${formPath}.otherPeopleDetails[1]`,
          addressState: otherPeopleState[1].address,
          idPrefixString: 'otherPeopleDetails',
          translationPathString: `claim/${claimType}:otherPeopleDetails`,
          isOptional: true,
        })
      );
    });
  });

  describe('MultiBlock', () => {
    it('should pass the correct props', () => {
      render(<OtherPeopleDetailsComponent />);
      const props = MultiBlock.mock.calls[0][0];

      expect(props).toEqual(
        expect.objectContaining({
          id: 'mainHasOtherPeopleDetailsAccordion',
          model: `${modelPath}.otherPeopleDetails`,
          headerLabel: `claim/${claimType}:otherPeopleDetails.heading`,
          addLinkText: `claim/${claimType}:otherPeopleDetails.addAnotherPerson`,
          removeLinkText: 'button.remove',
        })
      );
    });

    it('should configure add link based on the maximum count', () => {
      render(<OtherPeopleDetailsComponent />);
      let { multiBlockItems } = MultiBlock.mock.calls[0][0];

      expect(multiBlockItems.map(item => item.showAddLink)).toEqual([false, true]);

      const people = Array.from(
        { length: MAX_ALLOWED_OTHER_PEOPLE_COUNT },
        (_, index) => ({ address: { addressLine1: `${index + 1} Test Street` } })
      );

      selectorValues.set(selectors.getOtherPeopleDetails, people);
      selectorValues.set(
        selectors.getOtherPeopleDetailsCount,
        MAX_ALLOWED_OTHER_PEOPLE_COUNT
      );

      MultiBlock.mockClear();
      render(<OtherPeopleDetailsComponent />);

      multiBlockItems = MultiBlock.mock.calls[0][0].multiBlockItems;

      expect(multiBlockItems.at(-1).showAddLink).toBe(false);
    });
  });

  describe('handlers', () => {
    it('should add an other person', () => {
      render(<OtherPeopleDetailsComponent />);
      const { handleAdd } = MultiBlock.mock.calls[0][0];

      handleAdd(1);

      expect(thunks.updateOtherPeople).toHaveBeenCalledWith(
        1,
        true,
        otherPeopleState
      );
      expect(dispatch).toHaveBeenCalledWith({ type: 'update-other-people' });
    });

    it('should remove an other person', () => {
      render(<OtherPeopleDetailsComponent />);
      const { handleRemove } = MultiBlock.mock.calls[0][0];

      handleRemove(1);

      expect(thunks.updateOtherPeople).toHaveBeenCalledWith(
        1,
        false,
        otherPeopleState
      );
      expect(dispatch).toHaveBeenCalledWith({ type: 'update-other-people' });
    });
  });
});