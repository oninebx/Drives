import * as React from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import type { Dispatch } from 'redux';
import { bindActionCreators } from 'redux';
import type { MultiBlockItemsProps } from '~/common/components/dumb';
import { MultiBlock } from '~/common/components/dumb';
import { jumpToNextQuestionEx } from '~/common/utilities';
import { OtherDriverDetails } from '~/feature/claim/car/components';
import type { OtherDriver } from '~/feature/claim/car/state';
import { getDefaultOtherDriverState, modelPath, selectors, thunks } from '~/feature/claim/car/state';
import { AddDetailsOrSkip, Question } from '~/feature/claim/shared/components';
import { selectors as sharedSelectors } from '~/feature/claim/shared/state';
import type { ApplicationState } from '~/root/rootReducer';

// map actions to component
const mapDispatchToProps = (dispatch: Dispatch) =>
  /* istanbul ignore next */
  bindActionCreators(
    {
      getVehicleModels: (otherDriverIndex, make) => thunks.getOtherDriverVehicleModels(otherDriverIndex, make),
      clearVehicleModels: (otherDriverIndex) => thunks.clearOtherDriverVehicleModels(otherDriverIndex)
    },
    dispatch
  );

export interface OtherDriversProps extends Partial<ReturnType<typeof mapDispatchToProps>> {}

export const OtherDriversComponent = ({ clearVehicleModels, getVehicleModels }: OtherDriversProps) => {
  const dispatch = useDispatch();
  const otherDrivers = useSelector((state: ApplicationState) => selectors.getOtherDrivers(state));
  const claimType = useSelector((state: ApplicationState) => sharedSelectors.getClaimType(state));
  const vehicleMakes = useSelector((state: ApplicationState) => selectors.getVehicleMakes(state));
  const hasOtherDrivers = useSelector((state: ApplicationState) => selectors.hasOtherDrivers(state));

  const addOrSkipModel = `${modelPath}.otherDriversInd`;

  const showAddOtherDriver = (otherDriverIndex: number) => {
    const isLastOtherDriver = otherDriverIndex === otherDrivers.length - 1;
    const maxOtherDriversReached = selectors.maxOtherDriversReached();

    return isLastOtherDriver && !maxOtherDriversReached;
  };

  const updateOtherDriversArray = (otherDriverIndex: number, addOtherDriver: boolean) => {
    if (addOtherDriver) {
      dispatch(formActions.change(`${modelPath}.otherDrivers`, [...otherDrivers, getDefaultOtherDriverState()]));
    } else {
      if (otherDrivers.length === 1) {
        dispatch(formActions.change(`${modelPath}.otherDrivers`, [] as OtherDriver[]));
        dispatch(formActions.change(`${modelPath}.otherDriversInd`, false));
      } else {
        const newOtherDrivers = [...otherDrivers];
        newOtherDrivers.splice(otherDriverIndex, 1);
        dispatch(formActions.change(`${modelPath}.otherDrivers`, newOtherDrivers));
      }
    }
  };

  const handleAdd = (otherDriverIndex: number) => {
    updateOtherDriversArray(otherDriverIndex, true);
  };

  const handleRemove = (otherDriverIndex: number) => {
    updateOtherDriversArray(otherDriverIndex, false);
  };

  const getMultiBlockItems = () => {
    const multiBlockItems = [] as MultiBlockItemsProps[];
    if (otherDrivers && otherDrivers.length > 0) {
      const makes = vehicleMakes as string[];
      otherDrivers.forEach((otherDriver, i) => {
        const models = otherDriver.models;

        const multiBlockItem = {
          index: i,
          showAddLink: showAddOtherDriver(i),
          showRemoveLink: true,
          children: (
            <OtherDriverDetails
              index={i}
              modelPath={`${modelPath}.otherDrivers[${i}]`}
              formModelPath={`${modelPath}.otherDrivers[${i}]`}
              claimType={claimType}
              makes={makes}
              models={models}
              clearVehicleModels={clearVehicleModels}
              getVehicleModels={getVehicleModels}
              otherDriver={otherDrivers && otherDrivers[i]}
            />
          )
        };
        multiBlockItems.push(multiBlockItem);
      });
    }
    return multiBlockItems;
  };

  return (
    <Question id="questionOtherDrivers" model={modelPath} translation="claim/car:otherDrivers" noTick={true}>
      <AddDetailsOrSkip
        id="addOrSkipOtherDrivers"
        onClickYes={() => {
          dispatch(formActions.setTouched(addOrSkipModel));
          dispatch(formActions.setSubmitted(addOrSkipModel));
          dispatch(formActions.change(addOrSkipModel, true));
          updateOtherDriversArray(null, true);
        }}
        onClickNo={() => {
          dispatch(formActions.setTouched(addOrSkipModel));
          dispatch(formActions.setSubmitted(addOrSkipModel));
          dispatch(formActions.change(addOrSkipModel, true));
          dispatch(formActions.change(`${modelPath}.otherDrivers`, [] as OtherDriver[]));

          jumpToNextQuestionEx('#addOrSkipOtherDrivers');
        }}
        yesSelected={hasOtherDrivers}
      />
      {otherDrivers.length > 0 && getMultiBlockItems().length > 0 && (
        <>
          <br />
          <MultiBlock
            id="otherDriversAccordion"
            headerLabel="Other driver/vehicle"
            model={`${modelPath}.otherDrivers`}
            multiBlockItems={getMultiBlockItems()}
            addLinkText="I'd like to add another driver or vehicle"
            removeLinkText="Remove"
            handleAdd={handleAdd}
            handleRemove={handleRemove}
          />
        </>
      )}
    </Question>
  );
};

export const OtherDrivers = connect(null, mapDispatchToProps)(OtherDriversComponent);
