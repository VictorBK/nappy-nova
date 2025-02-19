import { db } from './dbConfig';
import { Users, Reports, Rewards, CollectedWastes, Notifications, Transactions } from './schema';
import { eq, sql, and, desc, ne } from 'drizzle-orm';

export async function createUser(email: string, name: string) {
    try {
      const [user] = await db.insert(Users).values({ email, name }).returning().execute();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
}

export async function getUserByEmail(email: string) {
    try {
      const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute();
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
}

export async function getReportsByUserId(userId: number) {
    try {
      const reports = await db.select().from(Reports).where(eq(Reports.userId, userId)).execute();
      return reports;
    } catch (error) {
      console.error("Error fetching reports:", error);
      return [];
    }
}

export async function getUserBalance(userId: number): Promise<number> {
    const transactions = await getRewardTransactions(userId) || [];

    if(!transactions) return 0;
    const balance = transactions.reduce((acc:number, transaction:any) => {
      return transaction.type.startsWith('earned') ? acc + transaction.amount : acc - transaction.amount
    }, 0);
    return Math.max(balance, 0); // Ensure balance is never negative
  }

export async function getRewardTransactions(userId: number) {
    try {
      console.log('Fetching transactions for user ID:', userId)
      const transactions = await db
        .select({
          id: Transactions.id,
          type: Transactions.type,
          amount: Transactions.amount,
          description: Transactions.description,
          date: Transactions.date,
        })
        .from(Transactions)
        .where(eq(Transactions.userId, userId))
        .orderBy(desc(Transactions.date))
        .limit(10)
        .execute();
  
      console.log('Raw transactions from database:', transactions)
  
      const formattedTransactions = transactions.map(t => ({
        ...t,
        date: t.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      }));
  
      console.log('Formatted transactions:', formattedTransactions)
      return formattedTransactions;
    } catch (error) {
      console.error("Error fetching reward transactions:", error);
      return [];
    }
}

export async function markNotificationAsRead(notificationId: number) {
  try {
    await db.update(Notifications).set({ isRead: true }).where(eq(Notifications.id, notificationId)).execute();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

export async function createReport(
  userId: number,
  location: string,
  wasteType: string,
  amount: string,
  imageUrl?: string,
  type?: string,
  verificationResult?: any
) {
  try {
    const [report] = await db
      .insert(Reports)
      .values({
        userId,
        location,
        wasteType,
        amount,
        imageUrl,
        verificationResult,
        status: "pending",
      })
      .returning()
      .execute();

    // Award 10 points for reporting waste
    const pointsEarned = 10;
    await updateRewardPoints(userId, pointsEarned);

    // Create a transaction for the earned points
    await createTransaction(userId, 'earned_report', pointsEarned, 'Points earned for reporting waste');

    // Create a notification for the user
    await createNotification(
      userId,
      `You've earned ${pointsEarned} points for reporting waste!`,
      'reward'
    );

    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null;
  }
}

export async function updateRewardPoints(userId: number, pointsToAdd: number) {
  try {
    const [updatedReward] = await db
      .update(Rewards)
      .set({ 
        points: sql`${Rewards.points} + ${pointsToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(Rewards.userId, userId))
      .returning()
      .execute();
    return updatedReward;
  } catch (error) {
    console.error("Error updating reward points:", error);
    return null;
  }
}

export async function createTransaction(userId: number, type: 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string) {
  try {
    const [transaction] = await db
      .insert(Transactions)
      .values({ userId, type, amount, description })
      .returning()
      .execute();
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

export async function createNotification(userId: number, message: string, type: string) {
  try {
    const [notification] = await db
      .insert(Notifications)
      .values({ userId, message, type })
      .returning()
      .execute();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}