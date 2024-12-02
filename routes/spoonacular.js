const express = require('express');
const axios = require('axios');
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

module.exports = router;
