import { pgTable, serial, varchar, timestamp, text, boolean, jsonb, integer, uuid, date, numeric } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Users table - simplified without team dependencies
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: text('auth_user_id').notNull().unique(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 50 }).default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Receipts table - no team dependencies, only user_id
export const receipts = pgTable('receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
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

// Business templates table - no team dependencies, only user_id
export const businessTemplates = pgTable('business_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  lineItemFields: jsonb('line_item_fields').notNull().default('[]'), // Array of field definitions
  customFields: jsonb('custom_fields').notNull().default('[]'), // Array of header/footer field definitions
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Receipt preferences table - no team dependencies, only user_id
export const receiptPreferences = pgTable('receipt_preferences', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
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

// Monthly usage tracking table - no team dependencies, only user_id
export const monthlyUsage = pgTable('monthly_usage', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1-12
  receiptCount: integer('receipt_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Composite unique constraint to ensure one record per user per month
  uniqueUserMonth: sql`UNIQUE(${table.userId}, ${table.year}, ${table.month})`
}));

// Relations - simplified without team dependencies
export const usersRelations = relations(users, ({ many }) => ({
  receipts: many(receipts),
  businessTemplates: many(businessTemplates),
  receiptPreferences: many(receiptPreferences),
  monthlyUsage: many(monthlyUsage),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  user: one(users, {
    fields: [receipts.userId],
    references: [users.id],
  }),
}));

export const businessTemplatesRelations = relations(businessTemplates, ({ one }) => ({
  user: one(users, {
    fields: [businessTemplates.userId],
    references: [users.id],
  }),
}));

export const receiptPreferencesRelations = relations(receiptPreferences, ({ one }) => ({
  user: one(users, {
    fields: [receiptPreferences.userId],
    references: [users.id],
  }),
}));

export const monthlyUsageRelations = relations(monthlyUsage, ({ one }) => ({
  user: one(users, {
    fields: [monthlyUsage.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;

export type BusinessTemplate = typeof businessTemplates.$inferSelect;
export type NewBusinessTemplate = typeof businessTemplates.$inferInsert;

export type ReceiptPreferences = typeof receiptPreferences.$inferSelect;
export type NewReceiptPreferences = typeof receiptPreferences.$inferInsert;

export type MonthlyUsage = typeof monthlyUsage.$inferSelect;
export type NewMonthlyUsage = typeof monthlyUsage.$inferInsert;
