import moment from "moment";
import { XBrandId } from "~/common/state";

const POLICY_START_DATE_MAX_DAYS = 60;
const TMI_POLICY_START_DATE_LAST_AVAILABLE_DATE = '2026-12-02';

const getPolicyStartDateRules = (
  startDate: string | undefined) => {

  const minDate = moment().startOf('day');
  let maxDate = minDate.clone().add(POLICY_START_DATE_MAX_DAYS, 'days');

  if (XBrandId === 'TMI') {
    const tmiMaxDate = moment(TMI_POLICY_START_DATE_LAST_AVAILABLE_DATE).startOf('day');
    if (tmiMaxDate.isBefore(maxDate)) {
      maxDate = tmiMaxDate;
    }
  }

  const date = startDate ? moment(startDate) : null;

  const isExpired = !!date && date.isBefore(minDate);
  const isBeyondMaxDate = !!date && date.isAfter(maxDate);

  return {
    minDate: minDate.toDate(),
    maxDate: maxDate.toDate(),
    date: date?.toDate() ?? null,
    isExpired,
    isBeyondMaxDate
  };
};

export default getPolicyStartDateRules;