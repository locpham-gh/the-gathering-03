import mongoose from "mongoose";
import { ForumTopic, IForumTopic } from "../models/ForumTopic.js";
import { User } from "../models/User.js";

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

        topic.replies.push({
            authorId: new mongoose.Types.ObjectId(authorId) as any,
            replyTo: replyToId ? new mongoose.Types.ObjectId(replyToId) as any : undefined,
            content,
            createdAt: new Date()
        });

        await topic.save();
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
        } else {
            topic.likes.splice(index, 1);
        }

        await topic.save();
        return topic;
    } catch (error) {
        console.error("Error toggling like:", error);
        throw new Error("Failed to toggle like");
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
