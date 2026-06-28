import type { Database } from '@/types/database.types'

export type Client = Database['public']['Tables']['clients']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectStep = Database['public']['Tables']['project_steps']['Row']
export type AtomeDocument = Database['public']['Tables']['documents']['Row']
export type VaultCredential = Database['public']['Tables']['vault_credentials']['Row']
export type ProjectBrief = Database['public']['Tables']['project_briefs']['Row']
export type SavTicket = Database['public']['Tables']['sav_tickets']['Row']
export type TokenLedgerEntry = Database['public']['Tables']['token_ledger']['Row']
export type Admin = Database['public']['Tables']['admins']['Row']
