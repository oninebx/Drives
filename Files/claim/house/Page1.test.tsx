import { screen } from '@testing-library/react';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import { OCCUPANCY_EMPTY } from '../../shared/state';
import { getDefaultClaimHouseState } from '../state';
import Page1 from './Page1';

describe('Page1', () => {
  const initialState = {
    myForms: {
      houseClaim: {
        ...getDefaultClaimHouseState(),
        eisClaim: {
          reportedPolicyNumber: 'P0001234',
          causeOfLoss: 'fire',
          lossDate: '2025-09-18T22:59:00.000Z'
        }
      },
      sharedClaim: {
        homePolicyDetails: {
          typeOfPolicy: 'house'
        },
        eventDate: '19 September 2025',
        eventTime: '10:59',
        eventTimeAmPm: 'am',
        policyDetails: {
          description: '123 Fake street Howick Manukau'
        }
      }
    }
  };

  const translationData = {
    'claim/house:headings': {
      page1: 'What happened',
      fire: 'Fire',
      witnesses: 'Witnesses',
      otherPeople: 'Other People'
    },
    'claim:page1': {
      eventDescription: { title: 'Describe what happened' }
    },
    'claim:reportedToPolice': {
      title: 'Were the police called?'
    },
    'claim:witness': { hasWitness: { title: 'Did anyone witness the incident?' } },
    'claim:didFireServiceAttend': { title: 'Did fire service attend?' },
    'claim/house:occupancy': { title: 'Who was living in the property' },
    'claim/house:houseLivable': { title: 'Is the proprty secure and sage to live in?' },
    'claim/house:theft': {
      houseLocked: { title: 'was the house locked?' },
      alarmSet: { title: 'was the alarm set?' },
      keysStolen: { title: 'were your keys stolen?' }
    },
    'claim:footer': { nextButton: { house: { page1: 'Next' } } }
  };

  it('should render the page with the correct claim information', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(screen.getByRole('heading', { level: 2, name: 'What happened' })).toBeInTheDocument();
    expect(screen.getByText('preStepsSummary.type.house')).toBeInTheDocument();
    expect(screen.getByText('123 Fake street Howick Manukau')).toBeInTheDocument();
    expect(screen.getByText('preStepsSummary.dateTime')).toBeInTheDocument();
    expect(screen.getByText('19/09/2025 at 10:59 am')).toBeInTheDocument();
    expect(screen.getByText('preStepsSummary.cause')).toBeInTheDocument();
    expect(screen.getByText('preStepsSummary.causeLabels.fire')).toBeInTheDocument();
  });

  it('should render the "What happened" textarea', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(screen.getByRole('heading', { level: 5, name: 'Describe what happened' })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render the occupancy questions', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(screen.getByRole('heading', { level: 3, name: 'Who was living in the property' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('should not render the last property inspection question if house', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(screen.queryByText('lastPropertyInspection.title')).not.toBeInTheDocument();
  });

  it('should not render the vacancy question if house is occupied', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(screen.queryByText('vacantDate.title')).not.toBeInTheDocument();
  });

  it('should render the vacancy question if house is unoccupied', () => {
    const newState = {
      ...initialState,
      myForms: {
        ...initialState.myForms,
        houseClaim: {
          ...initialState.myForms.houseClaim,
          occupancy: OCCUPANCY_EMPTY
        }
      }
    };
    renderComponent(<Page1 />, { initialState: newState, translationData });

    expect(screen.getByText('vacantDate.title')).toBeInTheDocument();
  });

  it('should render the property secure question', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(
      screen.getByRole('heading', { level: 3, name: 'Is the proprty secure and sage to live in?' })
    ).toBeInTheDocument();
  });

  it('should render the witnesses question', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(screen.getByRole('heading', { level: 2, name: 'Witnesses' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5, name: 'Did anyone witness the incident?' })).toBeInTheDocument();
  });

  it('should render the other people question', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(screen.getByRole('heading', { level: 2, name: 'Other People' })).toBeInTheDocument();
  });

  it('should render the form footer', () => {
    renderComponent(<Page1 />, { initialState, translationData });

    expect(screen.getByRole('button', { name: 'Next arrow_forward' })).toBeInTheDocument();
  });

  describe('Fire questions', () => {
    it('should not render the house locked question if not theft', () => {
      renderComponent(<Page1 />, { initialState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'was the house locked?' })).not.toBeInTheDocument();
    });

    it('should not render the alarm set question if not theft', () => {
      renderComponent(<Page1 />, { initialState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'was the alarm set?' })).not.toBeInTheDocument();
    });

    it('should render the keys stolen question if not theft', () => {
      renderComponent(<Page1 />, { initialState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'were your keys stolen?' })).not.toBeInTheDocument();
    });

    it('should not render the police report question if not theft', () => {
      renderComponent(<Page1 />, { initialState, translationData });

      expect(screen.queryByRole('heading', { level: 5, name: 'Were the police called?' })).not.toBeInTheDocument();
    });

    it('should render the fire questions if fire', () => {
      renderComponent(<Page1 />, { initialState, translationData });

      expect(screen.getByRole('heading', { level: 2, name: 'Fire' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'Did fire service attend?' })).toBeInTheDocument();
    });
  });

  describe('Theft questions', () => {
    const theftState = {
      myForms: {
        ...initialState.myForms,
        houseClaim: {
          ...getDefaultClaimHouseState(),
          eisClaim: {
            ...initialState.myForms.houseClaim.eisClaim,
            causeOfLoss: 'theft',
            secondaryCauseOfLoss: 'theft'
          }
        }
      }
    };

    it('should render the house locked question', () => {
      renderComponent(<Page1 />, { initialState: theftState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'was the house locked?' })).toBeInTheDocument();
    });

    it('should render the alarm set question', () => {
      renderComponent(<Page1 />, { initialState: theftState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'was the alarm set?' })).toBeInTheDocument();
    });

    it('should render the alarm set question', () => {
      renderComponent(<Page1 />, { initialState: theftState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'was the alarm set?' })).toBeInTheDocument();
    });

    it('should render the keys stolen question', () => {
      renderComponent(<Page1 />, { initialState: theftState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'were your keys stolen?' })).toBeInTheDocument();
    });

    it('should render the police report question', () => {
      renderComponent(<Page1 />, { initialState: theftState, translationData });

      expect(screen.getByRole('heading', { level: 5, name: 'Were the police called?' })).toBeInTheDocument();
    });

    it('should not render the fire questions if not fire', () => {
      renderComponent(<Page1 />, { initialState: theftState, translationData });

      expect(screen.queryByRole('heading', { level: 2, name: 'Fire' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 5, name: 'Did fire service attend?' })).not.toBeInTheDocument();
    });
  });
});
