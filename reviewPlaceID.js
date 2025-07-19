// backend/googleReviews.jsw
import { fetch } from 'wix-fetch';



export async function fetchGoogleReviews() {
    const API_KEY = "AIzaSyDnhC45O9elEbIQ0Arwsj-YB8yRSVaoyPc"; // Your API key
    const PLACE_ID = "ChIJ3erlbmUX2jER6e3vtVZk1XA"; // Your Place ID

    // Fields you want from Google (can add more if needed)
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews&key=${API_KEY}`;

    try {
        const response = await fetch(url, { method: "get" });
        const result = await response.json();

        if (result.status === "OK" && result.result && result.result.reviews) {
            // Return only needed data, map for frontend
            return result.result.reviews.map((r, i) => ({
                _id: "g" + i, // Unique ID for repeater
                reviewText: r.text,
                reviewerName: "— " + r.author_name,
                reviewRating: r.rating + " ★"
            }));
        } else {
            // If no reviews, return an empty array
            return [];
        }
    } catch (err) {
        // In case of error, log and return empty array
        console.error("Error fetching Google Reviews:", err);
        return [];
    }
}
