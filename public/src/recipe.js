async function removeRecipe(recipeId) {
    try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log('Recipe removed successfully');
        } else {
            console.error('Failed to remove recipe');
        }
    } catch (err) {
        console.error('Error removing recipe:', err);
    }
}

async function exportIngredientsToGrocery(recipeId) {
    try {
        // Fetch the recipe details
        const recipeResponse = await fetch(`/api/recipes/recipe?recipeID=${recipeId}`);
        const recipe = await recipeResponse.json();
        console.log('Recipe Ingredients:', recipe.ingredients);

        // Fetch pantry and grocery list
        const owner = localStorage.getItem('uid');
        const pantryResponse = await fetch('/getPantry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner })
        });
        const groceryResponse = await fetch('/getGroceries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner })
        });

        const pantryData = await pantryResponse.json();
        const groceryData = await groceryResponse.json();

        console.log('Pantry Items:', pantryData.pantry);
        console.log('Grocery Items:', groceryData.groceries);

        const pantryItems = pantryData.pantry.map(item => item.name.toLowerCase());
        const groceryItems = groceryData.groceries.map(item => item.name.toLowerCase());

        // Filter out ingredients already in pantry or grocery list
        const missingIngredients = recipe.ingredients.filter(ingredient =>
            !pantryItems.includes(ingredient.name.toLowerCase()) &&
            !groceryItems.includes(ingredient.name.toLowerCase())
        );

        console.log('Missing Ingredients:', missingIngredients);

        // Add missing ingredients to the grocery list using the server API
        for (const ingredient of missingIngredients) {
            ingredient.spoonacular_id = ingredient.spoonacular_id || ''; // Ensure ID exists
            ingredient.amount = ingredient.amount || 1; // Assign default amount if not present
            delete ingredient._id; // Remove the ID field

            await fetch('/addToGroceries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner, ingredient })
            });
            console.log(`Added to groceries: ${ingredient.name} with amount: ${ingredient.amount}`);
        }

        let popup = document.getElementById('popup');
        popup.classList.remove("hide");

    } catch (err) {
        console.error('Error exporting ingredients:', err);
    }
}

async function saveRecipe(recipe) {
    const userId = localStorage.getItem("uid");

    if (!userId) {
        alert('User ID is not available. Please log in again.');
        return;
    }


    try {
        // Send selected recipe IDs to the backend along with the userId
        const response = await fetch('/api/saveRecipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, recipes: [recipe] }),
        });

        if (response.ok) {
            let popup = document.getElementById('popup-save');
            popup.classList.remove("hide");
        } else {
            alert('Failed to save recipes.');
        }
    } catch (err) {
        console.error('Error saving recipes:', err);
    }

}


async function fetchRecipe() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const recipeId = params.get('id');
    const buttons = document.getElementById('buttons');
    var recipe = {}
    var spoon_recipe = {}
    if (recipeId === null) {

        spoon_recipe = JSON.parse(localStorage.getItem("previewRecipe"));
        console.log(spoon_recipe);
        recipe.name = spoon_recipe.title;
        recipe.meta = {
            serves: spoon_recipe.servings || 0,
            cost: spoon_recipe.pricePerServing ? spoon_recipe.pricePerServing / 100 : 0,
        }
        recipe.ingredients = spoon_recipe.ingredients;
        recipe.steps = spoon_recipe.steps;
        let saveButton = document.createElement("button");
        saveButton.className = "secondary-button";
        saveButton.innerText = "Save Recipe";
        saveButton.addEventListener('click', async event => {
            saveButton.innerText = "Saving..."
            try {
                await saveRecipe(spoon_recipe);
            } catch (error) {
                console.error(error);
            }
            saveButton.innerText = "Save Recipe";
        });
        buttons.appendChild(saveButton);
    } else {
        try {
            const response = await fetch(`/api/recipes/recipe?recipeID=${recipeId}`); // Pass userId as a query parameter
            recipe = await response.json();
        } catch (err) {
            console.error('Error fetching recipes:', err);
        }
        let removeButton = document.createElement("button");
        removeButton.className = "secondary-button";
        removeButton.innerText = "Delete";
        removeButton.addEventListener('click', async event => {
            try {
                await removeRecipe(recipeId);
            } catch (error) {
                console.error(error);
            }
            window.location.href = "/recipes";
        });
        let exportButton = document.createElement("button");
        exportButton.className = "secondary-button";
        exportButton.innerText = "Add to Cart";
        exportButton.addEventListener('click', async event => {
            console.log("exporting");
            try {
                await exportIngredientsToGrocery(recipeId);
            } catch (error) {
                console.error(error);
            }
        });
        buttons.appendChild(removeButton);
        buttons.appendChild(exportButton);

    }




    const recipeContainer = document.getElementById('recipe');
    recipeContainer.innerHTML = ''; // Clear existing rows
    const header = document.getElementById("recipe-header");
    header.innerHTML = `
            <h1>${recipe.name}</h1>
            <ul>
                <li>Serves: ${recipe.meta.serves}</li>
                <li>Cost: $${recipe.meta.cost.toFixed(2)}/Serving</li>
            </ul>
        `;
    const ingredients = document.createElement("div");
    const steps = document.createElement("div");

    let ingredientsHeader = document.createElement("h2");
    ingredientsHeader.innerText = "Ingredients";
    ingredients.appendChild(ingredientsHeader);
    let ingredientsList = document.createElement("ul");
    recipe.ingredients.forEach(element => {
        let item = document.createElement("li");
        if (recipeId === null) {
            item.innerText = element.name;
        } else {
            item.innerText = Math.round(element.amount) + "g " + element.name;
        }
        ingredientsList.appendChild(item);
    });
    ingredients.appendChild(ingredientsList);

    let stepsHeader = document.createElement("h2");
    stepsHeader.innerText = "Steps";
    steps.appendChild(stepsHeader);
    let stepsList = document.createElement("ol");
    recipe.steps.forEach(element => {
        let item = document.createElement("li");
        item.innerText = element;
        stepsList.appendChild(item);
    });
    steps.appendChild(stepsList);

    recipeContainer.appendChild(ingredients);
    recipeContainer.appendChild(steps);






}

window.onload = fetchRecipe;