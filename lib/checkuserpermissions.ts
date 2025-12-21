// @/lib/checkuserpermissions.ts

/**
 * Checks if the current user has any of the required roles.
 * @param roles Array of role names like ['ADMINISTRATOR', 'EDITOR']
 * @returns Promise<boolean>
 */
export async function checkUserPermissions(roles: string[]): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      roles.forEach(role => params.append('roles', role));
  
      const res = await fetch(`/api/check-permissions?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store', // Ensure we get fresh data
      });
  
      if (!res.ok) return false;
  
      const data = await res.json();
      return !!data.isallowed; // Matches your API: sendJSON({isallowed:authorized})
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  }