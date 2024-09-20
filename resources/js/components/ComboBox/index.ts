export { default as ComboBox } from "./ComboBox.vue";
export { default as ComboBoxOption } from "./ComboBoxOption.vue";

export interface ComboBoxOptionType {
  id?: string | number; // new options might have an undefined id
  label: string;
  secondaryLabel?: string;
}
