document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.getElementById("search-bar");
    const searchButton = document.getElementById("search-button");
    const groceryTable = document.getElementById("grocery-table").querySelector("tbody");
    const shoppedButton = document.getElementById("shopped-button");
  
    // Fetch grocery items from the server
    const fetchGroceries = async () => {
      const response = await fetch('/groceries');
      const groceries = await response.json();
      updateTable(groceries);
    };
  
    // Add grocery item to the database and update the table
    const addGrocery = async (item, amount) => {
      await fetch('/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item, amount })
      });
      fetchGroceries();
    };
  
    // Remove grocery item
    const removeGrocery = async (id) => {
      await fetch(`/groceries/${id}`, { method: 'DELETE' });
      fetchGroceries();
    };
  
    // Clear the entire grocery list
    const clearGroceries = async () => {
      await fetch('/groceries', { method: 'DELETE' });
      fetchGroceries();
    };
  
    // Update the table with grocery items
    const updateTable = (groceries) => {
      groceryTable.innerHTML = '';
      groceries.forEach(({ id, name, amount }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${name}</td>
          <td>
            <input type="number" value="${amount}" min="1" data-id="${id}" />
          </td>
          <td>
            <button data-id="${id}" class="delete-button">Delete</button>
          </td>
        `;
        groceryTable.appendChild(row);
      });
  
      // Add event listeners for delete and update
      document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => removeGrocery(button.dataset.id));
      });
  
      document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', async () => {
          const id = input.dataset.id;
          const amount = input.value;
          await fetch(`/groceries/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
          });
          fetchGroceries();
        });
      });
    };
  
    // Event listeners
    searchButton.addEventListener('click', async () => {
      const query = searchBar.value;
      const response = await fetch(`https://api.spoonacular.com/food/ingredients/search?query=${query}&apiKey=YOUR_API_KEY`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0].name;
        addGrocery(item, 1);
      } else {
        alert('Item not found!');
      }
    });
  
    shoppedButton.addEventListener('click', clearGroceries);
  
    // Initial load
    fetchGroceries();
  });
  