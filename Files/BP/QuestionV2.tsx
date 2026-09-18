import type { TypographyProps } from '@tower/tui';
import { Divider, Typography } from '@tower/tui';
import { isEmpty } from 'lodash';
import * as React from 'react';
import type { MapPropsProps } from 'react-redux-form';
import { Control } from 'react-redux-form';
import styled from '@emotion/styled';
import { QuestionTickV2 } from './QuestionTickV2';
const IconAndDivider = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: ${({ theme }) => theme.spacing.lg};
  height: auto;
  gap: 8px;
  ${({ theme }) => theme.viewport.min('md')} {
    align-items: center;
    margin-right: 36px;
  }
`;
const StyledDivider = styled(Divider)`
  height: 100%;
  margin-left: ${({ theme }) => theme.spacing.xs};
  box-sizing: border-box;
  margin-bottom: 0;
  ${({ theme }) => theme.viewport.min('md')} {
    margin-left: 1px;
  }
`;
const StyledControl = styled(Control)`
  height: 100%;
`;
interface TickProps {
  model: string;
  tick?: boolean;
}
interface DividerAndTickProps {
  show: boolean;
  error: boolean;
  tick?: boolean;
}
const DividerAndTick = (props: DividerAndTickProps) =>
  props.tick ? (
    <IconAndDivider>
      <QuestionTickV2 show={props.show} error={props.error} />
      {(props.show || props.error) && <StyledDivider orientation="vertical" aria-hidden />}
    </IconAndDivider>
  ) : null;
export const RrfFormTick = (props: TickProps) => (
  <StyledControl
    model={props.model}
    withField
    mapProps={{
      show: (showProps: MapPropsProps) => {
        const { errors, value } = showProps.fieldValue;
        let hasError = errors === true;
        for (const k in errors) {
          if (errors[k] === true) {
            hasError = true;
          }
        }
        return !isEmpty(value) && !hasError;
      },
      error: (errorProps: MapPropsProps) => {
        const { errors, value } = errorProps.fieldValue;
        let hasError = false;
        for (const k in errors) {
          if (errors[k] === true) {
            hasError = true;
          }
        }
        return !isEmpty(value) && hasError;
      },
      tick: () => props.tick
    }}
    component={DividerAndTick}
  />
);
export const FormTick = (props: DividerAndTickProps) => {
  return DividerAndTick(props);
};

export const Root = styled.fieldset`
  &:has(${IconAndDivider}) {
    ${({ theme }) => theme.viewport.min('lg')} {
      margin-left: -73px;
    }
  }
  max-width: 680px;
  width: 100%;
  display: flex;
  flex-direction: row;
  padding-top: 40px;
  padding-bottom: ${({ theme }) => theme.spacing.lg};
  margin-right: ${({ theme }) => theme.spacing.lg};
`;
export const Description = styled(Typography)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;
export const TitleComponent = styled(Typography)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;
export const Title = (props: TypographyProps) => (
  <legend>
    <TitleComponent {...props} />
  </legend>
);
