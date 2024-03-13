export default async function performPCA(ids) {
    try {
        const response = await fetch('http://localhost:5000/pca', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: ids,
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        //console.log('Transformed Data:', responseData.transformed_data);
        return responseData.transformed_data;
    } catch (error) {
        console.error('Error:', error);
        throw error; // Rethrow the error for further handling if needed
    }
}
