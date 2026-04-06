const testRegister = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test Faculty',
                email: 'testfac@test.com',
                password: 'password123',
                role: 'faculty'
            })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Data:", data);
    } catch (err) {
        console.error(err);
    }
}
testRegister();
