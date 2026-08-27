import * as React from 'react';
import * as styles from './styles';
import { Button, Card, Typography } from '@tower/tui';
import { getDefaultRequestOptions } from '~/common/state/services';
import { logApiError } from '~/common/utilities';
import type { StagedFile } from '~/feature/claim/shared/state';
import { thunks } from '~/feature/claim/shared/state';
import {
  areClaimStagedFiles,
  getClaimFileList,
  getClaimNumber,
  getClaimStagedFileList
} from '~/feature/claim/shared/state/selectors';
import { useDocumentUploadViewModel } from './useDocumentUploadViewModel';
import { useAppDispatch, useAppSelector } from '~/root/store';
import { useTranslation } from 'react-i18next';
import { CloudUploadIcon, DeleteIcon, ErrorIcon, SecurityIcon, CheckIcon } from '@tower/tui/icons';
import Dropzone from 'react-dropzone';

export interface DocumentUploadProps {}
const DocumentUploadLoader: React.FC<DocumentUploadProps> = (props) => {
  const fileList = useAppSelector(getClaimFileList);
  const claimNumber = useAppSelector(getClaimNumber);
  const dispatch = useAppDispatch();
  React.useEffect(() => {
    dispatch(thunks.getUploadedDocumentList(claimNumber, fileList));
  }, []);
  return <DocumentUploadComponent {...props} />;
};

export const DocumentUploadComponent: React.FC<DocumentUploadProps> = () => {
  const { t } = useTranslation();
  const stagedFiles = useAppSelector(getClaimStagedFileList);
  const fileList = useAppSelector(getClaimFileList);
  const areStagedFiles = useAppSelector(areClaimStagedFiles);
  const claimNumber = useAppSelector(getClaimNumber);
  const dispatch = useAppDispatch();

  const {
    maxFileSize,
    allowableFileExtensions,
    getMappedFileStatus,
    getFileProgressValue,
    getFileStatusDescription,
    invalidCharacterValidator,
    sendRequest
  } = useDocumentUploadViewModel({ claimNumber });

  const [uploading, setUploading] = React.useState(false);

  const uploadStagedFiles = async () => {
    setUploading(true);
    const requestOptions = getDefaultRequestOptions();
    const uploadPromises = stagedFiles.map((file) => {
      return sendRequest(file);
    });

    try {
      await Promise.all(uploadPromises);
      setUploading(false);
    } catch (e) {
      logApiError(e, 'ui-api-upload-staged-files', requestOptions);
      setUploading(false);
    }
  };

  return (
    <>
      <Dropzone
        onDropAccepted={(acceptedFiles) => {
          dispatch(thunks.addAcceptedClaimDocuments(acceptedFiles, fileList));
        }}
        onDropRejected={(rejectedFiles) => {
          dispatch(thunks.addRejectedClaimDocuments(rejectedFiles, fileList));
        }}
        validator={invalidCharacterValidator}
        accept={allowableFileExtensions}
        minSize={1}
        maxSize={maxFileSize}
        disabled={false}
        noClick
        noKeyboard>
        {({ getRootProps, getInputProps, open, isDragActive }) => {
          return (
            <styles.DropzoneOuterWrapper isDragActive={isDragActive}>
              <styles.DropzoneWrapper {...getRootProps()} isDragActive={isDragActive}>
                <input data-testid="drop-input" {...getInputProps()} />

                <styles.DropzoneHelperContainer>
                  {isDragActive ? (
                    <>
                      <styles.DragAndDropText variant="body" bold>
                        Drop files here
                      </styles.DragAndDropText>
                      <styles.DragAndDropText variant="small">Maximum size per file: 10MB</styles.DragAndDropText>
                    </>
                  ) : (
                    <>
                      <styles.DragAndDropText variant="body" bold>
                        Drag and drop files, or
                      </styles.DragAndDropText>
                      <Button variant="secondary" onClick={open}>
                        Browse files
                      </Button>
                      <styles.DragAndDropText variant="small">Maximum size per file: 10MB</styles.DragAndDropText>
                    </>
                  )}
                </styles.DropzoneHelperContainer>
              </styles.DropzoneWrapper>
            </styles.DropzoneOuterWrapper>
          );
        }}
      </Dropzone>

      <styles.FileListWrapper>
        {fileList && Object.keys(fileList).length > 0 && (
          <>
            {Object.entries(fileList).map(([fileName, stagedFile]: StagedFile, index: number) => {
              const fileStatus = getMappedFileStatus(stagedFile);
              const isComplete = fileStatus === 'success';
              let statusIcon = null;
              if (fileStatus === 'error') {
                statusIcon = <ErrorIcon color="neutral900Default" />;
              } else if (fileStatus === 'scanning') {
                statusIcon = <SecurityIcon color="neutral900Default" />;
              } else if (fileStatus === 'success') {
                statusIcon = <CheckIcon color="neutral900Default" />;
              }
              return (
                <styles.StyledFileItemCardContainer key={fileName}>
                  <Card.Content>
                    <styles.FileItem status={fileStatus}>
                      <styles.FileProgress>
                        <styles.IconTitleContainer>
                          <styles.StatusIconContainer status={fileStatus}>{statusIcon}</styles.StatusIconContainer>
                          <styles.StagedFileName variant="body">{stagedFile.name}</styles.StagedFileName>
                        </styles.IconTitleContainer>
                        {!isComplete && (
                          <styles.StyledLinearProgress
                            id={`uploadFile${index}`}
                            value={getFileProgressValue(stagedFile)}
                            status={fileStatus}
                          />
                        )}
                        <styles.FileDescription variant="small" status={fileStatus}>
                          {getFileStatusDescription(stagedFile)}
                        </styles.FileDescription>
                      </styles.FileProgress>
                      {(stagedFile.clientStatus === 'staged' || stagedFile.clientStatus === 'failed') && (
                        <styles.RemoveContainer>
                          <Button
                            variant="tertiary"
                            onClick={() => {
                              dispatch(thunks.deleteClaimDocument(stagedFile.name));
                            }}>
                            <DeleteIcon color="link500Default" />
                            Remove
                          </Button>
                        </styles.RemoveContainer>
                      )}
                    </styles.FileItem>
                  </Card.Content>
                </styles.StyledFileItemCardContainer>
              );
            })}
          </>
        )}

        <styles.UploadContainer>
          {areStagedFiles && (
            <Card.Container borderColor="primary">
              <Card.Content>
                <styles.UploadCheckTitleContainer>
                  <ErrorIcon />
                  <Typography variant="body">{t('claim:documentUpload.check.title')}</Typography>
                </styles.UploadCheckTitleContainer>
                <Typography variant="body">{t('claim:documentUpload.check.description')}</Typography>
              </Card.Content>
            </Card.Container>
          )}
          <Button
            variant="secondary"
            id="uploadFilesButton"
            type="button"
            disabled={uploading || !areStagedFiles}
            onClick={uploadStagedFiles}>
            <CloudUploadIcon />
            Upload files
          </Button>
        </styles.UploadContainer>
      </styles.FileListWrapper>
    </>
  );
};

export const DocumentUpload = DocumentUploadLoader;
