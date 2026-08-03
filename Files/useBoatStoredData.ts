import { useTranslation } from "react-i18next";
import { KnownBoatType } from "~/common/state/autorest/Policy/src/models";
import { useBoatStorageRules } from "~/feature/boat/hooks/useBoatStorageRules";
import type { QuoteBoatsState } from "~/feature/quote/boat/state";

const useBoatStoredData = (boatState: QuoteBoatsState) => {
  
  const { isReferNotRequired, isTrailerStorage } = useBoatStorageRules();

  const boatType = boatState.boatType === KnownBoatType.Yacht ? boatState.boatType : 'otherBoatType';
  const { t } = useTranslation(['base', 'quote', 'quote/boat']);

  const locationNoteMessage = t(`quote/boat:howBoatStored.boatTrailerStorageMessage.${boatType}`);
  const fieldLabel = t('quote/boat:howBoatStored.label');
  const referTitle = t(`quote/boat:howBoatStored.referTitle`);
  const referContent = t(`quote/boat:howBoatStored.refer`);
  const options = t('quote/boat:howBoatStored.options', {
    returnObjects: true
  });
  
  return {
    fieldLabel,
    locationNoteMessage,
    referTitle,
    referContent,
    options,
    isStoredOnTrailer: isTrailerStorage(boatState.howBoatStored),
    isReferNotRequired
  }
}

export {
  useBoatStoredData
}