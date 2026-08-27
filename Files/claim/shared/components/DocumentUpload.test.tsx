import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { renderComponent } from '~/common/test-utilities/renderComponent';
import type { ApplicationFormState } from '~/root/rootReducer';
import { DocumentUpload } from './DocumentUpload';
import { getDefaultClaimSharedState } from '../../../state';

describe('Document upload test', () => {
  localStorage.setItem('access_token', 'TOKEN');

  const props: React.ComponentProps<typeof DocumentUpload> = {};

  const createFile = (name: string, size: number, type: string) => {
    const file = new File([], name, { type });
    Object.defineProperty(file, 'size', {
      get() {
        return size;
      }
    });
    return file;
  };

  const createDataTransferWithFiles = (files: File[]) => {
    return {
      dataTransfer: {
        files,
        items: files.map((file) => ({
          kind: 'file',
          size: file.size,
          type: file.type,
          getAsFile: () => file
        })),
        types: ['Files']
      }
    };
  };
  const maxFileSize = 10 * 1024 * 1024; // 10 MB

  it('Should render correctly before any action to the dropzone', () => {
    renderComponent(<DocumentUpload {...props} />);
    expect(screen.getByText('Drag and drop files, or')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse files' })).toBeInTheDocument();
    expect(screen.getByText('Maximum size per file: 10MB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeDisabled();
  });

  it('it should be in staged area when dropped if file is in the list of accepted files', async () => {
    renderComponent(<DocumentUpload {...props} />);
    const dropzone = screen.getByTestId('drop-input');
    const file = [createFile('test.png', 8, 'image/png')];
    const data = createDataTransferWithFiles(file);
    act(() => {
      fireEvent.drop(dropzone, data);
    });
    expect(await screen.findByText('test.png')).toBeInTheDocument();
    expect(await screen.findByText('documentUpload.uploadStatus.ready')).toBeInTheDocument();
    expect(await screen.findByText('Remove')).toBeInTheDocument();
    expect(await screen.findByText('documentUpload.check.title')).toBeInTheDocument();
    expect(await screen.findByText('documentUpload.check.description')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Upload files' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Upload files' })).not.toBeDisabled();
  });

  it('it should show error messaging in staged area when dropped if file is NOT in the list of accepted files', async () => {
    renderComponent(<DocumentUpload {...props} />);
    const dropzone = screen.getByTestId('drop-input');
    const file = [createFile('dontacceptme.json', 15, 'application/json')];
    const data = createDataTransferWithFiles(file);

    act(() => {
      fireEvent.drop(dropzone, data);
    });

    expect(await screen.findByText('dontacceptme.json')).toBeInTheDocument();
    expect(await screen.findByText('documentUpload.errors.fileType')).toBeInTheDocument();
    expect(await screen.findByText('Remove')).toBeInTheDocument();
  });

  it('it should show error messaging in staged area when dropped if file is OVER the maxFileSize', async () => {
    renderComponent(<DocumentUpload {...props} />);
    const dropzone = screen.getByTestId('drop-input');
    const file = [createFile('toolarge.png', maxFileSize + 1, 'image/png')];
    const data = createDataTransferWithFiles(file);

    act(() => {
      fireEvent.drop(dropzone, data);
    });
    expect(await screen.findByText('toolarge.png')).toBeInTheDocument();
    expect(await screen.findByText('documentUpload.errors.fileSize')).toBeInTheDocument();
    expect(await screen.findByText('Remove')).toBeInTheDocument();
  });

  it('should change text to Drop Files here when isDragActive is activated', async () => {
    renderComponent(<DocumentUpload {...props} />);
    const dropzone = screen.getByTestId('drop-input');
    const file = [createFile('test.png', 8, 'image/png')];

    act(() => {
      fireEvent.dragEnter(dropzone, file);
    });

    expect(await screen.findByText('Drop files here')).toBeInTheDocument();
    expect(await screen.findByText('Maximum size per file: 10MB')).toBeInTheDocument();
  });

  it('should be removed from the list of STAGED files when the remove is clicked', async () => {
    renderComponent(<DocumentUpload {...props} />);
    const dropzone = screen.getByTestId('drop-input');
    const file = [createFile('test.png', 8, 'image/png')];
    const data = createDataTransferWithFiles(file);

    act(() => {
      fireEvent.drop(dropzone, data);
    });
    expect(await screen.findByText('test.png')).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: 'Remove' });

    userEvent.click(removeButton);

    expect(screen.queryByText('test.png')).not.toBeInTheDocument();
    expect(screen.queryByText('documentUpload.uploadStatus.ready')).not.toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    expect(screen.queryByText('documentUpload.check.title')).not.toBeInTheDocument();
    expect(screen.queryByText('documentUpload.check.description')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeDisabled();
  });

  it('should show in the staged area if there are stagedFiles', async () => {
    const initialState = {
      myForms: {
        sharedClaim: {
          ...getDefaultClaimSharedState(),
          fileList: {
            test: {
              name: 'staged.png',
              clientStatus: 'staged',
              serverStatus: null,
              percentage: 0,
              fileSize: 8
            }
          }
        }
      } as Partial<ApplicationFormState>
    };
    renderComponent(<DocumentUpload {...props} />, { initialState });

    expect(await screen.getByText('staged.png')).toBeInTheDocument();
    expect(await screen.getByText('documentUpload.uploadStatus.ready')).toBeInTheDocument();
    expect(await screen.getByText('Remove')).toBeInTheDocument();
  });

  it('should show uploading state if uploading', async () => {
    const initialState = {
      myForms: {
        sharedClaim: {
          ...getDefaultClaimSharedState(),
          fileList: {
            test: {
              name: 'uploading.png',
              clientStatus: 'inProgress',
              serverStatus: null,
              percentage: 0,
              fileSize: 15
            }
          }
        }
      } as Partial<ApplicationFormState>
    };
    renderComponent(<DocumentUpload {...props} />, { initialState });

    expect(screen.getByText('uploading.png')).toBeInTheDocument();
    expect(screen.getByText('documentUpload.uploadStatus.uploading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeDisabled();
  });

  it('should show scanning state if scanning', async () => {
    const initialState = {
      myForms: {
        sharedClaim: {
          ...getDefaultClaimSharedState(),
          fileList: {
            test: {
              name: 'scanning.png',
              clientStatus: 'uploaded',
              serverStatus: 'inProgress',
              percentage: 0,
              fileSize: 8
            }
          }
        }
      } as Partial<ApplicationFormState>
    };
    renderComponent(<DocumentUpload {...props} />, { initialState });
    expect(screen.getByText('scanning.png')).toBeInTheDocument();
    expect(screen.getByText('documentUpload.uploadStatus.scanning')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeDisabled();
  });

  it('should show uploaded state if uploaded', async () => {
    const initialState = {
      myForms: {
        sharedClaim: {
          ...getDefaultClaimSharedState(),
          fileList: {
            test: {
              name: 'uploaded.png',
              clientStatus: 'uploaded',
              serverStatus: 'uploaded',
              percentage: 100,
              fileSize: 8
            }
          }
        }
      } as Partial<ApplicationFormState>
    };
    renderComponent(<DocumentUpload {...props} />, { initialState });
    expect(screen.getByText('uploaded.png')).toBeInTheDocument();
    expect(screen.getByText('documentUpload.uploadStatus.complete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload files' })).toBeDisabled();
  });

  it('it should show error messaging when file name has invalid characters', async () => {
    renderComponent(<DocumentUpload {...props} />);
    const dropzone = screen.getByTestId('drop-input');
    const file = [createFile('<dontacceptme>.json', 15, 'application/json')];
    const data = createDataTransferWithFiles(file);

    act(() => {
      fireEvent.drop(dropzone, data);
    });

    await waitFor(() => {
      expect(screen.getByText('<dontacceptme>.json')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
      expect(screen.getByText('documentUpload.errors.fileName')).toBeInTheDocument();
    });
  });

  it('it should show error messaging when file name is zero bytes', async () => {
    renderComponent(<DocumentUpload {...props} />);
    const dropzone = screen.getByTestId('drop-input');
    const file = [createFile('emptyfile.json', 0, 'application/json')];
    const data = createDataTransferWithFiles(file);

    act(() => {
      fireEvent.drop(dropzone, data);
    });

    await waitFor(() => {
      expect(screen.getByText('emptyfile.json')).toBeInTheDocument();
      expect(screen.getByText('documentUpload.errors.emptyFile')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });
  });
});
