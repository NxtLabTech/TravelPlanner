import { useEffect } from "react";

const APP_NAME = "TravelPlanner";

// Sets the browser tab title to "<title> · TravelPlanner" while the page
// is shown. Pass nothing (e.g. while data is loading) to show the app name.
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}
