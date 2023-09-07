import dayjs from "dayjs";

// this plugin is required for ordinal date formats like `YYYY, MMMM Do`
// which are used throughout the app.
import advancedFormat from "dayjs/plugin/advancedFormat";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(advancedFormat);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export default dayjs;
