const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const router = express.Router();

const mongoUri = process.env.mongo_uri; // Load MongoDB URI from environment variables

// GET /api/recipes - Fetch recipes for the logged-in user
router.get('/', async (req, res) => {
    const userId = req.query.userId; // Get userId from the query parameters

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db('feastify');
        const recipes = await db.collection('recipes').find({ userId: new ObjectId(userId) }).toArray();
        res.json(recipes);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    } finally {
        await client.close();
    }
});

module.exports = router;

