import * as React from 'react';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import type { Dispatch } from 'redux';
import { bindActionCreators } from 'redux';
import type { InjectedTranslateProps } from '~/common/utilities/translation';
import { translate } from '~/common/utilities/translation';
import { OtherDriverDetails } from '~/feature/claim/car/components';
import { getDefaultOtherDriverState, selectors, thunks } from '~/feature/claim/car/state';
import { AddDetailsOrSkip, Question } from '~/feature/claim/shared/components';
import type { ApplicationState } from '~/root/rootReducer';
import store from '~/root/store';

const mapStateToProps = (state: ApplicationState) => ({
  carState: selectors.getBaseState(state),
  carForm: selectors.getBaseFormState(state)
});

// map actions to component
const mapDispatchToProps = (dispatch: Dispatch) =>
  /* istanbul ignore next */
  bindActionCreators(
    {
      getVehicleModels: (otherDriverIndex, make) => thunks.getPropertyDamageVehicleModels(otherDriverIndex, make),
      clearVehicleModels: (otherDriverIndex) => thunks.clearPropertyDamageVehicleModels(otherDriverIndex)
    },
    dispatch
  );

export interface VehicleDamageDetailsProps
  extends Partial<ReturnType<typeof mapStateToProps>>,
    Partial<ReturnType<typeof mapDispatchToProps>>,
    InjectedTranslateProps {
  index: number;
  modelPath: string;
  formModelPath: string;
}

export class VehicleDamageDetailsComponent extends React.Component<VehicleDamageDetailsProps> {
  public render() {
    const state = store.getState();
    const { carState, index, modelPath, formModelPath, getVehicleModels, clearVehicleModels } = this.props;

    const damage = selectors.getOtherPropertyDamage(state, index);

    const addOrSkipModel = `${modelPath}.hasDriverDetails`;
    const driverDetailsModel = `${modelPath}.driverDetails`;

    return (
      <>
        <Question
          id="questionVehicleDamageDetails"
          model={modelPath}
          translation="claim:otherPropertyDamage.vehicleDamageDetails"
          noTick={true}>
          <AddDetailsOrSkip
            id="addOrSkipVehicleDamageDetails"
            onClickYes={() => {
              store.dispatch(formActions.setTouched(addOrSkipModel));
              store.dispatch(formActions.setSubmitted(addOrSkipModel));
              store.dispatch(formActions.change(addOrSkipModel, true));
            }}
            onClickNo={() => {
              store.dispatch(formActions.setTouched(addOrSkipModel));
              store.dispatch(formActions.setSubmitted(addOrSkipModel));
              store.dispatch(formActions.change(addOrSkipModel, false));
              store.dispatch(formActions.change(driverDetailsModel, getDefaultOtherDriverState()));
            }}
            yesSelected={selectors.hasVehicleDamageDetails(state, index)}
          />
        </Question>
        {selectors.hasVehicleDamageDetails(state, index) && (
          <OtherDriverDetails
            index={index}
            modelPath={driverDetailsModel}
            formModelPath={`${formModelPath}.driverDetails`}
            makes={carState.vehicleMakes}
            models={selectors.getDamageVehicleModels(state, index)}
            clearVehicleModels={clearVehicleModels}
            getVehicleModels={getVehicleModels}
            otherDriver={damage && damage.driverDetails}
          />
        )}
      </>
    );
  }
}

const TranslatedComponent = translate(['base', 'claim', 'claim/car'])(VehicleDamageDetailsComponent);

export const VehicleDamageDetails = connect(mapStateToProps, mapDispatchToProps)(TranslatedComponent);
