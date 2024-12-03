const express = require('express');
const axios = require('axios');
const Recipe = require('../models/Recipe'); // Ensure this points to your Recipe model
const router = express.Router();

// Route to search recipes via Spoonacular
router.get('/api/spoonacular', async (req, res) => {
    const query = req.query.query; // Get the search query from the URL
    const spoonApiKey = process.env.spoon_api_key;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${spoonApiKey}&query=${query}&number=5&addRecipeInformation=true&addRecipeInstructions=true&fillIngredients=true`;
        const response = await axios.get(apiUrl);

        // Send the results directly to the front-end
        res.json(response.data.results);
    } catch (error) {
        console.error('Error fetching recipes from Spoonacular:', error.message);
        res.status(500).json({ error: 'Failed to fetch recipes from Spoonacular' });
    }
});

// Route to save selected recipes to MongoDB
router.post('/api/saveRecipes', async (req, res) => {
    const { userId, recipeIds } = req.body; // Extract userId and recipeIds from the request body

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    if (!recipeIds || recipeIds.length === 0) {
        return res.status(400).json({ error: 'No recipes selected for saving.' });
    }

    try {
        // Fetch detailed recipe information for each ID from Spoonacular
        const recipesToSave = [];
        for (const id of recipeIds) {
            const apiUrl = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${process.env.spoon_api_key}`;
            const response = await axios.get(apiUrl);
            const recipe = response.data;

            recipesToSave.push({
                name: recipe.title,
                ingredients: recipe.extendedIngredients.map(ingredient => ({
                    name: ingredient.name,
                    spoonacular_id: ingredient.id,
                    amount: `${ingredient.amount} ${ingredient.unit}`,
                })),
                steps: recipe.analyzedInstructions.length > 0
                    ? recipe.analyzedInstructions[0].steps.map(step => step.step)
                    : [],
                meta: {
                    serves: recipe.servings || 0,
                    nutrition: recipe.nutrition || {},
                    cuisine: recipe.cuisines.length > 0 ? recipe.cuisines[0] : 'Unknown',
                    cost: recipe.pricePerServing ? recipe.pricePerServing / 100 : 0,
                },
                userId, // Use userId from the request body
            });
        }

        // Save the recipes to MongoDB
        await Recipe.insertMany(recipesToSave);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving recipes:', error.message);
        res.status(500).json({ error: 'Failed to save recipes.' });
    }
});


module.exports = router;
