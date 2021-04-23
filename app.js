const express = require('express');
const app = express();

// Static directory 'static' with subdirectiories css, js, and html.
//app.use(express.static('static'));
//app.use('/js', express.static(__dirname + '/static/js'));

app.get('/', (req,res) => res.sendFile(__dirname + "/index.html"));

app.listen(5000, () => {
    console.log('Listening on port 5000');
});