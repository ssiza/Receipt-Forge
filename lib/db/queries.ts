import { desc, and, eq, isNull, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, receipts, businessTemplates, receiptPreferences, monthlyUsage } from './schema';
import { getCurrentUser } from '@/lib/supabaseClient';
import { log } from '../logger';

// Helper function to check if db is available
function checkDb() {
  if (!db) {
    throw new Error('Database connection not available. Please check your environment variables.');
  }
  return db;
}

export async function getUser() {
  try {
    const supabaseUser = await getCurrentUser();
    
    if (!supabaseUser) {
      return null;
    }

    const database = checkDb();

    // Find user in our database by auth_user_id (Supabase Auth UID)
    const user = await database
      .select()
      .from(users)
      .where(and(eq(users.authUserId, supabaseUser.id), isNull(users.deletedAt)))
      .limit(1);

    if (user.length > 0) {
      return user[0];
    }

    return null;
  } catch (error) {
    log.error('Error in getUser:', error);
    return null;
  }
}

export async function getUserWithTeam() {
  try {
    const supabaseUser = await getCurrentUser();
    
    if (!supabaseUser) {
      return null;
    }

    const database = checkDb();

    const result = await database
      .select({
        user: users,
        teamId: teamMembers.teamId
      })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(and(eq(users.authUserId, supabaseUser.id), isNull(users.deletedAt)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    log.error('Error in getUserWithTeam:', error);
    return null;
  }
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const database = checkDb();

  return await database
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const database = checkDb();

  const result = await database
    .select({
      team: teams,
      teamMember: teamMembers
    })
    .from(teamMembers)
    .leftJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  return result[0] || null;
}

export async function getReceiptsForTeam(teamId: number) {
  const database = checkDb();
  return await database
    .select()
    .from(receipts)
    .where(eq(receipts.teamId, teamId))
    .orderBy(desc(receipts.createdAt));
}

export async function getReceiptById(receiptId: string, teamId: number) {
  const database = checkDb();
  const result = await database
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, receiptId), eq(receipts.teamId, teamId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createReceipt(receiptData: {
  teamId: number;
  issueDate: Date;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  items: any[];
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  currency?: string;
  status?: string;
  notes?: string | null;
  // Business information fields
  businessName?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  // Additional fields
  dueDate?: string | null;
  paymentTerms?: string | null;
  reference?: string | null;
  // Item additional fields
  itemAdditionalFields?: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
  }> | null;
  [key: string]: any; // Allow any additional fields
}) {
  log.debug('Creating receipt with data:', {
    teamId: receiptData.teamId,
    customerName: receiptData.customerName,
    itemsCount: receiptData.items.length,
    totalAmount: receiptData.totalAmount,
    issueDate: receiptData.issueDate
  });

  // Ensure issueDate is a proper Date object
  const issueDate = receiptData.issueDate instanceof Date 
    ? receiptData.issueDate 
    : new Date(receiptData.issueDate);

  // Generate a simple receipt number using timestamp and random suffix
  const timestamp = Date.now().toString().slice(-8);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const receiptNumber = `RCPT-${timestamp}-${randomSuffix}`;

  // Validate and provide defaults for all fields
  const insertData = {
    teamId: receiptData.teamId,
    receiptNumber,
    issueDate: issueDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string format
    customerName: receiptData.customerName || '',
    customerEmail: receiptData.customerEmail || null,
    customerPhone: receiptData.customerPhone || null,
    customerAddress: receiptData.customerAddress || null,
    items: receiptData.items || [],
    subtotal: (receiptData.subtotal || 0).toString(), // Convert to string for numeric field
    taxAmount: (receiptData.taxAmount || 0).toString(), // Convert to string for numeric field
    totalAmount: (receiptData.totalAmount || 0).toString(), // Convert to string for numeric field
    currency: receiptData.currency || 'USD',
    status: receiptData.status || 'paid',
    notes: receiptData.notes || null,
    // Business information fields
    businessName: receiptData.businessName || null,
    businessAddress: receiptData.businessAddress || null,
    businessPhone: receiptData.businessPhone || null,
    businessEmail: receiptData.businessEmail || null,
    // Additional fields
    dueDate: receiptData.dueDate || null,
    paymentTerms: receiptData.paymentTerms || null,
    reference: receiptData.reference || null,
    // Item additional fields
    itemAdditionalFields: receiptData.itemAdditionalFields || [],
  };

  log.debug('Inserting receipt with validated data:', insertData);

  try {
    const [newReceipt] = await checkDb().insert(receipts).values(insertData).returning();
    log.debug('Successfully created receipt:', { id: newReceipt.id, receiptNumber: newReceipt.receiptNumber });
    return newReceipt;
  } catch (error) {
    log.error('Failed to create receipt:', error);
    throw error;
  }
}



export async function updateReceipt(
  receiptId: string,
  teamId: number,
  updateData: Partial<typeof receipts.$inferInsert>
) {
  const [updatedReceipt] = await checkDb()
    .update(receipts)
    .set({
      ...updateData,
      updatedAt: new Date()
    })
    .where(and(eq(receipts.id, receiptId), eq(receipts.teamId, teamId)))
    .returning();

  return updatedReceipt;
}

export async function deleteReceipt(receiptId: string, teamId: number) {
  return await checkDb().delete(receipts).where(and(eq(receipts.id, receiptId), eq(receipts.teamId, teamId)));
}



// Business Template Queries
export async function getBusinessTemplatesForTeam(teamId: number) {
  const database = checkDb();
  return await database.select().from(businessTemplates).where(eq(businessTemplates.teamId, teamId));
}

export async function getBusinessTemplateById(templateId: string, teamId: number) {
  const database = checkDb();
  const templates = await database
    .select()
    .from(businessTemplates)
    .where(and(eq(businessTemplates.id, templateId), eq(businessTemplates.teamId, teamId)));
  return templates[0] || null;
}

export async function createBusinessTemplate(data: {
  teamId: number;
  name: string;
  description?: string;
  isDefault: boolean;
  lineItemFields: any;
  customFields: any;
}) {
  const [template] = await checkDb().insert(businessTemplates).values(data).returning();
  return template;
}

export async function updateBusinessTemplate(
  templateId: string,
  teamId: number,
  data: Partial<typeof businessTemplates.$inferInsert>
) {
  const [template] = await checkDb()
    .update(businessTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(businessTemplates.id, templateId), eq(businessTemplates.teamId, teamId)))
    .returning();
  return template;
}

export async function deleteBusinessTemplate(templateId: string, teamId: number) {
  return await checkDb()
    .delete(businessTemplates)
    .where(and(eq(businessTemplates.id, templateId), eq(businessTemplates.teamId, teamId)));
}

export async function getDefaultBusinessTemplate(teamId: number) {
  const database = checkDb();
  const templates = await database
    .select()
    .from(businessTemplates)
    .where(and(eq(businessTemplates.teamId, teamId), eq(businessTemplates.isDefault, true)));
  return templates[0] || null;
}

// Receipt Preferences Queries
export async function getReceiptPreferences(teamId: number) {
  const database = checkDb();
  const preferences = await database
    .select()
    .from(receiptPreferences)
    .where(eq(receiptPreferences.teamId, teamId))
    .limit(1);
  
  return preferences[0] || null;
}

export async function createOrUpdateReceiptPreferences(teamId: number, data: {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  logoUrl?: string;
  tableColor?: string;
  footerThankYouText?: string;
  footerContactInfo?: string;
}) {
  const existing = await getReceiptPreferences(teamId);
  
  if (existing) {
    const [updated] = await checkDb()
      .update(receiptPreferences)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(receiptPreferences.id, existing.id))
      .returning();
    return updated;
  } else {
    const [created] = await checkDb()
      .insert(receiptPreferences)
      .values({
        teamId,
        ...data
      })
      .returning();
    return created;
  }
}

// Monthly Usage Tracking Functions
export async function getCurrentMonthUsage(teamId: number): Promise<number> {
  const database = checkDb();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12

  const usage = await database
    .select()
    .from(monthlyUsage)
    .where(and(
      eq(monthlyUsage.teamId, teamId),
      eq(monthlyUsage.year, year),
      eq(monthlyUsage.month, month)
    ))
    .limit(1);

  return usage[0]?.receiptCount || 0;
}

export async function incrementMonthlyUsage(teamId: number): Promise<void> {
  const database = checkDb();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12

  // Check if record exists
  const existing = await database
    .select()
    .from(monthlyUsage)
    .where(and(
      eq(monthlyUsage.teamId, teamId),
      eq(monthlyUsage.year, year),
      eq(monthlyUsage.month, month)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    await database
      .update(monthlyUsage)
      .set({
        receiptCount: sql`${monthlyUsage.receiptCount} + 1`,
        updatedAt: new Date()
      })
      .where(and(
        eq(monthlyUsage.teamId, teamId),
        eq(monthlyUsage.year, year),
        eq(monthlyUsage.month, month)
      ));
  } else {
    // Create new record
    await database.insert(monthlyUsage).values({
      teamId,
      year,
      month,
      receiptCount: 1
    });
  }
}

export async function resetMonthlyUsage(teamId: number): Promise<void> {
  // This function can be used when a user upgrades to reset their usage
  // or for admin purposes to reset usage for a specific month
  const database = checkDb();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  await database
    .update(monthlyUsage)
    .set({
      receiptCount: 0,
      updatedAt: new Date()
    })
    .where(and(
      eq(monthlyUsage.teamId, teamId),
      eq(monthlyUsage.year, year),
      eq(monthlyUsage.month, month)
    ));
}
