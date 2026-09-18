import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Label, ProgressIndicator, Radio, Typography } from '@tower/tui';
import React from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { ReferralFormValues } from '../../schema';
import { schema } from '../../schema';
import * as PhoneInput from '../PhoneInput/PhoneInput';
import { ReferralProduct } from '../ReferralProduct/ReferralProduct';
import {
  CheckBoxControl,
  CheckboxWrapper,
  FieldLabel,
  Fieldset,
  Form,
  InputWrapper,
  ProgressIndicatorContainer,
  RadioRoot,
  Section,
  SubmitButton,
  TextAreaField,
  TextAreaRoot
} from './ReferralForm.styles';
import { contactMethods, preferredContactTime, referralProducts } from './constants';

export const ReferralForm = ({
  onSubmit,
  defaultValues = {
    products: [],
    contactMethod: undefined,
    email: '',
    phone: {
      code: 'NZ',
      number: ''
    }
  }
}: {
  onSubmit: (data: ReferralFormValues) => Promise<void> | void;
  defaultValues?: ReferralFormValues;
}) => {
  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting, errors }
  } = useForm<ReferralFormValues>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: defaultValues,
    resolver: zodResolver(schema)
  });

  const contactMethod = useWatch({ control, name: 'contactMethod' });

  return (
    <Form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Section>
        <Fieldset>
          <FieldLabel variant="title" asChild bold $disabled={isSubmitting}>
            <legend>Referral product(s)</legend>
          </FieldLabel>
          <Controller
            name="products"
            control={control}
            render={({ field, fieldState }) => (
              <>
                {referralProducts.map(({ value, ...product }) => {
                  const checked = field.value?.includes(value);

                  return (
                    <ReferralProduct
                      key={value}
                      {...product}
                      checked={checked}
                      disabled={isSubmitting}
                      onCheckedChange={(next: boolean) => {
                        const nextArr = next
                          ? [...(field.value ?? []), value]
                          : (field.value ?? []).filter((v) => v !== value);
                        field.onChange(nextArr);

                        // Any interaction with a checkbox counts as "touched" for the group.
                        // RHF's `onTouched` mode relies on `onBlur`, so we manually mark it once.
                        if (!fieldState.isTouched) field.onBlur();
                      }}
                    />
                  );
                })}
              </>
            )}
          />
          {errors.products ? (
            <Typography variant="small" color="error500Default">
              {errors.products.message}
            </Typography>
          ) : null}
        </Fieldset>
      </Section>
      <Section>
        <Fieldset>
          <FieldLabel variant="title" asChild bold $disabled={isSubmitting}>
            <legend>Preferred contact method</legend>
          </FieldLabel>
          <Controller
            control={control}
            name="contactMethod"
            render={({ field }) => (
              <RadioRoot
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSubmitting}>
                {contactMethods.map(({ value, label }) => (
                  <Label key={value}>
                    <Radio.Item value={value} />
                    {label}
                  </Label>
                ))}
              </RadioRoot>
            )}
          />
          {errors.contactMethod ? (
            <Typography variant="small" color="error500Default">
              {errors.contactMethod.message}
            </Typography>
          ) : null}
        </Fieldset>
        {contactMethod === 'phone' ? (
          <>
            <InputWrapper>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput.Root
                    value={
                      field.value ?? {
                        code: 'NZ',
                        number: ''
                      }
                    }
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={isSubmitting}>
                    <PhoneInput.Label>Preferred number to call</PhoneInput.Label>
                    <PhoneInput.Field />
                  </PhoneInput.Root>
                )}
              />
              {errors.phone ? (
                <Typography variant="small" color="error500Default">
                  {errors.phone.message}
                </Typography>
              ) : null}
            </InputWrapper>
            <Fieldset>
              <FieldLabel variant="title" asChild bold $disabled={isSubmitting}>
                <legend>Best time to call</legend>
              </FieldLabel>
              <Controller
                name="contactTimes"
                control={control}
                render={({ field, fieldState }) => (
                  <CheckboxWrapper>
                    {preferredContactTime.map(({ value, label }) => {
                      const checked = field.value?.includes(value);

                      return (
                        <Label key={value}>
                          <CheckBoxControl
                            checked={checked}
                            disabled={isSubmitting}
                            onCheckedChange={(next: boolean) => {
                              const nextArr = next
                                ? [...(field.value ?? []), value]
                                : (field.value ?? []).filter((v) => v !== value);
                              field.onChange(nextArr);

                              // Manually mark the field.
                              if (!fieldState.isTouched) field.onBlur();
                            }}
                          />
                          {label}
                        </Label>
                      );
                    })}
                  </CheckboxWrapper>
                )}
              />
              {errors.contactTimes ? (
                <Typography variant="small" color="error500Default">
                  {errors.contactTimes.message}
                </Typography>
              ) : null}
            </Fieldset>
          </>
        ) : null}
        {contactMethod === 'email' ? (
          <InputWrapper>
            <FieldLabel variant="title" bold asChild $disabled={isSubmitting}>
              <label htmlFor="preferred-email">Preferred email address</label>
            </FieldLabel>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input.Root value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur}>
                  <Input.Field id="preferred-email" disabled={isSubmitting} />
                </Input.Root>
              )}
            />
            {errors.email ? (
              <Typography variant="small" color="error500Default">
                {errors.email.message}
              </Typography>
            ) : null}
          </InputWrapper>
        ) : null}
      </Section>
      <Controller
        name="comments"
        control={control}
        render={({ field }) => (
          <TextAreaRoot value={field.value ?? ''} onChange={field.onChange}>
            <FieldLabel variant="title" bold asChild $disabled={isSubmitting}>
              <label htmlFor="referral-notes">Notes</label>
            </FieldLabel>
            <TextAreaField id="referral-notes" disabled={isSubmitting} />
          </TextAreaRoot>
        )}
      />
      <SubmitButton variant="primary" type="submit" disabled={!isValid || isSubmitting}>
        Submit referral
        <ProgressIndicatorContainer $pending={isSubmitting} aria-hidden={!isSubmitting}>
          <ProgressIndicator.Circular />
        </ProgressIndicatorContainer>
      </SubmitButton>
    </Form>
  );
};
