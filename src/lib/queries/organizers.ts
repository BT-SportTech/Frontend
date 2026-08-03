import { api } from '../api'
import type { AuthResponse } from '../types'

export type OrganizerListItem = {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string | null
  createdAt: string
  assignedEventsCount: number
  status: 'ACTIVE'
}

export type PendingInvite = {
  id: string
  email: string
  firstName: string
  lastName: string
  expiresAt: string
  createdAt: string
  status: 'PENDING'
}

export type OrganizersListResponse = {
  organizers: OrganizerListItem[]
  pendingInvites: PendingInvite[]
}

export type InvitePreview = {
  email: string
  firstName: string
  lastName: string
  expiresAt: string
}

export const organizersKeys = {
  all: ['organizers'] as const,
  list: () => [...organizersKeys.all, 'list'] as const,
  invite: (token: string) => [...organizersKeys.all, 'invite', token] as const,
}

export async function fetchOrganizers(): Promise<OrganizersListResponse> {
  return api<OrganizersListResponse>('/organizers')
}

export async function inviteOrganizer(body: {
  email: string
  firstName: string
  lastName: string
}): Promise<PendingInvite> {
  return api('/organizers/invite', { method: 'POST', body })
}

export async function resendOrganizerInvite(
  inviteId: string,
): Promise<PendingInvite> {
  return api(`/organizers/invites/${inviteId}/resend`, { method: 'POST' })
}

export async function fetchInvitePreview(token: string): Promise<InvitePreview> {
  return api(`/organizers/invite/${token}`, { auth: false })
}

export async function acceptOrganizerInvite(body: {
  token: string
  password: string
  username?: string
}): Promise<AuthResponse> {
  return api('/organizers/accept-invite', {
    method: 'POST',
    body,
    auth: false,
  })
}
