import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  if (!db) return null;

  return db.notification.create({
    data: {
      id: uuidv4(),
      userId,
      type,
      title,
      message,
      metadata,
    },
  });
}

export async function getNotifications(userId: string, unreadOnly: boolean = false) {
  if (!db) return [];

  return db.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  if (!db) return;

  return db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  if (!db) return;

  return db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getUnreadCount(userId: string) {
  if (!db) return 0;

  return db.notification.count({
    where: { userId, read: false },
  });
}
