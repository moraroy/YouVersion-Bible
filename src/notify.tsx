import { ServerAPI } from "decky-frontend-lib";
import { getVerseOfTheDay } from "@glowstudent/youversion";

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
        const verseOfTheDay = await getVerseOfTheDay(this.serverAPI);
        if (verseOfTheDay && 'citation' in verseOfTheDay && 'passage' in verseOfTheDay) {
          this.toast(verseOfTheDay.citation.toString(), verseOfTheDay.passage.toString());
        }
      } catch (error) {
        console.error("Failed to fetch the verse of the day:", error);
      }
    }
}
export default notify;