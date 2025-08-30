import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  date,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const users = pgTable('users', {
  uuidId: uuid('uuid_id').primaryKey().defaultRandom(),
  id: serial('id'), // Legacy ID, kept for migration
  authUserId: uuid('auth_user_id').unique(), // Links to Supabase Auth
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'), // Will be removed after migration
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});



export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'), // Legacy reference, kept for migration
  userUuidId: uuid('user_uuid_id').references(() => users.uuidId), // New UUID reference
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id'), // Legacy reference, kept for migration
  userUuidId: uuid('user_uuid_id').references(() => users.uuidId), // New UUID reference
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by'), // Legacy reference, kept for migration
  invitedByUuidId: uuid('invited_by_uuid_id').references(() => users.uuidId), // New UUID reference
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const receipts = pgTable('receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  receiptNumber: text('receipt_number').notNull().unique(),
  issueDate: date('issue_date').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  customerAddress: text('customer_address'),
  items: jsonb('items').notNull().default('[]'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('paid'),
  notes: text('notes'),
  // Business information fields
  businessName: text('business_name'),
  businessAddress: text('business_address'),
  businessPhone: text('business_phone'),
  businessEmail: text('business_email'),
  // Additional fields
  dueDate: date('due_date'),
  paymentTerms: text('payment_terms'),
  reference: text('reference'),
  // Item additional fields
  itemAdditionalFields: jsonb('item_additional_fields').default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// New table for business templates
export const businessTemplates = pgTable('business_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  lineItemFields: jsonb('line_item_fields').notNull().default('[]'), // Array of field definitions
  customFields: jsonb('custom_fields').notNull().default('[]'), // Array of header/footer field definitions
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// New table for user receipt preferences
export const receiptPreferences = pgTable('receipt_preferences', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  businessName: text('business_name'),
  businessAddress: text('business_address'),
  businessPhone: text('business_phone'),
  businessEmail: text('business_email'),
  logoUrl: text('logo_url'),
  tableColor: text('table_color').default('#3b82f6'), // Default blue color
  footerThankYouText: text('footer_thank_you_text'),
  footerContactInfo: text('footer_contact_info'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// New table for monthly usage tracking
export const monthlyUsage = pgTable('monthly_usage', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  receiptCount: integer('receipt_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Composite unique constraint to ensure one record per team per month
  uniqueTeamMonth: sql`UNIQUE(${table.teamId}, ${table.year}, ${table.month})`
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  receiptPreferences: one(receiptPreferences),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers, { relationName: 'userTeamMembers' }),
  invitationsSent: many(invitations, { relationName: 'userInvitationsSent' }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedByUuidId],
    references: [users.uuidId],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userUuidId],
    references: [users.uuidId],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userUuidId],
    references: [users.uuidId],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  team: one(teams, {
    fields: [receipts.teamId],
    references: [teams.id],
  }),

}));

export const businessTemplatesRelations = relations(businessTemplates, ({ one }) => ({
  team: one(teams, {
    fields: [businessTemplates.teamId],
    references: [teams.id],
  }),
}));

export const receiptPreferencesRelations = relations(receiptPreferences, ({ one }) => ({
  team: one(teams, {
    fields: [receiptPreferences.teamId],
    references: [teams.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type BusinessTemplate = typeof businessTemplates.$inferSelect;
export type NewBusinessTemplate = typeof businessTemplates.$inferInsert;
export type MonthlyUsage = typeof monthlyUsage.$inferSelect;
export type NewMonthlyUsage = typeof monthlyUsage.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
