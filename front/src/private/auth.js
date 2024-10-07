// private/auth.js
const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
};

export { isAuthenticated };