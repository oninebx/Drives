import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ReferralFormValues } from '../../schema';
import { ReferralForm } from './ReferralForm';

const defaultVlaues: ReferralFormValues = {
  products: [],
  contactMethod: undefined,
  email: '',
  phone: {
    code: 'NZ' as const,
    number: ''
  }
};

describe('ReferralForm', () => {
  it('should render', () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    expect(screen.getByText('Referral product(s)')).toBeInTheDocument();
    expect(screen.getByText('Motorbike')).toBeInTheDocument();
    expect(screen.getByText('Motorhome')).toBeInTheDocument();
    expect(screen.getByText('Caravan')).toBeInTheDocument();
    expect(screen.getByText('Trailer')).toBeInTheDocument();
    expect(screen.getByText('Contract works')).toBeInTheDocument();

    expect(screen.getByText('Preferred contact method')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Submit referral')).toBeInTheDocument();
  });

  it('should render preferred email section', async () => {
    renderComponent(
      <ReferralForm
        defaultValues={{
          ...defaultVlaues,
          email: 'test@example.com'
        }}
        onSubmit={() => {}}
      />
    );

    screen.getByLabelText('By email').click();

    expect(await screen.findByText('Preferred email address')).toBeInTheDocument();
  });

  it('should render preferred phone section', async () => {
    renderComponent(
      <ReferralForm
        defaultValues={{
          ...defaultVlaues,
          phone: {
            code: 'NZ',
            number: '0211111111'
          }
        }}
        onSubmit={() => {}}
      />
    );

    screen.getByLabelText('By phone').click();

    expect(await screen.findByText('Preferred number to call')).toBeInTheDocument();
    expect(await screen.findByText('Best time to call')).toBeInTheDocument();

    expect(await screen.findByText('Morning (8am - 12pm)')).toBeInTheDocument();
    expect(await screen.findByText('Afternoon (12pm - 5pm)')).toBeInTheDocument();
  });

  it('should have submit disabled initially', () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    expect(screen.getByRole('button', { name: /submit referral/i })).toBeDisabled();
  });

  it('should show products error once touched and none selected', async () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    screen.getByLabelText(/Motorbike/i).click();
    screen.getByLabelText(/Motorbike/i).click();

    expect(await screen.findByText('Please select a product')).toBeInTheDocument();
  });

  it('should show contact method error once touched and none selected', async () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    screen.getByLabelText('By email').focus();
    screen.getByLabelText('By email').blur();

    expect(await screen.findByText('Please select your preferred contact method')).toBeInTheDocument();
  });

  it('should validate email: required', async () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    // make form require email branch
    screen.getByLabelText(/Motorbike/i).click();
    screen.getByLabelText('By email').click();

    // Touch email field but leave empty
    const input = screen.getByLabelText('Preferred email address');
    input.focus();
    input.blur(); // onTouched needs blur

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit referral/i })).toBeDisabled();
  });

  it('should validate email: invalid format', async () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    screen.getByLabelText(/Motorbike/i).click();
    screen.getByLabelText('By email').click();

    const input = screen.getByLabelText('Preferred email address');
    userEvent.type(input, 'not-an-email');
    input.blur();

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit referral/i })).toBeDisabled();
  });

  it('should clear email errors when corrected', async () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    screen.getByLabelText(/Motorbike/i).click();
    screen.getByLabelText('By email').click();

    const input = screen.getByLabelText('Preferred email address');

    userEvent.type(input, 'not-an-email');
    input.blur();
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();

    userEvent.clear(input);
    userEvent.type(input, 'test@test.com');
    input.blur();

    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  it('should submit form if valid (number path)', async () => {
    const handleSubmit = jest.fn();

    renderComponent(<ReferralForm onSubmit={handleSubmit} />);

    screen.getByLabelText(/Motorbike/i).click();
    screen.getByLabelText('By phone').click();

    screen.debug(undefined, Infinity);
    const labelText = screen.getByText('Preferred number to call');
    const wrappingLabel = labelText.closest('label')!;
    const tel = wrappingLabel.querySelector('input[type="tel"]') as HTMLInputElement;

    // NOTE: Use fireEvent.input for this PhoneInput.
    // In our test env (old @testing-library/user-event + JSDOM), userEvent.type/clear relies on
    // Selection APIs (e.g. getSelection().removeAllRanges). Those are partially implemented here,
    // so typing can silently fail or not trigger the correct event chain and we never reach validation
    // the "invalid phone number" branch. fireEvent.input deterministically updates the value and
    // triggers React/RHF change handling.
    fireEvent.input(tel, { target: { value: '211111111' } });

    const morning = await screen.findByText('Morning (8am - 12pm)');
    morning.click();

    // button should become enabled once valid
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit referral/i })).not.toBeDisabled();
    });

    screen.getByRole('button', { name: /submit referral/i }).click();

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.products).toEqual(['motorbike']);
    expect(submitted.contactMethod).toBe('phone');
    expect(submitted.phone).toEqual({ code: 'NZ', number: '211111111' });
    expect(submitted.contactTimes).toEqual(['morning']);
  });

  it('should submit form if valid (email path)', async () => {
    const handleSubmit = jest.fn();

    renderComponent(<ReferralForm onSubmit={handleSubmit} />);

    screen.getByLabelText(/Motorbike/i).click();
    screen.getByLabelText('By email').click();

    const input = screen.getByLabelText('Preferred email address');
    userEvent.type(input, 'test@test.com');
    input.blur();

    // button should become enabled once valid
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit referral/i })).not.toBeDisabled();
    });

    screen.getByRole('button', { name: /submit referral/i }).click();

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.products).toEqual(['motorbike']);
    expect(submitted.contactMethod).toBe('email');
    expect(submitted.email).toBe('test@test.com');
  });

  it('should validate phone path: call time required', async () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    screen.getByLabelText(/Motorbike/i).click();
    screen.getByLabelText('By phone').click();

    const morning = await screen.findByText('Morning (8am - 12pm)');
    morning.click();
    morning.click();

    expect(await screen.findByText('Please select a time to call')).toBeInTheDocument();
  });

  it('should validate phone path: phone required', async () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    screen.getByLabelText(/motorbike/i).click();
    screen.getByLabelText('By phone').click();

    const labelText = await screen.findByText('Preferred number to call');

    const wrappingLabel = labelText.closest('label');
    expect(wrappingLabel).not.toBeNull();

    const telInput = wrappingLabel!.querySelector('input[type="tel"]') as HTMLInputElement | null;
    expect(telInput).not.toBeNull();

    telInput!.focus();
    telInput!.blur();

    expect(await screen.findByText('Phone number is required')).toBeInTheDocument();
  });

  it('should validate phone path: invalid phone number', async () => {
    renderComponent(<ReferralForm onSubmit={() => {}} />);

    screen.getByLabelText(/motorbike/i).click();
    screen.getByLabelText('By phone').click();

    await screen.findByText('Preferred number to call');

    const labelText = screen.getByText('Preferred number to call');
    const wrappingLabel = labelText.closest('label')!;
    const tel = wrappingLabel.querySelector('input[type="tel"]') as HTMLInputElement;

    // touched
    tel.focus();
    tel.blur();

    // NOTE: Use fireEvent.input for this PhoneInput.
    // In our test env (old @testing-library/user-event + JSDOM), userEvent.type/clear relies on
    // Selection APIs (e.g. getSelection().removeAllRanges). Those are partially implemented here,
    // so typing can silently fail or not trigger the correct event chain and we never reach validation
    // the "invalid phone number" branch. fireEvent.input deterministically updates the value and
    // triggers React/RHF change handling.
    fireEvent.input(tel, { target: { value: '123' } });
    fireEvent.blur(tel);

    expect(tel.value).toBe('123');

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number'));
    });
  });

  it('should not submit form if invalid', async () => {
    const handleSubmit = jest.fn();

    renderComponent(<ReferralForm onSubmit={handleSubmit} />);

    screen.getByRole('button', { name: /submit referral/i }).click();

    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });
});
