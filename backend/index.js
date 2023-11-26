const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors')
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/searchYouTube', (req, res) => {
    const searchQuery = req.query.searchQuery;
    console.log(req.query)
    if (!searchQuery || searchQuery.trim() === '') {
        return res.status(400).json({error: 'Please enter a valid search query.'});
    }

    const apiKey = process.env.API_KEY;

    // Fetch videos directly from YouTube Data API
    fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1`)
        .then(response => response.json())
        .then(data => {
            if (data.items.length === 0) {
                throw new Error('No videos found in search');
            }

            const youtubeId = data.items[0].id.videoId;
            console.log("youtubeId: ", youtubeId);
            let tentativeAlreadyChordifiedSong = `https://chordify.net/chords/-songs/-chords?version=youtube:${youtubeId}`;

            // Define los callbacks
            function onSuccess() {
                console.log("La cancion está chordificada, se procede a abrir la pagina");
                res.json({url: tentativeAlreadyChordifiedSong});
            }

            function onError() {
                console.log("La canción no está chordificada se procede a abrir la pagina de Chordificación");
                const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
                const youtubeUrlEscaped = encodeURIComponent(youtubeUrl);
                const searchUrl = `https://chordify.net/search/${youtubeUrlEscaped}`;
                res.json({url: searchUrl});
            }

            // Llama a la función con los callbacks
            checkChordifyStatus(tentativeAlreadyChordifiedSong, onSuccess, onError);

        })
        .catch(error => {
            console.error(error);
            res.status(500).json({error: 'Internal Server Error'});
        });
});

function checkChordifyStatus(url, callbackOka, callbackBad) {
    // Realiza una solicitud HTTP GET a la URL
    fetch(url)
        .then(response => {
            // Verifica el código de estado de la respuesta
            if (response.ok) {
                // Si el código es 200, llama al callback de éxito
                callbackOka();
            } else {
                // Si el código no es 200, llama al callback de error
                callbackBad();
            }
        })
        .catch(error => {
            // Maneja errores de red u otros problemas
            console.error(error);
            callbackBad();
        });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
