import styled from '@emotion/styled';
import * as React from 'react';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { DatePicker } from '~/common/components/base';
import { Question } from '~/common/components/dumb';
import { commonActions } from '~/common/state';
import { moment } from '~/common/twr-moment/twr-moment';
import { raiseFieldGAEvent } from '~/common/utilities';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import type { QuoteSharedState } from '~/feature/quote/shared/state';
import { modelPath, selectors } from '~/feature/quote/shared/state';
import type { ApplicationState, Dispatch } from '~/root/rootReducer';
import './PolicyStartDate.scss';

const StyledMessageDiv = styled.div`
  display: flex;
  margin-top: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.color.error500Default};
`;

interface StateProps {
  sharedState: QuoteSharedState;
  onChange?: (model: string, value: string) => void;
  clearPolicyStartDate?: (model: string) => void;
}

const mapStateToProps = (state: ApplicationState): StateProps => {
  return {
    sharedState: selectors.getQuoteSharedState(state)
  };
};

export interface PolicyStartDateProps
  extends Partial<ReturnType<typeof mapDispatchToProps>>,
    Partial<ReturnType<typeof mapStateToProps>>,
    InjectedTranslateProps {
  noTick?: boolean;
  overrideTranslationDescriptionKey?: string;
  onSelect?: () => void;
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onChange: (model: string, value: string) => {
    dispatch(formActions.change(model, value));
    dispatch(commonActions.eqcWindow(null));
    dispatch(formActions.change(`${modelPath}.payment.paymentPlan`, 'annual'));
    dispatch(formActions.reset(`${modelPath}.payment.paymentType`));
    dispatch(formActions.reset(`${modelPath}.payment.savedPaymentMethod`));
    dispatch(formActions.reset(`${modelPath}.payment.paymentBankAccount`));
    dispatch(formActions.reset(`${modelPath}.payment.paymentAuthority`));
    dispatch(formActions.reset(`${modelPath}.payment.paymentFrequency`));
    dispatch(formActions.reset(`${modelPath}.payment.paymentDayOfMonth`));
    dispatch(formActions.reset(`${modelPath}.payment.paymentStartDate`));
    dispatch(formActions.reset(`${modelPath}.payment.installments`));
    raiseFieldGAEvent('last_field_interacted', 'date', 'policyStartDatePicker');
  },
  clearPolicyStartDate: (model: string) => {
    dispatch(formActions.change(model, ''));
  }
});

const PolicyStartDateComponent = ({
  sharedState,
  noTick,
  overrideTranslationDescriptionKey,
  t,
  onSelect,
  onChange,
  clearPolicyStartDate
}: PolicyStartDateProps) => {
  const model = `${modelPath}.policyStartDate`;
  const minDate = moment().startOf('day');

  const maxDate = moment().startOf('day').add(49, 'days');
  const [startDateExpiredMsg, setStartDateExpiredMsg] = React.useState(null);
  const date = sharedState.policyStartDate ? moment(sharedState.policyStartDate).toDate() : null;

  React.useEffect(() => {
    if (date) {
      const momentDate = moment(date);
      const today = moment().startOf('day');
      if (momentDate.isBefore(today)) {
        setStartDateExpiredMsg(t('quote:policyStartDate.errors.startDateExpired'));
        clearPolicyStartDate(model);
      }
      if (momentDate.isAfter(maxDate)) {
        clearPolicyStartDate(model);
      }
    }
  }, [date?.toString()]);

  return (
    <>
      <Question
        id="questionPolicyStartDate"
        model={model}
        translation="quote:policyStartDate"
        overrideTranslationDescriptionKey={overrideTranslationDescriptionKey}
        noTick={noTick}
        className={noTick ? 'no-tick' : ''}>
        <DatePicker
          id="policyStartDatePicker"
          value={date}
          minDate={minDate.toDate()}
          maxDate={maxDate.toDate()}
          onSelect={(dateStr: Date) => {
            onChange(model, dateStr.toISOString());
            setStartDateExpiredMsg('');
            onSelect?.();
          }}
          onTyping={() => {
            clearPolicyStartDate(model);
          }}
        />
        {setStartDateExpiredMsg && <StyledMessageDiv>{startDateExpiredMsg}</StyledMessageDiv>}
      </Question>
    </>
  );
};

export const PolicyStartDate = connect(
  mapStateToProps,
  mapDispatchToProps
)(translate(['base', 'quote'])(PolicyStartDateComponent));
