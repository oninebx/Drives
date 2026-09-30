import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { moment } from '~/common/twr-moment/twr-moment';
import type { ApplicationState } from '~/root/rootReducer';
import type { PolicyStartDateProps } from './PolicyStartDate';
import { PolicyStartDate } from './PolicyStartDate';

describe('PolicyStartDate', () => {
  const initialState = {
    myForms: {
      sharedQuote: {
        policyStartDate: '2024-05-10T00:00:00.000Z'
      }
    }
  } as Partial<ApplicationState>;

  const translationData = {
    'quote:policyStartDate': {
      title: 'title',
      description: 'description1',
      descriptionSummaryPage: 'description2',
      errors: {
        startDateExpired: 'start date expired'
      }
    }
  };

  it('should render component', () => {
    renderComponent(<PolicyStartDate />, { translationData });
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description1')).toBeInTheDocument();
    expect(screen.getByText('Choose a date')).toBeInTheDocument();
    expect(screen.getByText('done')).toBeInTheDocument();
  });

  it('should render tick', () => {
    const props: PolicyStartDateProps = {
      noTick: true,
      t: () => jest.fn()
    };
    renderComponent(<PolicyStartDate {...props} />, { translationData });
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.queryByText('done')).not.toBeInTheDocument();
  });

  it('should show expired start date error', () => {
    renderComponent(<PolicyStartDate />, { initialState, translationData });
    expect(screen.getByText('start date expired')).toBeInTheDocument();
  });

  it('should not populate past date', () => {
    renderComponent(<PolicyStartDate />, { initialState, translationData });
    expect(screen.getByDisplayValue('')).not.toBeUndefined();
  });

  it('should render description2', () => {
    const props: PolicyStartDateProps = {
      overrideTranslationDescriptionKey: 'descriptionSummaryPage',
      t: () => jest.fn()
    };
    renderComponent(<PolicyStartDate {...props} />, { translationData });
    expect(screen.getByText('description2')).toBeInTheDocument();
  });

  it('should show error for past dates', async () => {
    renderComponent(<PolicyStartDate />, { translationData });
    const input = screen.getByRole('textbox', { name: 'Choose a date' });

    // band aid until we are on userEvent
    // https://github.com/testing-library/user-event/releases/tag/v14.0.0
    // @TODO convert to await userEvent.MY_ACTION
    act(() => {
      userEvent.type(input, '16/05/2020');
    });

    expect(screen.getByText('Enter a valid date in format DD/MM/YYYY')).toBeInTheDocument();
  });

  it('should populate dates no more than 49 days from today', async () => {
    const state = { ...initialState };
    const today = moment().startOf('day');
    const todayPlus49Days = today.add(35, 'days');
    const todayPlus49DaysDisplayValue = todayPlus49Days.format('DD/MM/YYYY');
    state.myForms.sharedQuote.policyStartDate = todayPlus49Days.toISOString();

    renderComponent(<PolicyStartDate />, { initialState: state, translationData });
    expect(screen.getByDisplayValue(todayPlus49DaysDisplayValue)).toBeInTheDocument();
  });

  it('should populate 49 days from today', async () => {
    const state = { ...initialState };
    const today = moment().startOf('day');
    const todayPlus49Days = today.add(49, 'days');
    const todayPlus49DaysDisplayValue = todayPlus49Days.format('DD/MM/YYYY');
    state.myForms.sharedQuote.policyStartDate = todayPlus49Days.toISOString();

    renderComponent(<PolicyStartDate />, { initialState: state, translationData });
    expect(screen.getByDisplayValue(todayPlus49DaysDisplayValue)).toBeInTheDocument();
  });

  it('should populate not 50 days from today', async () => {
    const state = { ...initialState };
    const today = moment().startOf('day');
    const todayPlus49Days = today.add(50, 'days');
    const todayPlus49DaysDisplayValue = todayPlus49Days.format('DD/MM/YYYY');
    state.myForms.sharedQuote.policyStartDate = todayPlus49Days.toISOString();

    renderComponent(<PolicyStartDate />, { initialState: state, translationData });
    expect(screen.queryByDisplayValue(todayPlus49DaysDisplayValue)).not.toBeInTheDocument();
  });

  it('should not populate dates beyond 49 days from today', async () => {
    const state = { ...initialState };
    const today = moment().startOf('day');
    const todayPlus49Days = today.add(55, 'days');
    const todayPlus49DaysDisplayValue = todayPlus49Days.format('DD/MM/YYYY');
    state.myForms.sharedQuote.policyStartDate = todayPlus49Days.toISOString();

    renderComponent(<PolicyStartDate />, { initialState: state, translationData });
    expect(screen.queryByDisplayValue(todayPlus49DaysDisplayValue)).not.toBeInTheDocument();
  });
});
