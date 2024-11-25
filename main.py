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

import requests
import json
import re

class Plugin:

    async def _main(self):
        decky_plugin.logger.info("This is _main being called")
        
        async def handleVOTD(request):
            language = request.rel_url.query.get('lang', 'en')
            votd_data = await asyncio.to_thread(self.get_votd, language)
            return web.json_response(votd_data)

        app = web.Application()
        app.router.add_get('/votd', handleVOTD)
        runner = web.AppRunner(app)
        await runner.setup()
        decky_plugin.logger.info("Server runner setup")
        site = web.TCPSite(runner, 'localhost', 8777)
        await site.start()
        decky_plugin.logger.info("Server started at http://localhost:8777")

    def fetch_data(self, language):
        URL = f"https://www.bible.com/{language}/verse-of-the-day"
        print(f"Fetching data for URL: {URL}")  # Log the URL being fetched
        try:
            response = requests.get(URL)
            response.raise_for_status()
            print(f"Successfully fetched data for language: {language}")
            return response
        except requests.exceptions.HTTPError as errh:
            print(f"HTTP Error for language '{language}': {errh.response.status_code}")
        except requests.exceptions.ConnectionError as errc:
            print(f"Error Connecting for language '{language}': {errc}")
        except requests.exceptions.Timeout as errt:
            print(f"Timeout Error for language '{language}': {errt}")
        except requests.exceptions.RequestException as err:
            print(f"Network error for language '{language}': {err}")
        return None

    def get_votd(self, lang):
        language_list = lang.split(',')
        index = 0
        response_status = 0
        data = None

        while index < len(language_list) and response_status != 200:
            language = language_list[index].strip()
            print(f"Trying language: {language}")  # Log the current language being tried
            data = self.fetch_data(language)
            if data:
                response_status = data.status_code
                print(f"Response status: {response_status}")  # Log the response status
                if response_status == 200:
                    html_content = data.text

                    # Look for the __NEXT_DATA__ script tag
                    next_data_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>', html_content, re.S)
                    if next_data_match:
                        json_data = next_data_match.group(1)
                        json_obj = json.loads(json_data)
                        verse = json_obj['props']['pageProps']['verses'][0]['content'].replace('\n', ' ')
                        reference = json_obj['props']['pageProps']['verses'][0]['reference']['human']
                        version = json_obj['props']['pageProps']['versionData']['abbreviation']

                        # Extract image URLs
                        image_urls = re.findall(r'<a class="block[^>]*><img src="([^"]+)"', html_content)
                        image_array = [f"https://www.bible.com{src}" for src in image_urls]

                        print(f"Verse: {verse}")  # Log the verse
                        print(f"Reference: {reference}")  # Log the reference
                        print(f"Version: {version}")  # Log the version
                        print(f"Images: {image_array}")  # Log the images

                        return {
                            'citation': reference,
                            'passage': verse,
                            'images': image_array,
                            'version': version
                        }
                    else:
                        print("Using the old way...")  # Log that the script is using the old way
                        # Old way
                        verses_array = []
                        citations_array = []
                        image_array = []

                        # Extract verses and citations
                        verses_matches = re.findall(r'<a class="text-text-light w-full no-underline"[^>]*>(.+?)</a>', html_content, re.S)
                        citations_matches = re.findall(r'<p class="text-gray-25">(.+?)</p>', html_content, re.S)
                        images_matches = re.findall(r'<a class="block[^>]*><img src="([^"]+)"', html_content)

                        for citation in citations_matches:
                            # Extract citation and version
                            citation_text = citation.strip()
                            version = citation_text[-4:].replace('(', '').replace(')', '')
                            citation_text = citation_text[:-6]
                            citations_array.append(citation_text)
                            print(f"Citation: {citation_text}")  # Log the citation

                        for verse in verses_matches:
                            unformatted_verse = re.sub(r'\n', ' ', verse.strip())
                            verses_array.append(unformatted_verse)
                            print(f"Verse: {unformatted_verse}")  # Log the verse

                        image_array = [f"https://www.bible.com{src}" for src in images_matches]
                        print(f"Images: {image_array}")  # Log the images

                        return {
                            'citation': citations_array[0] if citations_array else '',
                            'passage': verses_array[0] if verses_array else '',
                            'images': image_array,
                            'version': version
                        }
            index += 1
        print("Failed to fetch the verse of the day.")  # Log failure
        return {}

    async def _unload(self):
        """
        Cleanup any necessary resources when the plugin is unloaded.
        """
        decky_plugin.logger.info("Plugin Unloaded!")
        pass  # Any necessary cleanup on unload
