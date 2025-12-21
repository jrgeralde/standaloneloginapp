//lib/permissions.js

import { query } from './db'; 

/**
 * Pure logic helper (The one you already have)
 */
export function hasUserRoles(userRoles, requiredRoles) {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!userRoles || !Array.isArray(userRoles)) return false;
  
    return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * The "Server-Side Truth" helper
 * Performs the DB query and validates permissions
 */
export async function authorizeUser(userId, requiredRoles) {
  // If no userId is provided (unauthenticated), immediately deny access
  if (!userId) return false;

  const res = await query(
    `SELECT r.name 
     FROM roles r 
     JOIN usersroles ur ON r.id = ur.roleid 
     WHERE ur.userid = $1`,
    [userId]
  );
  
  const actualUserRoles = res.rows.map(r => r.name);
  
  // Return the boolean result directly
  return hasUserRoles(actualUserRoles, requiredRoles);
}