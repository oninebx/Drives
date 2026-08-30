import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DocumentUpload, DocumentUploadComponent } from './DocumentUpload';

import { useAppDispatch, useAppSelector } from '~/root/store';
import {
  areClaimStagedFiles,
  getClaimFileList,
  getClaimNumber,
  getClaimStagedFileList
} from '~/feature/claim/shared/state/selectors';
import { thunks } from '~/feature/claim/shared/state';
import { getDefaultRequestOptions } from '~/common/state/services';
import { logApiError } from '~/common/utilities';
import { useDocumentUploadViewModel } from './useDocumentUploadViewModel';

import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone';

/* -------------------------------------------------------------------------- */
/* Mocks                                                                      */
/* -------------------------------------------------------------------------- */

jest.mock('~/root/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn()
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn()
}));

jest.mock('./useDocumentUploadViewModel', () => ({
  useDocumentUploadViewModel: jest.fn()
}));

jest.mock('~/feature/claim/shared/state/selectors', () => ({
  areClaimStagedFiles: jest.fn(),
  getClaimFileList: jest.fn(),
  getClaimNumber: jest.fn(),
  getClaimStagedFileList: jest.fn()
}));

jest.mock('~/feature/claim/shared/state', () => ({
  thunks: {
    getUploadedDocumentList: jest.fn(),
    addAcceptedClaimDocuments: jest.fn(),
    addRejectedClaimDocuments: jest.fn(),
    deleteClaimDocument: jest.fn()
  }
}));

jest.mock('~/common/state/services', () => ({
  getDefaultRequestOptions: jest.fn()
}));

jest.mock('~/common/utilities', () => ({
  logApiError: jest.fn()
}));

/*
 * Keep the Toast mock intentionally small.
 *
 * This is important because the component calls:
 *
 *   Toast.Provider
 *   useToast()
 *
 * We therefore mock both from the same module.
 */
jest.mock('@tower/tui', () => {
  const React = require('react');

  return {
    Button: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <button {...props}>{children}</button>,

    Card: {
      Container: ({
        children
      }: {
        children: React.ReactNode;
      }) => <div data-testid="card-container">{children}</div>,

      Content: ({
        children
      }: {
        children: React.ReactNode;
      }) => <div>{children}</div>
    },

    Typography: ({
      children
    }: {
      children: React.ReactNode;
    }) => <span>{children}</span>,

    Toast: {
      Provider: ({
        children
      }: {
        children: React.ReactNode;
      }) => <div data-testid="toast-provider">{children}</div>
    },

    useToast: jest.fn()
  };
});

/*
 * The styles are presentation-only for this test.
 *
 * We don't want styled-components implementation details to affect
 * the composite component tests.
 */
jest.mock('./DocumentUpload.styles', () => {
  const React = require('react');

  const createWrapper =
    (testId?: string) =>
    ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <div data-testid={testId} {...props}>
        {children}
      </div>
    );

  return {
    StyledToast: createWrapper('styled-toast'),
    StyledToastDescription: createWrapper('styled-toast-description'),
    StyledToastViewport: createWrapper('styled-toast-viewport'),

    DropzoneOuterWrapper: createWrapper('dropzone-outer-wrapper'),
    DropzoneWrapper: createWrapper('dropzone-wrapper'),
    DropzoneHelperContainer: createWrapper('dropzone-helper'),

    DragAndDropText: createWrapper(),

    FileListWrapper: createWrapper('file-list-wrapper'),
    StyledFileItemCardContainer: createWrapper('file-item'),
    FileItem: createWrapper(),
    FileProgress: createWrapper(),
    IconTitleContainer: createWrapper(),
    StatusIconContainer: createWrapper(),
    StagedFileName: createWrapper(),
    StyledLinearProgress: ({
      value,
      id,
      ...props
    }: {
      value?: number;
      id?: string;
      [key: string]: unknown;
    }) => (
      <div
        data-testid="progress"
        data-value={value}
        id={id}
        {...props}
      />
    ),
    FileDescription: createWrapper(),
    RemoveContainer: createWrapper(),

    UploadContainer: createWrapper(),
    UploadCheckTitleContainer: createWrapper()
  };
});

/*
 * This is deliberately a small Dropzone mock.
 *
 * We don't test react-dropzone itself here.
 *
 * getRootProps/getInputProps preserve the generic signature expected
 * by the real Dropzone render-prop API.
 */
jest.mock('react-dropzone', () => {
  const React = require('react');

  const getRootProps = jest.fn(
    <T extends DropzoneRootProps>(props?: T): T =>
      ({ ...(props ?? {}) } as T)
  );

  const getInputProps = jest.fn(
    <T extends DropzoneInputProps>(props?: T): T =>
      ({
        type: 'file',
        ...(props ?? {})
      } as T)
  );

  const Dropzone = ({
    children,
    onDropAccepted,
    onDropRejected
  }: {
    children: (args: {
      getRootProps: typeof getRootProps;
      getInputProps: typeof getInputProps;
      open: jest.Mock;
      isDragActive: boolean;
    }) => React.ReactNode;
    onDropAccepted: (files: File[]) => void;
    onDropRejected: (files: unknown[]) => void;
  }) => (
    <div
      data-testid="dropzone"
      data-on-drop-accepted={!!onDropAccepted}
      data-on-drop-rejected={!!onDropRejected}>
      {children({
        getRootProps,
        getInputProps,
        open: mockOpen,
        isDragActive: mockIsDragActive
      })}
    </div>
  );

  return {
    __esModule: true,
    default: Dropzone
  };
});

/* -------------------------------------------------------------------------- */
/* Typed mocks                                                                */
/* -------------------------------------------------------------------------- */

const mockDispatch = jest.fn();
const mockShowToast = jest.fn();
const mockOpen = jest.fn();

let mockIsDragActive = false;

const mockSendRequest = jest.fn();
const mockGetMappedFileStatus = jest.fn();
const mockGetFileProgressValue = jest.fn();
const mockGetFileStatusDescription = jest.fn();
const mockInvalidCharacterValidator = jest.fn();

const mockedUseAppDispatch = jest.mocked(useAppDispatch);
const mockedUseAppSelector = jest.mocked(useAppSelector);
const mockedUseDocumentUploadViewModel =
  jest.mocked(useDocumentUploadViewModel);

const mockedUseTranslation =
  jest.mocked(require('react-i18next').useTranslation);

const mockedUseToast =
  jest.mocked(require('@tower/tui').useToast);

const mockedGetDefaultRequestOptions =
  jest.mocked(getDefaultRequestOptions);

const mockedLogApiError =
  jest.mocked(logApiError);

const mockedThunks = jest.mocked(thunks);

/* -------------------------------------------------------------------------- */
/* Test data                                                                  */
/* -------------------------------------------------------------------------- */

const claimNumber = 'CLM-123';

const stagedFile = {
  name: 'test.pdf',
  clientStatus: 'staged'
} as any;

const failedFile = {
  name: 'failed.pdf',
  clientStatus: 'failed'
} as any;

const completedFile = {
  name: 'completed.pdf',
  clientStatus: 'uploaded'
} as any;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const setupSelectors = ({
  fileList = {},
  stagedFiles = [],
  areStagedFiles = false
}: {
  fileList?: Record<string, unknown>;
  stagedFiles?: unknown[];
  areStagedFiles?: boolean;
} = {}) => {
  mockedUseAppSelector.mockImplementation((selector) => {
    if (selector === getClaimFileList) {
      return fileList;
    }

    if (selector === getClaimStagedFileList) {
      return stagedFiles;
    }

    if (selector === areClaimStagedFiles) {
      return areStagedFiles;
    }

    if (selector === getClaimNumber) {
      return claimNumber;
    }

    return undefined;
  });
};

const setupViewModel = () => {
  mockedUseDocumentUploadViewModel.mockReturnValue({
    maxFileSize: 10 * 1024 * 1024,
    allowableFileExtensions: {
      'application/pdf': ['.pdf']
    },
    getMappedFileStatus: mockGetMappedFileStatus,
    getFileProgressValue: mockGetFileProgressValue,
    getFileStatusDescription: mockGetFileStatusDescription,
    invalidCharacterValidator: mockInvalidCharacterValidator,
    sendRequest: mockSendRequest
  });
};

const renderComponent = () =>
  render(<DocumentUploadComponent />);

/* -------------------------------------------------------------------------- */
/* Setup                                                                      */
/* -------------------------------------------------------------------------- */

beforeEach(() => {
  jest.clearAllMocks();

  mockIsDragActive = false;

  mockedUseAppDispatch.mockReturnValue(mockDispatch);

  mockedUseTranslation.mockReturnValue({
    t: ((key: string) => {
      if (key === 'claim:config.enableDocumentUploadToast') {
        return false;
      }

      if (key === 'claim:documentUpload.check.title') {
        return 'Check your documents';
      }

      if (key === 'claim:documentUpload.check.description') {
        return 'Please check your documents before uploading';
      }

      return key;
    }) as any
  });

  mockedUseToast.mockReturnValue({
    id: 'toast-1',
    showToast: mockShowToast
  });

  mockedGetDefaultRequestOptions.mockReturnValue({
    headers: {}
  } as any);

  mockedGetMappedFileStatus.mockReturnValue('success');
  mockGetFileProgressValue.mockReturnValue(50);
  mockGetFileStatusDescription.mockReturnValue('Uploaded');

  setupSelectors();
  setupViewModel();
});

/* -------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* -------------------------------------------------------------------------- */

describe('DocumentUploadComponent', () => {
  it('renders the browse files UI when there is no active drag', () => {
    renderComponent();

    expect(
      screen.getByRole('button', { name: /browse files/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/drag and drop files, or/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/maximum size per file: 10mb/i)
    ).toBeInTheDocument();
  });

  it('renders the drop state when a file is being dragged over the dropzone', () => {
    mockIsDragActive = true;

    renderComponent();

    expect(
      screen.getByText(/drop files here/i)
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: /browse files/i })
    ).not.toBeInTheDocument();
  });

  it('renders the drop input', () => {
    renderComponent();

    expect(
      screen.getByTestId('drop-input')
    ).toHaveAttribute('type', 'file');
  });
});

/* -------------------------------------------------------------------------- */
/* File acceptance / rejection                                                */
/* -------------------------------------------------------------------------- */

describe('file drop behaviour', () => {
  it('dispatches addAcceptedClaimDocuments when files are accepted', () => {
    const acceptedFiles = [
      new File(['content'], 'document.pdf', {
        type: 'application/pdf'
      })
    ];

    const action = { type: 'ADD_ACCEPTED' };

    mockedThunks.addAcceptedClaimDocuments.mockReturnValue(action as any);

    renderComponent();

    /*
     * The Dropzone mock does not automatically invoke callbacks.
     * This is intentional: the test only needs to verify how the
     * component reacts to Dropzone events.
     */
    const dropzoneProps = jest.mocked(
      require('react-dropzone').default
    );

    const onDropAccepted =
      dropzoneProps.mock.calls[0][0].onDropAccepted;

    onDropAccepted(acceptedFiles);

    expect(
      thunks.addAcceptedClaimDocuments
    ).toHaveBeenCalledWith(
      acceptedFiles,
      {}
    );

    expect(mockDispatch).toHaveBeenCalledWith(action);
  });

  it('dispatches addRejectedClaimDocuments when files are rejected', () => {
    const rejectedFiles = [
      {
        file: new File(['content'], 'document.exe'),
        errors: [{ code: 'file-invalid-type' }]
      }
    ];

    const action = { type: 'ADD_REJECTED' };

    mockedThunks.addRejectedClaimDocuments.mockReturnValue(action as any);

    renderComponent();

    const dropzoneProps = jest.mocked(
      require('react-dropzone').default
    );

    const onDropRejected =
      dropzoneProps.mock.calls[0][0].onDropRejected;

    onDropRejected(rejectedFiles);

    expect(
      thunks.addRejectedClaimDocuments
    ).toHaveBeenCalledWith(
      rejectedFiles,
      {}
    );

    expect(mockDispatch).toHaveBeenCalledWith(action);
  });
});

/* -------------------------------------------------------------------------- */
/* File list                                                                  */
/* -------------------------------------------------------------------------- */

describe('file list behaviour', () => {
  it('renders files from the file list', () => {
    setupSelectors({
      fileList: {
        'test.pdf': stagedFile
      }
    });

    renderComponent();

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('renders progress for an incomplete file', () => {
    mockedUseDocumentUploadViewModel.mockReturnValue({
      maxFileSize: 10 * 1024 * 1024,
      allowableFileExtensions: {
        'application/pdf': ['.pdf']
      },
      getMappedFileStatus: mockGetMappedFileStatus,
      getFileProgressValue: mockGetFileProgressValue,
      getFileStatusDescription: mockGetFileStatusDescription,
      invalidCharacterValidator: mockInvalidCharacterValidator,
      sendRequest: mockSendRequest
    });

    mockGetMappedFileStatus.mockReturnValue('scanning');
    mockGetFileProgressValue.mockReturnValue(60);

    setupSelectors({
      fileList: {
        'test.pdf': stagedFile
      }
    });

    renderComponent();

    expect(screen.getByTestId('progress')).toHaveAttribute(
      'data-value',
      '60'
    );

    expect(
      screen.getByText('Uploaded')
    ).toBeInTheDocument();
  });

  it('does not render progress for a completed file', () => {
    mockGetMappedFileStatus.mockReturnValue('success');

    setupSelectors({
      fileList: {
        'completed.pdf': completedFile
      }
    });

    renderComponent();

    expect(
      screen.queryByTestId('progress')
    ).not.toBeInTheDocument();
  });

  it('renders the Remove button for a staged file', () => {
    setupSelectors({
      fileList: {
        'test.pdf': stagedFile
      }
    });

    renderComponent();

    expect(
      screen.getByRole('button', { name: /remove/i })
    ).toBeInTheDocument();
  });

  it('renders the Remove button for a failed file', () => {
    setupSelectors({
      fileList: {
        'failed.pdf': failedFile
      }
    });

    renderComponent();

    expect(
      screen.getByRole('button', { name: /remove/i })
    ).toBeInTheDocument();
  });

  it('does not render the Remove button for a completed file', () => {
    setupSelectors({
      fileList: {
        'completed.pdf': completedFile
      }
    });

    renderComponent();

    expect(
      screen.queryByRole('button', { name: /remove/i })
    ).not.toBeInTheDocument();
  });

  it('dispatches deleteClaimDocument when Remove is clicked', () => {
    const action = { type: 'DELETE_DOCUMENT' };

    mockedThunks.deleteClaimDocument.mockReturnValue(action as any);

    setupSelectors({
      fileList: {
        'test.pdf': stagedFile
      }
    });

    renderComponent();

    fireEvent.click(
      screen.getByRole('button', { name: /remove/i })
    );

    expect(
      thunks.deleteClaimDocument
    ).toHaveBeenCalledWith('test.pdf');

    expect(mockDispatch).toHaveBeenCalledWith(action);
  });
});

/* -------------------------------------------------------------------------- */
/* Upload section                                                             */
/* -------------------------------------------------------------------------- */

describe('upload behaviour', () => {
  it('shows the document check message when there are staged files', () => {
    setupSelectors({
      areStagedFiles: true,
      stagedFiles: [stagedFile]
    });

    renderComponent();

    expect(
      screen.getByText('Check your documents')
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Please check your documents before uploading'
      )
    ).toBeInTheDocument();
  });

  it('does not show the document check message when there are no staged files', () => {
    setupSelectors({
      areStagedFiles: false,
      stagedFiles: []
    });

    renderComponent();

    expect(
      screen.queryByText('Check your documents')
    ).not.toBeInTheDocument();
  });

  it('disables Upload files when there are no staged files', () => {
    setupSelectors({
      areStagedFiles: false,
      stagedFiles: []
    });

    renderComponent();

    expect(
      screen.getByRole('button', { name: /upload files/i })
    ).toBeDisabled();
  });

  it('enables Upload files when there are staged files', () => {
    setupSelectors({
      areStagedFiles: true,
      stagedFiles: [stagedFile]
    });

    renderComponent();

    expect(
      screen.getByRole('button', { name: /upload files/i })
    ).toBeEnabled();
  });

  it('uploads all staged files', async () => {
    const file1 = {
      name: 'first.pdf',
      clientStatus: 'staged'
    } as any;

    const file2 = {
      name: 'second.pdf',
      clientStatus: 'staged'
    } as any;

    setupSelectors({
      areStagedFiles: true,
      stagedFiles: [file1, file2]
    });

    mockSendRequest.mockResolvedValue(undefined);

    renderComponent();

    fireEvent.click(
      screen.getByRole('button', { name: /upload files/i })
    );

    expect(mockSendRequest).toHaveBeenCalledTimes(2);
    expect(mockSendRequest).toHaveBeenNthCalledWith(1, file1);
    expect(mockSendRequest).toHaveBeenNthCalledWith(2, file2);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /upload files/i })
      ).toBeEnabled();
    });
  });

  it('shows the toast after all staged files are uploaded successfully when toast is enabled', async () => {
    mockedUseTranslation.mockReturnValue({
      t: ((key: string) => {
        if (key === 'claim:config.enableDocumentUploadToast') {
          return true;
        }

        if (key === 'claim:documentUpload.check.title') {
          return 'Check your documents';
        }

        if (key === 'claim:documentUpload.check.description') {
          return 'Please check your documents before uploading';
        }

        return key;
      }) as any
    });

    setupSelectors({
      areStagedFiles: true,
      stagedFiles: [stagedFile]
    });

    mockSendRequest.mockResolvedValue(undefined);

    renderComponent();

    fireEvent.click(
      screen.getByRole('button', { name: /upload files/i })
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledTimes(1);
    });
  });

  it('does not show the toast when toast is disabled', async () => {
    setupSelectors({
      areStagedFiles: true,
      stagedFiles: [stagedFile]
    });

    mockSendRequest.mockResolvedValue(undefined);

    renderComponent();

    fireEvent.click(
      screen.getByRole('button', { name: /upload files/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /upload files/i })
      ).toBeEnabled();
    });

    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('disables Upload files while uploading', async () => {
    setupSelectors({
      areStagedFiles: true,
      stagedFiles: [stagedFile]
    });

    let resolveUpload!: () => void;

    mockSendRequest.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpload = resolve;
        })
    );

    renderComponent();

    const uploadButton = screen.getByRole('button', {
      name: /upload files/i
    });

    fireEvent.click(uploadButton);

    expect(uploadButton).toBeDisabled();

    resolveUpload();

    await waitFor(() => {
      expect(uploadButton).toBeEnabled();
    });
  });

  it('logs the API error when upload fails', async () => {
    const error = new Error('Upload failed');

    setupSelectors({
      areStagedFiles: true,
      stagedFiles: [stagedFile]
    });

    mockSendRequest.mockRejectedValue(error);

    renderComponent();

    fireEvent.click(
      screen.getByRole('button', { name: /upload files/i })
    );

    await waitFor(() => {
      expect(mockedLogApiError).toHaveBeenCalledWith(
        error,
        'ui-api-upload-staged-files',
        {
          headers: {}
        }
      );
    });
  });

  it('re-enables Upload files after upload failure', async () => {
    setupSelectors({
      areStagedFiles: true,
      stagedFiles: [stagedFile]
    });

    mockSendRequest.mockRejectedValue(
      new Error('Upload failed')
    );

    renderComponent();

    const uploadButton = screen.getByRole('button', {
      name: /upload files/i
    });

    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(uploadButton).toBeEnabled();
    });
  });
});

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */

describe('toast', () => {
  it('renders the toast when toast feature is enabled', () => {
    mockedUseTranslation.mockReturnValue({
      t: ((key: string) => {
        if (key === 'claim:config.enableDocumentUploadToast') {
          return true;
        }

        return key;
      }) as any
    });

    renderComponent();

    expect(
      screen.getByTestId('styled-toast')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Thanks for your documents')
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('styled-toast-viewport')
    ).toBeInTheDocument();
  });

  it('does not render the toast when toast feature is disabled', () => {
    renderComponent();

    expect(
      screen.queryByTestId('styled-toast')
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('styled-toast-viewport')
    ).not.toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/* Loader                                                                     */
/* -------------------------------------------------------------------------- */

describe('DocumentUploadLoader', () => {
  it('loads uploaded documents on mount', () => {
    const action = {
      type: 'GET_UPLOADED_DOCUMENT_LIST'
    };

    mockedThunks.getUploadedDocumentList.mockReturnValue(
      action as any
    );

    setupSelectors({
      fileList: {
        'existing.pdf': completedFile
      }
    });

    render(<DocumentUpload />);

    expect(
      thunks.getUploadedDocumentList
    ).toHaveBeenCalledWith(
      claimNumber,
      {
        'existing.pdf': completedFile
      }
    );

    expect(mockDispatch).toHaveBeenCalledWith(action);
  });
});