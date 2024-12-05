async function fetchRecipes() {
    const userId = sessionStorage.getItem('userId'); // Assuming userId is stored in sessionStorage
    
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
        const response = await fetch(`/api/recipes/recipe?recipeID=${recipeId}`);
        const recipe = await response.json();

        // Store ingredients in localStorage for now
        localStorage.setItem('ingredients', JSON.stringify(recipe.ingredients));
        alert('Ingredients exported to grocery list');
        window.location.href = 'groceries.html'; // Redirect to grocery page
    } catch (err) {
        console.error('Error exporting ingredients:', err);
    }
}

window.onload = fetchRecipes;