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
from decky_plugin import DECKY_PLUGIN_DIR, DECKY_USER_HOME
from aiohttp import web
import decky_plugin

class Plugin:
    votd_cache = {}  # Use a class-level variable to store cached data
    update_cache = {}  # New variable to cache update info

    async def _main(self):
        decky_plugin.logger.info("This is _main being called")

        # Function to fetch GitHub package.json
        async def fetch_github_version():
            github_url = "https://raw.githubusercontent.com/moraroy/YouVersion-Bible/main/package.json"
            decky_plugin.logger.info(f"Fetching GitHub version from {github_url}")
            loop = asyncio.get_event_loop()
            try:
                response = await loop.run_in_executor(None, requests.get, github_url)
                response.raise_for_status()
                decky_plugin.logger.info("Successfully fetched GitHub version")
                return response.json()  # This will return the parsed JSON directly
            except requests.exceptions.RequestException as e:
                decky_plugin.logger.error(f"Error fetching GitHub version: {e}")
                return None

        # Function to read the local package.json
        async def fetch_local_version():
            local_package_path = os.path.join(DECKY_PLUGIN_DIR, 'package.json')
            try:
                with open(local_package_path, "r") as file:
                    data = json.load(file)
                    decky_plugin.logger.info("Successfully read local package.json")
                    return data["version"]
            except FileNotFoundError:
                decky_plugin.logger.error(f"Local {local_package_path} not found!")
                return None
            except json.JSONDecodeError:
                decky_plugin.logger.error(f"Failed to parse {local_package_path}")
                return None

        # Compare versions
        async def compare_versions():
            if Plugin.update_cache:  # Check if we have cached update info
                decky_plugin.logger.info("Returning cached update information.")
                return Plugin.update_cache

            local_version = await fetch_local_version()
            github_data = await fetch_github_version()

            if not local_version or not github_data:
                return {"error": "Could not fetch version information"}

            github_version = github_data.get("version")
            if not github_version:
                return {"error": "GitHub version not found"}

            decky_plugin.logger.info(f"Local Version: {local_version}, GitHub Version: {github_version}")

            if local_version == github_version:
                update_info = {"status": "Up-to-date", "local_version": local_version, "github_version": github_version}
            else:
                update_info = {"status": "Update available", "local_version": local_version, "github_version": github_version}

            Plugin.update_cache = update_info  # Cache the update info
            return update_info

        # WebSocket handler to check for updates
        async def handle_check_update(request):
            ws = web.WebSocketResponse()
            await ws.prepare(request)

            try:
                # Fetch and compare the versions
                version_info = await compare_versions()
                await ws.send_json(version_info)
            except Exception as e:
                decky_plugin.logger.error(f"Error handling update check: {e}")
                await ws.send_json({"error": "Internal error"})
            finally:
                await ws.close()
            return ws

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
            return ws

        async def fetch_data():
            URL = "https://www.bible.com/en/verse-of-the-day"
            decky_plugin.logger.info(f"Fetching data from {URL}")

            loop = asyncio.get_event_loop()
            try:
                response = await loop.run_in_executor(None, requests.get, URL)
                response.raise_for_status()
                return response.text
            except requests.exceptions.RequestException as e:
                decky_plugin.logger.error(f"Error fetching data: {e}")
                return None

        async def fetch_votd():
            if Plugin.votd_cache:
                return Plugin.votd_cache

            data = await fetch_data()
            if not data:
                return {}

            html_content = data

            try:
                json_data = html_content.split('<script id="__NEXT_DATA__" type="application/json">')[1].split('</script>')[0]
                json_obj = json.loads(json_data)

                ref = json_obj['props']['pageProps']['votdVideo']['references'][0]

                book_map = {
                    "GEN": "Genesis", "EXO": "Exodus", "LEV": "Leviticus", "NUM": "Numbers", "DEU": "Deuteronomy",
                    "JOS": "Joshua", "JDG": "Judges", "RUT": "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
                    "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
                    "EZR": "Ezra", "NEH": "Nehemiah", "EST": "Esther", "JOB": "Job", "PSA": "Psalms",
                    "PRO": "Proverbs", "ECC": "Ecclesiastes", "SNG": "Song of Solomon", "ISA": "Isaiah",
                    "JER": "Jeremiah", "LAM": "Lamentations", "EZK": "Ezekiel", "DAN": "Daniel",
                    "HOS": "Hosea", "JOL": "Joel", "AMO": "Amos", "OBA": "Obadiah", "JON": "Jonah",
                    "MIC": "Micah", "NAM": "Nahum", "HAB": "Habakkuk", "ZEP": "Zephaniah", "HAG": "Haggai",
                    "ZEC": "Zechariah", "MAL": "Malachi", "MAT": "Matthew", "MRK": "Mark", "LUK": "Luke",
                    "JHN": "John", "ACT": "Acts", "ROM": "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians",
                    "GAL": "Galatians", "EPH": "Ephesians", "PHP": "Philippians", "COL": "Colossians",
                    "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy",
                    "TIT": "Titus", "PHM": "Philemon", "HEB": "Hebrews", "JAS": "James", "1PE": "1 Peter",
                    "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", "JUD": "Jude", "REV": "Revelation",
                }

                book_code = ref.split('.')[0]
                book_name = book_map.get(book_code, book_code)
                chapter = ref.split('.')[1]
                verse = ref.split('.')[2]

                full_ref = f"{book_name} {chapter}:{verse}"
                api_url = f"https://bible-api.com/{full_ref}?translation=kjv"

                decky_plugin.logger.info(f"Fetching KJV from: {api_url}")
                verse_response = requests.get(api_url)
                verse_response.raise_for_status()
                kjv_data = verse_response.json()

                verse_text = kjv_data.get("text", "").strip()
                reference = kjv_data.get("reference", full_ref)

                image_urls = re.findall(r'<a class="block[^>]*><img src="([^"]+)"', html_content)
                image_array = [f"https://www.bible.com{src}" for src in image_urls]

                Plugin.votd_cache = {
                    'citation': reference,
                    'passage': verse_text,
                    'images': image_array,
                    'version': "KJV"
                }

                return Plugin.votd_cache

            except Exception as e:
                decky_plugin.logger.error(f"Failed to extract KJV VOTD: {e}")
                return {}

        # Set up the web application
        app = web.Application()
        app.router.add_get('/votd_ws', handle_votd_ws)
        app.router.add_get('/check_update', handle_check_update)

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