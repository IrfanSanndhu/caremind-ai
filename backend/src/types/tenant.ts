export interface TenantContext {
  tenantId: string;
  dbUrl: string;
  schemaName?: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  dbUrl: string;
  plan: string;
  createdAt: Date;
}
