import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { MultiBlockItemsProps } from '~/common/components/dumb';
import { MultiBlock } from '~/common/components/dumb';
import { jumpToNextQuestionEx } from '~/common/utilities';
import { OtherPersonDetails } from '~/feature/claim/car/components/dumb';
import type { OtherPeopleDetails } from '~/feature/claim/car/state';
import { formPath, MAX_ALLOWED_OTHER_PEOPLE_COUNT, modelPath, selectors, thunks } from '~/feature/claim/car/state';
import { AddDetailsOrSkip, Question } from '~/feature/claim/shared/components';
import type { ClaimType } from '~/feature/claim/shared/state';
import { selectors as sharedSelectors, thunks as sharedThunks } from '~/feature/claim/shared/state';
import { useAppDispatch, useAppSelector } from '~/root/store';

const getMultiBlockItems = (
  people: OtherPeopleDetails[],
  claimType: ClaimType,
  otherPersonCount: number
): MultiBlockItemsProps[] => {
  return Object.keys(people).map((index): MultiBlockItemsProps => {
    const idx = parseInt(index, 10);
    return {
      index: idx,
      showAddLink: showAddPersonLink(idx, otherPersonCount),
      showRemoveLink: true,
      children: (
        <OtherPersonDetails
          index={idx}
          modelPath={`${modelPath}.otherPeopleDetails[${index}]`}
          formModelPath={`${formPath}.otherPeopleDetails[${index}]`}
          addressState={people[idx].address}
          idPrefixString={'otherPeopleDetails'}
          translationPathString={`claim/${claimType}:otherPeopleDetails`}
          isOptional={true}
        />
      )
    };
  });
};

const showAddPersonLink = (index: number, otherPersonCount: number) => {
  const isLast = index === otherPersonCount - 1;

  return isLast && otherPersonCount < MAX_ALLOWED_OTHER_PEOPLE_COUNT;
};

export const OtherPeopleDetailsComponent = () => {
  const otherPeopleState = useAppSelector(selectors.getOtherPeopleDetails);
  const claimType = useAppSelector(sharedSelectors.getClaimType);
  const otherPeopleStateCount = useAppSelector(selectors.getOtherPeopleDetailsCount);
  const hasOtherPeople = useAppSelector(selectors.hasOtherPeopleDetails);
  const dispatch = useAppDispatch();

  const otherPeopleDetailsModel = `${modelPath}.otherPeopleDetails`;
  const { t } = useTranslation();

  const multiBlockItems = getMultiBlockItems(otherPeopleState, claimType, otherPeopleStateCount);

  return (
    <>
      <Question
        id="questionOtherPeopleDetails"
        model={modelPath}
        translation={`claim/${claimType}:otherPeopleDetails.otherDetails`}>
        <AddDetailsOrSkip
          id="addOrSkipOtherPeopleDetails"
          onClickYes={() => {
            dispatch(thunks.addOtherPerson(otherPeopleDetailsModel));
          }}
          onClickNo={() => {
            dispatch(sharedThunks.resetModelState(otherPeopleDetailsModel));
            jumpToNextQuestionEx('#addOrSkipOtherPeopleDetails');
          }}
          yesSelected={hasOtherPeople}
        />
      </Question>
      {hasOtherPeople && (
        <MultiBlock
          id={`mainHasOtherPeopleDetailsAccordion`}
          headerLabel={t(`claim/${claimType}:otherPeopleDetails.heading`)}
          model={`${modelPath}.otherPeopleDetails`}
          multiBlockItems={multiBlockItems}
          addLinkText={t(`claim/${claimType}:otherPeopleDetails.addAnotherPerson`)}
          removeLinkText={t('button.remove')}
          handleAdd={(index) => dispatch(thunks.updateOtherPeople(index, true, otherPeopleState))}
          handleRemove={(index) => dispatch(thunks.updateOtherPeople(index, false, otherPeopleState))}
        />
      )}
    </>
  );
};

export const OtherPeopleDetail = OtherPeopleDetailsComponent;

export default OtherPeopleDetail;
