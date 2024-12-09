const express = require('express');
const axios = require('axios');
const Recipe = require('../models/Recipe'); // Ensure this points to your Recipe model
const router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");

async function processIngredients(recipe) {
    const processedIngredients = await Promise.all(
        recipe.extendedIngredients.map(async(ingredient) => {
            let convertedAmount = ingredient.amount;
            let unit = ingredient.unit.toLowerCase();
            // Convert to grams if not already in grams
            if (unit !== 'g' && unit !== 'grams') {
                try {
                    const conversionUrl = `https://api.spoonacular.com/recipes/convert?apiKey=${process.env.spoon_api_key}`;
                    const conversionResponse = await axios.get(conversionUrl, {
                        params: {
                            ingredientName: ingredient.name,
                            sourceAmount: ingredient.amount,
                            sourceUnit: unit,
                            targetUnit: 'grams',
                        },
                    });
                    convertedAmount = conversionResponse.data.targetAmount || ingredient.amount;
                    unit = 'grams'; // Update unit to grams
                } catch (conversionError) {
                    console.warn(
                        `Conversion failed for ingredient: ${ingredient.name}. Keeping original unit.`
                    );
                }
            }

            // Ensure amount is a number (int or float)
            convertedAmount = parseFloat(convertedAmount);

            return {
                name: ingredient.name,
                spoonacular_id: ingredient.id,
                amount: convertedAmount, // Store as a number
                unit: unit, // Separate field for unit
            };
        })
    );
    return processedIngredients;
}


// Route to search recipes via Spoonacular
router.get('/api/spoonacular', async(req, res) => {
    const query = req.query.query; // Get the search query from the URL
    const spoonApiKey = process.env.spoon_api_key;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${spoonApiKey}&query=${query}&number=9&addRecipeInformation=true&addRecipeInstructions=true&fillIngredients=true`;
        const response = await axios.get(apiUrl);

        // Send the results directly to the front-end
        const resultsWithImages = await Promise.all(response.data.results.map(async recipe => {
            return {
                id: recipe.id,
                title: recipe.title,
                image: recipe.image, // Include image URL
                imageType: recipe.imageType, // Include image type
                cuisines: recipe.cuisines,
                servings: recipe.servings,
                pricePerServing: recipe.pricePerServing,
                steps: recipe.analyzedInstructions.length > 0 ?
                    recipe.analyzedInstructions[0].steps.map((step) => step.step) : [],
                ingredients: recipe.extendedIngredients,
                pricePerServing: recipe.pricePerServing
            }
        }));

        res.json(resultsWithImages);
    } catch (error) {
        console.error('Error fetching recipes from Spoonacular:', error.message);
        res.status(500).json({ error: 'Failed to fetch recipes from Spoonacular' });
    }
});

async function processIngredients(recipe) {
    const processedIngredients = await Promise.all(
        recipe.ingredients.map(async(ingredient) => {
            let convertedAmount = ingredient.amount;
            let unit = ingredient.unit.toLowerCase();
            // Convert to grams if not already in grams
            if (unit !== 'g' && unit !== 'grams') {
                try {
                    const conversionUrl = `https://api.spoonacular.com/recipes/convert?apiKey=${process.env.spoon_api_key}`;
                    const conversionResponse = await axios.get(conversionUrl, {
                        params: {
                            ingredientName: ingredient.name,
                            sourceAmount: ingredient.amount,
                            sourceUnit: unit,
                            targetUnit: 'grams',
                        },
                    });
                    convertedAmount = conversionResponse.data.targetAmount || ingredient.amount;
                    unit = 'grams'; // Update unit to grams
                } catch (conversionError) {
                    console.warn(
                        `Conversion failed for ingredient: ${ingredient.name}. Keeping original unit.`
                    );
                }
            }

            // Ensure amount is a number (int or float)
            convertedAmount = parseFloat(convertedAmount);

            return {
                name: ingredient.name,
                spoonacular_id: ingredient.id,
                amount: convertedAmount, // Store as a number
                unit: unit, // Separate field for unit
            };
        })
    );
    return processedIngredients;
}

// Route to save selected recipes to MongoDB
router.post('/api/saveRecipes', async(req, res) => {
    const { userId, recipes } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    if (!recipes || recipes.length === 0) {
        return res.status(400).json({ error: 'No recipes selected for saving.' });
    }

    try {
        const recipesToSave = [];
        for await (const recipe of recipes) {
            var ingredients = await processIngredients(recipe);
            recipesToSave.push({
                name: recipe.title,
                ingredients: ingredients,
                steps: recipe.steps,
                meta: {
                    serves: recipe.servings || 0,
                    nutrition: recipe.nutrition || {},
                    cuisine: recipe.cuisines.length > 0 ? recipe.cuisines[0] : 'Unknown',
                    cost: recipe.pricePerServing ? recipe.pricePerServing / 100 : 0,
                },
                image: recipe.image || '',
                imageType: recipe.imageType || '',
                userId: new ObjectId(userId),
                spoonacular_id: recipe.id,
            });
        }

        // Save the recipes to MongoDB
        const client = new MongoClient(process.env.mongo_uri);
        await client.connect();
        const dbName = client.db("feastify");
        const collection = dbName.collection("recipes");

        const resp = await collection.insertMany(recipesToSave);
        console.log(resp);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving recipes:', error.message);
        res.status(500).json({ error: 'Failed to save recipes.' });
    }
});

module.exports = router;