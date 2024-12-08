async function removeRecipe(recipeId) {
    try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Recipe removed successfully');
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

        alert(`Exported ${missingIngredients.length} new ingredients to the grocery list.`);
        window.location.href = 'groceries.html'; // Redirect to grocery page
    } catch (err) {
        console.error('Error exporting ingredients:', err);
    }
}




async function fetchRecipe() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const recipeId = params.get('id');

    console.log(recipeId);


    try {
        const response = await fetch(`/api/recipes/recipe?recipeID=${recipeId}`); // Pass userId as a query parameter
        const recipe = await response.json();

        const recipeContainer = document.getElementById('recipe');
        recipeContainer.innerHTML = ''; // Clear existing rows
        const header = document.getElementById("recipe-header");
        header.innerHTML = `
            <h1>${recipe.name}</h1>
            <ul>
                <li>Serves: ${recipe.meta.serves}</li>
                <li>Cost: $${recipe.meta.cost.toFixed(2)}</li>
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
            item.innerText = Math.round(element.amount) + "g " + element.name;
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

        let removeBtn = document.getElementById("remove-btn");
        removeBtn.addEventListener('click', async event => {
            await removeRecipe(recipeId);
            window.location.href = "/recipes";
        });

        let exportBtn = document.getElementById("export-btn");
        exportBtn.addEventListener('click', async event => {
            console.log("exporting");
            await exportIngredientsToGrocery(recipeId);
        });




    } catch (err) {
        console.error('Error fetching recipes:', err);
    }
}

window.onload = fetchRecipe;