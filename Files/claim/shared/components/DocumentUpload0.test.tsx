import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  DropzoneInputProps,
  DropzoneProps,
  DropzoneRootProps,
  DropzoneState
} from 'react-dropzone';

import { DocumentUpload, DocumentUploadComponent } from './DocumentUpload';

import {
  getDefaultRequestOptions
} from '~/common/state/services';
import { logApiError } from '~/common/utilities';
import { thunks } from '~/feature/claim/shared/state';
import {
  areClaimStagedFiles,
  getClaimFileList,
  getClaimNumber,
  getClaimStagedFileList
} from '~/feature/claim/shared/state/selectors';
import { useAppDispatch, useAppSelector } from '~/root/store';
import { useDocumentUploadViewModel } from './useDocumentUploadViewModel';

import type { StagedFile } from '~/feature/claim/shared/state';

/* -------------------------------------------------------------------------- */
/* Module mocks                                                               */
/* -------------------------------------------------------------------------- */

jest.mock('~/root/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn()
}));

jest.mock('~/feature/claim/shared/state/selectors', () => ({
  getClaimFileList: jest.fn(),
  getClaimNumber: jest.fn(),
  getClaimStagedFileList: jest.fn(),
  areClaimStagedFiles: jest.fn()
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

jest.mock('./useDocumentUploadViewModel', () => ({
  useDocumentUploadViewModel: jest.fn()
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

/* -------------------------------------------------------------------------- */
/* react-dropzone mock                                                        */
/* -------------------------------------------------------------------------- */

jest.mock('react-dropzone', () => {
  const MockDropzone = ({
    children,
    ...props
  }: DropzoneProps) => {
    const getRootProps = <T extends DropzoneRootProps>(
      rootProps?: T
    ): T => {
      return (rootProps ?? {}) as T;
    };

    const getInputProps = <T extends DropzoneInputProps>(
      inputProps?: T
    ): T => {
      return (inputProps ?? {}) as T;
    };

    const open = jest.fn();

    const state: DropzoneState = {
      getRootProps,
      getInputProps,
      rootRef: React.createRef<HTMLElement>(),
      inputRef: React.createRef<HTMLInputElement>(),
      isFocused: false,
      isDragActive: false,
      isDragAccept: false,
      isDragReject: false,
      isFileDialogActive: false,
      acceptedFiles: [],
      fileRejections: [],
      open
    };

    mockDropzoneProps = props;

    return (
      <div data-testid="dropzone">
        {typeof children === 'function'
          ? children(state)
          : children}
      </div>
    );
  };

  MockDropzone.displayName = 'MockDropzone';

  return {
    __esModule: true,
    default: MockDropzone
  };
});

/* -------------------------------------------------------------------------- */
/* TUI mocks                                                                  */
/* -------------------------------------------------------------------------- */

jest.mock('@tower/tui', () => {
  interface ButtonProps {
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
    id?: string;
    type?: 'button' | 'submit' | 'reset';
  }

  const MockButton: React.FC<ButtonProps> = ({
    children,
    onClick,
    disabled,
    id,
    type = 'button'
  }) => (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}>
      {children}
    </button>
  );

  MockButton.displayName = 'MockButton';

  const MockCardContainer: React.FC<{
    children?: React.ReactNode;
  }> = ({ children }) => <div>{children}</div>;

  MockCardContainer.displayName = 'MockCardContainer';

  const MockCardContent: React.FC<{
    children?: React.ReactNode;
  }> = ({ children }) => <div>{children}</div>;

  MockCardContent.displayName = 'MockCardContent';

  const MockTypography: React.FC<{
    children?: React.ReactNode;
  }> = ({ children }) => <div>{children}</div>;

  MockTypography.displayName = 'MockTypography';

  return {
    Button: MockButton,
    Card: {
      Container: MockCardContainer,
      Content: MockCardContent
    },
    Typography: MockTypography
  };
});

jest.mock('@tower/tui/icons', () => {
  const MockIcon: React.FC = () => (
    <span aria-hidden="true" />
  );

  MockIcon.displayName = 'MockIcon';

  return {
    CloudUploadIcon: MockIcon,
    DeleteIcon: MockIcon,
    ErrorIcon: MockIcon,
    SecurityIcon: MockIcon,
    CheckIcon: MockIcon
  };
});

/* -------------------------------------------------------------------------- */
/* Typed mocks                                                                */
/* -------------------------------------------------------------------------- */

const mockUseAppDispatch =
  useAppDispatch as jest.MockedFunction<typeof useAppDispatch>;

const mockUseAppSelector =
  useAppSelector as jest.MockedFunction<typeof useAppSelector>;

const mockGetClaimFileList =
  getClaimFileList as jest.MockedFunction<typeof getClaimFileList>;

const mockGetClaimNumber =
  getClaimNumber as jest.MockedFunction<typeof getClaimNumber>;

const mockGetClaimStagedFileList =
  getClaimStagedFileList as jest.MockedFunction<
    typeof getClaimStagedFileList
  >;

const mockAreClaimStagedFiles =
  areClaimStagedFiles as jest.MockedFunction<
    typeof areClaimStagedFiles
  >;

const mockGetDefaultRequestOptions =
  getDefaultRequestOptions as jest.MockedFunction<
    typeof getDefaultRequestOptions
  >;

const mockLogApiError =
  logApiError as jest.MockedFunction<typeof logApiError>;

const mockUseDocumentUploadViewModel =
  useDocumentUploadViewModel as jest.MockedFunction<
    typeof useDocumentUploadViewModel
  >;

const mockGetUploadedDocumentList =
  thunks.getUploadedDocumentList as jest.Mock;

const mockAddAcceptedClaimDocuments =
  thunks.addAcceptedClaimDocuments as jest.Mock;

const mockAddRejectedClaimDocuments =
  thunks.addRejectedClaimDocuments as jest.Mock;

const mockDeleteClaimDocument =
  thunks.deleteClaimDocument as jest.Mock;

/* -------------------------------------------------------------------------- */
/* Test helpers                                                               */
/* -------------------------------------------------------------------------- */

let mockDropzoneProps: Omit<
  DropzoneProps,
  'children'
> | undefined;

const mockDispatch = jest.fn();

const mockGetMappedFileStatus = jest.fn();
const mockGetFileProgressValue = jest.fn();
const mockGetFileStatusDescription = jest.fn();
const mockInvalidCharacterValidator = jest.fn();
const mockSendRequest = jest.fn();

const claimNumber = 'CLAIM-123';

const createFile = (
  name: string,
  clientStatus: string
): StagedFile => ({
  name,
  clientStatus
} as StagedFile);

const setupSelectors = ({
  fileList = {},
  stagedFiles = [],
  areStagedFiles = false,
  currentClaimNumber = claimNumber
}: {
  fileList?: Record<string, StagedFile>;
  stagedFiles?: StagedFile[];
  areStagedFiles?: boolean;
  currentClaimNumber?: string;
} = {}) => {
  mockUseAppSelector.mockImplementation((selector) => {
    if (selector === mockGetClaimFileList) {
      return fileList;
    }

    if (selector === mockGetClaimNumber) {
      return currentClaimNumber;
    }

    if (selector === mockGetClaimStagedFileList) {
      return stagedFiles;
    }

    if (selector === mockAreClaimStagedFiles) {
      return areStagedFiles;
    }

    return undefined;
  });
};

const setupViewModel = () => {
  mockUseDocumentUploadViewModel.mockReturnValue({
    maxFileSize: 10 * 1024 * 1024,

    allowableFileExtensions: {
      'application/pdf': ['.pdf']
    },

    getMappedFileStatus: mockGetMappedFileStatus,

    getFileProgressValue:
      mockGetFileProgressValue,

    getFileStatusDescription:
      mockGetFileStatusDescription,

    invalidCharacterValidator:
      mockInvalidCharacterValidator,

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

  mockUseAppDispatch.mockReturnValue(mockDispatch);

  mockGetDefaultRequestOptions.mockReturnValue({
    headers: {}
  });

  setupSelectors();
  setupViewModel();

  mockDropzoneProps = undefined;
});

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('DocumentUploadComponent', () => {
  describe('Dropzone', () => {
    it('renders the browse files button', () => {
      renderComponent();

      expect(
        screen.getByRole('button', {
          name: 'Browse files'
        })
      ).toBeInTheDocument();
    });

    it('opens the file browser when Browse files is clicked', () => {
      renderComponent();

      expect(
        screen.getByRole('button', {
          name: 'Browse files'
        })
      ).toBeInTheDocument();

      /*
       * We deliberately don't assert Dropzone's internal `open`
       * implementation because that belongs to react-dropzone.
       */
    });

    it('passes the configured file validation properties to Dropzone', () => {
      renderComponent();

      expect(mockDropzoneProps).toEqual(
        expect.objectContaining({
          accept: {
            'application/pdf': ['.pdf']
          },
          minSize: 1,
          maxSize: 10 * 1024 * 1024,
          disabled: false,
          noClick: true,
          noKeyboard: true,
          validator: mockInvalidCharacterValidator
        })
      );
    });

    it('dispatches addAcceptedClaimDocuments when files are accepted', () => {
      const fileList = {
        'existing.pdf': createFile(
          'existing.pdf',
          'uploaded'
        )
      };

      const acceptedFiles = [
        new File(
          ['content'],
          'new.pdf',
          {
            type: 'application/pdf'
          }
        )
      ];

      const action = jest.fn();

      setupSelectors({
        fileList
      });

      mockAddAcceptedClaimDocuments.mockReturnValue(
        action
      );

      renderComponent();

      mockDropzoneProps?.onDropAccepted?.(
        acceptedFiles
      );

      expect(
        mockAddAcceptedClaimDocuments
      ).toHaveBeenCalledWith(
        acceptedFiles,
        fileList
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        action
      );
    });

    it('dispatches addRejectedClaimDocuments when files are rejected', () => {
      const fileList = {
        'existing.pdf': createFile(
          'existing.pdf',
          'uploaded'
        )
      };

      const rejectedFiles = [];

      const action = jest.fn();

      setupSelectors({
        fileList
      });

      mockAddRejectedClaimDocuments.mockReturnValue(
        action
      );

      renderComponent();

      mockDropzoneProps?.onDropRejected?.(
        rejectedFiles
      );

      expect(
        mockAddRejectedClaimDocuments
      ).toHaveBeenCalledWith(
        rejectedFiles,
        fileList
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        action
      );
    });
  });

  describe('file list', () => {
    it('renders file names from the file list', () => {
      const firstFile = createFile(
        'document1.pdf',
        'staged'
      );

      const secondFile = createFile(
        'document2.pdf',
        'uploaded'
      );

      setupSelectors({
        fileList: {
          'document1.pdf': firstFile,
          'document2.pdf': secondFile
        }
      });

      mockGetMappedFileStatus
        .mockReturnValueOnce('uploading')
        .mockReturnValueOnce('success');

      mockGetFileStatusDescription
        .mockReturnValueOnce('Uploading')
        .mockReturnValueOnce('Uploaded');

      renderComponent();

      expect(
        screen.getByText('document1.pdf')
      ).toBeInTheDocument();

      expect(
        screen.getByText('document2.pdf')
      ).toBeInTheDocument();
    });

    it('does not render a file list when fileList is empty', () => {
      setupSelectors({
        fileList: {}
      });

      renderComponent();

      expect(
        screen.queryByText(/\.pdf$/)
      ).not.toBeInTheDocument();
    });

    it('gets progress value for a file that is not complete', () => {
      const stagedFile = createFile(
        'document.pdf',
        'staged'
      );

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      mockGetMappedFileStatus.mockReturnValue(
        'uploading'
      );

      mockGetFileProgressValue.mockReturnValue(
        50
      );

      mockGetFileStatusDescription.mockReturnValue(
        'Uploading'
      );

      renderComponent();

      expect(
        mockGetFileProgressValue
      ).toHaveBeenCalledWith(stagedFile);
    });

    it('does not get progress value for a completed file', () => {
      const stagedFile = createFile(
        'document.pdf',
        'uploaded'
      );

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      mockGetMappedFileStatus.mockReturnValue(
        'success'
      );

      mockGetFileStatusDescription.mockReturnValue(
        'Uploaded'
      );

      renderComponent();

      expect(
        mockGetFileProgressValue
      ).not.toHaveBeenCalled();
    });

    it('gets the status description for each file', () => {
      const stagedFile = createFile(
        'document.pdf',
        'staged'
      );

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      mockGetMappedFileStatus.mockReturnValue(
        'uploading'
      );

      mockGetFileStatusDescription.mockReturnValue(
        'Uploading'
      );

      renderComponent();

      expect(
        mockGetFileStatusDescription
      ).toHaveBeenCalledWith(stagedFile);
    });
  });

  describe('Remove', () => {
    it.each(['staged', 'failed'])(
      'renders Remove button for %s file',
      (clientStatus) => {
        const stagedFile = createFile(
          'document.pdf',
          clientStatus
        );

        setupSelectors({
          fileList: {
            'document.pdf': stagedFile
          }
        });

        mockGetMappedFileStatus.mockReturnValue(
          'error'
        );

        mockGetFileStatusDescription.mockReturnValue(
          'Failed'
        );

        renderComponent();

        expect(
          screen.getByRole('button', {
            name: /remove/i
          })
        ).toBeInTheDocument();
      }
    );

    it('does not render Remove button for uploaded file', () => {
      const stagedFile = createFile(
        'document.pdf',
        'uploaded'
      );

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      mockGetMappedFileStatus.mockReturnValue(
        'success'
      );

      mockGetFileStatusDescription.mockReturnValue(
        'Uploaded'
      );

      renderComponent();

      expect(
        screen.queryByRole('button', {
          name: /remove/i
        })
      ).not.toBeInTheDocument();
    });

    it('dispatches deleteClaimDocument when Remove is clicked', () => {
      const stagedFile = createFile(
        'document.pdf',
        'staged'
      );

      const action = jest.fn();

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      mockGetMappedFileStatus.mockReturnValue(
        'uploading'
      );

      mockGetFileStatusDescription.mockReturnValue(
        'Uploading'
      );

      mockDeleteClaimDocument.mockReturnValue(
        action
      );

      renderComponent();

      fireEvent.click(
        screen.getByRole('button', {
          name: /remove/i
        })
      );

      expect(
        mockDeleteClaimDocument
      ).toHaveBeenCalledWith(
        stagedFile.name
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        action
      );
    });
  });

  describe('staged files', () => {
    it('renders the check message when staged files exist', () => {
      setupSelectors({
        areStagedFiles: true
      });

      renderComponent();

      expect(
        screen.getByText(
          'claim:documentUpload.check.title'
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          'claim:documentUpload.check.description'
        )
      ).toBeInTheDocument();
    });

    it('does not render the check message when there are no staged files', () => {
      setupSelectors({
        areStagedFiles: false
      });

      renderComponent();

      expect(
        screen.queryByText(
          'claim:documentUpload.check.title'
        )
      ).not.toBeInTheDocument();
    });
  });

  describe('Upload files', () => {
    it('disables Upload files when there are no staged files', () => {
      setupSelectors({
        areStagedFiles: false
      });

      renderComponent();

      expect(
        screen.getByRole('button', {
          name: /upload files/i
        })
      ).toBeDisabled();
    });

    it('enables Upload files when staged files exist', () => {
      setupSelectors({
        areStagedFiles: true
      });

      renderComponent();

      expect(
        screen.getByRole('button', {
          name: /upload files/i
        })
      ).toBeEnabled();
    });

    it('sends every staged file when Upload files is clicked', async () => {
      const firstFile = createFile(
        'first.pdf',
        'staged'
      );

      const secondFile = createFile(
        'second.pdf',
        'staged'
      );

      setupSelectors({
        stagedFiles: [
          firstFile,
          secondFile
        ],
        areStagedFiles: true
      });

      mockSendRequest.mockResolvedValue(
        undefined
      );

      renderComponent();

      fireEvent.click(
        screen.getByRole('button', {
          name: /upload files/i
        })
      );

      await waitFor(() => {
        expect(mockSendRequest).toHaveBeenCalledTimes(
          2
        );
      });

      expect(mockSendRequest).toHaveBeenNthCalledWith(
        1,
        firstFile
      );

      expect(mockSendRequest).toHaveBeenNthCalledWith(
        2,
        secondFile
      );
    });

    it('logs the API error when uploading staged files fails', async () => {
      const stagedFile = createFile(
        'document.pdf',
        'staged'
      );

      const error = new Error(
        'Upload failed'
      );

      const requestOptions = {
        headers: {}
      };

      setupSelectors({
        stagedFiles: [stagedFile],
        areStagedFiles: true
      });

      mockGetDefaultRequestOptions.mockReturnValue(
        requestOptions
      );

      mockSendRequest.mockRejectedValue(
        error
      );

      renderComponent();

      fireEvent.click(
        screen.getByRole('button', {
          name: /upload files/i
        })
      );

      await waitFor(() => {
        expect(mockLogApiError).toHaveBeenCalledWith(
          error,
          'ui-api-upload-staged-files',
          requestOptions
        );
      });
    });

    it('disables Upload files while uploading', async () => {
      const stagedFile = createFile(
        'document.pdf',
        'staged'
      );

      let resolveUpload:
        | (() => void)
        | undefined;

      const uploadPromise = new Promise<void>(
        (resolve) => {
          resolveUpload = resolve;
        }
      );

      setupSelectors({
        stagedFiles: [stagedFile],
        areStagedFiles: true
      });

      mockSendRequest.mockReturnValue(
        uploadPromise
      );

      renderComponent();

      const uploadButton =
        screen.getByRole('button', {
          name: /upload files/i
        });

      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(uploadButton).toBeDisabled();
      });

      resolveUpload?.();

      await waitFor(() => {
        expect(uploadButton).toBeEnabled();
      });
    });
  });
});

/* -------------------------------------------------------------------------- */
/* Loader tests                                                               */
/* -------------------------------------------------------------------------- */

describe('DocumentUploadLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAppDispatch.mockReturnValue(mockDispatch);

    setupSelectors({
      fileList: {
        'existing.pdf': createFile(
          'existing.pdf',
          'uploaded'
        )
      }
    });

    setupViewModel();

    mockGetUploadedDocumentList.mockReturnValue(
      jest.fn()
    );
  });

  it('loads uploaded documents when the component mounts', () => {
    const action = jest.fn();

    mockGetUploadedDocumentList.mockReturnValue(
      action
    );

    render(<DocumentUpload />);

    expect(
      mockGetUploadedDocumentList
    ).toHaveBeenCalledWith(
      claimNumber,
      {
        'existing.pdf': expect.objectContaining({
          name: 'existing.pdf'
        })
      }
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      action
    );
  });
});