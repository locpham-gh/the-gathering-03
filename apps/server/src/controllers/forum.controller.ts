import { ForumTopic, IForumTopic } from "../models/ForumTopic.js";
import { User } from "../models/User.js";

// List all topics with author info (lean is faster and more similar to plain JSON)
export const getAllTopics = async () => {
    try {
        const topics = await ForumTopic.find()
            .populate('authorId', 'displayName avatarUrl')
            .populate('replies.authorId', 'displayName avatarUrl')
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

export const addReply = async (topicId: string, content: string, authorId: string) => {
    try {
        const topic = await ForumTopic.findById(topicId);
        if (!topic) {
            throw new Error("Topic not found");
        }

        topic.replies.push({
            authorId: authorId as any,
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
