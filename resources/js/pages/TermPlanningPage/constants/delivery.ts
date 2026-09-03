/** How a section is taught, which the SIS has no column for. */

import type { Delivery } from "../types";

export const DELIVERY_OPTIONS: { value: Delivery; label: string }[] = [
  { value: "onCampus", label: "On campus" },
  { value: "blended", label: "Blended" },
  { value: "online", label: "Online" },
];

export const labelOfDelivery = (delivery: Delivery) =>
  DELIVERY_OPTIONS.find((option) => option.value === delivery)?.label ??
  delivery;
