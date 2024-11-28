if (localStorage.getItem("isAuthenticated")) {
    window.location.href = '/recipes';
}

document.getElementById('logout-button').addEventListener("click", () => {
    localStorage.removeItem("uid");
    localStorage.setItem("isAuthenticated", false);
    window.location.href = "/";
})