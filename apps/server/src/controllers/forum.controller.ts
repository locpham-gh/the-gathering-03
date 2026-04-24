import mongoose from "mongoose";
import { ForumTopic, IForumTopic } from "../models/ForumTopic.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { broadcastNotification } from "../index.js";

// List all topics with author info (lean is faster and more similar to plain JSON)
export const getAllTopics = async () => {
    try {
        const topics = await ForumTopic.find()
            .populate('authorId', 'displayName avatarUrl')
            .populate({
                path: 'replies.authorId',
                select: 'displayName avatarUrl'
            })
            .populate({
                path: 'replies.replyTo',
                select: 'displayName'
            })
            .sort({ updatedAt: -1 });

        return topics;
    } catch (error) {
        console.error("Error fetching topics:", error);
        throw new Error("Failed to fetch topics");
    }
};

export const createTopic = async (title: string, authorId: string) => {
    try {
        const topic = new ForumTopic({
            title,
            authorId,
            replies: []
        });
        await topic.save();
        return topic;
    } catch (error) {
        console.error("Error creating topic:", error);
        throw new Error("Failed to create topic");
    }
};

export const addReply = async (topicId: string, content: string, authorId: string, replyToId?: string) => {
    try {
        const topic = await ForumTopic.findById(topicId);
        if (!topic) {
            throw new Error("Topic not found");
        }

        const reply = {
            authorId: new mongoose.Types.ObjectId(authorId) as any,
            replyTo: replyToId ? new mongoose.Types.ObjectId(replyToId) as any : undefined,
            content,
            likes: [],
            createdAt: new Date()
        };

        topic.replies.push(reply);
        await topic.save();

        // Notification Logic
        let recipientId;
        if (replyToId) {
            // If replying to a specific user, notify them
            recipientId = replyToId;
        } else {
            // Otherwise notify the topic author
            recipientId = topic.authorId;
        }

        // Only create notification if recipient is not the sender
        if (recipientId && recipientId.toString() !== authorId) {
            await Notification.create({
                recipient: recipientId,
                sender: authorId,
                type: "reply",
                topicId: topicId,
                content: content.substring(0, 50) + (content.length > 50 ? "..." : "")
            });
            broadcastNotification(recipientId.toString());
        }

        return topic;
    } catch (error) {
        console.error("Error adding reply:", error);
        throw new Error("Failed to add reply");
    }
};

export const deleteTopic = async (topicId: string, authorId: string) => {
    try {
        const topic = await ForumTopic.findById(topicId);
        if (!topic) {
            throw new Error("Topic not found");
        }

        // String comparison between ObjectId and String
        if (topic.authorId.toString() !== authorId) {
            throw new Error("Unauthorized to delete this topic");
        }

        await ForumTopic.findByIdAndDelete(topicId);
        return true;
    } catch (error) {
        console.error("Error deleting topic:", error);
        throw new Error("Failed to delete topic");
    }
};

export const toggleLikeTopic = async (topicId: string, userId: string) => {
    try {
        const topic = await ForumTopic.findById(topicId);
        if (!topic) throw new Error("Topic not found");

        const userObjectId = userId as any;
        const index = topic.likes.indexOf(userObjectId);

        if (index === -1) {
            topic.likes.push(userObjectId);
            
            // Notification Logic: Notify author when liked (only if not liking own topic)
            if (topic.authorId.toString() !== userId) {
                // Check if there's already an unread "like" notification from this user to avoid spam
                const existingNotif = await Notification.findOne({
                    recipient: topic.authorId,
                    sender: userId,
                    type: "like",
                    topicId: topicId,
                    isRead: false
                });

                if (!existingNotif) {
                    await Notification.create({
                        recipient: topic.authorId,
                        sender: userId,
                        type: "like",
                        topicId: topicId
                    });
                    broadcastNotification(topic.authorId.toString());
                }
            }
        } else {
            topic.likes.splice(index, 1);
            // Optionally delete notification if unliked? (Usually not needed for performance)
        }

        await topic.save();
        return topic;
    } catch (error) {
        console.error("Error toggling like:", error);
        throw new Error("Failed to toggle like");
    }
};

export const toggleLikeReply = async (topicId: string, replyId: string, userId: string) => {
    try {
        const topic = await ForumTopic.findById(topicId);
        if (!topic) throw new Error("Topic not found");

        const reply = topic.replies.find(r => (r as any)._id.toString() === replyId);
        if (!reply) throw new Error("Reply not found");

        const userObjectId = userId as any;
        const index = reply.likes.indexOf(userObjectId);

        if (index === -1) {
            reply.likes.push(userObjectId);
            
            // Notification Logic: Notify reply author
            if (reply.authorId.toString() !== userId) {
                const existingNotif = await Notification.findOne({
                    recipient: reply.authorId,
                    sender: userId,
                    type: "reply_like",
                    topicId: topicId,
                    isRead: false
                });

                if (!existingNotif) {
                    await Notification.create({
                        recipient: reply.authorId,
                        sender: userId,
                        type: "reply_like",
                        topicId: topicId,
                        content: reply.content.substring(0, 30)
                    });
                    broadcastNotification(reply.authorId.toString());
                }
            }
        } else {
            reply.likes.splice(index, 1);
        }

        await topic.save();
        return topic;
    } catch (error) {
        console.error("Error toggling reply like:", error);
        throw new Error("Failed to toggle reply like");
    }
};

export const deleteReply = async (topicId: string, replyId: string, userId: string) => {
    try {
        const topic = await ForumTopic.findById(topicId);
        if (!topic) throw new Error("Topic not found");

        const replyIndex = topic.replies.findIndex(r => (r as any)._id.toString() === replyId);
        if (replyIndex === -1) throw new Error("Reply not found");

        if (topic.replies[replyIndex].authorId.toString() !== userId) {
            throw new Error("Unauthorized to delete this reply");
        }

        topic.replies.splice(replyIndex, 1);
        await topic.save();
        return topic;
    } catch (error) {
        console.error("Error deleting reply:", error);
        throw new Error("Failed to delete reply");
    }
};

export const getUserNotifications = async (userId: string) => {
    try {
        return await Notification.find({ recipient: userId })
            .populate('sender', 'displayName avatarUrl')
            .populate('topicId', 'title')
            .sort({ createdAt: -1 })
            .limit(20);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to fetch notifications");
    }
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true }
        );
        return true;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw new Error("Failed to mark notification as read");
    }
};
