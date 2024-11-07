import express from 'express';

const app = express();
const port = 8080;


// Routes
app.get('/', (req, res) => {
    res.send('Hello World! APi is running....');
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

