import decky_plugin
import logging
import asyncio
from aiohttp import web

# Set up logging
logging.basicConfig(level=logging.DEBUG)

async def fetch_verse_of_the_day():
    try:
        url = "https://api.bible.com/v1/verse_of_the_day"
        response = requests.get(url)
        if response.status_code == 200:
            verse_data = response.json()
            return {
                "citation": verse_data.get("citation"),
                "passage": verse_data.get("passage"),
                "version": verse_data.get("version"),
                "images": verse_data.get("images", [])
            }
        else:
            logging.error(f"Failed to fetch verse data: {response.status_code}")
            return None
    except Exception as e:
        logging.error(f"Error fetching verse data: {e}")
        return None

class Plugin:
    async def handle_verse_of_the_day(self, request):
        verse_data = await fetch_verse_of_the_day()
        if verse_data:
            return web.json_response(verse_data)
        else:
            return web.json_response({"status": "error", "message": "Failed to fetch verse data"}, status=500)

    async def _main(self):
        # Create aiohttp app and set up routes
        app = web.Application()
        app.router.add_get('/api/verse-of-the-day', self.handle_verse_of_the_day)

        # Start the server
        runner = web.AppRunner(app)
        await runner.setup()
        logging.info("Server runner setup")
        site = web.TCPSite(runner, 'localhost', 8777)
        await site.start()
        logging.info("Server started at http://localhost:8777")

    async def _unload(self):
        logging.info("Plugin Unloaded!")
        pass  # Any necessary cleanup on unload