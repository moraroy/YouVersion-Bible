import { ServerAPI } from "decky-frontend-lib";
const YouVersion = require("@glowstudent/youversion");

export class notify {
    private static serverAPI: ServerAPI;
    /**
     * Sets the interop's severAPI.
     * @param serv The ServerAPI for the interop to use.
     */
    static setServer(serv: ServerAPI): void {
      this.serverAPI = serv;
    }
    static toast(title: string, message: string): void {
      return (() => {
        try {
          return this.serverAPI.toaster.toast({
            title: title,
            body: message,
            duration: 8000,
          });
        } catch (e) {
          console.log("Toaster Error", e);
        }
      })();
    }
    static async toastVerseOfTheDay(): Promise<void> {
      try {
        const verseOfTheDay = await YouVersion.getVerseOfTheDay();
        this.toast(verseOfTheDay.citation, verseOfTheDay.passage);
      } catch (error) {
        console.error("Failed to fetch the verse of the day:", error);
      }
    }
}
export default notify;