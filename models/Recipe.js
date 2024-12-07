const mongoose = require('mongoose');

// Define the Recipe Schema
const RecipeSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Recipe name
    ingredients: [
        {
            name: { type: String, required: true }, // Ingredient name
            spoonacular_id: { type: String, required: true }, // ID from Spoonacular API
            amount: { type: Number, required: true }, // Amount as a number
            unit: { type: String, required: true }, // Unit of measurement (e.g., "grams")
        }
    ],
    steps: [String], // Array of steps for the recipe
    meta: {
        serves: { type: Number, required: true }, // Number of servings
        nutrition: Object, // Nutrition info (e.g., calories, protein)
        cuisine: { type: String }, // e.g., "Italian", "Mexican"
        cost: { type: Number } // Estimated cost of the recipe
    },
    image: { type: String }, // URL for the recipe image
    imageType: { type: String }, // Type of the image (e.g., "jpg", "png")
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user
});

// Create the Recipe model
const Recipe = mongoose.model('Recipe', RecipeSchema);

// Export the model for use in other parts of the app
module.exports = Recipe;
