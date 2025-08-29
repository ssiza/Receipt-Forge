import { db } from './drizzle';
import { users, teams, teamMembers, businessTemplates } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seed() {
  const email = 'demo@receiptforge.com';
const password = 'demo123';
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [team] = await db
    .insert(teams)
    .values({
      name: 'Test Team',
    })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    role: 'owner',
  });


}

export async function seedBusinessTemplates() {
  console.log('Seeding business templates...');

  const defaultTemplates = [
    {
      name: 'General',
      description: 'Standard receipt template with basic fields',
      isDefault: true,
      lineItemFields: [
        {
          id: 'description',
          name: 'description',
          label: 'Description',
          type: 'text',
          required: true,
          placeholder: 'Item description',
          affectsCalculation: false
        },
        {
          id: 'quantity',
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          required: true,
          defaultValue: 1,
          validation: { min: 1 },
          affectsCalculation: false
        },
        {
          id: 'unitPrice',
          name: 'unitPrice',
          label: 'Unit Price',
          type: 'number',
          required: true,
          defaultValue: 0,
          validation: { min: 0 },
          affectsCalculation: true
        }
      ],
      customFields: []
    },
    {
      name: 'Shipping & Logistics',
      description: 'Template for shipping and logistics businesses',
      isDefault: false,
      lineItemFields: [
        {
          id: 'description',
          name: 'description',
          label: 'Description',
          type: 'text',
          required: true,
          placeholder: 'Item description',
          affectsCalculation: false
        },
        {
          id: 'quantity',
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          required: true,
          defaultValue: 1,
          validation: { min: 1 },
          affectsCalculation: false
        },
        {
          id: 'weight',
          name: 'weight',
          label: 'Weight (kg)',
          type: 'number',
          required: false,
          validation: { min: 0 },
          affectsCalculation: false
        },
        {
          id: 'dimensions',
          name: 'dimensions',
          label: 'Dimensions (LxWxH)',
          type: 'text',
          required: false,
          placeholder: 'e.g., 10x5x3 cm',
          affectsCalculation: false
        },
        {
          id: 'trackingNumber',
          name: 'trackingNumber',
          label: 'Tracking Number',
          type: 'text',
          required: false,
          placeholder: 'Tracking number',
          affectsCalculation: false
        },
        {
          id: 'unitPrice',
          name: 'unitPrice',
          label: 'Unit Price',
          type: 'number',
          required: true,
          defaultValue: 0,
          validation: { min: 0 },
          affectsCalculation: true
        }
      ],
      customFields: [
        {
          id: 'purchaseOrder',
          name: 'purchaseOrder',
          label: 'Purchase Order #',
          type: 'text',
          required: false,
          section: 'header',
          order: 1
        },
        {
          id: 'deliveryInstructions',
          name: 'deliveryInstructions',
          label: 'Delivery Instructions',
          type: 'textarea',
          required: false,
          section: 'footer',
          order: 1
        }
      ]
    },
    {
      name: 'Professional Services',
      description: 'Template for consulting, photography, and other professional services',
      isDefault: false,
      lineItemFields: [
        {
          id: 'description',
          name: 'description',
          label: 'Service Description',
          type: 'text',
          required: true,
          placeholder: 'Service description',
          affectsCalculation: false
        },
        {
          id: 'hoursWorked',
          name: 'hoursWorked',
          label: 'Hours Worked',
          type: 'number',
          required: false,
          validation: { min: 0 },
          affectsCalculation: false
        },
        {
          id: 'serviceDate',
          name: 'serviceDate',
          label: 'Service Date',
          type: 'date',
          required: false,
          affectsCalculation: false
        },
        {
          id: 'location',
          name: 'location',
          label: 'Location',
          type: 'text',
          required: false,
          placeholder: 'Service location',
          affectsCalculation: false
        },
        {
          id: 'rate',
          name: 'rate',
          label: 'Hourly Rate',
          type: 'number',
          required: false,
          defaultValue: 0,
          validation: { min: 0 },
          affectsCalculation: false
        },
        {
          id: 'unitPrice',
          name: 'unitPrice',
          label: 'Total Price',
          type: 'number',
          required: true,
          defaultValue: 0,
          validation: { min: 0 },
          affectsCalculation: true
        }
      ],
      customFields: [
        {
          id: 'projectName',
          name: 'projectName',
          label: 'Project Name',
          type: 'text',
          required: false,
          section: 'header',
          order: 1
        },
        {
          id: 'clientAccount',
          name: 'clientAccount',
          label: 'Client Account #',
          type: 'text',
          required: false,
          section: 'header',
          order: 2
        },
        {
          id: 'terms',
          name: 'terms',
          label: 'Payment Terms',
          type: 'text',
          required: false,
          section: 'footer',
          order: 1
        }
      ]
    },
    {
      name: 'Retail',
      description: 'Template for retail businesses with SKU and variant tracking',
      isDefault: false,
      lineItemFields: [
        {
          id: 'description',
          name: 'description',
          label: 'Product Name',
          type: 'text',
          required: true,
          placeholder: 'Product name',
          affectsCalculation: false
        },
        {
          id: 'sku',
          name: 'sku',
          label: 'SKU',
          type: 'text',
          required: false,
          placeholder: 'Stock keeping unit',
          affectsCalculation: false
        },
        {
          id: 'variant',
          name: 'variant',
          label: 'Variant',
          type: 'text',
          required: false,
          placeholder: 'Color, size, etc.',
          affectsCalculation: false
        },
        {
          id: 'quantity',
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          required: true,
          defaultValue: 1,
          validation: { min: 1 },
          affectsCalculation: false
        },
        {
          id: 'unitPrice',
          name: 'unitPrice',
          label: 'Unit Price',
          type: 'number',
          required: true,
          defaultValue: 0,
          validation: { min: 0 },
          affectsCalculation: true
        }
      ],
      customFields: [
        {
          id: 'customerAccount',
          name: 'customerAccount',
          label: 'Customer Account #',
          type: 'text',
          required: false,
          section: 'header',
          order: 1
        },
        {
          id: 'loyaltyNumber',
          name: 'loyaltyNumber',
          label: 'Loyalty Number',
          type: 'text',
          required: false,
          section: 'header',
          order: 2
        }
      ]
    }
  ];

  // For each team, create these templates
  // Note: This is a simplified approach - in production you might want to create templates per team
  for (const template of defaultTemplates) {
    try {
      await db.insert(businessTemplates).values({
        teamId: 1, // Default team ID - adjust as needed
        ...template
      });
      console.log(`Created template: ${template.name}`);
    } catch (error) {
      console.log(`Template ${template.name} might already exist:`, error);
    }
  }

  console.log('Business templates seeded successfully!');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
