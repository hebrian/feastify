const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const router = express.Router();

const mongoUri = process.env.mongo_uri; // Load MongoDB URI from environment variables

// GET /api/recipes - Fetch recipes for the logged-in user
router.get('/', async(req, res) => {
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

router.get('/recipe', async(req, res) => {
    const recipeID = req.query.recipeID;

    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db('feastify');
        const recipes = await db.collection('recipes').findOne({ _id: new ObjectId(recipeID) });
        res.json(recipes);
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    } finally {
        await client.close();
    }
})

// DELETE /api/recipes/:id - Remove a recipe by ID
router.delete('/:id', async (req, res) => {
    const recipeId = req.params.id;

    if (!recipeId) {
        return res.status(400).json({ error: 'Recipe ID is required' });
    }

    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db('feastify');
        const result = await db.collection('recipes').deleteOne({ _id: new ObjectId(recipeId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.status(200).json({ success: true, message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    } finally {
        await client.close();
    }
});


module.exports = router;