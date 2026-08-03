import { useSelector } from "react-redux";
import  {KnownHowBoatStored } from "~/common/state/autorest/Policy/src"
import { getFeatureFlags } from "~/feature/portal/state/selectors";

const useBoatStorageRules = () => {
  const flags = useSelector(getFeatureFlags);
  const flag = !!(flags['q2b-boat-referral-on-trailer-other']);

  const isReferNotRequired = (s: KnownHowBoatStored) => {
    const baseValid = s !== KnownHowBoatStored.SwingMoored &&
                      s !== KnownHowBoatStored.PileMoored &&
                      s !== KnownHowBoatStored.Other;

    return flag ? (baseValid && s !== KnownHowBoatStored.OnTrailerOther) : baseValid;
  };

  const isTrailerStorage = (howBoatStored: KnownHowBoatStored): boolean => {
    const isStoredOnPrivateTrailer = howBoatStored === KnownHowBoatStored.OnTrailerPrivateResidence;
    return flag ? isStoredOnPrivateTrailer : (isStoredOnPrivateTrailer || howBoatStored === KnownHowBoatStored.OnTrailerOther)
  }

  return {
    isReferNotRequired,
    isTrailerStorage
  }
  
}

export {
  useBoatStorageRules
}