import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import MembershipValidation from './MembershipValidation';
import { renderComponent } from '~/common/test-utilities/renderComponent';

const mockUseValidateMembership = jest.fn();
const mockUseAppSelector = jest.fn();

jest.mock('~/root/store', () => ({
  __esModule: true,
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector)
}));

jest.mock('./useValidateMembership', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseValidateMembership(...args)
}));

type Props = React.ComponentProps<typeof MembershipValidation>;
const copy = {
  title: 'Membership Validation',
  helperText: 'Enter your membership number to verify.',
  label: 'Membership number'
}
const agencyCode = 'westpac_main';
const mockT = jest.fn((key: string) => `translated:${key}`);
const mockOnValidate = jest.fn();

const render = (overrideProps: Partial<Props> = {}) => {
  const props = {
    copy: copy,
    agencyCode: agencyCode,
    onValidate: mockOnValidate,
    t: mockT,
    ...overrideProps
  };

  const utils = renderComponent(<MembershipValidation {...props} />);
  const input = screen.getByRole("textbox") as HTMLInputElement;
  const button = screen.getByRole("button", { name: /Verify|Verified/ });

  return { ...utils, props, input, button };
};

describe('MembershipValidation', () => {

  let hookState: {
    data?: { valid?: boolean } | undefined;
    loading: boolean;
    refetch: jest.Mock<Promise<unknown>, [string, string]>;
  };


  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAppSelector.mockReturnValue({
      membershipId: {
        value: ''
      }
    });

    hookState = {
      data: undefined,
      loading: false,
      refetch: jest.fn().mockResolvedValue({})
    };

    mockUseValidateMembership.mockImplementation(() => hookState);
  });

  it('renders title, label, helper text, and disabled Verify button initially', () => {
    render();

    expect(screen.getByText('Membership Validation')).toBeInTheDocument();
    expect(screen.getByLabelText('Membership number')).toBeInTheDocument();
    expect(screen.getByText('Enter your membership number to verify.')).toBeInTheDocument;

    const verifyButton = screen.getByRole('button', { name: 'Verify' });
    expect(verifyButton).toBeDisabled();
  });

  it('enables Verify button only when trimmed input has content', () => {
    render();

    const input = screen.getByLabelText('Membership number');
    const verifyButton = screen.getByRole('button', { name: 'Verify' });

    fireEvent.change(input, { target: { value: '   ' } });
    expect(verifyButton).toBeDisabled();

    fireEvent.change(input, { target: { value: ' 12345 ' } });
    expect(verifyButton).toBeEnabled();
  });

  it('calls refetch on validate and shows verified state when membership is valid', async () => {
    render();

    const button = screen.getByRole('button', { name: 'Verify' });

    const input = screen.getByLabelText('Membership number');
    fireEvent.change(input, { target: { value: ' 12345 ' } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(hookState.refetch).toHaveBeenCalledWith(agencyCode, '12345');
    });

    hookState.data = { valid: true };

    // const {button} = renderComponent(
    //   <MembershipValidation
    //     copy={copy}
    //     agencyCode={agencyCode}
    //     onValidate={mockOnValidate}
    //     t={mockT}
    //   />
    // );

    await waitFor(() => {
      expect(button).toHaveTextContent('Verified');
      expect(button).toBeDisabled();
      // expect(screen.getByTestId('supporting-text')).toHaveTextContent('');
      // expect(screen.getByTestId('input-enabled')).toHaveTextContent('false');
      // expect(screen.getByTestId('icon-present')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('welcome-back')).toHaveTextContent(
      'translated:quote:membershipValidation.welcomeBackTitle | translated:quote:membershipValidation.welcomeBackDescription'
    );
  });

  it('hides helper text after verify and shows it again when value changes (invalid flow)', async () => {
    hookState.data = { valid: false };
    renderSubject();

    const input = screen.getByLabelText('Membership number');

    fireEvent.change(input, { target: { value: '111' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(hookState.refetch).toHaveBeenCalledWith(agencyCode, '111');
    });

    // unchanged since last verify => helper hidden, button disabled
    expect(screen.getByTestId('supporting-text')).toHaveTextContent('');
    expect(screen.getByRole('button', { name: 'Verify' })).toBeDisabled();

    // changed value => helper returns, button enabled
    fireEvent.change(input, { target: { value: '222' } });

    expect(screen.getByTestId('supporting-text')).toHaveTextContent(
      'Enter your membership number to verify.'
    );
    expect(screen.getByRole('button', { name: 'Verify' })).toBeEnabled();
  });

  it('keeps Verify button disabled while loading', () => {
    hookState.loading = true;
    renderSubject();

    const input = screen.getByLabelText('Membership number');
    fireEvent.change(input, { target: { value: '12345' } });

    expect(screen.getByRole('button', { name: 'Verify' })).toBeDisabled();
  });

  it('does not render welcome back when membership is not valid', () => {
    hookState.data = { valid: false };
    renderSubject();

    expect(screen.queryByTestId('welcome-back')).not.toBeInTheDocument();
  });
});