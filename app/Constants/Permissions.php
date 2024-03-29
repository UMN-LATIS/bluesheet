<?php

namespace App\Constants;

/**
 * This contains the constants for various permissions used in this app.
 */

enum Permissions: string {
    case VIEW_OWN_GROUPS = 'view own groups';
    case VIEW_GROUPS = 'view groups';
    case VIEW_PRIVATE_GROUPS = 'view private groups';
    case VIEW_USERS = 'view users';
    case CREATE_GROUPS = 'create groups';
    case EDIT_GROUPS = 'edit groups';
    case EDIT_USERS = 'edit users';
    case VIEW_REPORTS = 'view reports';
    case VIEW_LEAVES = 'view leaves';
    case EDIT_LEAVES = 'edit leaves';
    case SCHEDULE_DEPARTMENTS = 'schedule departments';
    case VIEW_ELIGIBILITY = 'view eligibility';
    case VIEW_PLANNED_COURSES = 'view planned courses';
    case EDIT_PLANNED_COURSES = 'edit planned courses';
}
