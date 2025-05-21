import PocketBase from "pocketbase"

// Create a single PocketBase instance
export const pb = new PocketBase(process.env.POCKETBASE_URL || "https://pocketbase.evoptech.com")

// Admin authentication function
export const authenticateAdmin = async () => {
  if (!pb.authStore.isValid) {
    try {
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_EMAIL || "kajuki27@gmail.com",
        process.env.POCKETBASE_PASSWORD || "EvopTech1sH3re",
      )
    } catch (error) {
      console.error("Admin authentication error:", error)
    }
  }
}

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return pb.authStore.isValid
}

// Helper function to check if user is a danuser
export const isDanuser = () => {
  if (!isAuthenticated()) return false
  return pb.authStore.model?.isdanuser === true
}

// Helper function to get current user
export const getCurrentUser = () => {
  if (!isAuthenticated()) return null
  return pb.authStore.model
}

// Helper function to get user's organization roles
export const getUserOrganizationRoles = async (userId: string) => {
  try {
    const roles = await pb.collection("danusin_user_organization_roles").getList(1, 50, {
      filter: `user="${userId}"`,
      expand: "organization",
    })
    return roles.items
  } catch (error) {
    console.error("Error fetching user organization roles:", error)
    return []
  }
}

// Helper function to check if user has a specific role in an organization
export const hasOrganizationRole = async (userId: string, organizationId: string, role: string) => {
  try {
    const record = await pb
      .collection("danusin_user_organization_roles")
      .getFirstListItem(`user="${userId}" && organization="${organizationId}" && role="${role}"`)
    return !!record
  } catch (error) {
    return false
  }
}

// Helper function to check if user is an admin of an organization
export const isOrganizationAdmin = async (userId: string, organizationId: string) => {
  return hasOrganizationRole(userId, organizationId, "admin")
}

// Helper function to check if user is a moderator of an organization
export const isOrganizationModerator = async (userId: string, organizationId: string) => {
  return (
    hasOrganizationRole(userId, organizationId, "moderator") || hasOrganizationRole(userId, organizationId, "admin")
  )
}

// Helper function to check if user is a member of an organization
export const isOrganizationMember = async (userId: string, organizationId: string) => {
  try {
    const record = await pb
      .collection("danusin_user_organization_roles")
      .getFirstListItem(`user="${userId}" && organization="${organizationId}"`)
    return !!record
  } catch (error) {
    return false
  }
}
