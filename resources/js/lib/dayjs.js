import dayjs from "dayjs";

// this plugin is required for ordinal date formats like `YYYY, MMMM Do`
// which are used throughout the app.
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(advancedFormat);

export default dayjs;
