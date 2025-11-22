import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkUser() {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'test-individual-123@example.com'),
    });

    if (user) {
      console.log('User found:', user.id, user.email);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error checking user:', error);
  }
  process.exit(0);
}

checkUser();
