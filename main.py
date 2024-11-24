import logging
import aiohttp
from aiohttp import web
import decky_plugin
import asyncio
from functools import partial

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Ensure Decky plugin path is set up correctly
def add_plugin_to_path():
    import sys
    from pathlib import Path
    plugin_dir = Path(__file__).parent.resolve()
    directories = [["./"], ["py_modules"], ["py_modules", "lib"], ["py_modules", "externals"]]
    for dir in directories:
        sys.path.append(str(plugin_dir.joinpath(*dir)))

# Call this to ensure Decky can find the plugin
add_plugin_to_path()

class Plugin:
    scan_lock = asyncio.Lock()

    async def fetch_verse_of_the_day(self):
        """
        Fetches the verse of the day from the external API.
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("https://api.bible.com/v1/verse_of_the_day") as response:
                    if response.status == 200:
                        verse_data = await response.json()
                        decky_plugin.logger.debug(f"Fetched verse data: {verse_data}")
                        return {
                            "citation": verse_data.get("citation"),
                            "passage": verse_data.get("passage"),
                            "version": verse_data.get("version"),
                            "images": verse_data.get("images", [])
                        }
                    else:
                        decky_plugin.logger.error(f"Failed to fetch verse data: {response.status}")
                        return None
        except Exception as e:
            decky_plugin.logger.error(f"Error fetching verse data: {e}")
            return None

    async def handle_verse_of_the_day(self, request):
        """
        Handles the API endpoint `/api/verse-of-the-day` by fetching the verse data.
        """
        # Log incoming request method, path, and headers
        decky_plugin.logger.info(f"Received request: {request.method} {request.path}")
        decky_plugin.logger.debug(f"Request headers: {request.headers}")

        verse_data = await self.fetch_verse_of_the_day()
        if verse_data:
            # Log the fetched verse data before sending it
            decky_plugin.logger.info(f"Sending verse data: {verse_data}")
            return web.json_response(verse_data)
        else:
            # Log error and failure to fetch verse data
            decky_plugin.logger.error("Failed to fetch verse data, sending error response")
            return web.json_response({"status": "error", "message": "Failed to fetch verse data"}, status=500)

    async def log_middleware(self, app, handler):
        """
        Logs incoming requests and outgoing responses.
        """
        async def middleware_handler(request):
            # Log incoming request details
            decky_plugin.logger.info(f"Incoming request: {request.method} {request.path}")
            decky_plugin.logger.debug(f"Request headers: {request.headers}")

            if request.can_read_body:
                body = await request.read()
                decky_plugin.logger.debug(f"Request body: {body.decode('utf-8') if body else ''}")

            try:
                response = await handler(request)
                # Log outgoing response details
                decky_plugin.logger.info(f"Response status: {response.status}")
                decky_plugin.logger.debug(f"Response headers: {response.headers}")

                # If the response is JSON, log the response body as well
                if response.content_type == 'application/json':
                    response_body = await response.text()
                    decky_plugin.logger.debug(f"Response body: {response_body}")

                return response
            except Exception as e:
                decky_plugin.logger.error(f"Exception occurred: {e}")
                raise
        return middleware_handler

    async def _main(self):
        """
        Starts the server and sets up the API routes.
        This method is automatically invoked by the Decky framework.
        """
        app = web.Application(middlewares=[self.log_middleware])

        # Register route for fetching verse of the day, binding it to the current instance
        app.router.add_get('/api/verse-of-the-day', partial(self.handle_verse_of_the_day))

        # Start the server
        runner = web.AppRunner(app)
        await runner.setup()
        decky_plugin.logger.info("Server runner setup")
        site = web.TCPSite(runner, 'localhost', 8777)
        await site.start()
        decky_plugin.logger.info("Server started at http://localhost:8777")

    async def _unload(self):
        """
        Cleanup any necessary resources when the plugin is unloaded.
        """
        decky_plugin.logger.info("Plugin Unloaded!")
        pass  # Any necessary cleanup on unload