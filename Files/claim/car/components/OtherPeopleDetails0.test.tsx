import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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
  MultiBlock: jest.fn(
    ({
      id,
      headerLabel,
      model,
      multiBlockItems,
      addLinkText,
      removeLinkText,
      handleAdd,
      handleRemove,
    }) => (
      <div data-testid={id}>
        <div data-testid="multi-block-header">
          {headerLabel}
        </div>

        <div data-testid="multi-block-model">
          {model}
        </div>

        <div data-testid="multi-block-add-text">
          {addLinkText}
        </div>

        <div data-testid="multi-block-remove-text">
          {removeLinkText}
        </div>

        {multiBlockItems.map((item: any) => (
          <div
            key={item.index}
            data-testid={`multi-block-item-${item.index}`}
          >
            <span data-testid={`show-add-link-${item.index}`}>
              {String(item.showAddLink)}
            </span>

            <span data-testid={`show-remove-link-${item.index}`}>
              {String(item.showRemoveLink)}
            </span>

            {item.children}
          </div>
        ))}

        <button
          data-testid="multi-block-add"
          onClick={() => handleAdd(1)}
        >
          Add
        </button>

        <button
          data-testid="multi-block-remove"
          onClick={() => handleRemove(1)}
        >
          Remove
        </button>
      </div>
    )
  ),
}));

jest.mock(
  '~/feature/claim/car/components/dumb',
  () => ({
    OtherPersonDetails: jest.fn(
      ({
        index,
        modelPath: personModelPath,
        formModelPath,
        addressState,
        idPrefixString,
        translationPathString,
        isOptional,
      }) => (
        <div data-testid={`other-person-${index}`}>
          <span data-testid={`person-model-path-${index}`}>
            {personModelPath}
          </span>

          <span data-testid={`person-form-model-path-${index}`}>
            {formModelPath}
          </span>

          <span data-testid={`person-address-${index}`}>
            {JSON.stringify(addressState)}
          </span>

          <span data-testid={`person-id-prefix-${index}`}>
            {idPrefixString}
          </span>

          <span data-testid={`person-translation-path-${index}`}>
            {translationPathString}
          </span>

          <span data-testid={`person-optional-${index}`}>
            {String(isOptional)}
          </span>
        </div>
      )
    ),
  })
);

jest.mock(
  '~/feature/claim/shared/components',
  () => ({
    Question: jest.fn(
      ({
        id,
        model,
        translation,
        children,
      }) => (
        <div data-testid={id}>
          <span data-testid="question-model">
            {model}
          </span>

          <span data-testid="question-translation">
            {translation}
          </span>

          {children}
        </div>
      )
    ),

    AddDetailsOrSkip: jest.fn(
      ({
        id,
        onClickYes,
        onClickNo,
        yesSelected,
      }) => (
        <div data-testid={id}>
          <span data-testid="yes-selected">
            {String(yesSelected)}
          </span>

          <button
            data-testid="add-details-yes"
            onClick={onClickYes}
          >
            Yes
          </button>

          <button
            data-testid="add-details-no"
            onClick={onClickNo}
          >
            No
          </button>
        </div>
      )
    ),
  })
);

describe('OtherPeopleDetailsComponent', () => {
  const dispatch = jest.fn();

  const otherPeopleState = [
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
    }
  ];

  const claimType = 'Motor';

  const selectorValues = new Map();

  beforeEach(() => {
    jest.clearAllMocks();

    selectorValues.clear();

    (useAppDispatch as jest.Mock).mockReturnValue(
      dispatch
    );

    /*
     * Important:
     *
     * useAppSelector(selector)
     *        ↓
     * selectorValues.get(selector)
     *
     * This is important because this component uses
     * multiple selectors with different return values.
     */
    (useAppSelector as jest.Mock).mockImplementation(
      (selector) => selectorValues.get(selector)
    );

    selectorValues.set(
      selectors.getOtherPeopleDetails,
      otherPeopleState
    );

    selectorValues.set(
      sharedSelectors.getClaimType,
      claimType
    );

    selectorValues.set(
      selectors.getOtherPeopleDetailsCount,
      2
    );

    selectorValues.set(
      selectors.hasOtherPeopleDetails,
      true
    );

    (
      thunks.addOtherPerson as jest.Mock
    ).mockReturnValue({
      type: 'add-other-person',
    });

    (
      thunks.updateOtherPeople as jest.Mock
    ).mockReturnValue({
      type: 'update-other-people',
    });

    (
      sharedThunks.resetModelState as jest.Mock
    ).mockReturnValue({
      type: 'reset-model-state',
    });

    dispatch.mockResolvedValue({});
  });

  describe('Question', () => {
    it('should render the question', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId(
          'questionOtherPeopleDetails'
        )
      ).toBeInTheDocument();
    });

    it('should use the correct question model', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('question-model')
      ).toHaveTextContent(modelPath);
    });

    it('should use the claim type in the question translation path', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('question-translation')
      ).toHaveTextContent(
        `claim/${claimType}:otherPeopleDetails.otherDetails`
      );
    });

    it('should pass hasOtherPeopleDetails to yesSelected', () => {
      selectorValues.set(
        selectors.hasOtherPeopleDetails,
        true
      );

      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('yes-selected')
      ).toHaveTextContent('true');
    });

    it('should pass false when there are no other people', () => {
      selectorValues.set(
        selectors.hasOtherPeopleDetails,
        false
      );

      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('yes-selected')
      ).toHaveTextContent('false');
    });
  });

  describe('AddDetailsOrSkip', () => {
    it('should dispatch addOtherPerson when Yes is clicked', () => {
      render(<OtherPeopleDetailsComponent />);

      fireEvent.click(
        screen.getByTestId('add-details-yes')
      );

      expect(
        thunks.addOtherPerson
      ).toHaveBeenCalledTimes(1);

      expect(
        thunks.addOtherPerson
      ).toHaveBeenCalledWith(
        `${modelPath}.otherPeopleDetails`
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'add-other-person',
      });
    });

    it('should reset model state and jump to next question when No is clicked', () => {
      render(<OtherPeopleDetailsComponent />);

      fireEvent.click(
        screen.getByTestId('add-details-no')
      );

      expect(
        sharedThunks.resetModelState
      ).toHaveBeenCalledTimes(1);

      expect(
        sharedThunks.resetModelState
      ).toHaveBeenCalledWith(
        `${modelPath}.otherPeopleDetails`
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'reset-model-state',
      });

      expect(
        jumpToNextQuestionEx
      ).toHaveBeenCalledTimes(1);

      expect(
        jumpToNextQuestionEx
      ).toHaveBeenCalledWith(
        '#addOrSkipOtherPeopleDetails'
      );
    });
  });

  describe('MultiBlock', () => {
    it('should render MultiBlock when there are other people', () => {
      selectorValues.set(
        selectors.hasOtherPeopleDetails,
        true
      );

      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId(
          'mainHasOtherPeopleDetailsAccordion'
        )
      ).toBeInTheDocument();
    });

    it('should not render MultiBlock when there are no other people', () => {
      selectorValues.set(
        selectors.hasOtherPeopleDetails,
        false
      );

      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.queryByTestId(
          'mainHasOtherPeopleDetailsAccordion'
        )
      ).not.toBeInTheDocument();
    });

    it('should use the correct model path', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('multi-block-model')
      ).toHaveTextContent(
        `${modelPath}.otherPeopleDetails`
      );
    });

    it('should use the correct translated header', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('multi-block-header')
      ).toHaveTextContent(
        `claim/${claimType}:otherPeopleDetails.heading`
      );
    });

    it('should use the correct add link text', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('multi-block-add-text')
      ).toHaveTextContent(
        `claim/${claimType}:otherPeopleDetails.addAnotherPerson`
      );
    });

    it('should use the correct remove link text', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('multi-block-remove-text')
      ).toHaveTextContent('button.remove');
    });
  });

  describe('OtherPersonDetails items', () => {
    it('should render one OtherPersonDetails for each person', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('other-person-0')
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('other-person-1')
      ).toBeInTheDocument();
    });

    it('should use the correct model path for each person', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('person-model-path-0')
      ).toHaveTextContent(
        `${modelPath}.otherPeopleDetails[0]`
      );

      expect(
        screen.getByTestId('person-model-path-1')
      ).toHaveTextContent(
        `${modelPath}.otherPeopleDetails[1]`
      );
    });

    it('should use the correct form model path for each person', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId(
          'person-form-model-path-0'
        )
      ).toHaveTextContent(
        `${formPath}.otherPeopleDetails[0]`
      );

      expect(
        screen.getByTestId(
          'person-form-model-path-1'
        )
      ).toHaveTextContent(
        `${formPath}.otherPeopleDetails[1]`
      );
    });

    it('should pass address state to OtherPersonDetails', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('person-address-0')
      ).toHaveTextContent(
        JSON.stringify(otherPeopleState[0].address)
      );

      expect(
        screen.getByTestId('person-address-1')
      ).toHaveTextContent(
        JSON.stringify(otherPeopleState[1].address)
      );
    });

    it('should use otherPeopleDetails as the id prefix', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('person-id-prefix-0')
      ).toHaveTextContent(
        'otherPeopleDetails'
      );
    });

    it('should use the claim type in OtherPersonDetails translation path', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId(
          'person-translation-path-0'
        )
      ).toHaveTextContent(
        `claim/${claimType}:otherPeopleDetails`
      );
    });

    it('should mark OtherPersonDetails as optional', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('person-optional-0')
      ).toHaveTextContent('true');
    });
  });

  describe('add person link', () => {
    it('should show add link for the last person when maximum count has not been reached', () => {
      selectorValues.set(
        selectors.getOtherPeopleDetailsCount,
        2
      );

      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('show-add-link-0')
      ).toHaveTextContent('false');

      expect(
        screen.getByTestId('show-add-link-1')
      ).toHaveTextContent('true');
    });

    it('should not show add link when maximum count has been reached', () => {
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

      expect(
        screen.getByTestId(
          `show-add-link-${
            MAX_ALLOWED_OTHER_PEOPLE_COUNT - 1
          }`
        )
      ).toHaveTextContent('false');
    });

    it('should always show remove link for each person', () => {
      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.getByTestId('show-remove-link-0')
      ).toHaveTextContent('true');

      expect(
        screen.getByTestId('show-remove-link-1')
      ).toHaveTextContent('true');
    });
  });

  describe('handleAdd', () => {
    it('should dispatch updateOtherPeople with add=true', () => {
      render(<OtherPeopleDetailsComponent />);

      fireEvent.click(
        screen.getByTestId('multi-block-add')
      );

      expect(
        thunks.updateOtherPeople
      ).toHaveBeenCalledTimes(1);

      expect(
        thunks.updateOtherPeople
      ).toHaveBeenCalledWith(
        1,
        true,
        otherPeopleState
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'update-other-people',
      });
    });
  });

  describe('handleRemove', () => {
    it('should dispatch updateOtherPeople with add=false', () => {
      render(<OtherPeopleDetailsComponent />);

      fireEvent.click(
        screen.getByTestId('multi-block-remove')
      );

      expect(
        thunks.updateOtherPeople
      ).toHaveBeenCalledTimes(1);

      expect(
        thunks.updateOtherPeople
      ).toHaveBeenCalledWith(
        1,
        false,
        otherPeopleState
      );

      expect(dispatch).toHaveBeenCalledWith({
        type: 'update-other-people',
      });
    });
  });

  describe('empty state', () => {
    it('should not render person details when there are no people', () => {
      selectorValues.set(
        selectors.getOtherPeopleDetails,
        []
      );

      selectorValues.set(
        selectors.getOtherPeopleDetailsCount,
        0
      );

      selectorValues.set(
        selectors.hasOtherPeopleDetails,
        false
      );

      render(<OtherPeopleDetailsComponent />);

      expect(
        screen.queryByTestId('other-person-0')
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId(
          'mainHasOtherPeopleDetailsAccordion'
        )
      ).not.toBeInTheDocument();
    });
  });
});