import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  DocumentUpload,
  DocumentUploadComponent
} from './DocumentUpload';

const mockDispatch = jest.fn();
const mockUseAppSelector = jest.fn();

const mockGetUploadedDocumentList = jest.fn();
const mockAddAcceptedClaimDocuments = jest.fn();
const mockAddRejectedClaimDocuments = jest.fn();
const mockDeleteClaimDocument = jest.fn();

const mockGetDefaultRequestOptions = jest.fn();
const mockLogApiError = jest.fn();

const mockUseDocumentUploadViewModel = jest.fn();

let mockDropzoneProps: any;

jest.mock('~/root/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector)
}));

jest.mock('~/common/state/services', () => ({
  getDefaultRequestOptions: () => mockGetDefaultRequestOptions()
}));

jest.mock('~/common/utilities', () => ({
  logApiError: (...args: unknown[]) => mockLogApiError(...args)
}));

jest.mock('~/feature/claim/shared/state', () => ({
  thunks: {
    getUploadedDocumentList: (...args: unknown[]) =>
      mockGetUploadedDocumentList(...args),

    addAcceptedClaimDocuments: (...args: unknown[]) =>
      mockAddAcceptedClaimDocuments(...args),

    addRejectedClaimDocuments: (...args: unknown[]) =>
      mockAddRejectedClaimDocuments(...args),

    deleteClaimDocument: (...args: unknown[]) =>
      mockDeleteClaimDocument(...args)
  }
}));

jest.mock('~/feature/claim/shared/state/selectors', () => ({
  areClaimStagedFiles: 'areClaimStagedFiles',
  getClaimFileList: 'getClaimFileList',
  getClaimNumber: 'getClaimNumber',
  getClaimStagedFileList: 'getClaimStagedFileList'
}));

jest.mock('./useDocumentUploadViewModel', () => ({
  useDocumentUploadViewModel: (props: unknown) =>
    mockUseDocumentUploadViewModel(props)
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

jest.mock('react-dropzone', () => {
  return (props: any) => {
    mockDropzoneProps = props;

    return (
      <div data-testid="dropzone">
        {props.children({
          getRootProps: () => ({
            'data-testid': 'dropzone-root'
          }),
          getInputProps: () => ({
            'data-testid': 'dropzone-input'
          }),
          open: jest.fn(),
          isDragActive: false
        })}
      </div>
    );
  };
});

jest.mock('@tower/tui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    id
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    id?: string;
  }) => (
    <button
      type="button"
      id={id}
      disabled={disabled}
      onClick={onClick}>
      {children}
    </button>
  ),

  Card: {
    Container: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="CardContainer">{children}</div>
    ),

    Content: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="CardContent">{children}</div>
    )
  },

  Typography: ({
    children
  }: {
    children?: React.ReactNode;
  }) => <div>{children}</div>
}));

jest.mock('@tower/tui/icons', () => ({
  CloudUploadIcon: () => <span />,
  DeleteIcon: () => <span />,
  ErrorIcon: () => <span />,
  SecurityIcon: () => <span />,
  CheckIcon: () => <span />
}));

jest.mock('./styles', () => {
  const React = require('react');

  const createComponent =
    (testId: string) =>
    ({ children, ...props }: any) =>
      (
        <div data-testid={testId} {...props}>
          {children}
        </div>
      );

  return {
    DropzoneOuterWrapper: createComponent('DropzoneOuterWrapper'),
    DropzoneWrapper: createComponent('DropzoneWrapper'),
    DropzoneHelperContainer: createComponent('DropzoneHelperContainer'),

    DragAndDropText: ({
      children
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,

    FileListWrapper: createComponent('FileListWrapper'),
    StyledFileItemCardContainer: createComponent(
      'StyledFileItemCardContainer'
    ),
    FileItem: createComponent('FileItem'),
    FileProgress: createComponent('FileProgress'),
    IconTitleContainer: createComponent('IconTitleContainer'),
    StatusIconContainer: createComponent('StatusIconContainer'),

    StagedFileName: ({
      children
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,

    StyledLinearProgress: ({
      id,
      value
    }: {
      id?: string;
      value?: number;
    }) => (
      <div
        data-testid={id}
        data-value={value}
      />
    ),

    FileDescription: ({
      children
    }: {
      children?: React.ReactNode;
    }) => <div>{children}</div>,

    RemoveContainer: createComponent('RemoveContainer'),
    UploadContainer: createComponent('UploadContainer'),
    UploadCheckTitleContainer: createComponent(
      'UploadCheckTitleContainer'
    )
  };
});

describe('DocumentUploadComponent', () => {
  const claimNumber = 'CLAIM-123';

  const defaultFileList = {};

  const defaultViewModel = {
    maxFileSize: 10485760,
    allowableFileExtensions: {
      'application/pdf': ['.pdf']
    },
    getMappedFileStatus: jest.fn(),
    getFileProgressValue: jest.fn(),
    getFileStatusDescription: jest.fn(),
    invalidCharacterValidator: jest.fn(),
    sendRequest: jest.fn()
  };

  const setupSelectors = ({
    stagedFiles = [],
    fileList = defaultFileList,
    areStagedFiles = false,
    currentClaimNumber = claimNumber
  }: {
    stagedFiles?: any[];
    fileList?: Record<string, any>;
    areStagedFiles?: boolean;
    currentClaimNumber?: string;
  } = {}) => {
    mockUseAppSelector.mockImplementation((selector: unknown) => {
      switch (selector) {
        case 'getClaimStagedFileList':
          return stagedFiles;

        case 'getClaimFileList':
          return fileList;

        case 'areClaimStagedFiles':
          return areStagedFiles;

        case 'getClaimNumber':
          return currentClaimNumber;

        default:
          return undefined;
      }
    });
  };

  const renderComponent = () =>
    render(<DocumentUploadComponent />);

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetDefaultRequestOptions.mockReturnValue({
      headers: {}
    });

    setupSelectors();

    mockUseDocumentUploadViewModel.mockReturnValue({
      ...defaultViewModel
    });
  });

  describe('Dropzone', () => {
    it('passes correct configuration to Dropzone', () => {
      renderComponent();

      expect(mockDropzoneProps).toEqual(
        expect.objectContaining({
          accept: defaultViewModel.allowableFileExtensions,
          minSize: 1,
          maxSize: defaultViewModel.maxFileSize,
          disabled: false,
          noClick: true,
          noKeyboard: true,
          validator: defaultViewModel.invalidCharacterValidator
        })
      );
    });

    it('dispatches addAcceptedClaimDocuments when files are accepted', () => {
      const fileList = {
        existing: {
          name: 'existing.pdf'
        }
      };

      setupSelectors({
        fileList
      });

      mockAddAcceptedClaimDocuments.mockReturnValue(
        'addAcceptedAction'
      );

      renderComponent();

      const acceptedFiles = [
        new File(['content'], 'document.pdf', {
          type: 'application/pdf'
        })
      ];

      mockDropzoneProps.onDropAccepted(acceptedFiles);

      expect(mockAddAcceptedClaimDocuments).toHaveBeenCalledWith(
        acceptedFiles,
        fileList
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        'addAcceptedAction'
      );
    });

    it('dispatches addRejectedClaimDocuments when files are rejected', () => {
      const fileList = {
        existing: {
          name: 'existing.pdf'
        }
      };

      setupSelectors({
        fileList
      });

      mockAddRejectedClaimDocuments.mockReturnValue(
        'addRejectedAction'
      );

      renderComponent();

      const rejectedFiles = [
        {
          file: new File(['content'], 'invalid.exe')
        }
      ];

      mockDropzoneProps.onDropRejected(rejectedFiles);

      expect(mockAddRejectedClaimDocuments).toHaveBeenCalledWith(
        rejectedFiles,
        fileList
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        'addRejectedAction'
      );
    });
  });

  describe('file list', () => {
    it('does not render file items when file list is empty', () => {
      setupSelectors({
        fileList: {}
      });

      renderComponent();

      expect(
        screen.queryByTestId('StyledFileItemCardContainer')
      ).not.toBeInTheDocument();
    });

    it('renders a file item for each file', () => {
      const file1 = {
        name: 'document1.pdf',
        clientStatus: 'staged'
      };

      const file2 = {
        name: 'document2.pdf',
        clientStatus: 'uploaded'
      };

      setupSelectors({
        fileList: {
          'document1.pdf': file1,
          'document2.pdf': file2
        }
      });

      defaultViewModel.getMappedFileStatus
        .mockReturnValueOnce('uploading')
        .mockReturnValueOnce('success');

      defaultViewModel.getFileProgressValue
        .mockReturnValueOnce(50)
        .mockReturnValueOnce(100);

      defaultViewModel.getFileStatusDescription
        .mockReturnValueOnce('Uploading')
        .mockReturnValueOnce('Uploaded');

      renderComponent();

      expect(
        screen.getAllByTestId(
          'StyledFileItemCardContainer'
        )
      ).toHaveLength(2);

      expect(
        screen.getByText('document1.pdf')
      ).toBeInTheDocument();

      expect(
        screen.getByText('document2.pdf')
      ).toBeInTheDocument();
    });

    it('shows progress for a file that is not complete', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'staged'
      };

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      defaultViewModel.getMappedFileStatus.mockReturnValue(
        'uploading'
      );

      defaultViewModel.getFileProgressValue.mockReturnValue(
        50
      );

      defaultViewModel.getFileStatusDescription.mockReturnValue(
        'Uploading'
      );

      renderComponent();

      expect(
        screen.getByTestId('uploadFile0')
      ).toHaveAttribute('data-value', '50');
    });

    it('does not show progress when a file is complete', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'uploaded'
      };

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      defaultViewModel.getMappedFileStatus.mockReturnValue(
        'success'
      );

      defaultViewModel.getFileStatusDescription.mockReturnValue(
        'Uploaded'
      );

      renderComponent();

      expect(
        screen.queryByTestId('uploadFile0')
      ).not.toBeInTheDocument();
    });

    it('shows file status description', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'staged'
      };

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      defaultViewModel.getMappedFileStatus.mockReturnValue(
        'scanning'
      );

      defaultViewModel.getFileProgressValue.mockReturnValue(
        50
      );

      defaultViewModel.getFileStatusDescription.mockReturnValue(
        'Scanning file'
      );

      renderComponent();

      expect(
        screen.getByText('Scanning file')
      ).toBeInTheDocument();
    });
  });

  describe('remove file', () => {
    it.each([
      ['staged'],
      ['failed']
    ])(
      'shows Remove button when clientStatus is %s',
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

        defaultViewModel.getMappedFileStatus.mockReturnValue(
          'error'
        );

        defaultViewModel.getFileStatusDescription.mockReturnValue(
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

    it('does not show Remove button for other client statuses', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'uploaded'
      };

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      defaultViewModel.getMappedFileStatus.mockReturnValue(
        'success'
      );

      defaultViewModel.getFileStatusDescription.mockReturnValue(
        'Uploaded'
      );

      renderComponent();

      expect(
        screen.queryByRole('button', {
          name: /remove/i
        })
      ).not.toBeInTheDocument();
    });

    it('dispatches deleteClaimDocument when Remove button is clicked', () => {
      const stagedFile = {
        name: 'document.pdf',
        clientStatus: 'staged'
      };

      setupSelectors({
        fileList: {
          'document.pdf': stagedFile
        }
      });

      mockDeleteClaimDocument.mockReturnValue(
        'deleteDocumentAction'
      );

      defaultViewModel.getMappedFileStatus.mockReturnValue(
        'uploading'
      );

      defaultViewModel.getFileStatusDescription.mockReturnValue(
        'Uploading'
      );

      renderComponent();

      fireEvent.click(
        screen.getByRole('button', {
          name: /remove/i
        })
      );

      expect(mockDeleteClaimDocument).toHaveBeenCalledWith(
        'document.pdf'
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        'deleteDocumentAction'
      );
    });
  });

  describe('upload validation message', () => {
    it('shows upload validation message when staged files exist', () => {
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

    it('does not show upload validation message when there are no staged files', () => {
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

  describe('upload staged files', () => {
    it('disables upload button when there are no staged files', () => {
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

    it('enables upload button when staged files exist', () => {
      setupSelectors({
        areStagedFiles: true
      });

      renderComponent();

      expect(
        screen.getByRole('button', {
          name: /upload files/i
        })
      ).not.toBeDisabled();
    });

    it('sends requests for all staged files', async () => {
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

      const sendRequest = jest
        .fn()
        .mockResolvedValue(undefined);

      mockUseDocumentUploadViewModel.mockReturnValue({
        ...defaultViewModel,
        sendRequest
      });

      renderComponent();

      fireEvent.click(
        screen.getByRole('button', {
          name: /upload files/i
        })
      );

      expect(sendRequest).toHaveBeenCalledWith(
        stagedFiles[0]
      );

      expect(sendRequest).toHaveBeenCalledWith(
        stagedFiles[1]
      );

      await waitFor(() => {
        expect(sendRequest).toHaveBeenCalledTimes(2);
      });
    });

    it('logs API error when an upload request fails', async () => {
      const stagedFiles = [
        {
          name: 'document.pdf'
        }
      ];

      const requestOptions = {
        headers: {
          test: 'value'
        }
      };

      const error = new Error('Upload failed');

      setupSelectors({
        stagedFiles,
        areStagedFiles: true
      });

      mockGetDefaultRequestOptions.mockReturnValue(
        requestOptions
      );

      const sendRequest = jest
        .fn()
        .mockRejectedValue(error);

      mockUseDocumentUploadViewModel.mockReturnValue({
        ...defaultViewModel,
        sendRequest
      });

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

    it('disables upload button while uploading', async () => {
      let resolveUpload: () => void;

      const uploadPromise = new Promise<void>((resolve) => {
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

      mockUseDocumentUploadViewModel.mockReturnValue({
        ...defaultViewModel,
        sendRequest: jest.fn(() => uploadPromise)
      });

      renderComponent();

      const uploadButton = screen.getByRole(
        'button',
        {
          name: /upload files/i
        }
      );

      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(uploadButton).toBeDisabled();
      });

      resolveUpload!();

      await waitFor(() => {
        expect(uploadButton).not.toBeDisabled();
      });
    });
  });
});

describe('DocumentUploadLoader', () => {
  const claimNumber = 'CLAIM-123';

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAppSelector.mockImplementation(
      (selector: unknown) => {
        switch (selector) {
          case 'getClaimFileList':
            return {
              'document.pdf': {
                name: 'document.pdf'
              }
            };

          case 'getClaimNumber':
            return claimNumber;

          case 'getClaimStagedFileList':
            return [];

          case 'areClaimStagedFiles':
            return false;

          default:
            return undefined;
        }
      }
    );

    mockUseDocumentUploadViewModel.mockReturnValue({
      maxFileSize: 10485760,
      allowableFileExtensions: {},
      getMappedFileStatus: jest.fn(),
      getFileProgressValue: jest.fn(),
      getFileStatusDescription: jest.fn(),
      invalidCharacterValidator: jest.fn(),
      sendRequest: jest.fn()
    });
  });

  it('loads uploaded document list when mounted', () => {
    const action = 'getUploadedDocumentListAction';

    const fileList = {
      'document.pdf': {
        name: 'document.pdf'
      }
    };

    mockGetUploadedDocumentList.mockReturnValue(
      action
    );

    render(<DocumentUpload />);

    expect(mockGetUploadedDocumentList).toHaveBeenCalledWith(
      claimNumber,
      fileList
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      action
    );
  });
});