export type RLSOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';

export interface RLSPolicy {
  id: string; // generated ID for ReactFlow nodes
  name: string;
  table: string;
  command: RLSOperation;
  roles: string[];
  qual: string; // USING expression
  with_check: string | null; // WITH CHECK expression
}

export interface RLSTable {
  name: string;
  has_rls: boolean;
  columns?: string[]; // for potential future column selector
}

export interface RLSMetadata {
  tables: RLSTable[];
  policies: RLSPolicy[];
}
