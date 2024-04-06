import * as T from "@/types";
import { usePermissionsStore } from "@/stores/usePermissionsStore";

export default function $can(permissionName: T.UserPermission) {
  const { can } = usePermissionsStore();
  return can(permissionName);
}
