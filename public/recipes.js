async function fetchRecipes() {
    const userId = sessionStorage.getItem('userId'); // Assuming userId is stored in sessionStorage

    if (!userId) {
        console.error('User ID is not available');
        return;
    }

    try {
        const response = await fetch(`/api/recipes?userId=${userId}`); // Pass userId as a query parameter
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
            `;

            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching recipes:', err);
    }
}

window.onload = fetchRecipes;