import { useTranslation } from "react-i18next";
import { KnownHowBoatStored } from "~/common/state/autorest/Policy/src/models";
import { KnownBoatType } from "~/common/state/autorest/PolicyAuth/src";
import type { QuoteBoatsState } from "~/feature/quote/boat/state";
import { isBoatOnOtherTrailer, isBoatStoredOnPrivateTrailer } from "~/feature/quote/boat/state/selectors";

const useBoatStoredData = (boatState: QuoteBoatsState, flag?: boolean) => {

  
  const isStoredOnOtherTrailer = isBoatOnOtherTrailer(boatState);
  const boatType = boatState.boatType === KnownBoatType.Yacht ? boatState.boatType : 'otherBoatType';
  
  const locationType = isStoredOnOtherTrailer ? 'trailerOther' : 'default';
  const { t } = useTranslation(['base', 'quote', 'quote/boat']);
  
  const locationNoteMessage = t(`quote/boat:howBoatStored.boatTrailerStorageMessage.${boatType}`);
  
  const fieldLabel = t('quote/boat:howBoatStored.label');
  const referTitle = t(`quote/boat:howBoatStored.referTitle.${locationType}`);
  const referContent = t(`quote/boat:howBoatStored.refer.${locationType}`);
  console.log(boatType, locationType, referTitle, referContent);
  const options = t('quote/boat:howBoatStored.options', {
    returnObjects: true
  });
  const isStoredOnPrivateTrailer = isBoatStoredOnPrivateTrailer(boatState);
  const isStoredOnTrailer = flag ? isStoredOnPrivateTrailer : (isStoredOnOtherTrailer || isStoredOnPrivateTrailer);
  const validateRefer = (s: KnownHowBoatStored) => {
    const baseValid = s !== KnownHowBoatStored.SwingMoored && 
                      s !== KnownHowBoatStored.PileMoored && 
                      s !== KnownHowBoatStored.Other;
                    
    return flag ? (baseValid && s !== KnownHowBoatStored.OnTrailerOther) : baseValid;
  };
  return {
    fieldLabel,
    locationNoteMessage,
    referTitle,
    referContent,
    options,
    isStoredOnTrailer,
    validateRefer
  }
}

export {
  useBoatStoredData
}