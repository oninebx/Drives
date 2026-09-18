import { ArrowBackIcon, Button, Typography } from '@tower/tui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { routes } from '~/common/state';

import { actions as formActions } from 'react-redux-form';
import { changeModelPath } from '~/feature/portal/state';
import { useAppDispatch } from '~/root/store';
import { PolicyHolderTitle } from '../CurrentPolicyHolders/CurrentPolicyHolders.styles';
import { EditPolicyHolderField } from './EditPolicyHolderField';

import { LinkTracked } from '~/common/components/base';
import { raiseFieldGAEvent } from '~/common/utilities';
import type { DeconstructedParams } from '~/feature/portal/hooks/useDeconstructedParams';
import { useDeconstructedParams } from '~/feature/portal/hooks/useDeconstructedParams';
import PolicyHolderDateOfBirth from '../Question/PolicyHolderDateOfBirth';
import {
  BackLink,
  ButtonAligningDiv,
  EditContainer,
  EditPolicyDateOfBirth,
  EditPolicyHolderContainer,
  EditPolicyHolderForm,
  EditPolicyHolderLayout,
  FieldBlock,
  InLineWarningContainer,
  NextButton,
  TypographyAccount,
  Typographycontent,
  WarningIcon
} from './EditPolicy.styles';
import { EditPolicyDescription } from './EditPolicyDescription';
import { EditPolicyDropDown } from './EditPolicyDropDown';
import { useEditPolicyHolderViewModel } from './useEditPolicyHolderViewModel';

export interface EditPolicyHolderProps {
  base: string;
  current: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    reasonForChange: string;
  };
  isDirty: boolean;
  onChange: (key: 'firstName' | 'lastName' | 'dateOfBirth' | 'reasonForChange', v: string) => void;
  onNext: () => void;
  onCancel: () => void;
  isFieldEdited: (key: 'firstName' | 'lastName' | 'dateOfBirth' | 'reasonForChange') => boolean;
  onBackAction: () => void;
  reasonForChangeValue: string;
}

export const EditPolicyHolders: React.FC<EditPolicyHolderProps> = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const base = `${changeModelPath}`;
  const vm = useEditPolicyHolderViewModel(base);
  const EDIT_POLICY_HOLDER_PATH = '/portal/profile/personal-details-edit-policy-holders';
  const isEditPolicyHolderPath = location.pathname === EDIT_POLICY_HOLDER_PATH;
  const editAccountDetail = `${base}.policyHolders.editPolicyHolder.isEditAccountDetails`;
  React.useEffect(() => {
    dispatch(formActions.change(editAccountDetail, isEditPolicyHolderPath));
  }, [isEditPolicyHolderPath]);
  React.useEffect(() => {
    if (!vm.customer) return;
    dispatch(formActions.change(`${base}.firstName`, vm.customer.firstName ?? ''));
    dispatch(formActions.change(`${base}.lastName`, vm.customer.lastName ?? ''));
    dispatch(formActions.change(`${base}.dateOfBirth`, vm.customer.dateOfBirth ?? ''));
  }, [dispatch, vm.customer, base]);

  const reasonModelPath = `${base}.policyHolders.editPolicyHolder.reasonForChange`;
  const descriptionModelPath = `${base}.policyHolders.editPolicyHolder.description`;

  const handleReasonChange = (v: string) => {
    dispatch(formActions.change(reasonModelPath, v));
    raiseFieldGAEvent('last_field_interacted', 'dropdown', v);
    if (v !== otherSpecify) {
      dispatch(formActions.change(descriptionModelPath, ''));
    }
  };
  const fieldsTouched = `${base}.policyHolders.editPolicyHolder.fieldsTouched`;

  React.useEffect(() => {
    dispatch(formActions.change(fieldsTouched, vm.isDirty));
  }, [dispatch, fieldsTouched, vm.isDirty]);

  const params: DeconstructedParams = useDeconstructedParams();
  const policyNumber = params.id;
  const navigate = useNavigate();

  const profileLink = routes.PORTAL.PROFILE_PERSONAL_DETAILS;

  const dobError = vm.isFieldEdited('dateOfBirth');
  const otherSpecify = t('portal:editCurrentPolicyHolder.otherSpecify');

  return (
    <EditPolicyHolderLayout $active={isEditPolicyHolderPath}>
      {isEditPolicyHolderPath && <h2>Edit policy holder</h2>}
      <div>
        <EditPolicyHolderContainer $active={isEditPolicyHolderPath}>
          <Typographycontent variant="body">
            {t('portal:editCurrentPolicyHolder.policyHolderMessage.message1')}
            <vm.phone />
            {t('portal:editCurrentPolicyHolder.policyHolderMessage.message2')}
          </Typographycontent>
          <Typographycontent variant="body">
            {t('portal:editCurrentPolicyHolder.policyHolderMessage.message3')}
          </Typographycontent>
        </EditPolicyHolderContainer>
        <TypographyAccount variant="body">
          {t('portal:editCurrentPolicyHolder.updateAccount.message')}
          <LinkTracked href={profileLink} id={'user-profile-link'} target={'_blank'}>
            <span>{t('portal:editCurrentPolicyHolder.updateAccount.linkText')}</span>
          </LinkTracked>
        </TypographyAccount>
        <EditContainer $active={isEditPolicyHolderPath}>
          <PolicyHolderTitle variant="title">{vm.customer.firstName + ' ' + vm.customer.lastName}</PolicyHolderTitle>
          <EditPolicyHolderForm>
            <EditPolicyHolderField
              id="firstName"
              fieldName={t(`portal:changes.policyholder.current.firstName`)}
              model={`${base}.policyHolders.editPolicyHolder.firstName`}
              editable={vm.isFieldEdited('firstName')}></EditPolicyHolderField>

            <EditPolicyHolderField
              id="lastName"
              fieldName={t(`portal:changes.policyholder.current.lastName`)}
              model={`${base}.policyHolders.editPolicyHolder.lastName`}
              editable={vm.isFieldEdited('lastName')}></EditPolicyHolderField>
          </EditPolicyHolderForm>
          <EditPolicyDateOfBirth>
            <PolicyHolderDateOfBirth
              index={0}
              modelPath={`${base}.policyHolders.editPolicyHolder.dateOfBirth`}
              defaultValue={vm.customer?.dateOfBirth}
              isEdit={vm.isFieldEdited('dateOfBirth')}></PolicyHolderDateOfBirth>
          </EditPolicyDateOfBirth>
          <FieldBlock>
            <EditPolicyDropDown value={vm.reasonForChangeValue} onChange={handleReasonChange} />
          </FieldBlock>
          <FieldBlock>
            {vm.reasonForChangeValue === otherSpecify && (
              <EditPolicyDescription value={vm.otherDescription} onChange={vm.handleOtherDescriptionChange} />
            )}
          </FieldBlock>
          {dobError && (
            <InLineWarningContainer variant="warning" border={true}>
              <WarningIcon color="warning500Default" />
              <Typography variant="body">
                {t('portal:editCurrentPolicyHolder.dateOfBirth.errors.dobTouched')}
              </Typography>
            </InLineWarningContainer>
          )}
          <ButtonAligningDiv>
            <NextButton
              variant="primary"
              disabled={!(vm.isDirty && vm.showNextEditPolicyHolder())}
              onClick={() => {
                isEditPolicyHolderPath
                  ? navigate(routes.PORTAL.GET_IN_TOUCH_ACCOUNT_DETAIL)
                  : navigate(routes.PORTAL.GET_IN_TOUCH.replace(':id', policyNumber));
                raiseFieldGAEvent('last_field_interacted', 'button', 'editPolicyHolderNext');
              }}>
              {t('portal:editCurrentPolicyHolder.button.next')}
            </NextButton>
            <Button
              variant="secondary"
              onClick={() => {
                vm.resetField();
                isEditPolicyHolderPath
                  ? navigate(routes.PORTAL.PROFILE_PERSONAL_DETAILS)
                  : navigate(routes.PORTAL.CHANGE.replace(':id', policyNumber).replace(':change', 'policyholder'));
                raiseFieldGAEvent('last_field_interacted', 'button', 'editPolicyHolderCancel');
              }}>
              {t('portal:editCurrentPolicyHolder.button.cancel')}
            </Button>
          </ButtonAligningDiv>
        </EditContainer>
        <BackLink
          id="backToDetail"
          onClick={() => {
            vm.resetField();
            isEditPolicyHolderPath
              ? navigate(routes.PORTAL.PROFILE_PERSONAL_DETAILS)
              : navigate(routes.PORTAL.CHANGE.replace(':id', policyNumber).replace(':change', 'policyholder'));
            raiseFieldGAEvent('last_field_interacted', 'button', 'editPolicyHolderBack');
          }}>
          <ArrowBackIcon color="link500Default" />
          <span>{t(`portal:changes.backButton`)}</span>
        </BackLink>
      </div>
    </EditPolicyHolderLayout>
  );
};
export default EditPolicyHolders;
