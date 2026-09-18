import styled from '@emotion/styled';
import {
  Button,
  Card,
  DropdownMenu,
  ExpandMoreIcon,
  InformationBox,
  TextArea,
  InfoIcon,
  Typography,
  Link,
  colorAlpha
} from '@tower/tui';
import { PolicyHolderFieldContainer } from '../CurrentPolicyHolders/PolicyHolderField/PolicyHolderField.styles';
import { StyledDOBQuestionContainer } from '../Question/PolicyHolderDateOfBirth.styles';

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const EditContainer = styled.div<{ $active: boolean }>`
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.color.white};
  width: 50%;

  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  box-shadow: 0 0 16px 2px rgba(0, 0, 0, 0.1);
  ${({ theme }) => theme.viewport.max('md')} {
    width: 100%;
  }
  ${({ $active }) => $active && `padding: 25px`};
`;
export const Container = styled(Card.Container)`
  margin-top: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  width: 100%;
  diplay: flex;
  align-items: flex-start;
  ${({ theme }) => theme.viewport.min('md')} {
    width: 50%;
  }
`;

export const Content = styled(Card.Content)`
  && {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.xs};
  }
`;

export const EditPolicyHolderContainer = styled.div<{ $active: boolean }>`
  width: 67%;
  ${({ theme }) => theme.viewport.max('md')} {
    width: 100%;
  }
  padding-bottom: ${({ theme }) => theme.spacing.md};
  ${({ $active }) => $active && `margin-top:50px; width: 70%;`};
`;

export const ReasonLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.small.fontSize};
  font-weight: ${({ theme }) => theme.typography.small.fontWeight};
  color: ${({ theme }) => theme.color.neutral700};
`;

export const DropDownContainer = styled(DropdownMenu.Container)``;
export const DropDownIcon = styled(ExpandMoreIcon)<{ $isFlipped: boolean }>`
  transform: ${({ $isFlipped }) => ($isFlipped ? 'rotate(180deg)' : 'rotate(0)')};
  transition: transorm 0.3s;
`;
export const DropDowntrigger = styled(DropdownMenu.Trigger)<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid;
  border-radius: 0;
`;
export const DropDownContent = styled(DropdownMenu.Content)``;
export const DropDownList = styled(DropdownMenu.Item)`
  width: 100%;
  padding: 10px 12px;
  cursor: pointer;
  &:not([data-disabled]) {
    color: ${({ theme }) => theme.color.primary};
    &:hover {
      background-color: ${({theme}) => colorAlpha(theme, 'link500Default', 0.1)};
    }

    &:focus {
      background-color: ${({theme}) => colorAlpha(theme, 'link500Default', 0.2)};
    }

    &:active {
      background-color: ${({theme}) => colorAlpha(theme, 'link500Default', 0.3)};
    }
  }
`;
export const SelectedValue = styled.span<{ hasValue: boolean }>`
  color: ${({ hasValue, theme }) => (hasValue ? theme.color.primary : theme.color.neutral700)};
`;
export const TextAreaContainer = styled(TextArea.Root)`
  textarea {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    border-bottom: 1px solid !important;
    border-radius: 0 !important;
    background-color: ${(p) => p.theme.color.neutral300};
  }
  textarea:focus,
  textarea:focus-visible {
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
    border-bottom: 1px solid !important;
    border-radius: 0 !important;
    background-color: ${(p) => p.theme.color.neutral300};
  }
  margin-top: 20px;
  padding-bottom: 48px;
`;
export const TextAreaLabel = styled(TextArea.Label)`
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.color.primary};
`;
export const TextAreaField = styled(TextArea.Field)<TextAreaProps>`
  border: none !important;
  outline: none !important;
  box-shadow: none !important;

  &:focus,
  &:focus-within,
  &:focus-visible {
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
  }
  &::before,
  &::after {
    border: 0 !important;
    box-shadow: none !important;
  }
  border-bottom: 1px solid;
  background: neutral400;
`;
export const TextAreaSupportingContainer = styled(TextArea.SupportingContainer);
export const NextButton = styled(Button)`
  margin-right: 10px;
`;
export const ButtonAligningDiv = styled.div`
  margin-top: 20px;
`;

export const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  & + & {
    margin-top: ${({ theme }) => theme.spacing.xs};
  }
`;
export const EditPolicyHolderForm = styled.div`
  padding-top: ${({ theme }) => theme.spacing.xs};
  ${PolicyHolderFieldContainer} {
    padding-top: 0px;
    padding-bottom: 0px;
  }
`;

export const EditPolicyDateOfBirth = styled.div`
  ${StyledDOBQuestionContainer} {
    fieldset.question {
      margin-left: 0px;
    }
  }
  padding-top: ${({ theme }) => theme.spacing.xxxl};
  padding-bottom: 0px;
  margin-left: ${({ theme }) => theme.spacing.xs};
  ${({ theme }) => theme.viewport.max('md')} {
    margin-left: ${({ theme }) => theme.spacing.xs};
  }
`;

export const InLineWarningContainer = styled(InformationBox.Container)`
  && {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.xs};
    padding-left: 5px;
    padding-right: 5px;
  }
`;

export const WarningIcon = styled(InfoIcon)`
  flex-shrink: 0;
  margin-top: 2px;
`;

export const Typographycontent = styled(Typography)`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.small.lineHeight};
  padding-bottom: ${({ theme }) => theme.spacing.xs};
`;

export const TypographyAccount = styled(Typography)`
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.small.lineHeight};
  padding-bottom: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.xs};
`;

export const BackLink = styled(Link)`
  display: inline-flex;
  cursor: pointer;
  align-items: center;
  border-bottom: none;
`;

export const InformationIcon = styled(InfoIcon)`
  flex-shrink: 0;
  margin-top: 2px;
`;

export const EditPolicyHolderLayout = styled.div<{ $active: boolean }>`
  ${({ $active }) => $active && `margin:50px`}
`;
