import * as React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DocumentUpload,
  DocumentUploadComponent
} from './DocumentUpload';

import { thunks } from '~/feature/claim/shared/state';
import {
  areClaimStagedFiles,
  getClaimFileList,
  getClaimNumber,
  getClaimStagedFileList
} from '~/feature/claim/shared/state/selectors';
import { getDefaultRequestOptions } from '~/common/state/services';
import { logApiError } from '~/common/utilities';
import { useDocumentUploadViewModel } from './useDocumentUploadViewModel';
import {
  useAppDispatch,
  useAppSelector
} from '~/root/store';

/**
 * ---------------------------------------------------------------------------
 * Mocks
 * ---------------------------------------------------------------------------
 */

jest.mock('~/root/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn()
}));

jest.mock('~/feature/claim/shared/state', () => ({
  thunks: {
    getUploadedDocumentList: jest.fn(),
    addAcceptedClaimDocuments: jest.fn(),
    addRejectedClaimDocuments: jest.fn(),
    deleteClaimDocument: jest.fn()
  }
}));

jest.mock('~/feature/claim/shared/state/selectors', () => ({
  areClaimStagedFiles: jest.fn(),
  getClaimFileList: jest.fn(),
  getClaimNumber: jest.fn(),
  getClaimStagedFileList: jest.fn()
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

/**
 * Translation mock.
 *
 * The config value is controlled by mockTranslationValues,
 * allowing us to test both toast enabled/disabled branches.
 */
const mockTranslationValues: Record<string, unknown> = {};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key in mockTranslationValues
        ? mockTranslationValues[key]
        : key
  })
}));

/**
 * ---------------------------------------------------------------------------
 * Dropzone
 * ---------------------------------------------------------------------------
 *
 * Dropzone itself has its own tests.
 * We only expose the callbacks and render props needed by this component.
 */

jest.mock('react-dropzone', () => ({
  __esModule: true,
  default: ({
    children,
    onDropAccepted,
    onDropRejected,
    validator,
    accept,
    minSize,
    maxSize
  }: any) => {
    const [isDragActive, setIsDragActive] =
      React.useState(false);

    const open = jest.fn();

    const getRootProps = () => ({
      onDragEnter: () => setIsDragActive(true),
      onDragLeave: () => setIsDragActive(false)
    });

    const getInputProps = () => ({
      type: 'file'
    });

    return (
      <div
        data-testid="dropzone"
        data-accept={JSON.stringify(accept)}
        data-min-size={minSize}
        data-max-size={maxSize}
        data-has-validator={Boolean(validator)}>
        <button
          type="button"
          data-testid="drop-accepted"
          onClick={() =>
            onDropAccepted([
              {
                name: 'accepted.pdf'
              }
            ])
          }>
          Trigger accepted
        </button>

        <button
          type="button"
          data-testid="drop-rejected"
          onClick={() =>
            onDropRejected([
              {
                file: {
                  name: 'rejected.pdf'
                },
                errors: []
              }
            ])
          }>
          Trigger rejected
        </button>

        <div
          data-testid="dropzone-root"
          {...getRootProps()}>
          {children({
            getRootProps,
            getInputProps,
            open,
            isDragActive
          })}
        </div>
      </div>
    );
  }
}));

/**
 * ---------------------------------------------------------------------------
 * TUI
 * ---------------------------------------------------------------------------
 */

const mockShowToast = jest.fn();

jest.mock('@tower/tui', () => ({
  Button: ({
    children,
    ...props
  }: any) => (
    <button {...props}>
      {children}
    </button>
  ),

  Card: {
    Container: ({
      children,
      ...props
    }: any) => (
      <div {...props}>
        {children}
      </div>
    ),

    Content: ({
      children,
      ...props
    }: any) => (
      <div {...props}>
        {children}
      </div>
    )
  },

  Typography: ({
    children,
    ...props
  }: any) => (
    <div {...props}>
      {children}
    </div>
  ),

  Toast: {
    Provider: ({
      children
    }: any) => <>{children}</>
  },

  useToast: () => ({
    id: 'document-upload-toast',
    showToast: mockShowToast
  })
}));

/**
 * ---------------------------------------------------------------------------
 * Icons
 * ---------------------------------------------------------------------------
 */

jest.mock('@tower/tui/icons', () => ({
  CloudUploadIcon: () => (
    <span data-testid="cloud-upload-icon" />
  ),

  DeleteIcon: () => (
    <span data-testid="delete-icon" />
  ),

  ErrorIcon: () => (
    <span data-testid="error-icon" />
  ),

  SecurityIcon: () => (
    <span data-testid="security-icon" />
  ),

  CheckIcon: () => (
    <span data-testid="check-icon" />
  )
}));

/**
 * ---------------------------------------------------------------------------
 * Styled components
 * ---------------------------------------------------------------------------
 *
 * We deliberately do not test styles.
 */

jest.mock('./DocumentUpload.styles', () => {
  const React = require('react');

  const createComponent =
    (
      tag = 'div',
      displayName?: string
    ) => {
      const Component = ({
        children,
        ...props
      }: any) =>
        React.createElement(
          tag,
          props,
          children
        );

      Component.displayName =
        displayName ?? `Mock${tag}`;

      return Component;
    };

  return {
    DropzoneOuterWrapper: createComponent(
      'div',
      'DropzoneOuterWrapper'
    ),

    DropzoneWrapper: createComponent(
      'div',
      'DropzoneWrapper'
    ),

    DropzoneHelperContainer: createComponent(
      'div',
      'DropzoneHelperContainer'
    ),

    DragAndDropText: createComponent(
      'div',
      'DragAndDropText'
    ),

    FileListWrapper: createComponent(
      'div',
      'FileListWrapper'
    ),

    StyledFileItemCardContainer:
      createComponent(
        'div',
        'StyledFileItemCardContainer'
      ),

    FileItem: createComponent(
      'div',
      'FileItem'
    ),

    FileProgress: createComponent(
      'div',
      'FileProgress'
    ),

    IconTitleContainer: createComponent(
      'div',
      'IconTitleContainer'
    ),

    StatusIconContainer: createComponent(
      'div',
      'StatusIconContainer'
    ),

    StagedFileName: createComponent(
      'div',
      'StagedFileName'
    ),

    /**
     * Important:
     * Source does not guarantee an ARIA progressbar.
     * Add a test id here instead of asserting role="progressbar".
     */
    StyledLinearProgress: ({
      children,
      ...props
    }: any) => (
      <div
        data-testid="file-progress"
        {...props}>
        {children}
      </div>
    ),

    FileDescription: createComponent(
      'div',
      'FileDescription'
    ),

    RemoveContainer: createComponent(
      'div',
      'RemoveContainer'
    ),

    UploadContainer: createComponent(
      'div',
      'UploadContainer'
    ),

    UploadCheckTitleContainer:
      createComponent(
        'div',
        'UploadCheckTitleContainer'
      ),

    StyledToast: ({
      children,
      ...props
    }: any) => (
      <div
        data-testid="document-upload-toast"
        {...props}>
        {children}
      </div>
    ),

    StyledToastDescription:
      createComponent(
        'div',
        'StyledToastDescription'
      ),

    StyledToastViewport:
      createComponent(
        'div',
        'StyledToastViewport'
      )
  };
});

/**
 * ---------------------------------------------------------------------------
 * Typed mocks
 * ---------------------------------------------------------------------------
 */

const mockUseAppDispatch =
  useAppDispatch as unknown as jest.Mock;

const mockUseAppSelector =
  useAppSelector as unknown as jest.Mock;

const mockUseDocumentUploadViewModel =
  useDocumentUploadViewModel as unknown as jest.Mock;

const mockGetUploadedDocumentList =
  thunks.getUploadedDocumentList as unknown as jest.Mock;

const mockAddAcceptedClaimDocuments =
  thunks.addAcceptedClaimDocuments as unknown as jest.Mock;

const mockAddRejectedClaimDocuments =
  thunks.addRejectedClaimDocuments as unknown as jest.Mock;

const mockDeleteClaimDocument =
  thunks.deleteClaimDocument as unknown as jest.Mock;

const mockGetDefaultRequestOptions =
  getDefaultRequestOptions as unknown as jest.Mock;

const mockLogApiError =
  logApiError as unknown as jest.Mock;

/**
 * ---------------------------------------------------------------------------
 * Test helpers
 * ---------------------------------------------------------------------------
 */

const claimNumber = 'CLM123';

const mockDispatchFunction = jest.fn();

const defaultViewModel = {
  maxFileSize: 10 * 1024 * 1024,

  allowableFileExtensions: {
    'application/pdf': ['.pdf']
  },

  getMappedFileStatus: jest.fn(
    () => 'success'
  ),

  getFileProgressValue: jest.fn(
    () => 100
  ),

  getFileStatusDescription: jest.fn(
    () => 'Upload complete'
  ),

  invalidCharacterValidator: jest.fn(),

  sendRequest: jest.fn()
};

const createFile = (
  overrides: Record<string, unknown> = {}
) => ({
  name: 'test.pdf',
  clientStatus: 'staged',
  serverStatus: null,
  percentage: 0,
  fileSize: 100,
  ...overrides
});

const createFileList = (
  ...files: any[]
) =>
  files.reduce(
    (result, file) => ({
      ...result,
      [file.name]: file
    }),
    {}
  );

const configureSelectors = ({
  fileList = {},
  stagedFiles = [],
  hasStagedFiles = false,
  claim = claimNumber
}: {
  fileList?: Record<string, any>;
  stagedFiles?: any[];
  hasStagedFiles?: boolean;
  claim?: string;
} = {}) => {
  mockUseAppSelector.mockImplementation(
    (selector: unknown) => {
      if (selector === getClaimFileList) {
        return fileList;
      }

      if (
        selector === getClaimStagedFileList
      ) {
        return stagedFiles;
      }

      if (
        selector === areClaimStagedFiles
      ) {
        return hasStagedFiles;
      }

      if (selector === getClaimNumber) {
        return claim;
      }

      return undefined;
    }
  );
};

const createThunkAction = (
  type: string
) => ({
  type
});

/**
 * ---------------------------------------------------------------------------
 * Setup
 * ---------------------------------------------------------------------------
 */

beforeEach(() => {
  jest.clearAllMocks();

  Object.keys(
    mockTranslationValues
  ).forEach((key) => {
    delete mockTranslationValues[key];
  });

  mockUseAppDispatch.mockReturnValue(
    mockDispatchFunction
  );

  mockGetUploadedDocumentList.mockImplementation(
    () =>
      createThunkAction(
        'GET_UPLOADED_DOCUMENT_LIST'
      )
  );

  mockAddAcceptedClaimDocuments.mockImplementation(
    () =>
      createThunkAction(
        'ADD_ACCEPTED_DOCUMENTS'
      )
  );

  mockAddRejectedClaimDocuments.mockImplementation(
    () =>
      createThunkAction(
        'ADD_REJECTED_DOCUMENTS'
      )
  );

  mockDeleteClaimDocument.mockImplementation(
    () =>
      createThunkAction(
        'DELETE_DOCUMENT'
      )
  );

  mockGetDefaultRequestOptions.mockReturnValue({
    headers: {}
  });

  mockUseDocumentUploadViewModel.mockReturnValue(
    {
      ...defaultViewModel,
      getMappedFileStatus: jest.fn(
        () => 'success'
      ),
      getFileProgressValue: jest.fn(
        () => 100
      ),
      getFileStatusDescription: jest.fn(
        () => 'Upload complete'
      ),
      invalidCharacterValidator: jest.fn(),
      sendRequest: jest.fn()
    }
  );

  configureSelectors();
});

/**
 * ===========================================================================
 * DocumentUpload
 *
 * Test the public component rather than importing the non-exported loader.
 * ===========================================================================
 */

describe('DocumentUpload', () => {
  it(
    'loads the uploaded document list on mount',
    () => {
      const fileList = {
        existing: {
          name: 'existing.pdf'
        }
      };

      configureSelectors({
        fileList,
        claim: claimNumber
      });

      render(<DocumentUpload />);

      expect(
        mockGetUploadedDocumentList
      ).toHaveBeenCalledWith(
        claimNumber,
        fileList
      );

      expect(
        mockDispatchFunction
      ).toHaveBeenCalledWith(
        mockGetUploadedDocumentList
          .mock.results[0]
          .value
      );
    }
  );
});

/**
 * ===========================================================================
 * DocumentUploadComponent
 * ===========================================================================
 */

describe('DocumentUploadComponent', () => {
  describe('dropzone', () => {
    it(
      'renders the initial dropzone content',
      () => {
        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.getByText(
            'Drag and drop files, or'
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole('button', {
            name: 'Browse files'
          })
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            'Maximum size per file: 10MB'
          )
        ).toBeInTheDocument();
      }
    );

    it(
      'dispatches addAcceptedClaimDocuments when files are accepted',
      () => {
        const fileList = {
          existing: {
            name: 'existing.pdf'
          }
        };

        configureSelectors({
          fileList
        });

        render(
          <DocumentUploadComponent />
        );

        fireEvent.click(
          screen.getByTestId(
            'drop-accepted'
          )
        );

        expect(
          mockAddAcceptedClaimDocuments
        ).toHaveBeenCalledWith(
          [
            {
              name: 'accepted.pdf'
            }
          ],
          fileList
        );

        expect(
          mockDispatchFunction
        ).toHaveBeenCalledWith(
          mockAddAcceptedClaimDocuments
            .mock.results[0]
            .value
        );
      }
    );

    it(
      'dispatches addRejectedClaimDocuments when files are rejected',
      () => {
        const fileList = {
          existing: {
            name: 'existing.pdf'
          }
        };

        configureSelectors({
          fileList
        });

        render(
          <DocumentUploadComponent />
        );

        fireEvent.click(
          screen.getByTestId(
            'drop-rejected'
          )
        );

        expect(
          mockAddRejectedClaimDocuments
        ).toHaveBeenCalledWith(
          [
            {
              file: {
                name: 'rejected.pdf'
              },
              errors: []
            }
          ],
          fileList
        );

        expect(
          mockDispatchFunction
        ).toHaveBeenCalledWith(
          mockAddRejectedClaimDocuments
            .mock.results[0]
            .value
        );
      }
    );

    it(
      'shows drag active content',
      () => {
        render(
          <DocumentUploadComponent />
        );

        fireEvent.dragEnter(
          screen.getByTestId(
            'dropzone-root'
          )
        );

        expect(
          screen.getByText(
            'Drop files here'
          )
        ).toBeInTheDocument();

        expect(
          screen.queryByRole('button', {
            name: 'Browse files'
          })
        ).not.toBeInTheDocument();
      }
    );

    it(
      'passes upload constraints to Dropzone',
      () => {
        const invalidCharacterValidator =
          jest.fn();

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          invalidCharacterValidator
        });

        render(
          <DocumentUploadComponent />
        );

        const dropzone =
          screen.getByTestId('dropzone');

        expect(
          dropzone
        ).toHaveAttribute(
          'data-min-size',
          '1'
        );

        expect(
          dropzone
        ).toHaveAttribute(
          'data-max-size',
          String(
            10 * 1024 * 1024
          )
        );

        expect(
          dropzone
        ).toHaveAttribute(
          'data-has-validator',
          'true'
        );
      }
    );
  });

  describe('file list', () => {
    it(
      'does not render files when fileList is empty',
      () => {
        configureSelectors({
          fileList: {}
        });

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.queryByText('test.pdf')
        ).not.toBeInTheDocument();
      }
    );

    it(
      'renders file name and status description',
      () => {
        const file = createFile({
          name: 'claim-document.pdf'
        });

        const getFileStatusDescription =
          jest.fn(
            () => 'Upload complete'
          );

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          getFileStatusDescription
        });

        configureSelectors({
          fileList: createFileList(file)
        });

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.getByText(
            'claim-document.pdf'
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            'Upload complete'
          )
        ).toBeInTheDocument();

        expect(
          getFileStatusDescription
        ).toHaveBeenCalledWith(file);
      }
    );

    it(
      'renders progress for a non-complete file',
      () => {
        const file = createFile({
          name: 'uploading.pdf'
        });

        const getFileProgressValue =
          jest.fn(() => 50);

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          getMappedFileStatus: jest.fn(
            () => 'uploading'
          ),
          getFileProgressValue
        });

        configureSelectors({
          fileList: createFileList(file)
        });

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.getByTestId(
            'file-progress'
          )
        ).toBeInTheDocument();

        expect(
          getFileProgressValue
        ).toHaveBeenCalledWith(file);
      }
    );

    it(
      'does not render progress for a complete file',
      () => {
        const file = createFile();

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          getMappedFileStatus: jest.fn(
            () => 'success'
          )
        });

        configureSelectors({
          fileList: createFileList(file)
        });

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.queryByTestId(
            'file-progress'
          )
        ).not.toBeInTheDocument();
      }
    );
  });

  describe('file status icons', () => {
    const testCases = [
      {
        status: 'error',
        testId: 'error-icon'
      },
      {
        status: 'scanning',
        testId: 'security-icon'
      },
      {
        status: 'success',
        testId: 'check-icon'
      }
    ];

    testCases.forEach(
      ({
        status,
        testId
      }) => {
        it(
          `renders the correct icon for ${status}`,
          () => {
            const file =
              createFile();

            mockUseDocumentUploadViewModel.mockReturnValue({
              ...defaultViewModel,
              getMappedFileStatus:
                jest.fn(() => status)
            });

            configureSelectors({
              fileList:
                createFileList(file)
            });

            render(
              <DocumentUploadComponent />
            );

            expect(
              screen.getByTestId(testId)
            ).toBeInTheDocument();
          }
        );
      }
    );
  });

  describe('remove file', () => {
    it.each([
      ['staged', true],
      ['failed', true],
      ['uploaded', false]
    ])(
      'shows Remove correctly for %s files',
      (
        clientStatus,
        shouldShowRemove
      ) => {
        const file = createFile({
          name: `${clientStatus}.pdf`,
          clientStatus
        });

        configureSelectors({
          fileList: createFileList(file)
        });

        render(
          <DocumentUploadComponent />
        );

        if (shouldShowRemove) {
          expect(
            screen.getByRole('button', {
              name: 'Remove'
            })
          ).toBeInTheDocument();
        } else {
          expect(
            screen.queryByRole(
              'button',
              {
                name: 'Remove'
              }
            )
          ).not.toBeInTheDocument();
        }
      }
    );

    it(
      'dispatches deleteClaimDocument when Remove is clicked',
      async () => {
        const user = userEvent.setup();

        const file = createFile({
          name: 'staged.pdf',
          clientStatus: 'staged'
        });

        configureSelectors({
          fileList: createFileList(file)
        });

        render(
          <DocumentUploadComponent />
        );

        await user.click(
          screen.getByRole('button', {
            name: 'Remove'
          })
        );

        expect(
          mockDeleteClaimDocument
        ).toHaveBeenCalledWith(
          'staged.pdf'
        );

        expect(
          mockDispatchFunction
        ).toHaveBeenCalledWith(
          mockDeleteClaimDocument
            .mock.results[0]
            .value
        );
      }
    );
  });

  describe('staged files', () => {
    it(
      'shows upload check content when staged files exist',
      () => {
        configureSelectors({
          hasStagedFiles: true
        });

        render(
          <DocumentUploadComponent />
        );

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
      }
    );

    it(
      'hides upload check content when there are no staged files',
      () => {
        configureSelectors({
          hasStagedFiles: false
        });

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.queryByText(
            'claim:documentUpload.check.title'
          )
        ).not.toBeInTheDocument();
      }
    );

    it(
      'disables Upload files when there are no staged files',
      () => {
        configureSelectors({
          hasStagedFiles: false
        });

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.getByRole('button', {
            name: 'Upload files'
          })
        ).toBeDisabled();
      }
    );

    it(
      'enables Upload files when staged files exist',
      () => {
        configureSelectors({
          hasStagedFiles: true
        });

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.getByRole('button', {
            name: 'Upload files'
          })
        ).toBeEnabled();
      }
    );
  });

  describe('upload staged files', () => {
    it(
      'sends every staged file',
      async () => {
        const user = userEvent.setup();

        const firstFile = createFile({
          name: 'first.pdf'
        });

        const secondFile = createFile({
          name: 'second.pdf'
        });

        const sendRequest = jest
          .fn()
          .mockResolvedValue(undefined);

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          sendRequest
        });

        configureSelectors({
          hasStagedFiles: true,
          stagedFiles: [
            firstFile,
            secondFile
          ]
        });

        render(
          <DocumentUploadComponent />
        );

        await user.click(
          screen.getByRole('button', {
            name: 'Upload files'
          })
        );

        await waitFor(() => {
          expect(sendRequest)
            .toHaveBeenCalledTimes(2);
        });

        expect(sendRequest)
          .toHaveBeenNthCalledWith(
            1,
            firstFile
          );

        expect(sendRequest)
          .toHaveBeenNthCalledWith(
            2,
            secondFile
          );
      }
    );

    it(
      'disables the button while uploading and enables it after completion',
      async () => {
        const user = userEvent.setup();

        let resolveUpload:
          | (() => void)
          | undefined;

        const uploadPromise =
          new Promise<void>((resolve) => {
            resolveUpload = resolve;
          });

        const sendRequest = jest
          .fn()
          .mockReturnValue(uploadPromise);

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          sendRequest
        });

        configureSelectors({
          hasStagedFiles: true,
          stagedFiles: [
            createFile()
          ]
        });

        render(
          <DocumentUploadComponent />
        );

        const uploadButton =
          screen.getByRole('button', {
            name: 'Upload files'
          });

        await user.click(uploadButton);

        expect(
          uploadButton
        ).toBeDisabled();

        resolveUpload?.();

        await waitFor(() => {
          expect(
            uploadButton
          ).toBeEnabled();
        });
      }
    );

    it(
      'logs the error and re-enables the button when upload fails',
      async () => {
        const user = userEvent.setup();

        const error =
          new Error('Upload failed');

        const requestOptions = {
          headers: {
            Authorization:
              'Bearer TOKEN'
          }
        };

        const sendRequest = jest
          .fn()
          .mockRejectedValue(error);

        mockGetDefaultRequestOptions.mockReturnValue(
          requestOptions
        );

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          sendRequest
        });

        configureSelectors({
          hasStagedFiles: true,
          stagedFiles: [
            createFile()
          ]
        });

        render(
          <DocumentUploadComponent />
        );

        const uploadButton =
          screen.getByRole('button', {
            name: 'Upload files'
          });

        await user.click(uploadButton);

        await waitFor(() => {
          expect(
            mockLogApiError
          ).toHaveBeenCalledWith(
            error,
            'ui-api-upload-staged-files',
            requestOptions
          );
        });

        expect(
          uploadButton
        ).toBeEnabled();
      }
    );

    it(
      'gets default request options when uploading',
      async () => {
        const user = userEvent.setup();

        const sendRequest = jest
          .fn()
          .mockResolvedValue(undefined);

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          sendRequest
        });

        configureSelectors({
          hasStagedFiles: true,
          stagedFiles: [
            createFile()
          ]
        });

        render(
          <DocumentUploadComponent />
        );

        await user.click(
          screen.getByRole('button', {
            name: 'Upload files'
          })
        );

        await waitFor(() => {
          expect(
            mockGetDefaultRequestOptions
          ).toHaveBeenCalledTimes(1);
        });
      }
    );
  });

  describe('document upload toast', () => {
    it(
      'does not render toast when the feature is disabled',
      () => {
        mockTranslationValues[
          'claim:config.enableDocumentUploadToast'
        ] = false;

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.queryByTestId(
            'document-upload-toast'
          )
        ).not.toBeInTheDocument();
      }
    );

    it(
      'renders toast when the feature is enabled',
      () => {
        mockTranslationValues[
          'claim:config.enableDocumentUploadToast'
        ] = true;

        render(
          <DocumentUploadComponent />
        );

        expect(
          screen.getByTestId(
            'document-upload-toast'
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            'Thanks for your documents'
          )
        ).toBeInTheDocument();
      }
    );

    it(
      'shows toast after a successful upload when enabled',
      async () => {
        const user = userEvent.setup();

        mockTranslationValues[
          'claim:config.enableDocumentUploadToast'
        ] = true;

        const sendRequest = jest
          .fn()
          .mockResolvedValue(undefined);

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          sendRequest
        });

        configureSelectors({
          hasStagedFiles: true,
          stagedFiles: [
            createFile()
          ]
        });

        render(
          <DocumentUploadComponent />
        );

        await user.click(
          screen.getByRole('button', {
            name: 'Upload files'
          })
        );

        await waitFor(() => {
          expect(
            mockShowToast
          ).toHaveBeenCalledTimes(1);
        });
      }
    );

    it(
      'does not show toast after a successful upload when disabled',
      async () => {
        const user = userEvent.setup();

        mockTranslationValues[
          'claim:config.enableDocumentUploadToast'
        ] = false;

        const sendRequest = jest
          .fn()
          .mockResolvedValue(undefined);

        mockUseDocumentUploadViewModel.mockReturnValue({
          ...defaultViewModel,
          sendRequest
        });

        configureSelectors({
          hasStagedFiles: true,
          stagedFiles: [
            createFile()
          ]
        });

        render(
          <DocumentUploadComponent />
        );

        await user.click(
          screen.getByRole('button', {
            name: 'Upload files'
          })
        );

        await waitFor(() => {
          expect(sendRequest)
            .toHaveBeenCalledTimes(1);
        });

        expect(
          mockShowToast
        ).not.toHaveBeenCalled();
      }
    );
  });

  describe('view model configuration', () => {
    it(
      'passes claim number to the view model',
      () => {
        configureSelectors({
          claim: 'CLM456'
        });

        render(
          <DocumentUploadComponent />
        );

        expect(
          mockUseDocumentUploadViewModel
        ).toHaveBeenCalledWith({
          claimNumber: 'CLM456'
        });
      }
    );
  });
});