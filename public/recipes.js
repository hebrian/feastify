async function fetchRecipes() {

    const userId = localStorage.getItem("uid"); // Assuming userId is stored in sessionStorage
    console.log(userId);
    if (!userId) {
        console.error('User ID is not available');
        return;
    }

    try {
        const response = await fetch(`/api/recipes?userId=${userId}`);
        const recipes = await response.json();

        const tableBody = document.querySelector('#recipesTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        recipes.forEach(recipe => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td><a href="recipe.html?id=${recipe._id}">${recipe.name}</a></td>
                <td>${recipe.meta.serves || 'N/A'}</td>
                <td>${recipe.meta.cuisine || 'Unknown'}</td>
                <td>${recipe.meta.cost ? `$${recipe.meta.cost.toFixed(2)}` : 'N/A'}</td>
                <td>0</td> <!-- Default value for now -->
                <td>
                    <button class="remove-btn" data-id="${recipe._id}">Remove</button>
                    <button class="export-btn" data-id="${recipe._id}">Export</button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        // Add event listeners for action buttons
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', async event => {
                const recipeId = event.target.dataset.id;
                await removeRecipe(recipeId);
                fetchRecipes(); // Refresh the list
            });
        });

        document.querySelectorAll('.export-btn').forEach(button => {
            button.addEventListener('click', async event => {
                const recipeId = event.target.dataset.id;
                await exportIngredientsToGrocery(recipeId);
            });
        });

    } catch (err) {
        console.error('Error fetching recipes:', err);
    }
}

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

window.onload = fetchRecipes;