// cleanup-duplicates.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Post from './lib/models/Post.js';

dotenv.config({ path: '.env.local' });

async function cleanupDuplicatePosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all posts
    const posts = await Post.find({}).sort({ createdAt: -1 });
    console.log(`Total posts: ${posts.length}`);

    // Group by content and author to find duplicates
    const uniquePosts = new Map();
    const duplicatesToRemove = [];

    posts.forEach(post => {
      const key = `${post.author}-${post.content?.text}`;
      
      if (uniquePosts.has(key)) {
        // This is a duplicate
        duplicatesToRemove.push(post._id);
      } else {
        uniquePosts.set(key, post);
      }
    });

    console.log(`Found ${duplicatesToRemove.length} duplicate posts`);

    if (duplicatesToRemove.length > 0) {
      // Remove duplicates
      const result = await Post.deleteMany({
        _id: { $in: duplicatesToRemove }
      });
      console.log(`Removed ${result.deletedCount} duplicate posts`);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('Cleanup completed');

  } catch (error) {
    console.error('Cleanup Error:', error);
    process.exit(1);
  }
}

cleanupDuplicatePosts();