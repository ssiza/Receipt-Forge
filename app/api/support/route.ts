import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real application, you would:
    // 1. Send an email to your support team
    // 2. Store the message in a database
    // 3. Create a support ticket
    // 4. Send a confirmation email to the user

    // For now, we'll just log the message and return success
    console.log('Support request received:', { name, email, message });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(
      { success: true, message: 'Support request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing support request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 