const express = require('express');
const app = express();

// Static directory 'static' with subdirectiories css, js, and html.
app.use(express.static('static/html'))
app.use("/static/js", express.static('./static/js/'))

app.listen(5000, () => {
    console.log('Listening on port 5000');
});