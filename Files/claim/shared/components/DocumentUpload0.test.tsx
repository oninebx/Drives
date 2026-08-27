import * as React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import type {
  DropzoneProps,
  DropzoneRootProps,
  DropzoneInputProps,
  DropzoneState
} from 'react-dropzone';

import {
  DocumentUpload,
  DocumentUploadComponent
} from './DocumentUpload';

/**
 * Store mocks
 */
const mockDispatch = jest.fn();
const mockUseAppSelector = jest.fn();

/**
 * Redux selectors
 *
 * 使用 function reference 作为 selector identity，
 * 比用 string selector 更接近真实 useAppSelector 的行为。
 */
const mockSelectors = {
  getClaimFileList: jest.fn(),
  getClaimNumber: jest.fn(),
  getClaimStagedFileList: jest.fn(),
  areClaimStagedFiles: jest.fn()
};

/**
 * Thunks
 */
const mockThunks = {
  getUploadedDocumentList: jest.fn(),
  addAcceptedClaimDocuments: jest.fn(),
  addRejectedClaimDocuments: jest.fn(),
  deleteClaimDocument: jest.fn()
};

/**
 * Services / utilities
 */
const mockGetDefaultRequestOptions = jest.fn();
const mockLogApiError = jest.fn();

/**
 * ViewModel
 */
const mockUseDocumentUploadViewModel = jest.fn();

/**
 * Dropzone props
 */
let mockDropzoneProps: DropzoneProps | undefined;

/**
 * Dropzone open function
 */
const mockDropzoneOpen = jest.fn();

/**
 * Store
 */
jest.mock('~/root/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: unknown) =>
    mockUseAppSelector(selector)
}));

/**
 * Selectors
 */
jest.mock(
  '~/feature/claim/shared/state/selectors',
  () => ({
    getClaimFileList:
      mockSelectors.getClaimFileList,

    getClaimNumber:
      mockSelectors.getClaimNumber,

    getClaimStagedFileList:
      mockSelectors.getClaimStagedFileList,

    areClaimStagedFiles:
      mockSelectors.areClaimStagedFiles
  })
);

/**
 * Thunks
 */
jest.mock(
  '~/feature/claim/shared/state',
  () => ({
    thunks: mockThunks
  })
);

/**
 * Services
 */
jest.mock('~/common/state/services', () => ({
  getDefaultRequestOptions:
    mockGetDefaultRequestOptions
}));

/**
 * Utilities
 */
jest.mock('~/common/utilities', () => ({
  logApiError: mockLogApiError
}));

/**
 * ViewModel
 */
jest.mock(
  './useDocumentUploadViewModel',
  () => ({
    useDocumentUploadViewModel:
      mockUseDocumentUploadViewModel
  })
);

/**
 * Translation
 */
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

/**
 * react-dropzone
 *
 * Dropzone 是 default export。
 */
jest.mock('react-dropzone', () => {
  const MockDropzone = ({
    children,
    ...props
  }: DropzoneProps) => {
    mockDropzoneProps = {
      ...props,
      children
    };

    const getRootProps = <
      T extends DropzoneRootProps
    >(
      dropzoneProps?: T
    ): T => {
      return (dropzoneProps ?? {}) as T;
    };

    const getInputProps = <
      T extends DropzoneInputProps
    >(
      dropzoneProps?: T
    ): T => {
      return (dropzoneProps ?? {}) as T;
    };

    const dropzoneState: DropzoneState = {
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
      open: mockDropzoneOpen
    };

    if (typeof children === 'function') {
      return (
        <div data-testid="dropzone">
          {children(dropzoneState)}
        </div>
      );
    }

    return <div data-testid="dropzone" />;
  };

  MockDropzone.displayName = 'MockDropzone';

  return {
    __esModule: true,
    default: MockDropzone
  };
});

/**
 * Tower UI
 *
 * 只提供当前组件需要的最小实现。
 */
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

  MockCardContainer.displayName =
    'MockCardContainer';

  const MockCardContent: React.FC<{
    children?: React.ReactNode;
  }> = ({ children }) => <div>{children}</div>;

  MockCardContent.displayName =
    'MockCardContent';

  const MockTypography: React.FC<{
    children?: React.ReactNode;
  }> = ({ children }) => <div>{children}</div>;

  MockTypography.displayName =
    'MockTypography';

  return {
    Button: MockButton,

    Card: {
      Container: MockCardContainer,
      Content: MockCardContent
    },

    Typography: MockTypography
  };
});

/**
 * Icons
 */
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

describe('DocumentUploadComponent', () => {
  const claimNumber = 'CLAIM-123';

  const mockGetMappedFileStatus = jest.fn();
  const mockGetFileProgressValue = jest.fn();
  const mockGetFileStatusDescription = jest.fn();
  const mockInvalidCharacterValidator = jest.fn();
  const mockSendRequest = jest.fn();

  const defaultViewModel = {
    maxFileSize: 10 * 1024 * 1024,

    allowableFileExtensions: {
      'application/pdf': ['.pdf']
    },

    getMappedFileStatus:
      mockGetMappedFileStatus,

    getFileProgressValue:
      mockGetFileProgressValue,

    getFileStatusDescription:
      mockGetFileStatusDescription,

    invalidCharacterValidator:
      mockInvalidCharacterValidator,

    sendRequest:
      mockSendRequest
  };

  interface SelectorState {
    stagedFiles: unknown[];
    fileList: Record<string, unknown>;
    areStagedFiles: boolean;
    claimNumber: string;
  }

  const setupSelectors = ({
    stagedFiles = [],
    fileList = {},
    areStagedFiles = false,
    claimNumber: currentClaimNumber = claimNumber
  }: Partial<SelectorState> = {}) => {
    mockUseAppSelector.mockImplementation(
      (selector: unknown) => {
        if (
          selector ===
          mockSelectors.getClaimStagedFileList
        ) {
          return stagedFiles;
        }

        if (
          selector ===
          mockSelectors.getClaimFileList
        ) {
          return fileList;
        }

        if (
          selector ===
          mockSelectors.areClaimStagedFiles
        ) {
          return areStagedFiles;
        }

        if (
          selector ===
          mockSelectors.getClaimNumber
        ) {
          return currentClaimNumber;
        }

        return undefined;
      }
    );
  };

  const renderComponent = () =>
    render(<DocumentUploadComponent />);

  beforeEach(() => {
    jest.clearAllMocks();

    mockDropzoneProps = undefined;

    mockGetDefaultRequestOptions.mockReturnValue(
      {
        headers: {}
      }
    );

    setupSelectors();

    mockUseDocumentUploadViewModel.mockReturnValue(
      defaultViewModel
    );
  });

  describe('Dropzone', () => {
    it('dispatches addAcceptedClaimDocuments when files are accepted', () => {
      const fileList = {
        existing: {
          name: 'existing.pdf'
        }
      };

      const acceptedFiles = [
        new File(
          ['content'],
          'document.pdf',
          {
            type: 'application/pdf'
          }
        )
      ];

      const action = jest.fn();

      setupSelectors({
        fileList
      });

      mockThunks.addAcceptedClaimDocuments.mockReturnValue(
        action
      );

      renderComponent();

      expect(mockDropzoneProps).toBeDefined();

      mockDropzoneProps?.onDropAccepted?.(
        acceptedFiles
      );

      expect(
        mockThunks.addAcceptedClaimDocuments
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
        existing: {
          name: 'existing.pdf'
        }
      };

      const rejectedFiles = [];

      const action = jest.fn();

      setupSelectors({
        fileList
      });

      mockThunks.addRejectedClaimDocuments.mockReturnValue(
        action
      );

      renderComponent();

      expect(mockDropzoneProps).toBeDefined();

      mockDropzoneProps?.onDropRejected?.(
        rejectedFiles
      );

      expect(
        mockThunks.addRejectedClaimDocuments
      ).toHaveBeenCalledWith(
        rejectedFiles,
        fileList
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        action
      );
    });

    it('passes view model configuration to Dropzone', () => {
      renderComponent();

      expect(mockDropzoneProps).toEqual(
        expect.objectContaining({
          accept:
            defaultViewModel.allowableFileExtensions,

          minSize: 1,

          maxSize:
            defaultViewModel.maxFileSize,

          disabled: false,

          noClick: true,

          noKeyboard: true,

          validator:
            mockInvalidCharacterValidator
        })
      );
    });
  });

  describe('file list', () => {
    it('renders all files', () => {
      const firstFile = {
        name: 'document1.pdf',
        clientStatus: 'staged'
      };

      const secondFile = {
        name: 'document2.pdf',
        clientStatus: 'uploaded'
      };

      setupSelectors({
        fileList: {
          'document1.pdf': firstFile,
          'document2.pdf': secondFile
        }
      });

      mockGetMappedFileStatus
        .mockReturnValueOnce('uploading')
        .mockReturnValueOnce('success');

      mockGetFileProgressValue.mockReturnValue(
        50
      );

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

      expect(
        mockGetMappedFileStatus
      ).toHaveBeenCalledTimes(2);
    });

    it('does not render files when file list is empty', () => {
      setupSelectors({
        fileList: {}
      });

      renderComponent();

      expect(
        screen.queryByText(/\.pdf$/)
      ).not.toBeInTheDocument();
    });

    it('gets progress and description for a non-complete file', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'staged'
      };

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

      expect(
        mockGetFileStatusDescription
      ).toHaveBeenCalledWith(stagedFile);

      expect(
        screen.getByText('Uploading')
      ).toBeInTheDocument();
    });

    it('does not get progress for a complete file', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'uploaded'
      };

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

      expect(
        screen.getByText('Uploaded')
      ).toBeInTheDocument();
    });
  });

  describe('Remove file', () => {
    it.each([
      'staged',
      'failed'
    ])(
      'renders Remove button when client status is %s',
      (clientStatus) => {
        const stagedFile = {
          name: 'document.pdf',
          clientStatus
        };

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
            name: 'Remove'
          })
        ).toBeInTheDocument();
      }
    );

    it('does not render Remove button for uploaded file', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'uploaded'
      };

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
          name: 'Remove'
        })
      ).not.toBeInTheDocument();
    });

    it('dispatches deleteClaimDocument when Remove is clicked', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'staged'
      };

      const action = jest.fn();

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      mockThunks.deleteClaimDocument.mockReturnValue(
        action
      );

      mockGetMappedFileStatus.mockReturnValue(
        'uploading'
      );

      mockGetFileStatusDescription.mockReturnValue(
        'Uploading'
      );

      renderComponent();

      const removeButton =
        screen.getByRole('button', {
          name: 'Remove'
        });

      fireEvent.click(removeButton);

      expect(
        mockThunks.deleteClaimDocument
      ).toHaveBeenCalledWith(
        'document.pdf'
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        action
      );
    });
  });

  describe('Upload button', () => {
    it('is disabled when there are no staged files', () => {
      setupSelectors({
        areStagedFiles: false
      });

      renderComponent();

      expect(
        screen.getByRole('button', {
          name: 'Upload files'
        })
      ).toBeDisabled();
    });

    it('is enabled when staged files exist', () => {
      setupSelectors({
        areStagedFiles: true
      });

      renderComponent();

      expect(
        screen.getByRole('button', {
          name: 'Upload files'
        })
      ).not.toBeDisabled();
    });

    it('shows staged files message when staged files exist', () => {
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

    it('does not show staged files message when no staged files exist', () => {
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

  describe('Upload staged files', () => {
    it('sends a request for every staged file', async () => {
      const stagedFiles = [
        {
          name: 'document1.pdf'
        },
        {
          name: 'document2.pdf'
        }
      ];

      setupSelectors({
        stagedFiles,
        areStagedFiles: true
      });

      mockSendRequest.mockResolvedValue(
        undefined
      );

      renderComponent();

      fireEvent.click(
        screen.getByRole('button', {
          name: 'Upload files'
        })
      );

      expect(
        mockSendRequest
      ).toHaveBeenCalledWith(
        stagedFiles[0]
      );

      expect(
        mockSendRequest
      ).toHaveBeenCalledWith(
        stagedFiles[1]
      );

      await waitFor(() => {
        expect(
          mockSendRequest
        ).toHaveBeenCalledTimes(2);
      });
    });

    it('logs an API error when upload fails', async () => {
      const stagedFiles = [
        {
          name: 'document.pdf'
        }
      ];

      const error = new Error(
        'Upload failed'
      );

      const requestOptions = {
        headers: {
          test: 'value'
        }
      };

      setupSelectors({
        stagedFiles,
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
          name: 'Upload files'
        })
      );

      await waitFor(() => {
        expect(
          mockLogApiError
        ).toHaveBeenCalledWith(
          error,
          'ui-api-upload-staged-files',
          requestOptions
        );
      });
    });

    it('disables upload button while files are uploading', async () => {
      let resolveUpload:
        | (() => void)
        | undefined;

      const uploadPromise =
        new Promise<void>((resolve) => {
          resolveUpload = resolve;
        });

      const stagedFiles = [
        {
          name: 'document.pdf'
        }
      ];

      setupSelectors({
        stagedFiles,
        areStagedFiles: true
      });

      mockSendRequest.mockReturnValue(
        uploadPromise
      );

      renderComponent();

      const uploadButton =
        screen.getByRole('button', {
          name: 'Upload files'
        });

      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(uploadButton).toBeDisabled();
      });

      resolveUpload?.();

      await waitFor(() => {
        expect(
          uploadButton
        ).not.toBeDisabled();
      });
    });
  });
});

describe('DocumentUpload', () => {
  const claimNumber = 'CLAIM-123';

  const fileList = {
    'document.pdf': {
      name: 'document.pdf'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAppSelector.mockImplementation(
      (selector: unknown) => {
        if (
          selector ===
          mockSelectors.getClaimFileList
        ) {
          return fileList;
        }

        if (
          selector ===
          mockSelectors.getClaimNumber
        ) {
          return claimNumber;
        }

        if (
          selector ===
          mockSelectors.getClaimStagedFileList
        ) {
          return [];
        }

        if (
          selector ===
          mockSelectors.areClaimStagedFiles
        ) {
          return false;
        }

        return undefined;
      }
    );

    mockUseDocumentUploadViewModel.mockReturnValue({
      maxFileSize: 10 * 1024 * 1024,
      allowableFileExtensions: {},
      getMappedFileStatus: jest.fn(),
      getFileProgressValue: jest.fn(),
      getFileStatusDescription: jest.fn(),
      invalidCharacterValidator: jest.fn(),
      sendRequest: jest.fn()
    });
  });

  it('loads uploaded document list when mounted', () => {
    const action = jest.fn();

    mockThunks.getUploadedDocumentList.mockReturnValue(
      action
    );

    render(<DocumentUpload />);

    expect(
      mockThunks.getUploadedDocumentList
    ).toHaveBeenCalledWith(
      claimNumber,
      fileList
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      action
    );
  });
});