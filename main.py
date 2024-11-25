def get_plugin_dir():
    from pathlib import Path
    return Path(__file__).parent.resolve()

def add_plugin_to_path():
    import sys
    plugin_dir = get_plugin_dir()
    decky_plugin.logger.info(f"{plugin_dir}")
    directories = [["./"], ["py_modules"], ["py_modules", "lib"], ["py_modules", "externals"]]
    for dir in directories:
        sys.path.append(str(plugin_dir.joinpath(*dir)))

import decky_plugin
add_plugin_to_path()

import os
import logging
import asyncio
import json
import re
import requests
from aiohttp import web
import decky_plugin

class Plugin:
    votd_cache = {}  # Use a class-level variable to store cached data

    async def _main(self):
        decky_plugin.logger.info("This is _main being called")

        # Define the fetch_data function using requests inside _main
        async def fetch_data():
            URL = "https://www.bible.com/en/verse-of-the-day"
            decky_plugin.logger.info(f"Fetching data from {URL}")

            loop = asyncio.get_event_loop()
            try:
                # Use requests.get inside run_in_executor to run it in a separate thread
                response = await loop.run_in_executor(None, requests.get, URL)
                response.raise_for_status()  # Will raise an error for 4xx/5xx responses
                decky_plugin.logger.info(f"Successfully fetched data from {URL}")
                return response.text
            except requests.exceptions.RequestException as e:
                decky_plugin.logger.error(f"Error fetching data: {e}")
                return None

        # Define the fetch_votd function to process the fetched data
        async def fetch_votd():
            # Check if we already have VOTD data in cache
            if Plugin.votd_cache:
                decky_plugin.logger.info("Returning cached VOTD data.")
                return Plugin.votd_cache

            # If cache is empty, fetch the data
            data = await fetch_data()
            if data:
                html_content = data
                # Look for the __NEXT_DATA__ script tag
                next_data_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>', html_content, re.S)
                if next_data_match:
                    json_data = next_data_match.group(1)
                    json_obj = json.loads(json_data)
                    verse = json_obj['props']['pageProps']['verses'][0]['content'].replace('\n', ' ')
                    reference = json_obj['props']['pageProps']['verses'][0]['reference']['human']
                    version = json_obj['props']['pageProps']['versionData']['abbreviation']

                    image_urls = re.findall(r'<a class="block[^>]*><img src="([^"]+)"', html_content)
                    image_array = [f"https://www.bible.com{src}" for src in image_urls]

                    # Cache the fetched data inside the Plugin class
                    Plugin.votd_cache = {
                        'citation': reference,
                        'passage': verse,
                        'images': image_array,
                        'version': version
                    }

                    decky_plugin.logger.info("Fetched and cached new Verse of the Day")
                    return Plugin.votd_cache
                else:
                    decky_plugin.logger.warning("Using the old way to extract data.")
                    verses_array = []
                    citations_array = []
                    image_array = []

                    verses_matches = re.findall(r'<a class="text-text-light w-full no-underline"[^>]*>(.+?)</a>', html_content, re.S)
                    citations_matches = re.findall(r'<p class="text-gray-25">(.+?)</p>', html_content, re.S)
                    images_matches = re.findall(r'<a class="block[^>]*><img src="([^"]+)"', html_content)

                    for citation in citations_matches:
                        citation_text = citation.strip()
                        version = citation_text[-4:].replace('(', '').replace(')', '')
                        citation_text = citation_text[:-6]
                        citations_array.append(citation_text)
                        decky_plugin.logger.info(f"Citation: {citation_text}")

                    for verse in verses_matches:
                        unformatted_verse = re.sub(r'\n', ' ', verse.strip())
                        verses_array.append(unformatted_verse)
                        decky_plugin.logger.info(f"Verse: {unformatted_verse}")

                    image_array = [f"https://www.bible.com{src}" for src in images_matches]
                    decky_plugin.logger.info(f"Images: {image_array}")

                    # Cache the data even when fetched with the old way
                    Plugin.votd_cache = {
                        'citation': citations_array[0] if citations_array else '',
                        'passage': verses_array[0] if verses_array else '',
                        'images': image_array,
                        'version': version
                    }

                    return Plugin.votd_cache

            decky_plugin.logger.error("Failed to fetch the verse of the day.")
            return {}

        # WebSocket handler to send VOTD data
        async def handle_votd_ws(request):
            ws = web.WebSocketResponse()
            await ws.prepare(request)

            try:
                # Fetch VOTD data and send it over WebSocket
                votd_data = await fetch_votd()
                if votd_data:
                    await ws.send_json(votd_data)
                else:
                    await ws.send_json({"error": "Failed to fetch data"})
            except Exception as e:
                decky_plugin.logger.error(f"Error handling WebSocket: {e}")
                await ws.send_json({"error": "Internal error"})
            finally:
                await ws.close()

        # Set up the web application
        app = web.Application()
        app.router.add_get('/votd_ws', handle_votd_ws)

        # Set up the web server
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', 8777)
        await site.start()
        decky_plugin.logger.info("Server started at http://localhost:8777")

        # Keep the server running indefinitely
        await asyncio.Event().wait()

    async def _unload(self):
        decky_plugin.logger.info("Plugin Unloaded!")
        # Perform any necessary cleanup
        pass
