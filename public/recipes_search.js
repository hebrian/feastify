document.getElementById('search-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent form submission

    const query = document.getElementById('search-query').value;

    try {
        // Fetch recipes from the Spoonacular API via your backend
        const response = await fetch(`/api/spoonacular?query=${query}`);
        const recipes = await response.json();

        const tableBody = document.querySelector('#resultsTable tbody');
        tableBody.innerHTML = ''; // Clear any previous results

        // Populate table with search results
        recipes.forEach(recipe => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td><input type="checkbox" value="${recipe.id}"></td>
                <td>${recipe.title}</td>
                <td>${recipe.cuisines?.[0] || 'Unknown'}</td>
                <td>${recipe.servings || 'N/A'}</td>
                <td>${recipe.pricePerServing ? `$${(recipe.pricePerServing / 100).toFixed(2)}` : 'N/A'}</td>
            `;

            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching recipes:', err);
    }
});

document.getElementById('save-button').addEventListener('click', async function () {
    const userId = sessionStorage.getItem('userId'); // Reuse userId from sessionStorage

    if (!userId) {
        alert('User ID is not available. Please log in again.');
        return;
    }

    const selectedRecipeIds = Array.from(document.querySelectorAll('#resultsTable input[type="checkbox"]:checked'))
        .map(input => input.value);

    if (selectedRecipeIds.length === 0) {
        alert('Please select at least one recipe to save.');
        return;
    }

    try {
        // Send selected recipe IDs to the backend along with the userId
        const response = await fetch('/api/saveRecipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, recipeIds: selectedRecipeIds }),
        });

        if (response.ok) {
            alert('Recipes saved successfully!');
        } else {
            alert('Failed to save recipes.');
        }
    } catch (err) {
        console.error('Error saving recipes:', err);
    }
});
