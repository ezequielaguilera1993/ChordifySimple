require('dotenv').config();

exports.handler = async (event) => {
    const searchQuery = event.queryStringParameters ? event.queryStringParameters.searchQuery : null;

    if (!searchQuery || searchQuery.trim() === '') {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Please enter a valid search query.' }),
        };
    }

    const apiKey = process.env.API_KEY;

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1`);
        const data = await response.json();

        if (data.items.length === 0) {
            throw new Error('No videos found in search');
        }

        const youtubeId = data.items[0].id.videoId;
        console.log("youtubeId: ", youtubeId);
        let tentativeAlreadyChordifiedSong = `https://chordify.net/chords/-songs/-chords?version=youtube:${youtubeId}`;

        // Define los callbacks
        function onSuccess() {
            console.log("La cancion está chordificada, se procede a abrir la pagina");
            return {
                statusCode: 200,
                body: JSON.stringify({ url: tentativeAlreadyChordifiedSong }),
            };
        }

        function onError() {
            console.log("La canción no está chordificada se procede a abrir la pagina de Chordificación");
            const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
            const youtubeUrlEscaped = encodeURIComponent(youtubeUrl);
            const searchUrl = `https://chordify.net/search/${youtubeUrlEscaped}`;
            return {
                statusCode: 200,
                body: JSON.stringify({ url: searchUrl }),
            };
        }

        // Llama a la función con los callbacks
        return await checkChordifyStatus(tentativeAlreadyChordifiedSong, onSuccess, onError);

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error handled in lambda' }),
        };
    }
};

async function checkChordifyStatus(url, callbackOka, callbackBad) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            return callbackOka();
        } else {
            return callbackBad();
        }
    } catch (error) {
        console.error(error);
        callbackBad();
    }
}
