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
import re
import asyncio
import subprocess
import shutil
import requests
import json
from aiohttp import web
from decky_plugin import DECKY_PLUGIN_DIR, DECKY_USER_HOME
from settings import SettingsManager
from subprocess import Popen, run

class Plugin:
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

                    decky_plugin.logger.info(f"Verse: {verse}")
                    decky_plugin.logger.info(f"Reference: {reference}")
                    decky_plugin.logger.info(f"Version: {version}")
                    decky_plugin.logger.info(f"Images: {image_array}")

                    return {
                        'citation': reference,
                        'passage': verse,
                        'images': image_array,
                        'version': version
                    }
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

                    return {
                        'citation': citations_array[0] if citations_array else '',
                        'passage': verses_array[0] if verses_array else '',
                        'images': image_array,
                        'version': version
                    }

            decky_plugin.logger.error("Failed to fetch the verse of the day.")
            return {}

        # Define the route handler inside _main
        async def handleVOTD(request):
            try:
                votd_data = await fetch_votd()
                if votd_data:
                    return web.json_response(votd_data)
                return web.json_response({"error": "Failed to fetch data"}, status=500)
            except Exception as e:
                decky_plugin.logger.error(f"Error handling /votd request: {e}")
                return web.json_response({"error": "Internal server error"}, status=500)

        # Set up the web application and routes inside _main
        app = web.Application()
        app.router.add_get('/votd', handleVOTD)

        runner = web.AppRunner(app)
        await runner.setup()
        decky_plugin.logger.info("Server runner setup")
        site = web.TCPSite(runner, 'localhost', 8777)
        await site.start()
        decky_plugin.logger.info("Server started at http://localhost:8777")

        # Keep the server running
        await asyncio.Event().wait()

    async def _unload(self):
        decky_plugin.logger.info("Plugin Unloaded!")
        # Clean up any resources, if necessary
        pass
