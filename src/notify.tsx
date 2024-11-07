import { ServerAPI } from "decky-frontend-lib";
import { getVerseOfTheDay } from "@glowstudent/youversion";

export class notify {
    private static serverAPI: ServerAPI;

    static setServer(serv: ServerAPI): void {
      this.serverAPI = serv;
    }

    static toast(title: string, message: string): void {
      if (!this.serverAPI || !this.serverAPI.toaster) {
        console.error("serverAPI or toaster is not defined");
        return;
      }

      try {
        this.serverAPI.toaster.toast({
          title: title,
          body: message,
          duration: 8000,
        });
      } catch (e) {
        console.error("Toaster Error", e);
      }
    }

    static async toastVerseOfTheDay(): Promise<void> {
      if (!this.serverAPI) {
        console.error("serverAPI is not defined");
        return;
      }

      try {
        const verseOfTheDay = await getVerseOfTheDay(); // Removed the serverAPI argument
        if (verseOfTheDay && 'citation' in verseOfTheDay && 'passage' in verseOfTheDay) {
          this.toast(verseOfTheDay.citation.toString(), verseOfTheDay.passage.toString());
        }
      } catch (error) {
        console.error("Failed to fetch the verse of the day:", error);
      }
    }
}

export default notify;
