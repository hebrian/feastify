document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/requestLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email, password: password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Save the user's ID in session storage
                localStorage.setItem('uid', data.uid);

                // Redirect to the recipes page
                window.location.href = '/recipes';
            } else {
                // Display the error message
                document.getElementById('error-message').style.display = 'block';
                document.getElementById('error-message').innerText = data.message;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('error-message').style.display = 'block';
        });
});