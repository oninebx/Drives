import styled from '@emotion/styled';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { DatePicker } from '~/common/components/base';
import { Question } from '~/common/components/dumb';
import { commonActions } from '~/common/state';
import { raiseFieldGAEvent } from '~/common/utilities';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { modelPath, selectors } from '~/feature/quote/shared/state';
import './PolicyStartDate.scss';
import type { AppDispatch } from '~/root/store';
import { useCallback, useEffect, useState } from 'react';
import getPolicyStartDateRules from './getPolicyStartDateRules';

const StyledMessageDiv = styled.div`
  display: flex;
  margin-top: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.color.error500Default};
`;

export interface PolicyStartDateProps
  extends
  InjectedTranslateProps {
  noTick?: boolean;
  overrideTranslationDescriptionKey?: string;
  onSelect?: () => void;
}


const PolicyStartDateComponent = ({
  noTick,
  overrideTranslationDescriptionKey,
  t,
  onSelect,
}: PolicyStartDateProps) => {

  const sharedState = useSelector(selectors.getQuoteSharedState);
  const dispatch = useDispatch<AppDispatch>();
  const [startDateExpiredMsg, setStartDateExpiredMsg] = useState('');

  const model = `${modelPath}.policyStartDate`;
  const { date, minDate, maxDate, isExpired, isBeyondMaxDate } = getPolicyStartDateRules(sharedState.policyStartDate);

  const clearDate = useCallback(() => {
    dispatch(formActions.change(model, ''));
  }, [dispatch, model]);

  useEffect(() => {
    if (isExpired || isBeyondMaxDate) {
      clearDate();
    }
    if (isExpired) {
      setStartDateExpiredMsg(t('quote:policyStartDate.errors.startDateExpired'));
    }
  }, [isExpired, isBeyondMaxDate, clearDate]);

  const handleChange = (dateValue: Date) => {
    dispatch(formActions.change(model, dateValue.toISOString()));
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
  };

  const handleSelect = (dateValue: Date) => {
    handleChange(dateValue);
    setStartDateExpiredMsg('');
    onSelect?.();
  };

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
          minDate={minDate}
          maxDate={maxDate}
          onSelect={handleSelect}
          onTyping={clearDate}
        />
        {setStartDateExpiredMsg && <StyledMessageDiv>{startDateExpiredMsg}</StyledMessageDiv>}
      </Question>
    </>
  );
};

export const PolicyStartDate = translate(['base', 'quote'])(PolicyStartDateComponent);
