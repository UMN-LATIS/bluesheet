<?php

namespace App\Constants;

/**
 * Constants for various Roles (related to permissions, i.e. Spatie Roles)
 */

enum PermissionRoles: string {
    case BASIC_USER = 'basic user';
    case VIEW_USER = 'view user';
    case SITE_ADMIN = 'site admin';
    case GLOBAL_GROUP_ADMIN = 'global group admin';
    case SUPER_ADMIN = 'super admin';
}
